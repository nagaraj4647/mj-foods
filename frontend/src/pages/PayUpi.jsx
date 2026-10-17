import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {QRCodeSVG} from 'qrcode.react';
import {CheckCircle2,Copy,Loader2} from 'lucide-react';
import Seo from '../components/Seo';
import {api,demoMode} from '../services/api';

// Free manual UPI payment page: the customer scans the QR (or opens the UPI
// deep link) and pays the shop's own UPI ID the exact order amount. The order
// stays unpaid until the owner confirms the bank credit from the admin panel.
export default function PayUpi(){
  const {orderNumber}=useParams();
  const [pay,setPay]=useState(null),[error,setError]=useState(''),[paid,setPaid]=useState(false),[copied,setCopied]=useState('');
  useEffect(()=>{
    if(demoMode){setError('UPI payment needs the live backend. Configure Supabase and VITE_API_URL first.');return}
    api.manualUpiPay(orderNumber).then(setPay).catch(e=>setError(e.message));
  },[orderNumber]);
  useEffect(()=>{
    if(!pay||paid)return;
    let dead=false,stops=0;
    const tick=async()=>{
      try{const {order}=await api.orderPayment(orderNumber);if(dead)return;if(order.payment_status==='paid'){setPaid(true);return}}catch{/* keep polling */}
      if(!dead&&++stops<60)setTimeout(tick,5000);
    };
    tick();return()=>{dead=true};
  },[pay,paid,orderNumber]);
  const copy=async(key,text)=>{try{await navigator.clipboard.writeText(text);setCopied(key);setTimeout(()=>setCopied(''),1500)}catch{/* clipboard unavailable */}};
  if(error)return <><Seo title="Pay with UPI"/><main className="container-page py-20 text-center"><h1 className="text-3xl font-black text-brand-900">UPI payment</h1><p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p><Link to={`/order-success/${orderNumber}`} className="btn-secondary mt-6 inline-block">Back to order</Link></main></>;
  if(!pay)return <main className="container-page py-20 text-center"><Loader2 className="mx-auto animate-spin text-brand-700" size={40}/></main>;
  return <><Seo title="Pay with UPI"/><main className="container-page max-w-xl py-10 text-center">
    <h1 className="text-3xl font-black text-brand-900">Pay with UPI</h1>
    <p className="mt-2 text-stone-600">Order <strong>{pay.orderNumber}</strong></p>
    <p className="mt-4 text-4xl font-black text-brand-900">₹{pay.amount}</p>
    {paid?<div className="card mx-auto mt-8 p-8"><CheckCircle2 className="mx-auto text-emerald-600" size={52}/><h2 className="mt-4 text-xl font-bold text-emerald-700">Payment confirmed!</h2><p className="mt-2 text-sm text-stone-600">The shop received your payment. Your order is being prepared.</p><Link to={`/order-success/${orderNumber}`} className="btn-primary mt-6 inline-block">View order</Link></div>
    :<div className="card mx-auto mt-8 p-6">
      <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-sm"><QRCodeSVG value={pay.upiLink} size={220} level="M" includeMargin/></div>
      <p className="mt-4 text-sm font-semibold text-stone-700">Scan with any UPI app (GPay, PhonePe, Paytm…)</p>
      <a href={pay.upiLink} className="btn-primary mt-4 inline-block">Open UPI app</a>
      <div className="mt-5 grid gap-2 text-left text-sm">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2"><span className="text-stone-500">UPI ID</span><span className="flex items-center gap-2 font-semibold">{pay.vpa}<button type="button" onClick={()=>copy('vpa',pay.vpa)} className="text-brand-700" aria-label="Copy UPI ID">{copied==='vpa'?<CheckCircle2 size={16}/>:<Copy size={16}/>}</button></span></div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2"><span className="text-stone-500">Amount</span><span className="flex items-center gap-2 font-semibold">₹{pay.amount}<button type="button" onClick={()=>copy('amt',pay.amount)} className="text-brand-700" aria-label="Copy amount">{copied==='amt'?<CheckCircle2 size={16}/>:<Copy size={16}/>}</button></span></div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2"><span className="text-stone-500">Note</span><span className="font-semibold">{pay.note}</span></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-stone-500">Pay the exact amount shown. The shop checks the bank credit and confirms your order - this page updates automatically once confirmed.</p>
      <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-amber-700"><Loader2 size={16} className="animate-spin"/>Waiting for the shop to confirm your payment…</p>
    </div>}
  </main></>;
}
