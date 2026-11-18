#!/usr/bin/env python3
"""Brand Nation Drive -> Cloudinary migration. Run in GitHub Actions only."""
import json, os, re, sys, time
from pathlib import Path
import requests

CLOUD=os.environ.get("CLOUDINARY_CLOUD_NAME","ljmi8wba")
KEY=os.environ["CLOUDINARY_API_KEY"]
SECRET=os.environ["CLOUDINARY_API_SECRET"]
FEED=os.environ["BRAND_NATION_DRIVE_FEED"]
MAP_PATH=Path("cloudinary-map.js")
ID=re.compile(r"^[a-zA-Z0-9_-]{10,}$")
PUBLIC=re.compile(r"^[a-zA-Z0-9_/-]+$")
PREFIX="window.BRAND_NATION_CLOUDINARY_MAP = "
s=requests.Session()
def fetch_catalogue():
    resp=s.get(FEED,params={"callback":"brandNationMigration"},timeout=90)
    resp.raise_for_status()
    body=resp.text.strip()
    match=re.fullmatch(r"brandNationMigration\s*\(\s*(\{.*\})\s*\)\s*;?",body,re.S)
    if not match: raise ValueError("Unexpected catalogue response; expected JSONP")
    data=json.loads(match.group(1))
    if not isinstance(data.get("items"),list): raise ValueError("No catalogue items")
    return data["items"]
def old_map():
    if not MAP_PATH.exists(): return {}
    m=re.search(r"window\.BRAND_NATION_CLOUDINARY_MAP\s*=\s*(\{[^;]*\})\s*;",MAP_PATH.read_text(),re.S)
    return json.loads(m.group(1)) if m else {}
def write_map(mapping):
    safe={k:v for k,v in mapping.items() if ID.fullmatch(k) and PUBLIC.fullmatch(v)}
    header="""// Generated after successful Cloudinary uploads; keyed by Google Drive file ID.
window.BRAND_NATION_CLOUDINARY_MAP = """
    footer=""";
window.brandNationImage = function(id,width){
 const map=window.BRAND_NATION_CLOUDINARY_MAP||{};
 const key=String(id||'');
 const publicId=map[key];
 if(publicId && /^[a-zA-Z0-9_/-]+$/.test(publicId))return 'https://res.cloudinary.com/ljmi8wba/image/upload/f_auto,q_auto,c_limit,w_'+(Number(width)||480)+'/'+publicId;
 return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(key)+'&sz=w'+(Number(width)||480);
};
"""
    MAP_PATH.write_text(header+json.dumps(safe,indent=2,sort_keys=True)+footer)
def upload(drive_id):
    # Download source server-side, rather than requiring Cloudinary to access a Drive URL.
    url="https://drive.google.com/thumbnail"
    response=s.get(url,params={"id":drive_id,"sz":"w1600"},timeout=75)
    response.raise_for_status()
    if not response.headers.get("Content-Type","").lower().startswith("image/"):
        raise ValueError("Google Drive did not return an image (check sharing permissions)")
    if len(response.content)>15_000_000: raise ValueError("Source image exceeds 15 MB")
    public_id="brand-nation/drive-"+drive_id
    out=s.post("https://api.cloudinary.com/v1_1/"+CLOUD+"/image/upload",
        auth=(KEY,SECRET),data={"public_id":public_id,"overwrite":"false"},
        files={"file":("product.jpg",response.content,response.headers["Content-Type"])},timeout=90)
    if out.status_code>=400: raise RuntimeError("Cloudinary HTTP "+str(out.status_code)+": "+out.text[:200])
    result=out.json()
    if result.get("public_id")!=public_id: raise ValueError("Unexpected Cloudinary public ID")
    return public_id

def main():
    items=fetch_catalogue()
    ids=list(dict.fromkeys(str(x.get("id","")) for x in items if isinstance(x,dict) and ID.fullmatch(str(x.get("id","")))))
    if not ids: raise ValueError("No valid Google Drive image IDs; aborting")
    mapping=old_map()
    failures=[]
    limit=int(os.environ.get("MIGRATION_LIMIT","25"))
    pending=[x for x in ids if x not in mapping][:limit]
    print("Catalogue images:",len(ids),"already mapped:",len(mapping),"attempting:",len(pending))
    for index,drive_id in enumerate(pending,1):
        try:
            mapping[drive_id]=upload(drive_id)
            print(index,"OK",drive_id)
        except Exception as exc:
            failures.append({"id":drive_id,"error":str(exc)[:250]})
            print(index,"FAILED",drive_id,str(exc)[:250],file=sys.stderr)
        time.sleep(0.25)
    if pending: write_map(mapping)
    Path("cloudinary-migration-report.json").write_text(json.dumps({"total":len(ids),"mapped":len(mapping),"attempted":len(pending),"failures":failures},indent=2))
    print("Mapped",len(mapping),"failures",len(failures))
    if failures: sys.exit(2)
if __name__=="__main__":main()
