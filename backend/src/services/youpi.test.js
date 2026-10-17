import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {toPaise,toRupees,verifyYoupiSignature} from './youpi.js';
const secret='test-webhook-secret';
const sign=raw=>'sha256='+crypto.createHmac('sha256',secret).update(raw).digest('hex');
test('toPaise converts rupees to paise exactly',()=>{assert.equal(toPaise('499.00'),49900);assert.equal(toPaise(79),7900);assert.equal(toPaise('0.10'),10)});
test('toRupees formats paise with two decimals',()=>{assert.equal(toRupees(49900),'499.00');assert.equal(toRupees(5),'0.05')});
test('valid webhook signature passes',()=>{const raw=Buffer.from('{"event":"SUCCESS","orderId":"SF-1"}');assert.equal(verifyYoupiSignature(raw,sign(raw),secret),true)});
test('wrong secret fails',()=>{const raw=Buffer.from('{"event":"SUCCESS"}');assert.equal(verifyYoupiSignature(raw,sign(raw),'other-secret'),false)});
test('tampered body fails',()=>{const raw=Buffer.from('{"event":"SUCCESS","amountPaise":100}');const sig=sign(raw);const tampered=Buffer.from('{"event":"SUCCESS","amountPaise":99900}');assert.equal(verifyYoupiSignature(tampered,sig,secret),false)});
test('missing signature or secret fails safely',()=>{const raw=Buffer.from('{}');assert.equal(verifyYoupiSignature(raw,'',secret),false);assert.equal(verifyYoupiSignature(raw,sign(raw),''),false)});
