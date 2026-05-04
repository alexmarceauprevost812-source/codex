/* ============================================================
   Ti-LEX Codex — script.js
   Streaming lettre/lettre + Auto-push GitHub
   ============================================================ */

'use strict';

// ─── STATE ────────────────────────────────────────────────────
const state = {
  anthropicKey : '',
  githubToken  : '',
  repo         : '',
  branch       : 'main',
  supabase     : null,
  messages     : [],
  attachments  : [],
  repoFiles    : [],
  isStreaming  : false,
};

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSavedKeys();

  document.getElementById('sidebar').addEventListener('click', e => {
    if (e.target.id === 'toggleSidebar')
      document.getElementById('sidebar').classList.toggle('collapsed');
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.btn-plus') && !e.target.closest('.attach-menu'))
      document.getElementById('attachMenu').style.display = 'none';
  });
});

// ─── KEYS ─────────────────────────────────────────────────────
function loadSavedKeys() {
  const ak = localStorage.getItem('tilex_anthropic');
  const gh = localStorage.getItem('tilex_github');
  if (ak) { state.anthropicKey = ak; document.getElementById('anthropicKey').value = ak; }
  if (gh) { state.githubToken  = gh; document.getElementById('githubToken').value  = gh; }
}

function saveKey(type) {
  if (type === 'anthropic') {
    const v = document.getElementById('anthropicKey').value.trim();
    if (!v) return showToast('⚠️ Entre une clé Anthropic!', true);
    state.anthropicKey = v;
    localStorage.setItem('tilex_anthropic', v);
    showToast('✅ Clé Anthropic sauvegardée!');
  } else {
    const v = document.getElementById('githubToken').value.trim();
    if (!v) return showToast('⚠️ Entre un token GitHub!', true);
    state.githubToken = v;
    localStorage.setItem('tilex_github', v);
    showToast('✅ Token GitHub sauvegardé!');
  }
}

// ─── SUPABASE ─────────────────────────────────────────────────
async function connectSupabase() {
  const url = document.getElementById('supabaseUrl').value.trim();
  const key = document.getElementById('supabaseKey').value.trim();
  const el  = document.getElementById('supabaseStatus');
  if (!url || !key) return setStatus(el, 'err', '⚠️ URL et clé requis');
  setStatus(el, 'loading', '⏳ Connexion...');
  try {
    state.supabase = supabase.createClient(url, key);
    setStatus(el, 'ok', '✅ Supabase connecté');
    showToast('✅ Supabase OK!');
  } catch (err) {
    setStatus(el, 'err', `❌ ${err.message}`);
  }
}

// ─── GITHUB ───────────────────────────────────────────────────
async function loadRepo() {
  const repo   = document.getElementById('repoInput').value.trim();
  const branch = document.getElementById('branchInput').value.trim() || 'main';
  const el     = document.getElementById('repoStatus');
  if (!repo)              return setStatus(el, 'err', '⚠️ Entre owner/repo');
  if (!state.githubToken) return setStatus(el, 'err', '⚠️ Token GitHub requis');
  setStatus(el, 'loading', '⏳ Chargement...');
  state.repo   = repo;
  state.branch = branch;
  try {
    const tree = await ghFetch(`/repos/${repo}/git/trees/${branch}?recursive=1`);
    state.repoFiles = tree.tree.filter(f => f.type === 'blob').map(f => f.path);
    renderFileTree();
    setStatus(el, 'ok', `✅ ${state.repoFiles.length} fichiers`);
    const lbl = document.getElementById('repoLabel');
    lbl.textContent = `📁 ${repo} (${branch})`;
    lbl.classList.add('connected');
    showToast(`✅ Repo ${repo} chargé!`);
  } catch (err) {
    setStatus(el, 'err', `❌ ${err.message}`);
  }
}

async function ghFetch(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      'Authorization': `token ${state.githubToken}`,
      'Accept':        'application/vnd.github.v3+json',
      ...opts.headers
    },
    ...opts
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

