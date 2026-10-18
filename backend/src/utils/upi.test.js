import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildUpiLink} from './upi.js';

test('buildUpiLink builds a standard upi://pay link',()=>{
  const link=buildUpiLink({vpa:'nagaraj1212005@oksbi',name:'MJ Foods',amount:'125.5',note:'MJF ORD-1'});
  assert.ok(link.startsWith('upi://pay?'));
  const q=new URLSearchParams(link.slice('upi://pay?'.length));
  assert.equal(q.get('pa'),'nagaraj1212005@oksbi');
  assert.equal(q.get('pn'),'MJ Foods');
  assert.equal(q.get('am'),'125.50');
  assert.equal(q.get('cu'),'INR');
  assert.equal(q.get('tn'),'MJF ORD-1');
});

test('buildUpiLink rejects a missing or invalid VPA',()=>{
  assert.throws(()=>buildUpiLink({vpa:'',name:'MJ Foods',amount:'10',note:'n'}));
  assert.throws(()=>buildUpiLink({vpa:'not-a-vpa',name:'MJ Foods',amount:'10',note:'n'}));
});

test('buildUpiLink rejects a non-positive amount',()=>{
  assert.throws(()=>buildUpiLink({vpa:'a@ok',name:'MJ Foods',amount:'0',note:'n'}));
  assert.throws(()=>buildUpiLink({vpa:'a@ok',name:'MJ Foods',amount:'-5',note:'n'}));
});
