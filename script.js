// ===== SKILLER CODEX AI — script.js =====

const state = {
  activePanel: 'conversations',
  githubConnected: false,
  anthropicKey: localStorage.getItem('sk_anthropic') || '',
  model: localStorage.getItem('sk_model') || 'claude-sonnet-4-5',
  messages: [],
  isLoading: false
};

// ─── DOM ───────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initChat();
  initSettings();
  initGitHub();
  animateSkillBars();
  loadWelcomeMsg();
});

// ─── NAVIGATION SIDEBAR ────────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      // Active le bouton
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Affiche le bon panneau
      document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
      const target = document.getElementById('panel-' + panel);
      if (target) target.classList.add('active');
      state.activePanel = panel;
    });
  });
}

// ─── MESSAGE DE BIENVENUE ──────────────────────────────────
function loadWelcomeMsg() {
  const key = state.anthropicKey;
  const txt = key
    ? 'Cle API chargee ! Je suis Claude, ton Codex AI. Comment puis-je taider aujourd hui ? 🚀'
    : 'Bienvenue sur Skiller Codex AI ! Entre ta cle API Anthropic dans Parametres (engrenage) pour activer Claude. 🔑';
  addMsg('received', txt, 'Claude');
}

// ─── INIT CHAT ─────────────────────────────────────────────
function initChat() {
  const input = $('msgInput');
  const sendBtn = $('btnSend');
  const clearBtn = $('btnClearChat');

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  clearBtn.addEventListener('click', () => {
    $('chatMessages').innerHTML = '';
    state.messages = [];
    loadWelcomeMsg();
  });
}

// ─── ENVOYER MESSAGE ───────────────────────────────────────
async function sendMessage() {
  const input = $('msgInput');
  const text = input.value.trim();
  if (!text || state.isLoading) return;

  addMsg('sent', text);
  state.messages.push({ role: 'user', content: text });
  input.value = '';

  if (!state.anthropicKey) {
    addMsg('received', 'Aucune cle API detectee. Va dans Parametres et entre ta cle Anthropic pour activer Claude ! 🔑', 'Claude');
    return;
  }

  await callClaude(text);
}

// ─── APPEL CLAUDE API ──────────────────────────────────────
async function callClaude(userText) {
  state.isLoading = true;
  const sendBtn = $('btnSend');
  sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  sendBtn.disabled = true;

  // Indicateur typing
  const typingId = addTyping();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: state.model,
        max_tokens: 1024,
        system: 'Tu es Codex AI, un assistant de developpement integre dans la plateforme Skiller. Tu aides avec le code, larchitecture, le debug et les explications. Reponds en francais, de facon claire et concise.',
        messages: state.messages
      })
    });

    removeTyping(typingId);

    if (!res.ok) {
      const err = await res.json();
      const msg = err.error?.message || 'Erreur API Anthropic';
      addMsg('received', '❌ Erreur: ' + msg, 'Claude');
      return;
    }

    const data = await res.json();
    const reply = data.content[0].text;
    state.messages.push({ role: 'assistant', content: reply });
    addMsg('received', reply, 'Claude');

  } catch (e) {
    removeTyping(typingId);
    addMsg('received', '❌ Erreur de connexion. Verifie ta cle API et ta connexion internet.', 'Claude');
  } finally {
    state.isLoading = false;
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    sendBtn.disabled = false;
  }
}

// ─── AJOUTER MESSAGE ───────────────────────────────────────
function addMsg(type, text, sender) {
  const container = $('chatMessages');
  const div = document.createElement('div');
  div.className = 'message ' + type;

  const now = new Date();
  const time = now.getHours() + 'h' + String(now.getMinutes()).padStart(2, '0');

  if (type === 'received') {
    div.innerHTML = `
      <div class="msg-avatar">${(sender||'AI').substring(0,2).toUpperCase()}</div>
      <div class="msg-content">
        <span class="msg-sender">${sender || 'Claude'}</span>
        <p>${escapeHtml(text)}</p>
        <span class="msg-time">${time}</span>
      </div>`;
  } else {
    div.innerHTML = `
      <div class="msg-content">
        <p>${escapeHtml(text)}</p>
        <span class="msg-time">${time} <i class="fa-solid fa-check-double" style="color:var(--accent);font-size:.6rem"></i></span>
      </div>`;
  }

  div.style.opacity = '0';
  div.style.transform = type === 'sent' ? 'translateX(20px)' : 'translateX(-20px)';
  container.appendChild(div);

  requestAnimationFrame(() => {
    div.style.transition = 'all .25s ease';
    div.style.opacity = '1';
    div.style.transform = 'translateX(0)';
  });

  container.scrollTop = container.scrollHeight;
  return div;
}