function renderFileTree() {
  const el = document.getElementById('fileTree');
  el.innerHTML = '';
  state.repoFiles.forEach(path => {
    const div       = document.createElement('div');
    div.className   = 'file-item';
    div.innerHTML   = `<span>${fileIcon(path)}</span><span>${path}</span>`;
    div.onclick     = () => injectFileContext(path, div);
    el.appendChild(div);
  });
}

function fileIcon(p) {
  if (p.endsWith('.js'))   return '🟨';
  if (p.endsWith('.ts'))   return '🔷';
  if (p.endsWith('.html')) return '🟧';
  if (p.endsWith('.css'))  return '🎨';
  if (p.endsWith('.py'))   return '🐍';
  if (p.endsWith('.json')) return '📋';
  if (p.endsWith('.md'))   return '📝';
  return '📄';
}

async function injectFileContext(filePath, el) {
  el.classList.toggle('selected');
  try {
    const data    = await ghFetch(`/repos/${state.repo}/contents/${filePath}?ref=${state.branch}`);
    const content = atob(data.content.replace(/\n/g, ''));
    state.attachments.push({ name: filePath, content, fromRepo: true });
    renderAttachmentChips();
    showToast(`📎 ${filePath} ajouté au contexte`);
  } catch(e) {
    showToast(`❌ ${e.message}`, true);
  }
}

// ─── AUTO-PUSH GITHUB ─────────────────────────────────────────
async function autoPushToRepo(change) {
  if (!state.repo || !state.githubToken) return;
  try {
    if (change.operation === 'delete') {
      await ghDeleteFile(change.file_path);
    } else {
      await ghUpsertFile(change.file_path, change.content);
    }
    showToast(`🚀 ${change.file_path} pushé!`);
    // Refresh file list silently
    if (state.repoFiles.length) loadRepo().catch(() => {});
  } catch(e) {
    showToast(`❌ Push raté: ${e.message}`, true);
  }
}

async function ghUpsertFile(filePath, content) {
  let sha = null;
  try {
    const existing = await ghFetch(`/repos/${state.repo}/contents/${filePath}?ref=${state.branch}`);
    sha = existing.sha;
  } catch(e) { /* nouveau fichier */ }
  const body = {
    message : `✏️ Ti-LEX Codex: ${sha ? 'update' : 'create'} ${filePath}`,
    content : btoa(unescape(encodeURIComponent(content))),
    branch  : state.branch,
  };
  if (sha) body.sha = sha;
  await ghFetch(`/repos/${state.repo}/contents/${filePath}`, {
    method  : 'PUT',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify(body)
  });
}

async function ghDeleteFile(filePath) {
  const existing = await ghFetch(`/repos/${state.repo}/contents/${filePath}?ref=${state.branch}`);
  await ghFetch(`/repos/${state.repo}/contents/${filePath}`, {
    method  : 'DELETE',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify({
      message : `🗑 Ti-LEX Codex: delete ${filePath}`,
      sha     : existing.sha,
      branch  : state.branch
    })
  });
}

// ─── FILE UPLOAD ──────────────────────────────────────────────
function toggleAttachMenu() {
  const m = document.getElementById('attachMenu');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
}

async function handleFileUpload(e) {
  for (const file of Array.from(e.target.files)) {
    const content = await readFileText(file);
    state.attachments.push({ name: file.name, content });
  }
  renderAttachmentChips();
  document.getElementById('attachMenu').style.display = 'none';
  showToast(`📎 ${e.target.files.length} fichier(s) ajouté(s)`);
  e.target.value = '';
}

