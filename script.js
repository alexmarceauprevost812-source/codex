// ============================================================
//  CODEX — script.js
//  Push GitHub direct + Supabase + Performance max + Streaming
// ============================================================

let conversations = JSON.parse(localStorage.getItem('codex_convs') || '[]');
let currentConvId = null;
let apiKey        = localStorage.getItem('codex_api_key')    || '';
let githubToken   = localStorage.getItem('codex_gh_token')   || '';
let githubRepo    = localStorage.getItem('codex_gh_repo')    || '';
let githubBranch  = localStorage.getItem('codex_gh_branch')  || 'main';
let supabaseUrl   = localStorage.getItem('codex_sb_url')     || '';
let supabaseKey   = localStorage.getItem('codex_sb_key')     || '';
let isStreaming   = false;
let sidebarOpen   = false;
let perfMode      = localStorage.getItem('codex_perf') === 'true';

const $ = id => document.getElementById(id);

// ===== DOM =====
const sidebarToggle    = $('sidebarToggle');
const overlay          = $('overlay');
const newChatBtn       = $('newChatBtn');
const convsList        = $('conversationsList');
const chatMessages     = $('chatMessages');
const chatInput        = $('chatInput');
const sendBtn          = $('sendBtn');
const convTitle        = $('convTitle');
const clearBtn         = $('clearBtn');
const perfBtn          = $('perfBtn');
const perfIndicator    = $('perfIndicator');
const perfLabel        = $('perfLabel');
const toastContainer   = $('toastContainer');
const githubBtn        = $('githubBtn');
const githubDropdown   = $('githubDropdown');
const githubTokenInput = $('githubToken');
const githubRepoInput  = $('githubRepo');
const githubBranchInput= $('githubBranch');
const githubSave       = $('githubSave');
const githubStatus     = $('githubStatus');
const githubLabel      = $('githubLabel');
const supabaseBtn      = $('supabaseBtn');
const supabaseDropdown = $('supabaseDropdown');
const supabaseUrlInput = $('supabaseUrl');
const supabaseKeyInput = $('supabaseAnonKey');
const supabaseSave     = $('supabaseSave');
const supabaseStatus   = $('supabaseStatus');
const supabaseLabel    = $('supabaseLabel');
const apiBtn           = $('apiBtn');
const apiDropdown      = $('apiDropdown');
const apiKeyInput      = $('apiKeyInput');
const saveKeyBtn       = $('saveKeyBtn');
const keyStatus        = $('keyStatus');
const apiLabel         = $('apiLabel');
const copySqlBtn       = $('copySqlBtn');

const SQL_TABLE = `CREATE TABLE codex_files (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  language text,
  content text not null,
  conversation_id text,
  pushed_at timestamp default now()
);`;

// ========== INIT ==========
function init() {
  if (apiKey)      { apiKeyInput.value=apiKey; setStatus(keyStatus,'✓ Clé chargée','ok'); apiBtn.classList.add('connected'); apiLabel.textContent='✓ API'; }
  if (githubToken) { githubTokenInput.value=githubToken; githubRepoInput.value=githubRepo; githubBranchInput.value=githubBranch; setGHConnected(); }
  if (supabaseUrl) { supabaseUrlInput.value=supabaseUrl; supabaseKeyInput.value=supabaseKey; setSBConnected(); }
  if (perfMode)    applyPerfMode(true);
  renderConvList();
  if (window.innerWidth > 640) openSidebar();
}
init();

// ========== SIDEBAR ==========
function openSidebar()  { sidebarOpen=true;  document.body.classList.add('sidebar-open'); }
function closeSidebar() { sidebarOpen=false; document.body.classList.remove('sidebar-open'); }
sidebarToggle.addEventListener('click', () => sidebarOpen ? closeSidebar() : openSidebar());
overlay.addEventListener('click', closeSidebar);

// ========== DROPDOWNS ==========
const DDS = [
  { btn:githubBtn,   dd:githubDropdown },
  { btn:supabaseBtn, dd:supabaseDropdown },
  { btn:apiBtn,      dd:apiDropdown },
];
DDS.forEach(({btn,dd}) => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = dd.classList.contains('open');
    closeAllDD();
    if (!open) { dd.classList.add('open'); btn.classList.add('active'); }
  });
});
document.addEventListener('click', closeAllDD);
function closeAllDD() { DDS.forEach(({btn,dd}) => { dd.classList.remove('open'); btn.classList.remove('active'); }); }
document.querySelectorAll('.dropdown').forEach(d => d.addEventListener('click', e => e.stopPropagation()));

