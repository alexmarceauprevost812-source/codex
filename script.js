/* ============================================================
   Ti-LEX Codex — script.js
   Claude API + GitHub REST + Supabase + File/ZIP upload
   ============================================================ */

'use strict';

// ─── STATE ────────────────────────────────────────────────────
const state = {
  anthropicKey: '',
  githubToken: '',
  repo: '',
  branch: 'main',
  supabase: null,
  messages: [],          // historique Claude
  attachments: [],       // fichiers joints au prochain message
  repoFiles: [],         // liste des fichiers du repo
  pendingCodex: null,    // codex-change en attente d'application
};

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSavedKeys();
  document.getElementById('sidebar').addEventListener('click', (e) => {
    if (e.target.id !== 'toggleSidebar') return;
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('attachMenu');
    if (!menu) return;
    if (!e.target.closest('.btn-plus') && !e.target.closest('.attach-menu')) {
      menu.style.display = 'none';
    }
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
    if (!v) return alert('Entre une clé Anthropic!');
    state.anthropicKey = v;
    localStorage.setItem('tilex_anthropic', v);
    showToast('✅ Clé Anthropic sauvegardée!');
  } else if (type === 'github') {
    const v = document.getElementById('githubToken').value.trim();
    if (!v) return alert('Entre un token GitHub!');
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
    // test ping
    await state.supabase.from('_dummy_').select('*').limit(1).maybeSingle();
    setStatus(el, 'ok', '✅ Supabase connecté');
    showToast('✅ Supabase OK!');
  } catch (err) {
    setStatus(el, 'ok', '✅ Supabase initialisé');
    showToast('✅ Supabase client créé!');
  }
}

// ─── GITHUB ───────────────────────────────────────────────────
async function loadRepo() {
  const repo   = document.getElementById('repoInput').value.trim();
  const branch = document.getElementById('branchInput').value.trim() || 'main';
  const el     = document.getElementById('repoStatus');
  if (!repo) return setStatus(el, 'err', '⚠️ Entre owner/repo');
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
      'Accept': 'application/vnd.github.v3+json',
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
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `<span>${fileIcon(path)}</span><span>${path}</span>`;
    div.onclick = () => injectFileContext(path, div);
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
    const data = await ghFetch(`/repos/${state.repo}/contents/${filePath}?ref=${state.branch}`);
    const content = atob(data.content.replace(/\n/g, ''));
    state.attachments.push({ name: filePath, content, fromRepo: true });
    renderAttachmentChips();
    showToast(`📎 ${filePath} ajouté au contexte`);
  } catch(e) {
    showToast(`❌ Erreur: ${e.message}`, true);
  }
}

// ─── APPLIQUER CODEX CHANGE AU REPO ───────────────────────────
async function applyToRepo(change) {
  if (!state.repo || !state.githubToken) {
    showToast('❌ Connecte ton repo GitHub!', true);
    return;
  }
  state.pendingCodex = change;
  const el = document.getElementById('modalContent');
  el.innerHTML = `
    <p style="color:var(--text-muted);margin-bottom:12px;">Fichier : 
      <code style="color:var(--orange);">${change.file_path}</code> 
      — Opération : <span class="codex-op op-${change.operation}">${change.operation}</span>
    </p>
    <div class="codex-preview">${escHtml(change.content?.slice(0,600) || '')}${change.content?.length > 600 ? '\n...' : ''}</div>
  `;
  document.getElementById('modalOverlay').style.display = 'flex';
}

async function applyCodexChange() {
  const change = state.pendingCodex;
  if (!change) return;
  closeModal();
  showToast('⏳ Application en cours...');
  try {
    if (change.operation === 'delete') {
      await ghDeleteFile(change.file_path);
    } else {
      await ghUpsertFile(change.file_path, change.content);
    }
    showToast(`✅ ${change.file_path} appliqué!`);
    await loadRepo();
  } catch(e) {
    showToast(`❌ ${e.message}`, true);
  }
}