async function handleZipUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  showToast('⏳ Extraction ZIP...');
  try {
    const zip       = await JSZip.loadAsync(file);
    const promises  = [];
    zip.forEach((rel, entry) => {
      if (!entry.dir)
        promises.push(entry.async('string').then(c => state.attachments.push({ name: rel, content: c })));
    });
    await Promise.all(promises);
    renderAttachmentChips();
    document.getElementById('attachMenu').style.display = 'none';
    showToast(`✅ ZIP: ${promises.length} fichiers extraits`);
  } catch(err) {
    showToast(`❌ ZIP: ${err.message}`, true);
  }
  e.target.value = '';
}

function promptRepoFile() {
  document.getElementById('attachMenu').style.display = 'none';
  if (!state.repoFiles.length) return showToast('⚠️ Charge un repo dabord!', true);
  const path = prompt('Chemin du fichier:\n\n' + state.repoFiles.slice(0, 20).join('\n'));
  if (path) injectFileContext(path, document.createElement('div'));
}

function readFileText(file) {
  return new Promise((res, rej) => {
    const r   = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}

function removeAttachment(idx) {
  state.attachments.splice(idx, 1);
  renderAttachmentChips();
}

function renderAttachmentChips() {
  let c = document.getElementById('attachmentChips');
  if (!c) {
    c = document.createElement('div');
    c.id        = 'attachmentChips';
    c.className = 'attachment-chips';
    document.querySelector('.input-bar').before(c);
  }
  c.innerHTML = state.attachments.map((a, i) => `
    <div class="chip">📎 ${escHtml(a.name)}
      <button onclick="removeAttachment(${i})">✕</button>
    </div>`).join('');
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────
const SYSTEM = `Tu es Ti-LEX Codex, développeur expert, tu réponds en joual québécois authentique.
Mots clés : chu, faque, pis, ben, tsé, aweille, câline, toute, lâche-toi lousse.

Pour chaque fichier à créer/modifier/supprimer, utilise OBLIGATOIREMENT ce format exact :
\`\`\`codex-change
{
  "file_path": "chemin/exact/fichier.ext",
  "operation": "create" | "update" | "delete",
  "content": "contenu complet du fichier"
}
\`\`\`

Les changements sont appliqués AUTOMATIQUEMENT au repo GitHub dès que tu les écris.
Toujours écrire le contenu COMPLET du fichier, jamais de '...' ou de résumé.
Code propre, fonctionnel, commenté si nécessaire.`;

// ─── SEND MESSAGE ─────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if ((!text && !state.attachments.length) || state.isStreaming) return;
  if (!state.anthropicKey) return showToast('⚠️ Entre ta clé Anthropic!', true);

  let userText = text;
  if (state.attachments.length) {
    userText += '\n\n---\nFichiers joints:\n';
    state.attachments.forEach(a => {
      userText += `\n### ${a.name}\n\`\`\`\n${a.content.slice(0, 8000)}\n\`\`\`\n`;
    });
    state.attachments = [];
    renderAttachmentChips();
  }
  if (state.repo) userText = `[Repo: ${state.repo} | Branche: ${state.branch}]\n\n` + userText;

  input.value        = '';
  input.style.height = 'auto';
  appendMsg('user', text);
  state.messages.push({ role: 'user', content: userText });

  await streamResponse();
}

// ─── STREAMING SSE ────────────────────────────────────────────
async function streamResponse() {
  state.isStreaming = true;
  document.getElementById('chatInput').disabled = true;

  // Crée la bulle assistant
  const msgEl    = createAssistantBubble();
  const bodyEl   = msgEl.querySelector('.stream-body');

  let   fullText   = '';
  let   charQueue  = [];       // queue de chars à afficher
  let   rendering  = false;
  let   done       = false;

  // Typewriter engine — lettre par lettre ultra fluide
  const CHAR_DELAY = 8; // ms entre chaque caractère
  function drainQueue() {
    if (rendering) return;
    if (charQueue.length === 0) {
      if (done) finalizeMessage(msgEl, fullText);
      return;
    }
    rendering = true;
    function tick() {
      if (charQueue.length === 0) {
        rendering = false;
        if (done) finalizeMessage(msgEl, fullText);
        return;
      }
      const ch = charQueue.shift();
      fullText += ch;
      renderStreaming(bodyEl, fullText);
      scrollBottom();
      setTimeout(tick, CHAR_DELAY);
    }
    tick();
  }

  try {
    const model = document.getElementById('modelSelect').value;
    const res   = await fetch('https://api.anthropic.com/v1/messages', {
      method  : 'POST',
      headers : {
        'Content-Type'      : 'application/json',
        'x-api-key'         : state.anthropicKey,
        'anthropic-version' : '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens : 8096,
        stream     : true,
        system     : SYSTEM,
        messages   : state.messages.slice(-20)
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buf     = '';

    while (true) {
      const { value, done: readerDone } = await reader.read();
      if (readerDone) break;
      buf += decoder.decode(value, { stream: true });

      // Parse SSE lines
      const lines = buf.split('\n');
      buf = lines.pop(); // garde la ligne incomplète

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const json = JSON.parse(data);
          if (json.type === 'content_block_delta' && json.delta?.text) {
            // Pousse chaque caractère dans la queue
            for (const ch of json.delta.text) charQueue.push(ch);
            drainQueue();
          }
        } catch(_) {}
      }
    }

    done = true;
    if (!rendering) finalizeMessage(msgEl, fullText);

  } catch(err) {
    done = true;
    charQueue = [];
    rendering = false;
    bodyEl.innerHTML = `<p style="color:#f87171">❌ ${escHtml(err.message)}</p>`;
    state.isStreaming = false;
    document.getElementById('chatInput').disabled = false;
  }
}

// ─── RENDU STREAMING (lettre par lettre) ──────────────────────
function renderStreaming(el, text) {
  // Affiche le texte brut avec un curseur clignotant
  // Détecte les blocs codex-change COMPLETS pendant le stream
  const escaped = escHtml(text);
  el.innerHTML  = `<div class="stream-text">${escaped.replace(/\n/g, '<br>')}<span class="cursor">█</span></div>`;
}

// ─── FINALISATION ─────────────────────────────────────────────
function finalizeMessage(msgEl, fullText) {
  state.isStreaming = false;
  document.getElementById('chatInput').disabled = false;
  state.messages.push({ role: 'assistant', content: fullText });

  // Render final propre avec codex blocks parsés
  const bodyEl     = msgEl.querySelector('.stream-body');
  bodyEl.innerHTML = renderFinal(fullText);

  // Auto-push TOUS les blocs codex-change détectés
  const codexRe = /```codex-change\s*([\s\S]*?)```/g;
  let match;
  const pushed  = [];
  while ((match = codexRe.exec(fullText)) !== null) {
    try {
      const change = JSON.parse(match[1].trim());
      if (change.file_path && change.operation) {
        pushed.push(change);
      }
    } catch(_) {}
  }

  if (pushed.length > 0 && state.repo && state.githubToken) {
    showToast(`⏳ Auto-push de ${pushed.length} fichier(s)...`);
    // Push séquentiel pour éviter les conflits SHA
    (async () => {
      for (const change of pushed) {
        await autoPushToRepo(change);
        await sleep(400);
      }
    })();
  }

  // Wire les boutons copy
  msgEl.querySelectorAll('.btn-copy-codex').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.content).then(() => showToast('📋 Copié!'));
    });
  });

  scrollBottom();
}

