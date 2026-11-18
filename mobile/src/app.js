import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';

const site = 'https://brand-nation.in/';
const offline = document.getElementById('offline');
async function buzz() { try { if (Capacitor.isNativePlatform()) await Haptics.impact({style:ImpactStyle.Light}); } catch {} }
async function browse(url=site) {
  await buzz();
  if (!/^https:\/\/brand-nation\.in(?:\/|$)/.test(url)) return;
  try { await Browser.open({url}); } catch { window.location.assign(url); }
}
async function share() {
  await buzz();
  try { await Share.share({title:'Brand Nation',text:'Discover Brand Nation menswear',url:site,dialogTitle:'Share Brand Nation'}); }
  catch { if (navigator.share) await navigator.share({title:'Brand Nation',url:site}).catch(()=>{}); }
}
async function connectivity() {
  try { const s=await Network.getStatus();offline.hidden=s.connected; } catch { offline.hidden=navigator.onLine; }
}
document.getElementById('shop').addEventListener('click',()=>browse());
document.getElementById('home').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
document.getElementById('share').addEventListener('click',share);
document.getElementById('shareBottom').addEventListener('click',share);
document.getElementById('contact').addEventListener('click',()=>browse('https://brand-nation.in/#visit'));
document.getElementById('arrivals').addEventListener('click',async()=>{await buzz();document.getElementById('featured').scrollIntoView({behavior:'smooth'});});
// Curated native landing-page catalogue. Full inventory stays synced on the website.
const featured=[
 {name:'Armani Shacket',category:'Shackets',slug:'armani-shacket'},
 {name:'Classic Shacket',category:'Shackets',slug:'classic-shacket'},
 {name:'Puma Porsche Series',category:'Sweatshirts',slug:'puma-porsche-series'},
 {name:'Denim Jacket',category:'Jackets',slug:'denim-jacket'}
];
const featuredGrid=document.getElementById('featured-grid');
featuredGrid.innerHTML=featured.map(item=>'<button class="featured-card" type="button" data-slug="'+item.slug+'"><span class="card-copy"><small>'+item.category+'</small><strong>'+item.name+'</strong><em>View collection →</em></span></button>').join('');
featuredGrid.querySelectorAll('[data-slug]').forEach(el=>el.addEventListener('click',()=>browse(site+'products/'+el.dataset.slug+'.html')));
document.querySelectorAll('[data-url]').forEach(el=>el.addEventListener('click',()=>browse(el.dataset.url)));
connectivity();
Network.addListener('networkStatusChange',s=>{offline.hidden=s.connected;}).catch(()=>{});
if (Capacitor.isNativePlatform()) {
  App.addListener('backButton',()=>{window.scrollTo({top:0,behavior:'smooth'});}).catch(()=>{});
}

