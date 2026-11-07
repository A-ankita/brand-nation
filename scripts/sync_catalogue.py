#!/usr/bin/env python3
"""Sync Brand Nation admin catalogue to static, indexable product pages."""
import json, html, re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://brand-nation.in"
catalogue = json.loads((ROOT / "catalogue-admin.json").read_text(encoding="utf-8"))
product_dir = ROOT / "products"
product_dir.mkdir(exist_ok=True)

def escape(value):
    return html.escape(str(value or ""), quote=True)

def image_url(raw):
    raw = str(raw or "").strip()
    if raw.startswith("https://"):
        return raw
    if re.fullmatch(r"[a-zA-Z0-9_.-]+\.(?:webp|jpg|jpeg|png)", raw, re.I):
        return "/" + raw
    return ""

for id, product in catalogue.items():
    if not re.fullmatch(r"[a-zA-Z0-9_-]{3,100}", id):
        continue
    if not isinstance(product, dict) or not product.get("name"):
        continue
    name = str(product["name"])[:120]
    category = str(product.get("category") or "New Arrivals")[:60]
    colour_values = product.get("colours", [])
    if not isinstance(colour_values, list):
        colour_values = []
    colours = [str(c)[:60] for c in colour_values if str(c).strip()][:30]
    gallery = product.get("gallery", [])
    if not isinstance(gallery, list):
        gallery = []
    images = [image_url(product.get("image"))] + [image_url(x) for x in gallery[:15]]
    images = list(dict.fromkeys(x for x in images if x))
    url = f"{BASE}/products/{id}.html"
    desc = f"Explore {name} at Brand Nation in Noida. Enquire about size, colours and availability on WhatsApp."
    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(name)} | Brand Nation</title><meta name="description" content="{escape(desc)}"><link rel="canonical" href="{url}"><meta property="og:title" content="{escape(name)}"><meta property="og:description" content="{escape(desc)}"><meta property="og:image" content="{escape(images[0] if images else '')}"><style>body{{margin:0;background:#faf9f6;color:#171717;font:16px Arial}}header,footer{{background:#171717;color:white;padding:22px 7%}}header a{{color:white;text-decoration:none;font:24px Georgia,serif}}main{{max-width:1100px;margin:40px auto;padding:0 20px;display:grid;grid-template-columns:1fr 1fr;gap:45px}}h1{{font:clamp(30px,3.5vw,44px) Georgia,serif}}p{{line-height:1.6}}.hero{{width:100%;max-height:650px;object-fit:contain}}.thumbs{{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}}.thumb{{width:75px;height:80px;background:white;border:2px solid #ddd;cursor:pointer}}.thumb[aria-pressed=true]{{border-color:black}}.thumb img{{width:100%;height:100%;object-fit:cover}}form{{display:grid;gap:10px}}select,textarea{{padding:12px;font:inherit}}label{{font-weight:bold}}button.send{{background:#171717;color:white;padding:16px;border:0;cursor:pointer}}@media(max-width:750px){{main{{grid-template-columns:1fr}}}}</style></head><body><header><a href="/">BRAND NATION</a></header><main><div>{('<img class="hero" id="hero" src="'+escape(images[0])+'" alt="'+escape(name)+'">') if images else '<p>Product image coming soon</p>'}<div class="thumbs">{''.join('<button type="button" class="thumb" data-src="'+escape(src)+'" aria-pressed="'+str(i==0).lower()+'" aria-label="View photo '+str(i+1)+'"><img src="'+escape(src)+'" alt="Product photo '+str(i+1)+'"></button>' for i,src in enumerate(images))}</div></div><div><p>{escape(category)} · BRAND NATION</p><h1>{escape(name)}</h1><p>{escape(desc)}</p><p>{'Currently out of stock. Enquire about restocking.' if product.get('availability')=='out_of_stock' else 'Price and availability confirmed on enquiry.'}</p><form id="enquiry"><label for="size">Preferred size</label><select id="size" required><option value="">Select size</option>{''.join('<option>'+s+'</option>' for s in ['M','L','XL','XXL','Other / please advise'])}</select><label for="colour">Preferred colour</label><select id="colour" required><option value="">Select colour</option>{''.join('<option>'+escape(c)+'</option>' for c in colours)}<option>Ask store to confirm</option></select><label for="note">Message (optional)</label><textarea id="note" maxlength="500" rows="3"></textarea><button class="send" type="submit">ENQUIRE ON WHATSAPP</button></form><p><a href="/#shop">← Back to collection</a></p></div></main><footer>Brand Nation · Sector 76, Noida</footer><script>document.querySelectorAll('.thumb').forEach(b=>b.addEventListener('click',()=>{{document.getElementById('hero').src=b.dataset.src;document.querySelectorAll('.thumb').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}}));document.getElementById('enquiry').addEventListener('submit',e=>{{e.preventDefault();const size=document.getElementById('size').value,colour=document.getElementById('colour').value,note=document.getElementById('note').value.trim();if(!size||!colour)return;const msg="Hi Brand Nation! I'm interested in "+{json.dumps(name)}+".\nPreferred size: "+size+"\nPreferred colour: "+colour+(note?"\nMy message: "+note:"")+"\nPlease confirm price, availability and ordering details.\nProduct: "+location.origin+location.pathname;window.open('https://wa.me/918130687619?text='+encodeURIComponent(msg),'_blank','noopener')}});</script></body></html>"""
    (product_dir / f"{id}.html").write_text(page, encoding="utf-8")

urls = [f"{BASE}/"] + [f"{BASE}/products/{p.name}" for p in sorted(product_dir.glob("*.html"))]
sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{escape(u)}</loc></url>\n' for u in urls) + '</urlset>\n'
(ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
print(f"Synced {len(catalogue)} admin entries; sitemap has {len(urls)} URLs")