// ========== SQL COPY ==========
copySqlBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(SQL_TABLE);
  copySqlBtn.textContent = '✓ Copié!';
  setTimeout(() => { copySqlBtn.textContent = '📋 Copier le SQL'; }, 2000);
});

// ========== PERFORMANCE MODE ==========
perfBtn.addEventListener('click', () => {
  perfMode = !perfMode;
  localStorage.setItem('codex_perf', perfMode);
  applyPerfMode(perfMode);
  toast(perfMode ? '⚡ Mode Performance activé!' : '🔕 Mode Performance désactivé', perfMode ? 'info' : 'ok');
});

function applyPerfMode(on) {
  perfMode = on;
  if (on) {
    perfBtn.classList.add('active-perf');
    perfLabel.textContent = '⚡ PERF ON';
    perfIndicator.style.display = 'block';
  } else {
    perfBtn.classList.remove('active-perf');
    perfLabel.textContent = 'Performance';
    perfIndicator.style.display = 'none';
  }
}

// ========== ANTHROPIC KEY ==========
saveKeyBtn.addEventListener('click', () => {
  const k = apiKeyInput.value.trim();
  if (!k.startsWith('sk-ant-')) { setStatus(keyStatus,'✗ Format invalide (sk-ant-...)','err'); return; }
  apiKey = k;
  localStorage.setItem('codex_api_key', k);
  setStatus(keyStatus,'✓ Clé sauvegardée!','ok');
  apiBtn.classList.add('connected'); apiLabel.textContent='✓ API';
  setTimeout(closeAllDD, 1200);
});
apiKeyInput.addEventListener('keydown', e => { if(e.key==='Enter') saveKeyBtn.click(); });

// ========== GITHUB ==========
githubSave.addEventListener('click', async () => {
  const token  = githubTokenInput.value.trim();
  const repo   = githubRepoInput.value.trim();
  const branch = githubBranchInput.value.trim() || 'main';
  if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    setStatus(githubStatus,'✗ Token invalide (ghp_... ou github_pat_...)','err'); return;
  }
  setStatus(githubStatus,'⏳ Vérification...','');
  try {
    const res  = await fetch('https://api.github.com/user', {
      headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error('Token refusé');
    const user = await res.json();
    githubToken=token; githubRepo=repo; githubBranch=branch;
    localStorage.setItem('codex_gh_token', token);
    localStorage.setItem('codex_gh_repo', repo);
    localStorage.setItem('codex_gh_branch', branch);
    setStatus(githubStatus,`✓ Connecté comme @${user.login}${repo?' → '+repo:''}`, 'ok');
    setGHConnected(user.login);
    setTimeout(closeAllDD, 1500);
  } catch(err) { setStatus(githubStatus,`✗ ${err.message}`,'err'); }
});
function setGHConnected(login='') {
  githubBtn.classList.add('connected');
  githubLabel.textContent = login ? `@${login}` : '✓ GitHub';
}

// ===== PUSH FICHIER VERS GITHUB =====
async function pushToGitHub(filename, content, btnEl, resultEl) {
  if (!githubToken || !githubRepo) {
    toast('Connecte GitHub en haut à droite avant de pusher!', 'err'); return;
  }
  if (!filename.trim()) {
    toast('Entre un nom de fichier avant de pusher!', 'err'); return;
  }

  btnEl.classList.add('pushing');
  btnEl.textContent = '⏳';
  resultEl.className = 'push-result show';
  resultEl.innerHTML = '⏳ Push en cours...';

  try {
    const apiBase = `https://api.github.com/repos/${githubRepo}/contents/${filename}`;
    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };

    // Vérifie si le fichier existe déjà (pour avoir le SHA)
    let sha = null;
    const check = await fetch(apiBase, { headers });
    if (check.ok) {
      const existing = await check.json();
      sha = existing.sha;
    }

    const body = {
      message: `codex: ${sha ? 'update' : 'add'} ${filename}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: githubBranch || 'main'
    };
    if (sha) body.sha = sha;

    const push = await fetch(apiBase, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    if (!push.ok) {
      const err = await push.json();
      throw new Error(err.message || `Erreur ${push.status}`);
    }

    const data = await push.json();
    const fileUrl = data.content?.html_url || `https://github.com/${githubRepo}/blob/${githubBranch}/${filename}`;

    btnEl.classList.remove('pushing');
    btnEl.classList.add('pushed');
    btnEl.textContent = '✓ Pushé!';
    resultEl.className = 'push-result show ok';
    resultEl.innerHTML = `✅ ${sha ? 'Mis à jour' : 'Créé'} sur GitHub! <a href="${fileUrl}" target="_blank">→ Voir le fichier</a>`;
    toast(`✅ ${filename} pushé sur GitHub!`, 'ok');

  } catch(err) {
    btnEl.classList.remove('pushing');
    btnEl.textContent = '❌ Erreur';
    resultEl.className = 'push-result show err';
    resultEl.textContent = `❌ ${err.message}`;
    toast(`Erreur GitHub: ${err.message}`, 'err');
  }
}

// ===== PUSH VERS SUPABASE =====
async function pushToSupabase(filename, language, content, convId, btnEl, resultEl) {
  if (!supabaseUrl || !supabaseKey) {
    toast('Connecte Supabase en haut à droite avant de pusher!', 'err'); return;
  }

  btnEl.classList.add('pushing');
  btnEl.textContent = '⏳';
  resultEl.className = 'push-result show';
  resultEl.innerHTML = '⏳ Sauvegarde Supabase...';

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/codex_files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        filename: filename || 'untitled',
        language: language || 'text',
        content,
        conversation_id: convId || null
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.hint || `Erreur ${res.status}`);
    }

    const rows = await res.json();
    const id   = rows[0]?.id || '?';

    btnEl.classList.remove('pushing');
    btnEl.classList.add('pushed');
    btnEl.textContent = '✓ Sauvé!';
    resultEl.className = 'push-result show ok';
    resultEl.innerHTML = `✅ Sauvegardé dans Supabase! <a href="${supabaseUrl}/project/_/editor" target="_blank">→ Voir la DB</a>`;
    toast(`✅ ${filename || 'Code'} sauvé dans Supabase!`, 'ok');

  } catch(err) {
    btnEl.classList.remove('pushing');
    btnEl.textContent = '❌ Erreur';
    resultEl.className = 'push-result show err';
    resultEl.innerHTML = `❌ ${err.message}<br/><small>Crée la table codex_files avec le SQL dans le dropdown Supabase.</small>`;
    toast(`Erreur Supabase: ${err.message}`, 'err');
  }
}

