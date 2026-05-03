// ═══════════════════════════════════════
// RÉFÉRENCES DOM
// ═══════════════════════════════════════
const menuToggle      = document.getElementById('menuToggle');
const sidebar         = document.getElementById('sidebar');
const overlay         = document.getElementById('overlay');
const sendBtn         = document.getElementById('sendBtn');
const chatInput       = document.getElementById('chatInput');
const chatWindow      = document.getElementById('chatWindow');
const attachBtn       = document.getElementById('attachBtn');
const attachMenu      = document.getElementById('attachMenu');
const attachWrapper   = document.getElementById('attachWrapper');
const previewBar      = document.getElementById('previewBar');
const apiKeyInput     = document.getElementById('apiKeyInput');
const apiSaveBtn      = document.getElementById('apiSaveBtn');
const apiStatus       = document.getElementById('apiStatus');
const apiField        = document.getElementById('apiField');
const apiToggleVis    = document.getElementById('apiToggleVisibility');

// ═══════════════════════════════════════
// ÉTAT GLOBAL
// ═══════════════════════════════════════
let pendingFiles  = [];
let apiKey        = '';
let apiConnected  = false;

// ═══════════════════════════════════════
// CLÉ API ANTHROPIC
// ═══════════════════════════════════════

// Charger la clé sauvegardée (sessionStorage — jamais localStorage pour sécurité)
const savedKey = sessionStorage.getItem('anthropic_key');
if (savedKey) {
  apiKeyInput.value = savedKey;
  activateAPI(savedKey);
}

// Bouton Connecter
apiSaveBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    setStatus('❌ Entre une clé valide!', 'error');
    return;
  }
  if (!key.startsWith('sk-ant-')) {
    setStatus('⚠️ La clé doit commencer par sk-ant-...', 'error');
    return;
  }
  setStatus('⏳ Connexion...', 'loading');
  // Simulation validation (remplace par un vrai appel API si besoin)
  setTimeout(() => {
    sessionStorage.setItem('anthropic_key', key);
    activateAPI(key);
  }, 800);
});

// Entrée clavier sur le champ
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') apiSaveBtn.click();
});

// Voir / cacher la clé
apiToggleVis.addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  apiToggleVis.textContent = isPassword ? '🙈' : '👁️';
});

function activateAPI(key) {
  apiKey       = key;
  apiConnected = true;
  setStatus('✅ Clé connectée — prêt à chatter!', 'success');
  apiField.classList.add('connected');
  apiSaveBtn.textContent    = 'Déconnecter';
  apiSaveBtn.classList.add('connected');

  // Activer le chat
  chatInput.disabled  = false;
  sendBtn.disabled    = false;
  attachBtn.disabled  = false;
  chatInput.placeholder = 'Écris ton message...';

  addBotMessage('🔑 Clé API connectée! Chu prêt, lâche ta question! 🍁');

  // Remplacer le bouton par "Déconnecter"
  apiSaveBtn.onclick = disconnectAPI;
}

function disconnectAPI() {
  apiKey       = '';
  apiConnected = false;
  sessionStorage.removeItem('anthropic_key');
  apiKeyInput.value = '';
  apiField.classList.remove('connected');
  apiSaveBtn.textContent = 'Connecter';
  apiSaveBtn.classList.remove('connected');
  apiSaveBtn.onclick = null;
  setStatus('🔒 Déconnecté.', 'error');

  chatInput.disabled  = true;
  sendBtn.disabled    = true;
  attachBtn.disabled  = true;
  chatInput.placeholder = 'Entre ta clé API pour commencer...';

  apiSaveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key || !key.startsWith('sk-ant-')) {
      setStatus('⚠️ Clé invalide!', 'error');
      return;
    }
    setStatus('⏳ Connexion...', 'loading');
    setTimeout(() => {
      sessionStorage.setItem('anthropic_key', key);
      activateAPI(key);
    }, 800);
  }, { once: true });
}

function setStatus(msg, type) {
  apiStatus.textContent  = msg;
  apiStatus.className    = 'api-status ' + type;
}

