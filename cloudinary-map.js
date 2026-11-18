// Generated after a successful Cloudinary migration. Keys are original Google Drive file IDs.
window.BRAND_NATION_CLOUDINARY_MAP = {};
window.brandNationImage = function(id,width){
 const map=window.BRAND_NATION_CLOUDINARY_MAP||{};
 const key=String(id||'');
 const publicId=map[key];
 if(publicId && /^[a-zA-Z0-9_/-]+$/.test(publicId))return 'https://res.cloudinary.com/ljmi8wba/image/upload/f_auto,q_auto,c_limit,w_'+(Number(width)||480)+'/'+publicId;
 return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(key)+'&sz=w'+(Number(width)||480);
};
