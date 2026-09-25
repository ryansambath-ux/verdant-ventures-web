import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,updateDoc,collection,query,where,getDocs,serverTimestamp} from 'firebase/firestore';

const env=await initializeTestEnvironment({projectId:'demo-verdant',firestore:{rules:readFileSync('../firestore.customer-profile-candidate.rules','utf8')}});
const guest=env.unauthenticatedContext().firestore();
const alice=env.authenticatedContext('alice',{email:'alice@example.com'}).firestore();
const bob=env.authenticatedContext('bob',{email:'bob@example.com'}).firestore();
const admin=env.authenticatedContext('7NPZkGYBMnYtDHj7TDDT2ql2Njp2').firestore();
const order=(email,uid)=>({voucher_usd:5,voucher_price_pgk:28,transfer_reference:'1234567890123456',customer_name:'Alice',customer_phone:'70000000',customer_email:email,amount_paid_pgk:28,transfer_description:'',status:'pending',fulfilment_status:'not_delivered',createdAt:serverTimestamp(),...(uid?{customer_uid:uid}:{})});
try {
  await assertSucceeds(setDoc(doc(alice,'customer_profiles/alice'),{display_name:'Alice',phone:'70000000',email:'alice@example.com',createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(alice,'customer_profiles/bob'),{display_name:'Bob',phone:'70000001',email:'alice@example.com',createdAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'customer_profiles/alice'),{email:'bob@example.com'}));
  await assertSucceeds(updateDoc(doc(alice,'customer_profiles/alice'),{phone:'79999999'}));
  await assertFails(getDoc(doc(bob,'customer_profiles/alice')));
  await assertSucceeds(setDoc(doc(guest,'payments/guest1'),order('visitor@example.com')));
  await assertFails(getDoc(doc(alice,'payments/guest1')));
  await assertSucceeds(setDoc(doc(alice,'payments/alice1'),order('alice@example.com','alice')));
  await assertFails(setDoc(doc(alice,'payments/spoof'),order('alice@example.com','bob')));
  await assertFails(setDoc(doc(alice,'payments/wrong-email'),order('bob@example.com','alice')));
  await assertFails(setDoc(doc(alice,'payments/card-leak'),{...order('alice@example.com','alice'),voucher_code:'SECRET'}));
  await assertSucceeds(getDoc(doc(alice,'payments/alice1')));
  await assertFails(getDoc(doc(bob,'payments/alice1')));
  await assertFails(updateDoc(doc(alice,'payments/alice1'),{status:'approved'}));
  const owned=await assertSucceeds(getDocs(query(collection(alice,'payments'),where('customer_uid','==','alice'))));
  assert.deepEqual(owned.docs.map(x=>x.id),['alice1']);
  await assertFails(getDocs(collection(alice,'payments')));
  await assertSucceeds(getDoc(doc(admin,'payments/alice1')));
  await assertFails(getDoc(doc(alice,'voucher_inventory/stock1')));
  console.log('Customer ownership and guest order rules passed');
} finally {await env.cleanup();}