// ─── RENDER FINAL (avec codex blocks UI) ──────────────────────
function renderFinal(text) {
  const codexRe = /```codex-change\s*([\s\S]*?)```/g;
  let result    = '';
  let lastIndex = 0;
  let match;

  while ((match = codexRe.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before.trim())
      result += `<div class="prose">${mdToHtml(before)}</div>`;

    let change = null;
    try { change = JSON.parse(match[1].trim()); } catch(_) {}

    if (change) {
      const opCls    = `op-${change.operation}`;
      const preview  = escHtml((change.content || '').slice(0, 600));
      const full     = change.content || '';
      const repoConnected = !!(state.repo && state.githubToken);
      result += `
        <div class="codex-block">
          <div class="codex-header">
            <span class="codex-filepath">${escHtml(change.file_path || '')}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="codex-op ${opCls}">${change.operation}</span>
              ${repoConnected ? '<span class="pushed-badge">✅ Auto-pushé</span>' : ''}
            </div>
          </div>
          <div class="codex-preview">${preview}${full.length > 600 ? '\n...' : ''}</div>
          <div class="codex-actions">
            <button class="btn-ghost btn-copy-codex" data-content="${escHtml(full)}">📋 Copier le code</button>
            ${repoConnected ? `<button class="btn-orange btn-sm" onclick="manualPush(${escHtml(JSON.stringify(change))})">🔄 Re-push</button>` : ''}
          </div>
        </div>`;
    } else {
      result += `<pre class="code-raw">${escHtml(match[0])}</pre>`;
    }
    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining.trim())
    result += `<div class="prose">${mdToHtml(remaining)}</div>`;

  return result;
}

