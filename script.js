const chatBubble  = document.getElementById('chatBubble');
const chatWrapper = document.getElementById('chatWrapper');
const closeBtn    = document.getElementById('closeBtn');
const sendBtn     = document.getElementById('sendBtn');
const chatInput   = document.getElementById('chatInput');
const chatMessages= document.getElementById('chatMessages');

// Ouvrir / fermer
chatBubble.addEventListener('click', () => {
  chatWrapper.classList.add('open');
  chatBubble.style.display = 'none';
  chatInput.focus();
});

closeBtn.addEventListener('click', () => {
  chatWrapper.classList.remove('open');
  chatBubble.style.display = 'flex';
});

// Envoyer message
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  chatInput.value = '';

  // Simule une réponse bot après 800ms
  setTimeout(() => {
    addMessage(getBotReply(text), 'bot');
  }, 800);
}

function addMessage(text, type) {
  const msg = document.createElement('div');
  msg.classList.add('message', type);
  msg.innerHTML = `<span>${escapeHtml(text)}</span>`;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotReply(text) {
  const replies = [
    'Bonne question! 🤔',
    'Je comprends ce que tu veux dire!',
    'Intéressant... dis-moi en plus.',
    'OK, je note ça! 📝',
    'Super, on continue?',
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Envoyer avec bouton OU touche Enter
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});
