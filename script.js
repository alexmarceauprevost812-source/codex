const state={githubConnected:false,githubUser:null,activeConv:0,conversations:[{id:0,name:'Projet JavaScript',avatar:'JS',avatarClass:'',preview:'Dernier message...',time:'14h22',messages:[{type:'received',sender:'Skiller',text:'Bienvenue sur Skiller ! 🚀',time:'14h00'},{type:'sent',text:'Merci! On commence texte-1.',time:'14h05'},{type:'received',sender:'Skiller',text:'Parfait! Connecte ton GitHub pour voir tes repos 🟢',time:'14h22'}]},{id:1,name:'Repo texte-1',avatar:'GH',avatarClass:'gh',preview:'Commits recents',time:'12h10',messages:[{type:'received',sender:'GitHub',text:'Connecte ton GitHub pour voir tes repos 📂',time:'12h10'}]},{id:2,name:'Skiller General',avatar:'SK',avatarClass:'sk',preview:'Bienvenue!',time:'Hier',messages:[{type:'received',sender:'Skiller',text:'Bienvenue dans Skiller General! 👋',time:'Hier'},{type:'received',sender:'Skiller',text:'Partage tes skills et avance dans tes projets 💪',time:'Hier'}]}]};

const $=id=>document.getElementById(id);
const convList=$('convList'),chatMessages=$('chatMessages'),msgInput=$('msgInput'),btnSend=$('btnSend'),btnNewConv=$('btnNewConv'),searchConv=$('searchConv'),btnGithub=$('btnGithub'),githubStatus=$('githubStatus'),reposList=$('reposList'),chatAvatarEl=$('chatAvatar'),chatTitleEl=$('chatTitle');

function now(){const n=new Date();return n.getHours()+'h'+String(n.getMinutes()).padStart(2,'0');}

function renderConvList(f=''){
  convList.innerHTML='';
  state.conversations.filter(c=>c.name.toLowerCase().includes(f.toLowerCase())).forEach(c=>{
    const li=document.createElement('li');
    li.className='conv-item'+(c.id===state.activeConv?' active':'');
    const av=c.avatarClass==='gh'?'<i class="fa-brands fa-github"></i>':c.avatar;
    li.innerHTML=`<div class="conv-avatar ${c.avatarClass}">${av}</div><div class="conv-info"><span class="conv-name">${c.name}</span><span class="conv-preview">${c.preview}</span></div><span class="conv-time">${c.time}</span>`;
    li.onclick=()=>selectConv(c.id);
    convList.appendChild(li);
  });
}

function selectConv(id){
  state.activeConv=id;
  renderConvList(searchConv.value);
  renderMessages(id);
  const c=state.conversations.find(x=>x.id===id);
  chatTitleEl.textContent=c.name;
  if(c.avatarClass==='gh'){
    chatAvatarEl.innerHTML='<i class="fa-brands fa-github"></i>';
    chatAvatarEl.style.background='linear-gradient(135deg,#222,#444)';
    chatAvatarEl.style.color='#fff';
    chatAvatarEl.style.boxShadow='none';
  } else if(c.avatarClass==='sk'){
    chatAvatarEl.innerHTML=c.avatar;
    chatAvatarEl.style.background='linear-gradient(135deg,var(--orange-dark),var(--orange))';
    chatAvatarEl.style.color='#fff';
    chatAvatarEl.style.boxShadow='var(--glow-orange)';
  } else {
    chatAvatarEl.innerHTML=c.avatar;
    chatAvatarEl.style.background='linear-gradient(135deg,var(--lime-dark),var(--lime))';
    chatAvatarEl.style.color='#000';
    chatAvatarEl.style.boxShadow='var(--glow-lime)';
  }
}

function renderMessages(id){
  chatMessages.innerHTML='';
  const div=document.createElement('div');
  div.className='msg-date-divider';
  div.textContent="Aujourd'hui";
  chatMessages.appendChild(div);
  state.conversations.find(c=>c.id===id).messages.forEach(m=>{
    chatMessages.appendChild(makeMsg(m));
  });
  scrollBottom();
}

function makeMsg(m){
  const d=document.createElement('div');
  d.className='message '+m.type;
  if(m.type==='received'){
    d.innerHTML=`<div class="msg-avatar">${(m.sender||'SK').substring(0,2).toUpperCase()}</div><div class="msg-content"><span class="msg-sender">${m.sender||'Skiller'}</span><p>${m.text}</p><span class="msg-time">${m.time}</span></div>`;
  } else {
    d.innerHTML=`<div class="msg-content"><p>${m.text}</p><span class="msg-time">${m.time} <i class="fa-solid fa-check-double" style="color:var(--lime);font-size:.6rem"></i></span></div>`;
  }
  d.style.opacity='0';
  d.style.transform=m.type==='sent'?'translateX(20px)':'translateX(-20px)';
  requestAnimationFrame(()=>{
    d.style.transition='all .25s ease';
    d.style.opacity='1';
    d.style.transform='translateX(0)';
  });
  return d;
}