// Live Drive catalogue loaded through the same JSONP endpoint as the website.
const driveFeed='https://script.google.com/macros/s/AKfycbznN4Z-9Uy34jaw1v6etLQqD13brw9dcPnVnGx6RlrT8wyIZZGrX2klScCrjyPfOcad/exec';
const categoryOrder=['All','Jackets','Shackets','Tracksuits','Sweatshirts','Hoodies','Knitwear','Shirts','Polo T-Shirts','Jeans','Joggers','Winterwear','Other'];
const clean=s=>String(s||'').trim();
const classify=(name,category)=>{
 const n=clean(name).toLowerCase(),c=clean(category).toLowerCase();
 if(/shacket/.test(n))return 'Shackets';
 if(/denim jacket|\\bjacket\\b/.test(n))return 'Jackets';
 if(/tracksuit|track set|co-ord/.test(n))return 'Tracksuits';
 if(/hoodie/.test(n))return 'Hoodies';
 if(/sweatshirt|porsche|911 turbo/.test(n))return 'Sweatshirts';
 if(/jogger|trackpant/.test(n))return 'Joggers';
 if(/\\bjeans?\\b/.test(n))return 'Jeans';
 if(/\\bshirt\\b/.test(n))return 'Shirts';
 if(/polo|t-shirt|tshirt/.test(n))return 'Polo T-Shirts';
 if(/jacket/.test(c))return 'Jackets';
 if(/shacket/.test(c))return 'Shackets';
 if(/sweatshirt/.test(c))return 'Sweatshirts';
 if(/knit|sweater/.test(c))return 'Knitwear';
 return categoryOrder.find(x=>x.toLowerCase()===c)||'Other';
};
// Small thumbnails for cards; full-resolution imagery remains on product pages.
const catalogueName=(item)=>{
 const explicit=clean(item.productGroup);
 if(explicit && !looksLikeFilename(explicit))return explicit;
 const raw=clean(item.name).replace(/^BN-GH-[a-f0-9]{16}-/i,'').replace(/\.(jpe?g|png|webp|avif)$/i,'').replace(/[_-]+/g,' ').replace(/\b(img|image|photo|dsc|whatsapp)\b/gi,' ').replace(/\b\d{5,}\b/g,' ').replace(/\s+/g,' ').trim();
 const category=classify(raw,item.category);
 const labels={'Jackets':"Men's Jackets",'Shackets':"Men's Shackets",'Tracksuits':"Men's Tracksuits",'Sweatshirts':"Men's Sweatshirts",'Hoodies':"Men's Hoodies",'Knitwear':"Men's Knitwear",'Shirts':"Men's Shirts",'Polo T-Shirts':"Men's Polo T-Shirts",'Jeans':"Men's Jeans",'Joggers':"Men's Joggers",'Winterwear':"Men's Winterwear"};
 const hasArticle=/shacket|jacket|tracksuit|hoodie|sweatshirt|porsche|knit|sweater|shirt|polo|jeans|jogger|henley|cardigan/i.test(raw);
 if(!hasArticle || looksLikeFilename(raw))return labels[category]||'New Arrival';
 return raw.split(' ').slice(0,8).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
};
const looksLikeFilename=s=>{
 const v=clean(s);
 return /^(?:img|dsc|pxl|mvimg|whatsapp|image)[\\s_-]*\\d+/i.test(v)
 || /^[a-zA-Z0-9_-]{18,}$/.test(v)
 || /^\\d{6,}/.test(v)
 || /^(?:BN-GH-)?[a-f0-9]{16,}/i.test(v);
};
const photo=id=>window.brandNationImage?window.brandNationImage(id,320):'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w320';
const thumbnailObserver=('IntersectionObserver' in window)?new IntersectionObserver(entries=>{
 entries.forEach(entry=>{if(!entry.isIntersecting)return;const img=entry.target;img.src=img.dataset.src;img.removeAttribute('data-src');thumbnailObserver.unobserve(img);});
},{rootMargin:'120px 0px'}):null;
function setThumbnail(img,id,priority=false){
 img.alt=img.alt||'Product photo';
 img.decoding='async';
 img.loading=priority?'eager':'lazy';
 if(priority){img.fetchPriority='high';img.src=photo(id);}
 else if(thumbnailObserver){img.dataset.src=photo(id);thumbnailObserver.observe(img);}
 else img.src=photo(id);
}
let catalogue=[],selectedCategory='All';
const categoryBar=document.getElementById('category-filters');
const catalogueGrid=document.getElementById('catalogue-grid');
const catalogueStatus=document.getElementById('catalogue-status');
function renderCatalogue(){
 const categories=categoryOrder.filter(c=>c==='All'||catalogue.some(p=>p.category===c));
 categoryBar.innerHTML='';
 categories.forEach(c=>{const b=document.createElement('button');b.type='button';b.textContent=c;b.className=c===selectedCategory?'selected':'';b.setAttribute('aria-pressed',String(c===selectedCategory));b.addEventListener('click',()=>{selectedCategory=c;renderCatalogue();});categoryBar.appendChild(b);});
 catalogueGrid.innerHTML='';
 const filtered=catalogue.filter(p=>selectedCategory==='All'||p.category===selectedCategory);
 filtered.forEach(p=>{
  const b=document.createElement('button');b.type='button';b.className='featured-card';
  const img=document.createElement('img');img.alt=p.name;img.onerror=()=>{img.style.display='none';};
  const copy=document.createElement('span');copy.className='card-copy';
  const small=document.createElement('small');small.textContent=p.category;
  const strong=document.createElement('strong');strong.textContent=p.name;
  const link=document.createElement('em');link.textContent='Shop collection →';
  copy.append(small,strong,link);b.append(img,copy);
  b.addEventListener('click',()=>openGallery(p));
  catalogueGrid.appendChild(b);
  setThumbnail(img,p.ids[0]);
 });
 catalogueStatus.textContent=filtered.length+' products available. Tap a product to view its photo gallery.';
}
function loadCatalogue(){
 const cb='brandNationAppFeed';
 let completed=false;
 const script=document.createElement('script');
 const timer=setTimeout(()=>finish(false),15000);
 function finish(ok){if(completed)return;completed=true;clearTimeout(timer);script.remove();if(!ok)catalogueStatus.textContent='Live catalogue unavailable. Browse the website to shop.';}
 window[cb]=payload=>{
  if(!payload||!Array.isArray(payload.items)){finish(false);return;}
  const groups=new Map();
  payload.items.forEach(item=>{
   if(!item||!(/^[a-zA-Z0-9_-]{10,}$/).test(String(item.id||'')))return;
   const name=catalogueName(item);
   const category=classify(name,item.category);
   const group=clean(item.productGroup);
   const key=(group && !looksLikeFilename(group))?category+'::'+group.toLowerCase():'single::'+item.id;
   if(!groups.has(key))groups.set(key,{name,category,id:item.id,ids:[item.id]});
   else if(!groups.get(key).ids.includes(item.id))groups.get(key).ids.push(item.id);
  });
  catalogue=[...groups.values()].sort((a,b)=>categoryOrder.indexOf(a.category)-categoryOrder.indexOf(b.category)||a.name.localeCompare(b.name));
  renderCatalogue();
  // Update the four home cards with real images from the live Drive feed.
  featuredGrid.querySelectorAll('[data-slug]').forEach(card=>{
   const item=featured.find(x=>x.slug===card.dataset.slug);
   const match=catalogue.find(p=>clean(p.name).toLowerCase()===item.name.toLowerCase());
   if(match){const img=document.createElement('img');img.alt=item.name;img.onerror=()=>img.remove();card.prepend(img);setThumbnail(img,match.id,true);}
  });
  finish(true);
 };
 script.onerror=()=>finish(false);
 script.src=driveFeed+'?callback='+cb;
 document.head.appendChild(script);
}
document.getElementById('browse').addEventListener('click',async()=>{await buzz();document.getElementById('catalogue').scrollIntoView({behavior:'smooth'});});
loadCatalogue();

