import {initializeApp,getApp,getApps} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,query,where,orderBy,limit,onSnapshot,addDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';

const ADMIN_UID='7NPZkGYBMnYtDHj7TDDT2ql2Njp2';
const role=document.body.dataset.supportRole;
if(role==='admin'||role==='customer'){
  const app=getApps().length?getApp():initializeApp(firebaseConfig);
  const auth=getAuth(app),db=getFirestore(app),messagesRef=collection(db,'support_messages');
  const el=id=>document.getElementById(id);
  let unsubscribe=null,items=[],activeUid=null,loadedUser=null,sending=false;
  const time=m=>m.createdAt?.toMillis?.()||0;
  const date=m=>m.createdAt?.toDate?.().toLocaleString()||'Sending…';
  const displayName=m=>m.customer_name||m.customer_email||'Customer';
  function status(message='',error=false){
    const box=el(role==='admin'?'supportAdminStatus':'supportCustomerStatus');
    if(box){box.textContent=message;box.className='support-status'+(error?' error':'');}
  }
  function bubble(m,mine){
    const item=document.createElement('div');item.className='support-bubble'+(mine?' mine':'');
    const body=document.createElement('div');body.className='support-body';body.textContent=m.body;
    const meta=document.createElement('small');meta.textContent=(m.sender==='admin'?'Verdant Support':'Customer')+' · '+date(m);
    item.append(body,meta);return item;
  }
  function fillLog(id,conversation,mineSender){
    const box=el(id);if(!box)return;box.replaceChildren();
    if(!conversation.length){const empty=document.createElement('p');empty.className='support-empty';empty.textContent='No messages yet. Start a conversation below.';box.append(empty);return;}
    for(const m of conversation)box.append(bubble(m,m.sender===mineSender));
    box.scrollTop=box.scrollHeight;
  }
  async function send(uid,email,name,sender,body){
    const clean=body.trim();
    if(!clean||clean.length>1500)throw Error('Message must be between 1 and 1,500 characters.');
    if(!auth.currentUser)throw Error('Please sign in first.');
    if(sender==='admin'&&auth.currentUser.uid!==ADMIN_UID)throw Error('Admin access required.');
    await addDoc(messagesRef,{customer_uid:uid,customer_email:email,customer_name:name.slice(0,100),sender,body:clean,createdAt:serverTimestamp()});
  }
  function grouped(){
    const map=new Map();
    for(const m of items){
      if(!map.has(m.customer_uid))map.set(m.customer_uid,{uid:m.customer_uid,email:m.customer_email,name:displayName(m),messages:[]});
      map.get(m.customer_uid).messages.push(m);
    }
    return [...map.values()].map(t=>{
      t.messages.sort((a,b)=>time(a)-time(b));
      t.latest=t.messages[t.messages.length-1];
      return t;
    }).sort((a,b)=>time(b.latest)-time(a.latest));
  }
  function renderAdmin(){
    const threads=grouped();
    if(!threads.some(t=>t.uid===activeUid))activeUid=threads[0]?.uid||null;
    const search=(el('supportSearch')?.value||'').trim().toLowerCase();
    const list=el('supportThreads');list.replaceChildren();
    const filtered=threads.filter(t=>(t.email+' '+t.name).toLowerCase().includes(search));
    if(!filtered.length){const no=document.createElement('p');no.className='support-empty';no.textContent=threads.length?'No matching conversations.':'No customer messages yet.';list.append(no);}
    for(const t of filtered){
      const b=document.createElement('button');b.type='button';b.className='support-thread'+(t.uid===activeUid?' active':'');
      const name=document.createElement('strong');name.textContent=t.name;
      const email=document.createElement('small');email.textContent=t.email;
      const latest=document.createElement('small');latest.textContent=t.latest.body.slice(0,90);
      b.append(name,email,latest);
      if(t.latest.sender==='customer'){const tag=document.createElement('small');tag.className='support-awaiting';tag.textContent='Awaiting reply';b.append(tag);}
      b.addEventListener('click',()=>{activeUid=t.uid;renderAdmin();});
      list.append(b);
    }
    const current=threads.find(t=>t.uid===activeUid);
    el('supportChatTitle').textContent=current?(current.name+' · '+current.email):'Select a conversation';
    el('supportAdminSend').disabled=!current||sending;
    fillLog('supportAdminLog',current?.messages||[],'admin');
  }
  function renderCustomer(){
    const ordered=[...items].sort((a,b)=>time(a)-time(b));
    fillLog('supportCustomerLog',ordered,'customer');
  }
  el('supportSearch')?.addEventListener('input',()=>renderAdmin());
  el('supportAdminForm')?.addEventListener('submit',async event=>{
    event.preventDefault();const t=grouped().find(t=>t.uid===activeUid);if(!t||sending)return;
    const input=el('supportAdminText');sending=true;el('supportAdminSend').disabled=true;status('Sending reply…');
    try{await send(t.uid,t.email,t.name,'admin',input.value);input.value='';status('Reply sent.');}
    catch(e){status('Unable to send reply: '+e.message,true);}
    finally{sending=false;renderAdmin();}
  });
  el('supportCustomerForm')?.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||!auth.currentUser)return;
    const input=el('supportCustomerText'),user=auth.currentUser;
    const name=(el('profile-name')?.value||user.displayName||user.email?.split('@')[0]||'Customer').trim();
    sending=true;el('supportCustomerSend').disabled=true;status('Sending…');
    try{await send(user.uid,user.email||'',name,'customer',input.value);input.value='';status('Message sent to Verdant Support.');}
    catch(e){status('Unable to send message: '+e.message,true);}
    finally{sending=false;el('supportCustomerSend').disabled=false;}
  });
  onAuthStateChanged(auth,user=>{
    if(unsubscribe){unsubscribe();unsubscribe=null;}
    loadedUser=user?.uid||null;items=[];activeUid=null;
    if(role==='admin')renderAdmin();else renderCustomer();
    if(!user||(role==='admin'&&user.uid!==ADMIN_UID))return;
    status('Connecting to support messages…');
    const feed=role==='admin'
      ?query(messagesRef,orderBy('createdAt','desc'),limit(500))
      :query(messagesRef,where('customer_uid','==',user.uid));
    unsubscribe=onSnapshot(feed,snapshot=>{
      if(loadedUser!==user.uid)return;
      items=snapshot.docs.map(d=>({id:d.id,...d.data()}));
      if(role==='admin')renderAdmin();else renderCustomer();
      status('');
    },error=>{
      if(loadedUser!==user.uid)return;
      console.error('Support inbox error',error);
      status(error.code==='permission-denied'
        ?'Support messaging needs its Firestore access rules enabled. Contact the site administrator.'
        :'Messages unavailable. Check your connection and try again.',true);
    });
  });
}