// ─── TYPING INDICATOR ──────────────────────────────────────
function addTyping() {
  const id = 'typing-' + Date.now();
  const container = $('chatMessages');
  const div = document.createElement('div');
  div.id = id;
  div.className = 'message received';
  div.innerHTML = `
    <div class="msg-avatar">AI</div>
    <div class="msg-content">
      <span class="msg-sender">Claude</span>
      <p style="display:flex;gap:5px;align-items:center">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </p>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'<br/>');
}

// ─── SETTINGS ──────────────────────────────────────────────
function initSettings() {
  const keyInput = $('anthropicKey');
  const btnSave = $('btnSaveKey');
  const btnClear = $('btnClearKey');
  const btnEye = $('btnEye');
  const keyStatus = $('keyStatus');
  const modelSelect = $('modelSelect');

  // Charge la cle sauvegardee
  if (state.anthropicKey) {
    keyInput.value = state.anthropicKey;
    showKeyStatus('ok', '✅ Cle API chargee — Claude est actif !');
  }

  // Charge le modele
  modelSelect.value = state.model;
  modelSelect.addEventListener('change', () => {
    state.model = modelSelect.value;
    localStorage.setItem('sk_model', state.model);
  });

  // Toggle visibilite
  btnEye.addEventListener('click', () => {
    const isPass = keyInput.type === 'password';
    keyInput.type = isPass ? 'text' : 'password';
    btnEye.innerHTML = isPass
      ? '<i class="fa-solid fa-eye-slash"></i>'
      : '<i class="fa-solid fa-eye"></i>';
  });

  // Sauvegarder
  btnSave.addEventListener('click', () => {
    const val = keyInput.value.trim();
    if (!val) {
      showKeyStatus('err', '❌ Entre une cle API valide.');
      return;
    }
    if (!val.startsWith('sk-ant-')) {
      showKeyStatus('err', '❌ La cle doit commencer par sk-ant-...');
      return;
    }
    state.anthropicKey = val;
    localStorage.setItem('sk_anthropic', val);
    showKeyStatus('ok', '✅ Cle sauvegardee ! Claude est maintenant actif.');
    // Message de confirmation dans le chat
    addMsg('received', '🔑 Cle API Anthropic activee ! Je suis Claude, pret a taider. Pose-moi une question !', 'Claude');
  });

  // Effacer
  btnClear.addEventListener('click', () => {
    state.anthropicKey = '';
    localStorage.removeItem('sk_anthropic');
    keyInput.value = '';
    showKeyStatus('err', '🗑️ Cle effacee.');
    setTimeout(() => { keyStatus.className = 'key-status'; keyStatus.style.display='none'; }, 2000);
  });

  function showKeyStatus(type, msg) {
    keyStatus.textContent = msg;
    keyStatus.className = 'key-status ' + type;
  }
}

// ─── GITHUB ────────────────────────────────────────────────
function initGitHub() {
  [$('btnGithub'), $('btnGithub2')].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (state.githubConnected) return;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connexion...';
      btn.disabled = true;
      setTimeout(() => {
        state.githubConnected = true;
        [$('btnGithub'), $('btnGithub2')].forEach(b => {
          if (!b) return;
          b.innerHTML = '<i class="fa-brands fa-github"></i> Connecte ✓';
          b.classList.add('connected');
          b.disabled = false;
        });
        [$('githubStatus'), $('githubStatus2')].forEach(s => {
          if (!s) return;
          s.textContent = '@Alexmarceauprevost812';
          s.classList.add('online');
        });
        loadRepos();
        addMsg('received', '🐙 GitHub connecte ! Tes repos sont charges dans le panneau GitHub.', 'Claude');
      }, 1500);
    });
  });
}

function loadRepos() {
  const repos = [
    { name: 'texte-1', lang: 'JS', branch: 'Alex', stars: 2 },
    { name: 'portfolio', lang: 'HTML', branch: 'main', stars: 5 },
    { name: 'skiller-app', lang: 'JS', branch: 'dev', stars: 1 },
    { name: 'api-rest', lang: 'Node', branch: 'main', stars: 3 }
  ];
  [$('reposList'), $('reposList2')].forEach(list => {
    if (!list) return;
    list.innerHTML = '';
    repos.forEach(r => {
      const d = document.createElement('div');
      d.className = 'repo-item';
      d.innerHTML = `<i class="fa-solid fa-code-branch"></i><div class="repo-details"><span class="repo-name">${r.name}</span><span class="repo-branch"><i class="fa-solid fa-code-branch" style="font-size:.6rem"></i> ${r.branch}</span></div><div class="repo-meta"><span class="repo-lang">${r.lang}</span><span class="repo-stars"><i class="fa-solid fa-star" style="color:var(--accent);font-size:.6rem"></i> ${r.stars}</span></div>`;
      d.onclick = () => window.open('https://github.com/Alexmarceauprevost812/' + r.name, '_blank');
      list.appendChild(d);
    });
  });
}

// ─── SKILL BARS ────────────────────────────────────────────
function animateSkillBars() {
  document.querySelectorAll('.skill-fill').forEach(b => {
    const w = b.style.width;
    b.style.width = '0%';
    setTimeout(() => { b.style.transition = 'width 1s cubic-bezier(.4,0,.2,1)'; b.style.width = w; }, 500);
  });
}