function sendMessage(){
  const text=msgInput.value.trim();
  if(!text)return;
  const msg={type:'sent',text,time:now()};
  const conv=state.conversations[state.activeConv];
  conv.messages.push(msg);
  conv.preview=text;
  conv.time=now();
  chatMessages.appendChild(makeMsg(msg));
  scrollBottom();
  msgInput.value='';
  msgInput.focus();
  renderConvList(searchConv.value);
  setTimeout(()=>autoReply(state.activeConv),1200);
}

function autoReply(id){
  const replies=['Bonne idee! Continuons 🚀','Super, je note ca 📝','Excellent! Tu avances bien 💪','Parfait, on est sur la bonne track 🟢','Interessant! T as pense a GitHub pour ca? 🐙'];
  const msg={type:'received',sender:state.conversations[id].name,text:replies[Math.floor(Math.random()*replies.length)],time:now()};
  const conv=state.conversations[id];
  conv.messages.push(msg);
  conv.preview=msg.text;
  conv.time=now();
  if(state.activeConv===id){chatMessages.appendChild(makeMsg(msg));scrollBottom();}
  renderConvList(searchConv.value);
}

function newConversation(){
  const name=prompt('Nom de la nouvelle conversation:');
  if(!name||!name.trim())return;
  const id=state.conversations.length;
  state.conversations.unshift({id,name:name.trim(),avatar:name.trim().substring(0,2).toUpperCase(),avatarClass:'',preview:'Nouvelle conversation',time:'maintenant',messages:[{type:'received',sender:'Skiller',text:'Bienvenue dans '+name.trim()+' ! 👋',time:'maintenant'}]});
  state.conversations.forEach((c,i)=>c.id=i);
  state.activeConv=0;
  renderConvList();
  renderMessages(0);
}

function connectGitHub(){
  if(state.githubConnected){disconnectGitHub();return;}
  btnGithub.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Connexion...';
  btnGithub.disabled=true;
  setTimeout(()=>{
    state.githubConnected=true;
    state.githubUser='Alexmarceauprevost812';
    btnGithub.innerHTML='<i class="fa-brands fa-github"></i> Connecte ✓';
    btnGithub.classList.add('connected');
    btnGithub.disabled=false;
    githubStatus.textContent='@'+state.githubUser;
    githubStatus.classList.add('online');
    loadRepos();
    const msg={type:'received',sender:'GitHub',text:'Connecte en tant que @'+state.githubUser+' ! 🐙',time:now()};
    state.conversations[state.activeConv].messages.push(msg);
    chatMessages.appendChild(makeMsg(msg));
    scrollBottom();
  },1500);
}

function disconnectGitHub(){
  state.githubConnected=false;
  state.githubUser=null;
  btnGithub.innerHTML='<i class="fa-brands fa-github"></i> Connecter GitHub';
  btnGithub.classList.remove('connected');
  githubStatus.textContent='Non connecte';
  githubStatus.classList.remove('online');
  reposList.innerHTML='<div class="repo-placeholder">Connecte GitHub pour voir tes repos</div>';
}

function loadRepos(){
  const repos=[{name:'texte-1',lang:'JS',branch:'Alex',stars:2},{name:'portfolio',lang:'HTML',branch:'main',stars:5},{name:'skiller-app',lang:'JS',branch:'dev',stars:1},{name:'api-rest',lang:'Node',branch:'main',stars:3}];
  reposList.innerHTML='';
  repos.forEach(r=>{
    const d=document.createElement('div');
    d.className='repo-item';
    d.innerHTML=`<i class="fa-solid fa-code-branch"></i><div class="repo-details"><span class="repo-name">${r.name}</span><span class="repo-branch"><i class="fa-solid fa-code-branch" style="font-size:.6rem"></i> ${r.branch}</span></div><div class="repo-meta"><span class="repo-lang">${r.lang}</span><span class="repo-stars"><i class="fa-solid fa-star" style="color:var(--orange);font-size:.6rem"></i> ${r.stars}</span></div>`;
    d.onclick=()=>window.open('https://github.com/Alexmarceauprevost812/'+r.name,'_blank');
    reposList.appendChild(d);
  });
}

function animateSkillBars(){
  document.querySelectorAll('.skill-fill').forEach(b=>{
    const w=b.style.width;
    b.style.width='0%';
    setTimeout(()=>{b.style.transition='width 1s cubic-bezier(.4,0,.2,1)';b.style.width=w;},400);
  });
}

function scrollBottom(){
  requestAnimationFrame(()=>{chatMessages.scrollTop=chatMessages.scrollHeight;});
}

document.addEventListener('DOMContentLoaded',()=>{
  renderConvList();
  renderMessages(0);
  animateSkillBars();
  btnSend.onclick=sendMessage;
  msgInput.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}};
  btnNewConv.onclick=newConversation;
  searchConv.oninput=e=>renderConvList(e.target.value);
  btnGithub.onclick=connectGitHub;
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.onclick=()=>{document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');};
  });
  const ref=document.getElementById('refreshRepos');
  if(ref)ref.onclick=()=>{if(state.githubConnected)loadRepos();};
});