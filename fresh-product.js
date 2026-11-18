(function(){
const catalog={
 'armani-shacket':'Armani Shacket',
 'classic-shacket':'Classic Shacket',
 'puma-porsche-series':'Puma Porsche Series',
 'denim-jacket':'Denim Jacket'
};
const slug=document.body.dataset.product;
const target=catalog[slug];
if(!target)return;
const $=id=>document.getElementById(id);
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=window.BRAND_NATION_DRIVE_SYNC_URL;
const requestedId=new URLSearchParams(location.search).get('driveId');
if(requestedId && /^[a-zA-Z0-9_-]{10,}$/.test(requestedId)){$('main-photo').src='https://drive.google.com/thumbnail?id='+encodeURIComponent(requestedId)+'&sz=w1200';}
$('name').textContent=target;document.title=target+' | Brand Nation';
$('message').textContent='Checking the live Brand Nation catalogue…';
if(!url){$('message').textContent='Catalogue connection unavailable. Please enquire on WhatsApp.';return;}
const cb='brandNationDetailCallback';
$('main-photo').addEventListener('error',()=>{$('message').textContent='Product photo could not be loaded. Please enquire on WhatsApp.';});
const script=document.createElement('script');
let done=false;
const timer=setTimeout(()=>finish('Catalogue is taking longer than expected. Please enquire on WhatsApp.'),20000);
function finish(message){if(done)return;done=true;clearTimeout(timer);script.remove();if(message)$('message').textContent=message;}
window[cb]=function(data){
 if(!data||!Array.isArray(data.items)){finish('Catalogue temporarily unavailable. Please enquire on WhatsApp.');return;}
 const entries=data.items.filter(x=>x&&x.id);
 const normalize=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
 const matches=entries.filter(x=>String(x.id)===requestedId||normalize(x.name)===normalize(target)||normalize(x.productGroup)===normalize(target));
 if(!matches.length){finish('This collection is not currently listed in the live catalogue. Please ask us about availability on WhatsApp.');return;}
 const group=matches[0].productGroup ? entries.filter(x=>x.productGroup===matches[0].productGroup && x.category===matches[0].category) : matches;
 const items=group.length?group:matches;
 const ids=[...new Set(items.map(x=>x.id))];
 const photos=ids.map(id=>'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1200');
 $('main-photo').src=photos[0];$('main-photo').alt=target+' product photograph';
 $('gallery').innerHTML=photos.map((src,i)=>'<button type="button" class="thumb" aria-label="View image '+(i+1)+'"><img src="'+escape(src)+'" alt="'+escape(target)+' view '+(i+1)+'" loading="lazy"></button>').join('');
 [...$('gallery').children].forEach((b,i)=>b.addEventListener('click',()=>{$('main-photo').src=photos[i]}));
 $('category').textContent=items[0].category||'Fresh Arrivals';
 $('message').textContent='Select your preferred size and contact us to confirm price and stock.';
 finish();
};
script.onerror=()=>finish('Catalogue could not load. Please enquire on WhatsApp.');
script.src=url+(url.includes('?')?'&':'?')+'callback='+cb+'&t='+Date.now();
document.head.appendChild(script);
$('enquiry').addEventListener('submit',e=>{
 e.preventDefault();
 const size=$('size').value, note=$('note').value.trim();
 const msg='Hi Brand Nation, I am interested in '+target+'.\nPreferred size: '+(size||'Please advise')+(note?'\nMessage: '+note:'')+'\nPlease confirm price, colours, availability and how to order.\nProduct: '+location.href;
 window.open('https://wa.me/918130687619?text='+encodeURIComponent(msg),'_blank','noopener');
});
})();