const gallery=document.getElementById('product-gallery');
const galleryImage=document.getElementById('gallery-image');
let activeProduct=null,activePhoto=0;
function showGalleryPhoto(){
 if(!activeProduct)return;
 galleryImage.src=window.brandNationImage?window.brandNationImage(activeProduct.ids[activePhoto],900):photo(activeProduct.ids[activePhoto]);
 galleryImage.alt=activeProduct.name+' photo '+(activePhoto+1);
 document.getElementById('gallery-count').textContent=(activePhoto+1)+' of '+activeProduct.ids.length;
 document.getElementById('gallery-prev').disabled=activeProduct.ids.length<2;
 document.getElementById('gallery-next').disabled=activeProduct.ids.length<2;
}
function openGallery(product){
 activeProduct=product;activePhoto=0;
 document.getElementById('gallery-title').textContent=product.name;
 document.getElementById('gallery-category').textContent=product.category;
 showGalleryPhoto();gallery.showModal();
}
document.getElementById('gallery-close').addEventListener('click',()=>gallery.close());
document.getElementById('gallery-prev').addEventListener('click',()=>{if(activeProduct){activePhoto=(activePhoto+activeProduct.ids.length-1)%activeProduct.ids.length;showGalleryPhoto();}});
document.getElementById('gallery-next').addEventListener('click',()=>{if(activeProduct){activePhoto=(activePhoto+1)%activeProduct.ids.length;showGalleryPhoto();}});
document.getElementById('gallery-shop').addEventListener('click',()=>browse(site+'#shop'));
gallery.addEventListener('click',event=>{if(event.target===gallery)gallery.close();});
