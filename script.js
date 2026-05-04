// === ÉLÉMENTS DOM ===
const chatMessages  = document.getElementById('chatMessages');
const userInput     = document.getElementById('userInput');
const btnSend       = document.getElementById('btnSend');
const btnPlus       = document.getElementById('btnPlus');
const attachMenu    = document.getElementById('attachMenu');
const fileInput     = document.getElementById('fileInput');
const zipInput      = document.getElementById('zipInput');
const filePreviewBar = document.getElementById('filePreviewBar');

// Fichiers en attente d'envoi
let pendingFiles = [];

// =============================================
// MENU « + »
// =============================================
btnPlus.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = attachMenu.classList.toggle('visible');
  btnPlus.classList.toggle('open', isOpen);
});

// Fermer le menu si on clique ailleurs
document.addEventListener('click', () => {
  attachMenu.classList.remove('visible');
  btnPlus.classList.remove('open');
});

attachMenu.addEventListener('click', (e) => e.stopPropagation());

// =============================================
// GESTION DES FICHIERS
// =============================================
function handleFiles(files) {
  Array.from(files).forEach(file => {
    // Éviter les doublons
    if (pendingFiles.find(f => f.name === file.name && f.size === file.size)) return;
    pendingFiles.push(file);
    addFileChip(file);
  });
  // Fermer le menu après sélection
  attachMenu.classList.remove('visible');
  btnPlus.classList.remove('open');
}

fileInput.addEventListener('change', () => handleFiles(fileInput.files));
zipInput.addEventListener('change',  () => handleFiles(zipInput.files));

function getFileIcon(file) {
  const name = file.name.toLowerCase();
  if (/\.(zip|tar|gz|rar|7z)$/.test(name)) return '🗜️';
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return '🖼️';
  if (/\.(mp4|mov|avi|mkv)$/.test(name)) return '🎬';
  if (/\.(mp3|wav|ogg)$/.test(name)) return '🎵';
  if (/\.(pdf)$/.test(name)) return '📕';
  if (/\.(doc|docx)$/.test(name)) return '📝';
  if (/\.(xls|xlsx|csv)$/.test(name)) return '📊';
  if (/\.(js|ts|py|html|css|json|md)$/.test(name)) return '💾';
  return '📄';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function addFileChip(file) {
  const chip = document.createElement('div');
  chip.className = 'file-chip';
  chip.dataset.fileName = file.name;

  chip.innerHTML = `
    <span>${getFileIcon(file)}</span>
    <span title="${file.name}">${file.name}</span>
    <span style="color:#6b7a8d;font-size:0.7rem">${formatSize(file.size)}</span>
    <span class="chip-remove" title="Retirer">✕</span>
  `;

  chip.querySelector('.chip-remove').addEventListener('click', () => {
    pendingFiles = pendingFiles.filter(f => !(f.name === file.name && f.size === file.size));
    chip.remove();
    // Reset inputs pour permettre re-sélection du même fichier
    fileInput.value = '';
    zipInput.value = '';
  });

  filePreviewBar.appendChild(chip);
}

// =============================================
// ENVOI DE MESSAGE
// =============================================
function sendMessage() {
  const text = userInput.value.trim();
  if (!text && pendingFiles.length === 0) return;

  // Afficher les fichiers joints comme bulles séparées
  pendingFiles.forEach(file => {
    addMessage('user', `${getFileIcon(file)}  ${file.name}  <span style="opacity:0.6;font-size:0.75rem">${formatSize(file.size)}</span>`, true);
  });

  // Afficher le texte
  if (text) addMessage('user', text);

  // Réponse bot simulée
  const hasFiles = pendingFiles.length > 0;
  setTimeout(() => {
    if (hasFiles && text) {
      botReply(`J'ai reçu ${pendingFiles.length} fichier(s) pis ton message. Je regarde ça !`);
    } else if (hasFiles) {
      botReply(`Parfait, j'ai reçu ${pendingFiles.length} fichier(s). Je les analyse !`);
    } else {
      botReply('Message reçu 👍');
    }
    // Nettoyer après envoi
    pendingFiles = [];
    filePreviewBar.innerHTML = '';
    fileInput.value = '';
    zipInput.value = '';
  }, 600);

  userInput.value = '';
  userInput.style.height = 'auto';
}

function addMessage(role, html, isFile = false) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  const bubble = document.createElement('span');
  bubble.className = 'bubble' + (isFile ? ' file-bubble' : '');
  bubble.innerHTML = html;
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function botReply(text) {
  addMessage('bot', text);
}

// =============================================
// EVENTS ENVOI
// =============================================
btnSend.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

// =============================================
// DRAG & DROP sur la fenêtre de chat
// =============================================
const chatContainer = document.querySelector('.chat-container');

chatContainer.addEventListener('dragover', (e) => {
  e.preventDefault();
  chatContainer.style.outline = '2px dashed #e94560';
});

chatContainer.addEventListener('dragleave', () => {
  chatContainer.style.outline = 'none';
});

chatContainer.addEventListener('drop', (e) => {
  e.preventDefault();
  chatContainer.style.outline = 'none';
  if (e.dataTransfer.files.length > 0) {
    handleFiles(e.dataTransfer.files);
  }
});