// ========== VALIDATION CODE ==========
function validateCode(lang, code) {
  const issues = [];
  const lower  = code.toLowerCase();

  // Checks génériques
  if (code.length < 5) { issues.push({ type:'err', msg:'Bloc de code vide ou trop court' }); }

  if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
    if ((code.match(/\(/g)||[]).length !== (code.match(/\)/g)||[]).length)
      issues.push({ type:'warn', msg:'Parenthèses déséquilibrées' });
    if ((code.match(/\{/g)||[]).length !== (code.match(/\}/g)||[]).length)
      issues.push({ type:'warn', msg:'Accolades déséquilibrées' });
    if (lower.includes('eval('))
      issues.push({ type:'warn', msg:'eval() détecté — risque de sécurité' });
    if (lower.includes('console.log') && code.split('\n').length > 50)
      issues.push({ type:'info', msg:'Plusieurs console.log détectés — pense à les retirer en prod' });
    if (!lower.includes('const ') && !lower.includes('let ') && lower.includes('var '))
      issues.push({ type:'warn', msg:'Utilise const/let plutôt que var' });
  }

  if (lang === 'python' || lang === 'py') {
    if (lower.includes('import *'))
      issues.push({ type:'warn', msg:'import * — préfère les imports explicites' });
    if ((code.match(/def /g)||[]).length > 0 && !lower.includes('"""') && !lower.includes("'''"))
      issues.push({ type:'info', msg:'Aucune docstring détectée dans les fonctions' });
  }

  if (lang === 'sql') {
    if (lower.includes('drop table') || lower.includes('drop database'))
      issues.push({ type:'err', msg:'⚠️ DROP TABLE/DATABASE détecté — dangereux!' });
    if (lower.includes('select *'))
      issues.push({ type:'warn', msg:'SELECT * — spécifie les colonnes pour de meilleures performances' });
  }

  if (lang === 'html') {
    if (!lower.includes('<!doctype'))
      issues.push({ type:'warn', msg:'DOCTYPE manquant' });
    if (!lower.includes('<title>'))
      issues.push({ type:'info', msg:'Balise <title> manquante' });
  }

  if (issues.length === 0) return { type:'ok', msg:'✅ Code valide — aucun problème détecté!' };
  const worst = issues.find(i=>i.type==='err') || issues.find(i=>i.type==='warn') || issues[0];
  return { type: worst.type, msg: issues.map(i => {
    const icon = i.type==='err'?'❌':i.type==='warn'?'⚠️':'ℹ️';
    return `${icon} ${i.msg}`;
  }).join('  ·  ') };
}

