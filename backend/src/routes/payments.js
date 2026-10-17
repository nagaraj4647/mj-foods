import {Router} from 'express';import express from 'express';import {db} from '../services/supabase.js';import {asyncHandler} from '../utils/async.js';import {youpiConfigured,createYoupiPayment,verifyYoupiSignature,toPaise} from '../services/youpi.js';

export const paymentsRouter=Router();
export const youpiWebhookRouter=Router();

function ready(res){if(!db){res.status(503).json({message:'The order service is not configured yet.'});return false}if(!youpiConfigured()){res.status(503).json({message:'Online payment is not configured yet.'});return false}return true}

// Start a UPI checkout for an existing order. Amount always comes from the
// stored order total, never from the request body.
paymentsRouter.post('/orders/:number/pay',asyncHandler(async(req,res)=>{
  if(!ready(res))return;
  const {data:order,error}=await db.from('orders').select('id,order_number,customer_name,mobile,email,total_amount,status,payment_status').eq('order_number',req.params.number).maybeSingle();
  if(error)throw error;
  if(!order)return res.status(404).json({message:'Order not found'});
  if(order.payment_status==='paid')return res.status(409).json({message:'This order is already paid.'});
  if(order.status==='cancelled')return res.status(400).json({message:'This order was cancelled.'});
  const origin=(process.env.FRONTEND_ORIGIN||'http://localhost:5173').split(',')[0];
  const payment=await createYoupiPayment({orderId:order.order_number,amountPaise:toPaise(order.total_amount),customer:{name:order.customer_name,phoneNumber:order.mobile,email:order.email||undefined},description:`MJ Foods order ${order.order_number}`,returnUrl:`${origin}/order-success/${order.order_number}`});
  const {error:upError}=await db.from('orders').update({payment_provider:'youpi',payment_reference:payment.paymentId}).eq('id',order.id);
  if(upError)throw upError;
  res.status(201).json({checkoutUrl:payment.checkoutUrl,paymentId:payment.paymentId});
}));

// Public, low-detail status poll for the order success page.
paymentsRouter.get('/orders/:number/payment',asyncHandler(async(req,res)=>{
  if(!db)return res.status(503).json({message:'The order service is not configured yet.'});
  const {data,error}=await db.from('orders').select('order_number,status,payment_status,payment_provider').eq('order_number',req.params.number).maybeSingle();
  if(error)throw error;
  if(!data)return res.status(404).json({message:'Order not found'});
  res.json({order:data});
}));

// Authoritative server-to-server webhook from YouPI PG. Mounted with
// express.raw BEFORE express.json so the HMAC runs over the exact bytes.
youpiWebhookRouter.post('/payments/youpi/webhook',express.raw({type:'application/json',limit:'256kb'}),asyncHandler(async(req,res)=>{
  if(!process.env.YOUPI_WEBHOOK_SECRET)return res.status(503).json({message:'Webhook is not configured yet.'});
  if(!verifyYoupiSignature(req.body,req.headers['x-gateway-signature']))return res.status(401).json({message:'Invalid webhook signature'});
  let payload;try{payload=JSON.parse(req.body.toString('utf8'))}catch{return res.status(400).json({message:'Invalid webhook payload'})}
  const {event,orderId,paymentId,amountPaise,utr}=payload||{};
  if(!orderId)return res.status(400).json({message:'Missing order id'});
  const {data:order,error}=await db.from('orders').select('id,total_amount,payment_status,status').eq('order_number',orderId).maybeSingle();
  if(error)throw error;
  if(!order)return res.status(404).json({message:'Order not found'});
  if(event==='SUCCESS'){
    if(order.payment_status==='paid')return res.json({received:true,alreadyPaid:true});
    // Amount match: the gateway must confirm exactly the stored order total.
    if(Number(amountPaise)!==toPaise(order.total_amount)){console.error(`YouPI amount mismatch for ${orderId}: gateway=${amountPaise} expected=${toPaise(order.total_amount)}`);return res.status(409).json({message:'Amount mismatch'})}
    const {error:upError}=await db.from('orders').update({payment_status:'paid',status:order.status==='pending'?'confirmed':order.status,payment_provider:'youpi',payment_reference:utr||paymentId||null}).eq('id',order.id);
    if(upError)throw upError;
  }else if(['FAILED','EXPIRED','CANCELLED'].includes(event)){
    if(order.payment_status!=='paid')await db.from('orders').update({payment_status:'failed'}).eq('id',order.id);
  }
  res.json({received:true});
}));