function manualPush(changeJson) {
  try {
    const change = typeof changeJson === 'string' ? JSON.parse(changeJson) : changeJson;
    autoPushToRepo(change);
  } catch(e) {
    showToast('❌ Erreur parse JSON', true);
  }
}

// ─── MD TO HTML (basique) ─────────────────────────────────────
function mdToHtml(text) {
  return escHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// ─── APPEND MSG (user) ────────────────────────────────────────
function appendMsg(role, content) {
  const win     = document.getElementById('chatWindow');
  const welcome = win.querySelector('.welcome-msg');
  if (welcome) welcome.remove();

  const div       = document.createElement('div');
  div.className   = `msg ${role}`;
  const avatar    = role === 'user' ? '👤' : '⚡';

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-content">${mdToHtml(content)}</div>
    </div>`;

  win.appendChild(div);
  scrollBottom();
  return div;
}

// ─── CRÉE BULLE ASSISTANT STREAMING ───────────────────────────
function createAssistantBubble() {
  const win = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = 'msg assistant';
  div.innerHTML = `
    <div class="msg-avatar">⚡</div>
    <div class="msg-body">
      <div class="msg-content">
        <div class="stream-body"></div>
      </div>
    </div>`;
  win.appendChild(div);
  scrollBottom();
  return div;
}

// ─── UTILS ────────────────────────────────────────────────────
function scrollBottom() {
  const w = document.getElementById('chatWindow');
  w.scrollTop = w.scrollHeight;
}

function clearChat() {
  if (!confirm('Vider le chat?')) return;
  state.messages  = [];
  state.isStreaming = false;
  document.getElementById('chatInput').disabled = false;
  document.getElementById('chatWindow').innerHTML =
    `<div class="welcome-msg"><h2>⚡ Ti-LEX Codex</h2><p>Chu prêt. Lâche-toi lousse!</p></div>`;
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

function setStatus(el, type, msg) {
  el.className  = `status-badge ${type}`;
  el.textContent = msg;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let _toastTimer;
function showToast(msg, isErr = false) {
  let t = document.getElementById('tilex-toast');
  if (!t) {
    t    = document.createElement('div');
    t.id = 'tilex-toast';
    Object.assign(t.style, {
      position:'fixed', bottom:'24px', right:'24px',
      padding:'10px 20px', borderRadius:'12px',
      fontWeight:'600', fontSize:'13px', fontFamily:'Inter,sans-serif',
      zIndex:'9999', transition:'opacity 0.3s ease',
      boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
      maxWidth: '320px'
    });
    document.body.appendChild(t);
  }
  t.textContent    = msg;
  t.style.background = isErr ? '#ef4444' : '#ff6b2b';
  t.style.color      = '#fff';
  t.style.opacity    = '1';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.style.opacity = '0', 3500);
}