async function ghUpsertFile(filePath, content) {
  let sha = null;
  try {
    const existing = await ghFetch(`/repos/${state.repo}/contents/${filePath}?ref=${state.branch}`);
    sha = existing.sha;
  } catch(e) { /* nouveau fichier */ }

  const body = {
    message: `✏️ Ti-LEX Codex: update ${filePath}`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: state.branch,
  };
  if (sha) body.sha = sha;

  await ghFetch(`/repos/${state.repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function ghDeleteFile(filePath) {
  const existing = await ghFetch(`/repos/${state.repo}/contents/${filePath}?ref=${state.branch}`);
  await ghFetch(`/repos/${state.repo}/contents/${filePath}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `🗑 Ti-LEX Codex: delete ${filePath}`,
      sha: existing.sha,
      branch: state.branch
    })
  });
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  state.pendingCodex = null;
}

// ─── FILE UPLOAD ──────────────────────────────────────────────
function toggleAttachMenu() {
  const m = document.getElementById('attachMenu');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
}

async function handleFileUpload(e) {
  const files = Array.from(e.target.files);
  for (const file of files) {
    const content = await readFileText(file);
    state.attachments.push({ name: file.name, content });
  }
  renderAttachmentChips();
  document.getElementById('attachMenu').style.display = 'none';
  showToast(`📎 ${files.length} fichier(s) ajouté(s)`);
  e.target.value = '';
}

async function handleZipUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  showToast('⏳ Extraction du ZIP...');
  try {
    const zip = await JSZip.loadAsync(file);
    const promises = [];
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        promises.push(
          zipEntry.async('string').then(content => {
            state.attachments.push({ name: relativePath, content });
          })
        );
      }
    });
    await Promise.all(promises);
    renderAttachmentChips();
    document.getElementById('attachMenu').style.display = 'none';
    showToast(`✅ ZIP extrait: ${promises.length} fichiers`);
  } catch(err) {
    showToast(`❌ ZIP erreur: ${err.message}`, true);
  }
  e.target.value = '';
}

function promptRepoFile() {
  document.getElementById('attachMenu').style.display = 'none';
  if (!state.repoFiles.length) {
    showToast('⚠️ Charge un repo dabord!', true);
    return;
  }
  const path = prompt('Chemin du fichier dans le repo:\n\n' + state.repoFiles.slice(0,20).join('\n'));
  if (path) injectFileContext(path, document.createElement('div'));
}

function readFileText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
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
  let container = document.getElementById('attachmentChips');
  if (!container) {
    container = document.createElement('div');
    container.id = 'attachmentChips';
    container.className = 'attachment-chips';
    document.querySelector('.input-bar').before(container);
  }
  container.innerHTML = state.attachments.map((a, i) => `
    <div class="chip">
      📎 ${escHtml(a.name)}
      <button onclick="removeAttachment(${i})">✕</button>
    </div>
  `).join('');
}

// ─── CLAUDE API ───────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es Ti-LEX Codex, un développeur expert en joual québécois authentique.
Tu réponds en joual : "chu", "faque", "pis", "ben", "tsé", "aweille", "câline", "toute".
Tu es précis, concis, orienté résultat.

Pour CHAQUE modification de code, tu utilises OBLIGATOIREMENT ce format JSON dans un bloc codex-change:
\`\`\`codex-change
{
  "file_path": "chemin/exact/fichier.ext",
  "operation": "create" | "update" | "delete",
  "content": "contenu complet du fichier"
}
\`\`\`

Règles:
- Toujours le format codex-change pour tout code, jamais de blocs normaux.
- Avant chaque bloc: 1 phrase d'intro. Après: 1-2 bullets d'explication.
- Code propre, fonctionnel, commenté si nécessaire.
- Si l'utilisateur a fourni des fichiers en contexte, utilise les vrais noms de fichiers.`;

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if (!text && !state.attachments.length) return;
  if (!state.anthropicKey) { showToast('⚠️ Entre ta clé Anthropic!', true); return; }

  // Build user content
  let userText = text;
  if (state.attachments.length) {
    userText += '\n\n---\nFichiers joints:\n';
    state.attachments.forEach(a => {
      userText += `\n### ${a.name}\n\`\`\`\n${a.content.slice(0, 8000)}\n\`\`\`\n`;
    });
    state.attachments = [];
    renderAttachmentChips();
  }
  if (state.repo) {
    userText = `[Repo actif: ${state.repo} (${state.branch})]\n\n` + userText;
  }

  input.value = '';
  input.style.height = 'auto';

  appendMsg('user', text);
  state.messages.push({ role: 'user', content: userText });

  const typingEl = appendTyping();

  try {
    const model = document.getElementById('modelSelect').value;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         state.anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: 8096,
        system: SYSTEM_PROMPT,
        messages: state.messages.slice(-20)
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const reply = data.content[0].text;
    state.messages.push({ role: 'assistant', content: reply });
    typingEl.remove();
    appendMsg('assistant', reply);
  } catch(e) {
    typingEl.remove();
    appendMsg('assistant', `❌ Erreur: ${e.message}`);
  }
}

