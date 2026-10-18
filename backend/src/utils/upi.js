// Build a upi:// deep link / QR payload for a pay-to-VPA UPI payment.
// Amount must be a positive number (rupees); note is trimmed to UPI limits.
export function buildUpiLink({vpa,name,amount,note}){
  if(!vpa||!/^[\w.\-]+@[a-zA-Z][a-zA-Z0-9]*$/.test(vpa))throw Object.assign(new Error('A valid payee UPI ID is required'),{status:500});
  const amt=Number(amount);
  if(!Number.isFinite(amt)||amt<=0)throw Object.assign(new Error('A positive amount is required'),{status:400});
  const params=new URLSearchParams({pa:vpa,pn:String(name||'').slice(0,50),am:amt.toFixed(2),cu:'INR',tn:String(note||'').slice(0,80)});
  return `upi://pay?${params.toString()}`;
}
