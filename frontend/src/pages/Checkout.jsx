import {useState} from 'react';import {useNavigate} from 'react-router-dom';import Seo from '../components/Seo';import {useCart} from '../context/CartContext';import {api} from '../services/api';import {config,money} from '../config';import {validateCustomer} from '../utils/validation';import {orderMessage,whatsappUrl} from '../utils/whatsapp';
const fields=[['customer_name','Customer Name'],['mobile','Mobile Number'],['email','Email (optional)'],['address','Address'],['city','City'],['state','State'],['pincode','Pincode']];
export default function Checkout(){
  const {items,subtotal,clear}=useCart(),nav=useNavigate(),[form,setForm]=useState({customer_name:'',mobile:'',email:'',address:'',city:'',state:'',pincode:'',notes:''}),[errors,setErrors]=useState({}),[busy,setBusy]=useState(''),[apiError,setApiError]=useState('');
  const delivery=config.deliveryCharge,total=subtotal+delivery;
  const placeOrder=async()=>{
    const er=validateCustomer(form);setErrors(er);
    if(Object.keys(er).length||!items.length)return null;
    const {order}=await api.createOrder({...form,items:items.map(x=>({product_id:x.id,quantity:x.quantity}))});
    sessionStorage.setItem('lastOrder',JSON.stringify(order));
    return order;
  };
  const submit=async e=>{
    e.preventDefault();setBusy('whatsapp');setApiError('');
    try{const order=await placeOrder();if(!order)return;const message=orderMessage(order);clear();window.open(whatsappUrl(config.whatsapp,message),'_blank','noopener,noreferrer');nav(`/order-success/${order.order_number}`,{state:{order}})}catch(err){setApiError(err.message)}finally{setBusy('')}
  };
  const payOnline=async e=>{
    e.preventDefault();setBusy('upi');setApiError('');
    try{const order=await placeOrder();if(!order)return;const {checkoutUrl}=await api.payOrder(order.order_number);clear();window.location.href=checkoutUrl}catch(err){setApiError(err.message)}finally{setBusy('')}
  };
  if(!items.length)return <main className="container-page py-20 text-center"><h1 className="text-2xl font-bold">Your cart is empty</h1><button onClick={()=>nav('/shop')} className="btn-primary mt-6">Go to Shop</button></main>;
  return <><Seo title="Checkout"/><main className="container-page py-10"><h1 className="text-4xl font-black text-brand-900">Customer details</h1><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"><form className="card grid gap-5 p-6 sm:grid-cols-2" onSubmit={submit}>{fields.map(([k,label])=><label key={k} className={k==='address'?'sm:col-span-2':''}><span className="mb-2 block text-sm font-semibold">{label}</span><input className="input" type={k==='email'?'email':'text'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>{errors[k]&&<span className="mt-1 block text-xs text-red-700">{errors[k]}</span>}</label>)}<label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Order Notes (optional)</span><textarea className="input min-h-28" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>{apiError&&<div className="sm:col-span-2 rounded-xl bg-red-50 p-4 text-sm text-red-800">{apiError}</div>}<button type="button" onClick={payOnline} disabled={Boolean(busy)} className="btn-primary sm:col-span-2">{busy==='upi'?'Opening secure UPI checkout…':'Pay with UPI'}</button><button disabled={Boolean(busy)||!config.whatsapp} className="btn-secondary sm:col-span-2">{busy==='whatsapp'?'Saving order…':'Order on WhatsApp'}</button>{!config.whatsapp&&<p className="sm:col-span-2 text-sm text-amber-800">WhatsApp number is not configured. Add VITE_WHATSAPP_NUMBER.</p>}</form><aside className="card h-fit p-6"><h2 className="text-xl font-bold">Order summary</h2><div className="mt-5 grid gap-3">{items.map(x=><div key={x.id} className="flex justify-between gap-3 text-sm"><span>{x.name} × {x.quantity}</span><strong>{money(x.price*x.quantity)}</strong></div>)}</div><div className="mt-5 border-t pt-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="mt-2 flex justify-between"><span>Delivery</span><span>{money(delivery)}</span></div><div className="mt-4 flex justify-between text-lg font-bold"><span>Total</span><span>{money(total)}</span></div></div></aside></div></main></>;
}
