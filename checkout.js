/* Brand Nation live checkout preparation. Prices must match PRODUCT_CATALOG_JSON on Vercel. Keep disabled until live verification is complete. */
(function(){
'use strict';
const API='https://brand-nation-payments.vercel.app';
const LIVE_CHECKOUT_ENABLED=true; // Enable only after production readiness checks.

const PRICE_PAISE = {
  'checked-shirts': 220000,
  'new-striped-shirts': 220000,
  'striped-shirts': 220000,
  'new-pinstripe-shirts': 220000,
  'winter-addition-6': 200000,
  'winter-nov04-3': 200000,
  'denim-shirts': 250000,
  'nov04-denim-shirts': 250000,
  'winter-addition-5': 250000,
  'knitwear': 300000,
  'winter-addition-3': 300000,
  'winter-addition-7': 300000,
  'winter-nov04-1': 300000,
  'winter-nov04-2': 300000,
  'winter-nov04-4': 300000,
  'new-v-neck-sweaters': 300000,
  'polo-knitwear': 300000,
  'latest-button-neck-knitwear': 300000,
  'nov26-knit-polos': 300000,
  'contrast-polos': 230000,
  'classic-0': 230000,
  'classic-1': 230000,
  'classic-2': 230000,
  'classic-3': 230000
};

  
const cart=[];
const money=n=>'₹'+(n/100).toLocaleString('en-IN');
const el=id=>document.getElementById(id);
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notice(message,error=false){const e=el('bn-cart-message');if(e){e.textContent=message;e.setAttribute('role',error?'alert':'status');}}
function available(p){return Object.prototype.hasOwnProperty.call(PRICE_PAISE,p.id);}
function selected(i){const p=products[i];if(!p||!available(p)){notice('This product is available on WhatsApp enquiry only. Payment price is not configured.',true);openCart();return null;}const noSize=['watch','watches','bag','bags','handbags'].includes(String(p.type||'').toLowerCase());const size=noSize?'':(el('size'+i)?.value||'');if(!noSize&&!size){alert('Please choose a size first.');return null;}return {id:p.id,name:p.name,size,quantity:1};}
function add(i){const item=selected(i);if(!item)return false;const existing=cart.find(x=>x.id===item.id&&x.size===item.size);if(existing){if(existing.quantity>=10){alert('Maximum 10 per product and size');return false;}existing.quantity++;}else cart.push(item);render();return true;}
function openCart(){const e=el('bn-cart-overlay');e.classList.add('open');e.setAttribute('aria-hidden','false');render();}
function closeCart(){const e=el('bn-cart-overlay');e.classList.remove('open');e.setAttribute('aria-hidden','true');}
function render(){el('bn-cart-count').textContent=cart.reduce((n,x)=>n+x.quantity,0);el('bn-cart-lines').innerHTML=cart.length?cart.map((x,i)=>'<div class="bn-cart-line"><div><strong>'+safe(x.name)+'</strong><p>Size: '+safe(x.size||'N/A')+' · '+money(PRICE_PAISE[x.id])+'</p><button type="button" onclick="BrandNationCheckout.changeQty('+i+',-1)">−</button> '+x.quantity+' <button type="button" onclick="BrandNationCheckout.changeQty('+i+',1)">+</button></div><button type="button" onclick="BrandNationCheckout.remove('+i+')">Remove</button></div>').join(''):'Your cart is empty.';el('bn-cart-total').textContent='Total: '+money(cart.reduce((n,x)=>n+PRICE_PAISE[x.id]*x.quantity,0));el('bn-checkout-button').disabled=!cart.length || !LIVE_CHECKOUT_ENABLED;}
async function checkout(){
if(!cart.length)return;
if(!LIVE_CHECKOUT_ENABLED){notice('Online payments are temporarily unavailable while we complete our live payment checks. Please enquire on WhatsApp.',true);return;}
const button=el('bn-checkout-button');button.disabled=true;notice('Creating secure payment order...');
try{
const response=await fetch(API+'/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart.map(({id,size,quantity})=>({id,size,quantity}))})});
const order=await response.json();if(!response.ok)throw Error(order.error||'Could not create order');
if(!window.Razorpay)throw Error('Razorpay checkout could not load');
if(typeof order.key_id!=='string'||!order.key_id.startsWith('rzp_live_'))throw Error('Live payment configuration is not ready');
const rz=new Razorpay({key:order.key_id,amount:order.amount,currency:'INR',name:'Brand Nation',description:'Brand Nation Online Order',order_id:order.order_id,handler:async function(payment){
notice('Verifying payment...');
try{const r=await fetch(API+'/api/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payment)});const v=await r.json();if(!r.ok||!v.verified||!v.paid)throw Error(v.error||v.message||'Payment not captured');cart.length=0;render();notice('Payment successful. Order confirmed: '+v.order_id);}catch(err){notice('Payment verification failed: '+err.message,true);}
},modal:{ondismiss:function(){notice('Checkout closed.')}}});
rz.on('payment.failed',function(r){notice('Payment failed: '+(r.error?.description||'Please try again'),true);});
rz.open();
}catch(err){notice(err.message,true);}finally{button.disabled=!cart.length || !LIVE_CHECKOUT_ENABLED;}
}
window.BrandNationCheckout={openCart,closeCart,addFromProduct:i=>{if(add(i)){openCart();notice('Added to cart.');}},buyNow:i=>{const item=selected(i);if(!item)return;cart.length=0;cart.push(item);render();openCart();checkout();},changeQty:(i,n)=>{if(!cart[i])return;cart[i].quantity+=n;if(cart[i].quantity<=0)cart.splice(i,1);if(cart[i]&&cart[i].quantity>10)cart[i].quantity=10;render();},remove:i=>{cart.splice(i,1);render();},checkout};
render();
})();
