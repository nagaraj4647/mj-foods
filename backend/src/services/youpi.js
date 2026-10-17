import crypto from 'node:crypto';

const baseUrl=()=>process.env.YOUPI_BASE_URL?.replace(/\/+$/,'');

export const youpiConfigured=()=>Boolean(baseUrl()&&process.env.YOUPI_WEBHOOK_SECRET);

// Whole rupees/paise math lives here so amount checks stay exact.
export const toPaise=amount=>Math.round(Number(amount)*100);
export const toRupees=paise=>(Number(paise)/100).toFixed(2);

// HMAC-SHA256 over the RAW, unparsed request bytes, per the YouPI webhook contract.
// Header format: "sha256=<64 hex chars>".
export function verifyYoupiSignature(rawBody,signature,secret=process.env.YOUPI_WEBHOOK_SECRET){
  if(!secret||!signature||!rawBody)return false;
  const expected='sha256='+crypto.createHmac('sha256',secret).update(rawBody).digest('hex');
  const a=Buffer.from(String(signature)),b=Buffer.from(expected);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}

// Server-to-server payment session creation. Amount is always computed
// server-side from the order row, never taken from the browser.
export async function createYoupiPayment({orderId,amountPaise,customer,description,returnUrl}){
  const headers={'Content-Type':'application/json','Idempotency-Key':`mjfoods-${orderId}`};
  if(process.env.YOUPI_MERCHANT_ID)headers['X-Merchant-Id']=process.env.YOUPI_MERCHANT_ID;
  const res=await fetch(`${baseUrl()}/api/v1/payments`,{method:'POST',headers,body:JSON.stringify({orderId,amount:toRupees(amountPaise),currency:'INR',customer,description,returnUrl})});
  const body=await res.json().catch(()=>({}));
  if(!res.ok&&res.status!==200)throw Object.assign(new Error(body.message||body.error||'The payment gateway rejected the request.'),{status:res.status===409?409:502});
  if(!body.checkoutUrl)throw Object.assign(new Error('The payment gateway did not return a checkout link.'),{status:502});
  return body;
}
