import {useEffect,useState} from 'react';import {Link,useLocation,useParams} from 'react-router-dom';import {CheckCircle2,MessageCircle,Loader2,XCircle} from 'lucide-react';import Seo from '../components/Seo';import {config,money} from '../config';import {api,demoMode} from '../services/api';import {orderMessage,whatsappUrl} from '../utils/whatsapp';
export default function OrderSuccess(){
  const {orderNumber}=useParams(),{state}=useLocation(),[payment,setPayment]=useState(null);
  let order=state?.order;try{order=order||JSON.parse(sessionStorage.getItem('lastOrder'))}catch{order=null}
  useEffect(()=>{
    if(demoMode||!orderNumber)return;
    let stops=0,dead=false;
    const tick=async()=>{try{const {order:o}=await api.orderPayment(orderNumber);if(dead)return;setPayment(o);if(o.payment_status==='pending'&&++stops<24)setTimeout(tick,5000)}catch{/* keep showing the order */}};
    tick();return ()=>{dead=true};
  },[orderNumber]);
  return <><Seo title="Order placed"/><main className="container-page py-20 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={58}/><h1 className="mt-5 text-3xl font-black text-brand-900">Order placed successfully!</h1><p className="mt-3 text-stone-600">Order ID: <strong>{orderNumber}</strong></p>
  {payment&&<div className="mx-auto mt-5 flex max-w-lg items-center justify-center gap-2 text-sm font-semibold">
    {payment.payment_status==='paid'?<><CheckCircle2 size={18} className="text-emerald-600"/>Payment received. Thanks!</>:payment.payment_status==='failed'?<><XCircle size={18} className="text-red-600"/>Online payment did not complete. You can retry or order on WhatsApp.</>:<><Loader2 size={18} className="animate-spin text-amber-600"/>Waiting for payment confirmation…</>}{payment.payment_status==='pending'&&<Link to={`/pay/${orderNumber}`} className="btn-primary mt-3">Pay with UPI QR</Link>}
  </div>}
  {order&&<div className="card mx-auto mt-8 max-w-lg p-6 text-left"><dl className="grid grid-cols-2 gap-3 text-sm"><dt className="text-stone-500">Customer</dt><dd>{order.customer_name}</dd><dt className="text-stone-500">Total</dt><dd>{money(order.total_amount)}</dd><dt className="text-stone-500">Status</dt><dd className="capitalize">{order.status}</dd></dl></div>}<div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/shop" className="btn-primary">Continue Shopping</Link>{order&&<a className="btn-secondary" target="_blank" rel="noreferrer" href={whatsappUrl(config.whatsapp,orderMessage(order))}><MessageCircle className="mr-2" size={18}/>Contact on WhatsApp</a>}</div></main></>;
}
