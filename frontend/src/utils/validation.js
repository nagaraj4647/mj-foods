// Client-side mirror of the backend order schema (backend/src/routes/public.js).
// Keep these rules in sync with the server so the form flags a problem on the
// exact field before the API call, instead of failing after submit.
const EMAIL_RE=/^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
export function validateCustomer(v){
  const e={};
  const name=(v.customer_name||'').trim();
  if(name.length<2)e.customer_name='Enter your full name (at least 2 characters)';
  else if(name.length>100)e.customer_name='Name is too long (max 100 characters)';
  if(!/^[6-9]\d{9}$/.test(v.mobile||''))e.mobile='Enter a valid 10-digit mobile number';
  if(v.email&&!EMAIL_RE.test(v.email))e.email='Enter a valid email';
  const address=(v.address||'').trim();
  if(address.length<5)e.address='Enter your full address (at least 5 characters)';
  else if(address.length>300)e.address='Address is too long (max 300 characters)';
  for(const k of ['city','state']){const val=(v[k]||'').trim();if(val.length<2)e[k]='Required';else if(val.length>80)e[k]='Too long (max 80 characters)';}
  if(!/^\d{6}$/.test(v.pincode||''))e.pincode='Enter a valid 6-digit pincode';
  if((v.notes||'').length>500)e.notes='Notes are too long (max 500 characters)';
  return e;
}