// ═══════════════════════════════════════
// TOGGLE MENU LATÉRAL
// ═══════════════════════════════════════
menuToggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  overlay.classList.toggle('active', isOpen);
  menuToggle.textContent = isOpen ? '✕' : '☰';
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  menuToggle.textContent = '☰';
});

// ═══════════════════════════════════════
// TOGGLE MENU PIÈCES JOINTES
// ═══════════════════════════════════════
attachBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = attachMenu.classList.toggle('open');
  attachBtn.classList.toggle('active', isOpen);
});

document.addEventListener('click', (e) => {
  if (!attachWrapper.contains(e.target)) {
    attachMenu.classList.remove('open');
    attachBtn.classList.remove('active');
  }
});

// ═══════════════════════════════════════
// GESTION FICHIERS
// ═══════════════════════════════════════
function handleFileInput(inputId, type) {
  const input = document.getElementById(inputId);
  input.addEventListener('change', () => {
    Array.from(input.files).forEach(f => addFileChip(f, type));
    input.value = '';
    attachMenu.classList.remove('open');
    attachBtn.classList.remove('active');
  });
}
handleFileInput('inputFichier', 'file');
handleFileInput('inputZip',     'zip');
handleFileInput('inputImage',   'image');

function addFileChip(file, type) {
  const id = Date.now() + Math.random();
  pendingFiles.push({ id, file, type });

  const chip = document.createElement('div');
  chip.classList.add('preview-chip');
  chip.dataset.id = id;

  let icon = type === 'zip' ? '🗜️ ' : type === 'image' ? '' : '📄 ';

  if (type === 'image') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.classList.add('preview-thumb');
      chip.prepend(img);
    };
    reader.readAsDataURL(file);
  }

  chip.innerHTML = `
    <span>${icon}${escapeHTML(file.name)}</span>
    <span class="remove-chip" data-id="${id}">×</span>
  `;
  chip.querySelector('.remove-chip').addEventListener('click', () => {
    pendingFiles = pendingFiles.filter(f => f.id !== id);
    chip.remove();
  });
  previewBar.appendChild(chip);
}

// ═══════════════════════════════════════
// AUTO-RESIZE TEXTAREA
// ═══════════════════════════════════════
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = chatInput.scrollHeight + 'px';
});

// ═══════════════════════════════════════
// ENVOYER MESSAGE
// ═══════════════════════════════════════
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text && pendingFiles.length === 0) return;
  if (!apiConnected) return;

  if (pendingFiles.length > 0) {
    const attachMsg = document.createElement('div');
    attachMsg.classList.add('message', 'user');
    attachMsg.innerHTML = pendingFiles.map(f => {
      if (f.type === 'image') {
        return `<img src="${URL.createObjectURL(f.file)}"
                     style="max-width:180px;border-radius:8px;display:block;margin-top:6px;" />`;
      }
      return `<div>${f.type === 'zip' ? '🗜️' : '📄'} ${escapeHTML(f.file.name)}</div>`;
    }).join('');
    chatWindow.appendChild(attachMsg);
    pendingFiles = [];
    previewBar.innerHTML = '';
  }

  if (text) {
    const userMsg = document.createElement('div');
    userMsg.classList.add('message', 'user');
    userMsg.innerHTML = `<span>${escapeHTML(text)}</span>`;
    chatWindow.appendChild(userMsg);
  }

  chatInput.value = '';
  chatInput.style.height = 'auto';
  scrollToBottom();

  setTimeout(() => {
    addBotMessage('Chu en train de traiter ça avec ta clé Anthropic... 🍁');
  }, 600);
}

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
sendBtn.addEventListener('click', sendMessage);

// ═══════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════
function addBotMessage(text) {
  const msg = document.createElement('div');
  msg.classList.add('message', 'bot');
  msg.innerHTML = `<span>${text}</span>`;
  chatWindow.appendChild(msg);
  scrollToBottom();
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════
// ITEMS DISCUSSION
// ═══════════════════════════════════════
document.querySelectorAll('.discussion-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.discussion-item')
      .forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.textContent = '☰';
  });
});