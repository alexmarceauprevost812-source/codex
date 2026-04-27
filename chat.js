// ===== CHAT.JS — TI-LEX-AL via serveur local =====

const API_URL = '/api/chat';

const messagesHistory = [];

// --- Auth guard ---
const session = JSON.parse(sessionStorage.getItem('tilexal_logged') || 'null');
if (!session) { window.location.href = 'index.html'; }

// --- Setup UI au load ---
window.addEventListener('DOMContentLoaded', () => {
  const welcomeMsg = document.getElementById('welcome-msg');
  const modeBadge  = document.getElementById('mode-badge');
  const demoNote   = document.getElementById('demo-note');

  if (session.demo) {
    welcomeMsg.textContent = '⚡ MODE DÉMO — TI-LEX-AL';
    modeBadge.textContent  = '🎯 DÉMO';
    demoNote.textContent   = '⚠️ Mode démo — crée un compte pour sauvegarder tes conversations!';
  } else {
    welcomeMsg.textContent = '👋 Bienvenue Alex à ton bureau 😈🔥';
    modeBadge.textContent  = '✅ ' + session.user;
    demoNote.textContent   = '';
  }
});

// --- Envoyer un message ---
async function sendMessage() {
  const input = document.getElementById('user-input');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  appendMsg('user', text);
  messagesHistory.push({ role: 'user', content: text });

  const typingId = showTyping();

  try {
    const response = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: messagesHistory })
    });

    const data = await response.json();
    removeTyping(typingId);

    if (data.error) {
      appendMsg('ai', '❌ Erreur: ' + data.error);
      return;
    }

    messagesHistory.push({ role: 'assistant', content: data.reply });
    appendMsg('ai', data.reply);

  } catch (err) {
    removeTyping(typingId);
    appendMsg('ai', '❌ Câline, serveur introuvable! As-tu démarré server.js?');
    console.error(err);
  }
}

// --- Afficher un message ---
function appendMsg(role, text) {
  const wrap   = document.getElementById('messages');
  const div    = document.createElement('div');
  div.className = `msg ${role}`;

  const bubble = document.createElement('div');
  bubble.className  = 'msg-bubble';
  bubble.textContent = role === 'ai' ? '😈 TI-LEX-AL : ' + text : text;

  div.appendChild(bubble);
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

// --- Typing indicator ---
function showTyping() {
  const wrap = document.getElementById('messages');
  const div  = document.createElement('div');
  const id   = 'typing-' + Date.now();
  div.id        = id;
  div.className = 'msg ai';
  div.innerHTML = `<div class="msg-bubble typing-dots"><span></span><span></span><span></span></div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// --- Enter = envoie, Shift+Enter = newline ---
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
  const ta = document.getElementById('user-input');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
}

// --- Déconnexion ---
function logout() {
  sessionStorage.removeItem('tilexal_logged');
  window.location.href = 'index.html';
}