// ─── RENDER MESSAGES ──────────────────────────────────────────
function appendMsg(role, content) {
  const win  = document.getElementById('chatWindow');
  const welcome = win.querySelector('.welcome-msg');
  if (welcome) welcome.remove();

  const div = document.createElement('div');
  div.className = `msg ${role}`;

  const avatar = role === 'user' ? '👤' : '⚡';
  const bodyHtml = renderContent(content);

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-content">${bodyHtml}</div>
    </div>
  `;

  // Wire up codex apply buttons
  win.appendChild(div);
  div.querySelectorAll('.btn-apply-codex').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      applyToRepo(JSON.parse(btn.dataset.change));
    });
  });

  win.scrollTop = win.scrollHeight;
  return div;
}

function renderContent(text) {
  // Parse codex-change blocks
  const codexRe = /```codex-change\s*([\s\S]*?)```/g;
  let result = '';
  let lastIndex = 0;
  let match;
  let codexIdx = 0;

  while ((match = codexRe.exec(text)) !== null) {
    // Text before block
    const before = text.slice(lastIndex, match.index);
    result += `<p>${escHtml(before).replace(/\n/g, '<br>')}</p>`;

    // Parse JSON
    let change = null;
    try { change = JSON.parse(match[1].trim()); } catch(e) {}

    if (change) {
      const opClass = `op-${change.operation}`;
      const preview = escHtml((change.content || '').slice(0, 500));
      const changeStr = escHtml(JSON.stringify(change));
      result += `
        <div class="codex-block">
          <div class="codex-header">
            <span class="codex-filepath">${escHtml(change.file_path || '')}</span>
            <span class="codex-op ${opClass}">${change.operation}</span>
          </div>
          <div class="codex-preview">${preview}${(change.content || '').length > 500 ? '\n...' : ''}</div>
          <div class="codex-actions">
            <button class="btn-orange btn-sm btn-apply-codex" data-idx="${codexIdx}" data-change='${changeStr}'>🚀 Appliquer au repo</button>
            <button class="btn-ghost" onclick="copyCodex(this)" data-content='${escHtml(change.content || '')}'>📋 Copier</button>
          </div>
        </div>`;
      codexIdx++;
    } else {
      result += `<pre>${escHtml(match[0])}</pre>`;
    }
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  const remaining = text.slice(lastIndex);
  result += `<p>${escHtml(remaining).replace(/\n/g, '<br>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`;
  return result;
}

function copyCodex(btn) {
  const content = btn.dataset.content;
  navigator.clipboard.writeText(content).then(() => showToast('📋 Copié!'));
}

function appendTyping() {
  const win = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = 'msg assistant';
  div.innerHTML = `
    <div class="msg-avatar">⚡</div>
    <div class="msg-body">
      <div class="msg-content">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>
    </div>`;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
  return div;
}

// ─── UTILS ────────────────────────────────────────────────────
function clearChat() {
  if (!confirm('Vider le chat?')) return;
  state.messages = [];
  const win = document.getElementById('chatWindow');
  win.innerHTML = `<div class="welcome-msg"><h2>⚡ Ti-LEX Codex</h2><p>Chu prêt à coder. Lâche-toi lousse!</p></div>`;
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

function setStatus(el, type, msg) {
  el.className = `status-badge ${type}`;
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

let toastTimeout;
function showToast(msg, isErr = false) {
  let toast = document.getElementById('tilex-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tilex-toast';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '20px', right: '20px',
      padding: '10px 20px', borderRadius: '10px',
      fontWeight: '600', fontSize: '13px',
      zIndex: '9999', transition: 'opacity 0.3s',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
    });
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background  = isErr ? '#ef4444' : '#f97316';
  toast.style.color       = '#fff';
  toast.style.opacity     = '1';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}