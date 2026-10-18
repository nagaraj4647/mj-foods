import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {demoMode} from '../services/api';
const C=createContext(); const KEY='sivani-cart-v1';
// Live products use Supabase uuid ids. A cart saved while the site ran on the
// bundled demo catalogue holds non-uuid ids the backend rejects at checkout,
// so drop those stale items once on load instead of failing every order.
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function CartProvider({children}){const [items,setItems]=useState(()=>{try{const xs=JSON.parse(localStorage.getItem(KEY))||[];return demoMode?xs:xs.filter(x=>x&&UUID_RE.test(x.id))}catch{return[]}});useEffect(()=>localStorage.setItem(KEY,JSON.stringify(items)),[items]);
const add=(p,qty=1)=>setItems(xs=>{const found=xs.find(x=>x.id===p.id);const next=Math.min(Number(p.stock),Math.max(1,(found?.quantity||0)+qty));return found?xs.map(x=>x.id===p.id?{...x,quantity:next}:x):[...xs,{id:p.id,name:p.name,price:Number(p.price),image_url:p.image_url,stock:Number(p.stock),weight:p.weight,quantity:Math.min(qty,Number(p.stock))}]});
const update=(id,q)=>setItems(xs=>xs.map(x=>x.id===id?{...x,quantity:Math.min(x.stock,Math.max(1,q))}:x));const remove=id=>setItems(xs=>xs.filter(x=>x.id!==id));const clear=()=>setItems([]);const subtotal=useMemo(()=>items.reduce((s,x)=>s+x.price*x.quantity,0),[items]);const count=items.reduce((s,x)=>s+x.quantity,0);return <C.Provider value={{items,add,update,remove,clear,subtotal,count}}>{children}</C.Provider>};export const useCart=()=>useContext(C);