// ========== SUPABASE / GITHUB ==========
supabaseSave.addEventListener('click', async () => {
  const url = supabaseUrlInput.value.trim().replace(/\/$/, '');
  const key = supabaseKeyInput.value.trim();
  if (!url.includes('supabase.co') || !key.startsWith('eyJ')) {
    setStatus(supabaseStatus,'✗ URL ou clé invalide','err'); return;
  }
  setStatus(supabaseStatus,'⏳ Vérification...','');
  try {
    const res = await fetch(`${url}/rest/v1/`, { headers:{ apikey:key, Authorization:`Bearer ${key}` } });
    if (res.status===401) throw new Error('Clé refusée par Supabase');
    supabaseUrl=url; supabaseKey=key;
    localStorage.setItem('codex_sb_url', url);
    localStorage.setItem('codex_sb_key', key);
    setStatus(supabaseStatus,'✓ Supabase connecté!','ok');
    setSBConnected();
    setTimeout(closeAllDD, 1500);
  } catch(err) { setStatus(supabaseStatus,`✗ ${err.message}`,'err'); }
});
function setSBConnected() {
  supabaseBtn.classList.add('connected');
  supabaseLabel.textContent = '✓ Supabase';
}

function setStatus(el, msg, type) {
  el.textContent = msg;
  el.className   = 'connect-status' + (type ? ` ${type}` : '');
}

// ========== CONVERSATIONS ==========
function saveConvs() { localStorage.setItem('codex_convs', JSON.stringify(conversations)); }
function getConv()   { return conversations.find(c=>c.id===currentConvId)||null; }

function createConv() {
  const c = { id:'conv_'+Date.now(), title:'Nouvelle conversation', messages:[], createdAt:Date.now() };
  conversations.unshift(c); saveConvs(); return c;
}

function loadConv(id) {
  currentConvId = id;
  const conv = getConv(); if (!conv) return;
  convTitle.textContent  = conv.title;
  chatMessages.innerHTML = '';
  if (conv.messages.length === 0) chatMessages.appendChild(makeWelcome());
  else conv.messages.forEach(m => appendMessage(m.role, m.content, false));
  renderConvList(); scrollBottom();
}

function makeWelcome() {
  const d = document.createElement('div');
  d.id='welcomeScreen'; d.className='welcome-screen';
  d.innerHTML=`<div class="welcome-icon">🧠</div>
    <h1>Bienvenue dans Codex</h1>
    <p>Propulsé par <strong>Claude d'Anthropic</strong>.<br/>Entre ta clé API en haut pour commencer.</p>
    <div class="chips">
      <button class="chip" onclick="setInput('Optimise ce code pour la performance maximale et explique chaque amélioration')">⚡ Optimiser du code</button>
      <button class="chip" onclick="setInput('Écris un composant React performant avec mémoïsation')">⚛️ React perf</button>
      <button class="chip" onclick="setInput('Analyse la complexité algorithmique et propose des améliorations')">📊 Analyse O(n)</button>
      <button class="chip" onclick="setInput('Crée une API REST Node.js ultra-rapide avec cache')">🚀 API rapide</button>
    </div>`;
  return d;
}

function renderConvList() {
  convsList.innerHTML = '';
  if (conversations.length===0) { convsList.innerHTML='<div class="empty-list">Aucune conversation encore</div>'; return; }
  conversations.forEach(conv => {
    const item = document.createElement('div');
    item.className = 'conv-item'+(conv.id===currentConvId?' active':'');
    item.innerHTML = `<span class="conv-icon">💬</span><span class="conv-name">${escH(conv.title)}</span><button class="conv-delete" title="Supprimer">✕</button>`;
    item.addEventListener('click', e => {
      if (e.target.classList.contains('conv-delete')) { deleteConv(conv.id); return; }
      loadConv(conv.id);
      if (window.innerWidth<=640) closeSidebar();
    });
    convsList.appendChild(item);
  });
}

