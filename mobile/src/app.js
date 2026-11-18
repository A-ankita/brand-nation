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
document.getElementById('browse').addEventListener('click',()=>browse());
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
