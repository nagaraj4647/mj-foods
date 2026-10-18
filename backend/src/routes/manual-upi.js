import {Router} from 'express';
import {db} from '../services/supabase.js';
import {asyncHandler} from '../utils/async.js';
import {buildUpiLink} from '../utils/upi.js';

// Free "manual UPI" payment path, independent of the YouPI gateway: the
// customer pays the shop's own UPI ID with any UPI app (QR / deep link) and
// the owner confirms receipt from the admin panel after checking the bank.
export const manualUpiRouter=Router();

const vpa=()=>process.env.MANUAL_UPI_VPA||'nagaraj1212005@oksbi';
const payeeName=()=>process.env.MANUAL_UPI_PAYEE_NAME||'MJ Foods';

// Start (or restart) a manual UPI payment for an existing order. The amount
// always comes from the stored order total, never from the request body.
manualUpiRouter.post('/orders/:number/manual-upi',asyncHandler(async(req,res)=>{
  if(!db)return res.status(503).json({message:'The order service is not configured yet.'});
  const {data:order,error}=await db.from('orders').select('id,order_number,total_amount,status,payment_status').eq('order_number',req.params.number).maybeSingle();
  if(error)throw error;
  if(!order)return res.status(404).json({message:'Order not found'});
  if(order.payment_status==='paid')return res.status(409).json({message:'This order is already paid.'});
  if(order.status==='cancelled')return res.status(400).json({message:'This order was cancelled.'});
  const note=`MJF ${order.order_number}`;
  const amount=Number(order.total_amount).toFixed(2);
  const upiLink=buildUpiLink({vpa:vpa(),name:payeeName(),amount,note});
  const {error:upError}=await db.from('orders').update({payment_provider:'manual_upi'}).eq('id',order.id);
  if(upError)throw upError;
  res.status(201).json({upiLink,vpa:vpa(),payeeName:payeeName(),amount,note,orderNumber:order.order_number});
}));