function deleteConv(id) {
  conversations = conversations.filter(c=>c.id!==id); saveConvs();
  if (currentConvId===id) {
    currentConvId=null; chatMessages.innerHTML='';
    chatMessages.appendChild(makeWelcome());
    convTitle.textContent='Nouvelle conversation';
  }
  renderConvList();
}

newChatBtn.addEventListener('click', () => { const c=createConv(); loadConv(c.id); if(window.innerWidth<=640) closeSidebar(); });
clearBtn.addEventListener('click', () => {
  if (!currentConvId) return;
  const conv = getConv();
  if (!conv||!confirm('Effacer les messages?')) return;
  conv.messages=[]; conv.title='Nouvelle conversation'; saveConvs(); loadConv(currentConvId);
});

// ========== MESSAGES UI ==========
function appendMessage(role, content, animate=true) {
  const ws = document.getElementById('welcomeScreen');
  if (ws) ws.remove();
  const row    = document.createElement('div');
  row.className = `message-row ${role}`;
  if (!animate) row.style.animation = 'none';
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.innerHTML  = renderContent(content, role);
  row.innerHTML = `<div class="avatar ${role}">${role==='bot'?'🧠':'👤'}</div>`;
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  scrollBottom();
  return bubble;
}

function appendTyping() {
  const ws = document.getElementById('welcomeScreen');
  if (ws) ws.remove();
  const row = document.createElement('div');
  row.className='message-row bot'; row.id='typingRow';
  row.innerHTML=`<div class="avatar bot">🧠</div><div class="bubble bot"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  chatMessages.appendChild(row); scrollBottom();
}
function removeTyping() { const el=$('typingRow'); if(el) el.remove(); }
function scrollBottom()  { chatMessages.scrollTop=chatMessages.scrollHeight; }

// ===== RENDER CONTENT =====
function renderContent(text, role='bot') {
  let out='';
  let lastIdx=0;
  const codeRx = /```(\w*)[^\n]*\n?([\s\S]*?)```/g;
  let m;
  while ((m=codeRx.exec(text))!==null) {
    out += renderInline(text.slice(lastIdx, m.index));
    const lang    = (m[1]||'code').toLowerCase();
    const rawCode = m[2].trim();
    const escaped = escH(rawCode);

    // Génère un ID unique pour ce bloc
    const blockId = 'cb_' + Math.random().toString(36).slice(2,8);

    // Boutons push selon connexions
    const ghBtn = githubToken
      ? `<button class="btn-push-gh" id="gh_${blockId}" onclick="handlePushGH('${blockId}')">🐙 Push GitHub</button>`
      : '';
    const sbBtn = supabaseUrl
      ? `<button class="btn-push-sb" id="sb_${blockId}" onclick="handlePushSB('${blockId}')">⚡ Save Supabase</button>`
      : '';

    out += `
      <div class="code-block-wrapper" data-lang="${lang}" data-code="${blockId}" id="wrapper_${blockId}">
        <div class="code-block-header">
          <span class="code-lang-badge">${lang}</span>
          <input class="code-filename-input" id="fname_${blockId}" placeholder="nom-du-fichier.${langToExt(lang)}" type="text" />
          <div class="code-actions">
            <button class="btn-validate" onclick="handleValidate('${blockId}')">🔍 Valider</button>
            <button class="btn-copy" id="copy_${blockId}" onclick="handleCopy('${blockId}')">📋 Copier</button>
            ${ghBtn}
            ${sbBtn}
          </div>
        </div>
        <pre><code id="code_${blockId}">${escaped}</code></pre>
        <div class="code-validation" id="valid_${blockId}"></div>
        <div class="push-result" id="result_${blockId}"></div>
      </div>`;
    lastIdx = m.index + m[0].length;
  }
  out += renderInline(text.slice(lastIdx));
  return out;
}

function renderInline(text) {
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/\n/g, '<br/>');
  return text;
}

function escH(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function langToExt(lang) {
  const map = { javascript:'js', typescript:'ts', python:'py', html:'html', css:'css',
    sql:'sql', bash:'sh', shell:'sh', json:'json', yaml:'yml', rust:'rs',
    go:'go', java:'java', cpp:'cpp', c:'c', php:'php', ruby:'rb', swift:'swift' };
  return map[lang] || lang || 'txt';
}

// ===== ACTIONS SUR BLOCS DE CODE =====
window.handleCopy = (id) => {
  const code = document.getElementById(`code_${id}`)?.innerText || '';
  navigator.clipboard.writeText(code);
  const btn = document.getElementById(`copy_${id}`);
  if (btn) { btn.textContent='✓ Copié!'; setTimeout(()=>{ btn.textContent='📋 Copier'; },2000); }
  toast('Code copié!', 'ok');
};

window.handleValidate = (id) => {
  const wrapper = document.getElementById(`wrapper_${id}`);
  const lang    = wrapper?.dataset.lang || '';
  const code    = document.getElementById(`code_${id}`)?.innerText || '';
  const validEl = document.getElementById(`valid_${id}`);
  if (!validEl) return;
  const result  = validateCode(lang, code);
  validEl.className  = `code-validation show ${result.type}`;
  validEl.innerHTML  = result.msg;
  toast(result.type==='ok' ? '✅ Code validé!' : '⚠️ Problèmes détectés', result.type==='ok'?'ok':'info');
};

window.handlePushGH = (id) => {
  const fname  = document.getElementById(`fname_${id}`)?.value.trim();
  const code   = document.getElementById(`code_${id}`)?.innerText || '';
  const btnEl  = document.getElementById(`gh_${id}`);
  const result = document.getElementById(`result_${id}`);
  // Validation auto avant push
  const wrapper = document.getElementById(`wrapper_${id}`);
  const lang    = wrapper?.dataset.lang || '';
  const check   = validateCode(lang, code);
  if (check.type === 'err') {
    const validEl = document.getElementById(`valid_${id}`);
    if (validEl) { validEl.className='code-validation show err'; validEl.innerHTML=check.msg; }
    toast('Code invalide — corrige avant de pusher!', 'err');
    return;
  }
  pushToGitHub(fname, code, btnEl, result);
};

window.handlePushSB = (id) => {
  const fname  = document.getElementById(`fname_${id}`)?.value.trim();
  const code   = document.getElementById(`code_${id}`)?.innerText || '';
  const btnEl  = document.getElementById(`sb_${id}`);
  const result = document.getElementById(`result_${id}`);
  const wrapper= document.getElementById(`wrapper_${id}`);
  const lang   = wrapper?.dataset.lang || '';
  // Validation auto avant push
  const check  = validateCode(lang, code);
  if (check.type === 'err') {
    const validEl = document.getElementById(`valid_${id}`);
    if (validEl) { validEl.className='code-validation show err'; validEl.innerHTML=check.msg; }
    toast('Code invalide — corrige avant de sauvegarder!', 'err');
    return;
  }
  pushToSupabase(fname, lang, code, currentConvId, btnEl, result);
};

// ========== TOAST ==========
function toast(msg, type='info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = msg;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.opacity='0'; el.style.transform='translateX(20px)';
    el.style.transition='all .3s ease';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ========== INPUT ==========
chatInput.addEventListener('input', () => {
  chatInput.style.height='auto';
  chatInput.style.height=Math.min(chatInput.scrollHeight,200)+'px';
  sendBtn.disabled = !chatInput.value.trim() || isStreaming;
});
chatInput.addEventListener('keydown', e => {
  if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); if(!sendBtn.disabled) sendMessage(); }
});
sendBtn.addEventListener('click', sendMessage);

window.setInput = (text) => {
  chatInput.value=text;
  chatInput.dispatchEvent(new Event('input'));
  chatInput.focus();
};

// ========== STREAMING LETTRE PAR LETTRE ==========
let charQueue       = [];
let renderTimer     = null;
let currentBubble   = null;
let fullAccumulated = '';

function startLetterStream(bubble) {
  currentBubble=bubble; charQueue=[]; fullAccumulated=''; scheduleRender();
}

function pushChars(text) { for (const ch of text) charQueue.push(ch); }

function scheduleRender() {
  if (renderTimer) return;
  renderTimer = setInterval(flushChars, 16);
}

function flushChars() {
  if (!currentBubble) return;
  const batch = Math.min(4, charQueue.length);
  for (let i=0;i<batch;i++) {
    if (charQueue.length===0) break;
    fullAccumulated += charQueue.shift();
  }
  // Rendu brut avec curseur pendant le stream (pas de renderContent pour la perf)
  currentBubble.innerHTML = renderContent(fullAccumulated) + '<span class="cursor-blink"></span>';
  scrollBottom();

  if (charQueue.length===0 && !isStreaming) {
    clearInterval(renderTimer); renderTimer=null;
    currentBubble.innerHTML = renderContent(fullAccumulated);
    currentBubble=null;
    scrollBottom();
  }
}

// ========== SEND → CLAUDE ==========
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text||isStreaming) return;
  if (!apiKey) { alert('Entre ta clé Anthropic en haut à droite! 🔑'); return; }

  if (!currentConvId) { const c=createConv(); currentConvId=c.id; renderConvList(); }

  const conv = getConv();
  conv.messages.push({ role:'user', content:text });
  appendMessage('user', text);

  if (conv.messages.length===1) {
    conv.title = text.slice(0,44)+(text.length>44?'…':'');
    convTitle.textContent = conv.title;
  }

  saveConvs(); renderConvList();
  chatInput.value=''; chatInput.style.height='auto';
  sendBtn.disabled=true; isStreaming=true;
  appendTyping();

  // ===== SYSTEM PROMPT PERFORMANCE =====
  const perfInstructions = perfMode ? `

MODE PERFORMANCE MAXIMUM ACTIVÉ — Instructions obligatoires pour tout code généré:
• Complexité algorithmique: vise toujours O(1) ou O(log n) quand possible, évite O(n²)
• Mémoire: minimise les allocations, réutilise les objets, évite les fuites
• JavaScript: utilise const/let, évite var, préfère les méthodes natives (map/filter/reduce)
• React: applique useMemo/useCallback/React.memo systématiquement, évite les re-renders
• CSS: préfère transform/opacity pour les animations (GPU), évite les reflows
• SQL: INDEX sur chaque colonne de filtre/jointure, EXPLAIN ANALYZE avant de conclure
• Node.js: stream les données volumineuses, utilise le clustering, cache Redis
• Après chaque bloc de code, ajoute une note ⚡ PERF avec les gains obtenus
• Explique les trade-offs (vitesse vs lisibilité vs mémoire)` : '';

  let connCtx = '';
  if (githubToken) connCtx += `\nGitHub connecté (repo: ${githubRepo||'non défini'}, branche: ${githubBranch}).`;
  if (supabaseUrl) connCtx += `\nSupabase connecté (${supabaseUrl}).`;
  if (githubToken || supabaseUrl) connCtx += `\nLe code peut être pushé directement vers ces services via les boutons dans les blocs de code.`;

  const system = `Tu es Codex, un assistant développeur expert, direct et précis. Tu réponds en français québécois naturel. Spécialiste en architecture logicielle, performance et clean code.${perfInstructions}${connCtx}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key': apiKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 8096,
        stream: true,
        system,
        messages: conv.messages.map(m => ({
          role: m.role==='bot'?'assistant':'user',
          content: m.content
        }))
      })
    });

    if (!res.ok) { const err=await res.json(); throw new Error(err.error?.message||`Erreur ${res.status}`); }

    removeTyping();

    const ws2 = document.getElementById('welcomeScreen');
    if (ws2) ws2.remove();
    const row = document.createElement('div');
    row.className='message-row bot';
    const botBubble = document.createElement('div');
    botBubble.className='bubble bot';
    row.innerHTML=`<div class="avatar bot">🧠</div>`;
    row.appendChild(botBubble);
    chatMessages.appendChild(row);
    scrollBottom();

    startLetterStream(botBubble);
    let fullText = '';

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data==='[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type==='content_block_delta' && parsed.delta?.type==='text_delta') {
            const chunk = parsed.delta.text;
            fullText   += chunk;
            pushChars(chunk);
          }
        } catch(_) {}
      }
    }

    isStreaming = false;
    conv.messages.push({ role:'bot', content:fullText });
    saveConvs();

    const waitFlush = setInterval(() => {
      if (charQueue.length===0 && !renderTimer) {
        clearInterval(waitFlush);
        sendBtn.disabled = !chatInput.value.trim();
      }
    }, 50);

  } catch(err) {
    isStreaming=false;
    if (renderTimer) { clearInterval(renderTimer); renderTimer=null; }
    removeTyping();
    appendMessage('bot', `❌ Erreur : ${err.message}\n\nVérifie ta clé API pis réessaie!`);
    console.error(err);
    sendBtn.disabled = !chatInput.value.trim();
  }
}
