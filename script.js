/* ===== SKILLER — script.js ===== */

// ─── ÉTAT GLOBAL ───────────────────────────────────────────
const state = {
  githubConnected: false,
  githubUser: null,
  activeConv: 0,
  conversations: [
    {
      id: 0,
      name: 'Projet JavaScript',
      avatar: 'JS',
      avatarClass: '',
      preview: 'Dernier message...',
      time: '14h22',
      messages: [
        { type: 'received', sender: 'Skiller', text: 'Bienvenue sur la plateforme Skiller ! 🚀', time: '14h00' },
        { type: 'sent', text: 'Merci ! On commence le projet texte-1.', time: '14h05' },
        { type: 'received', sender: 'Skiller', text: 'Parfait ! Connecte ton GitHub pour voir tes repos 🟢', time: '14h22' }
      ]
    },
    {
      id: 1,
      name: 'Repo texte-1',
      avatar: '\uF09B',
      avatarClass: 'gh',
      preview: 'Commits récents',
      time: '12h10',
      messages: [
        { type: 'received', sender: 'GitHub', text: 'Connecte ton compte GitHub pour voir tes repos ici 📂', time: '12h10' }
      ]
    },
    {
      id: 2,
      name: 'Skiller General',
      avatar: 'SK',
      avatarClass: 'sk',
      preview: 'Bienvenue !',
      time: 'Hier',
      messages: [
        { type: 'received', sender: 'Skiller', text: 'Bienvenue dans Skiller General ! 👋', time: 'Hier' },
        { type: 'received', sender: 'Skiller', text: 'Partage tes skills pis avance dans tes projets 💪', time: 'Hier' }
      ]
    }
  ]
};

// ─── SÉLECTEURS DOM ────────────────────────────────────────
const convList       = document.getElementById('convList');
const chatMessages   = document.getElementById('chatMessages');
const msgInput       = document.getElementById('msgInput');
const btnSend        = document.getElementById('btnSend');
const btnNewConv     = document.getElementById('btnNewConv');
const searchConv     = document.getElementById('searchConv');
const btnGithub      = document.getElementById('btnGithub');
const githubStatus   = document.getElementById('githubStatus');
const reposList      = document.getElementById('reposList');
const navBtns        = document.querySelectorAll('.nav-btn');

// ─── INIT ──────────────────────────────────────────────────
function init() {
  renderConvList();
  renderMessages(state.activeConv);
  bindEvents();
  animateSkillBars();
}

// ─── RENDER LISTE CONVERSATIONS ────────────────────────────
function renderConvList(filter = '') {
  convList.innerHTML = '';
  const filtered = state.conversations.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  filtered.forEach(conv => {
    const li = document.createElement('li');
    li.className = 'conv-item' + (conv.id === state.activeConv ? ' active' : '');
    li.dataset.id = conv.id;

    const avatarContent = conv.avatarClass === 'gh'
      ? '<i class="fa-brands fa-github"></i>'
      : conv.avatar;

    li.innerHTML = `
      <div class="conv-avatar ${conv.avatarClass}">${avatarContent}</div>
      <div class="conv-info">
        <span class="conv-name">${conv.name}</span>
        <span class="conv-preview">${conv.preview}</span>
      </div>
      <span class="conv-time">${conv.time}</span>
    `;

    li.addEventListener('click', () => selectConv(conv.id));
    convList.appendChild(li);
  });
}

// ─── SÉLECTIONNER UNE CONVERSATION ────────────────────────
function selectConv(id) {
  state.activeConv = id;
  renderConvList(searchConv.value);
  renderMessages(id);

  // Met à jour le header du chat
  const conv = state.conversations.find(c => c.id === id);
  const headerAvatar = document.querySelector('.chat-avatar');
  const headerTitle  = document.querySelector('.chat-title h3');

  if (conv.avatarClass === 'gh') {
    headerAvatar.innerHTML = '<i class="fa-brands fa-github"></i>';
    headerAvatar.style.background = 'linear-gradient(135deg, #222, #444)';
    headerAvatar.style.color = '#fff';
    headerAvatar.style.boxShadow = 'none';
  } else if (conv.avatarClass === 'sk') {
    headerAvatar.innerHTML = conv.avatar;
    headerAvatar.style.background = 'linear-gradient(135deg, var(--orange-dark), var(--orange))';
    headerAvatar.style.color = '#fff';
    headerAvatar.style.boxShadow = 'var(--glow-orange)';
  } else {
    headerAvatar.innerHTML = conv.avatar;
    headerAvatar.style.background = 'linear-gradient(135deg, var(--lime-dark), var(--lime))';
    headerAvatar.style.color = '#000';
    headerAvatar.style.boxShadow = 'var(--glow-lime)';
  }

  headerTitle.textContent = conv.name;
}

// ─── RENDER MESSAGES ───────────────────────────────────────
function renderMessages(convId) {
  const conv = state.conversations.find(c => c.id === convId);
  chatMessages.innerHTML = '';

  // Diviseur de date
  const divider = document.createElement('div');
  divider.className = 'msg-date-divider';
  divider.textContent = "Aujourd'hui";
  chatMessages.appendChild(divider);

  conv.messages.forEach(msg => {
    const el = createMessageEl(msg);
    chatMessages.appendChild(el);
  });

  scrollToBottom();
}

// ─── CRÉER UN ÉLÉMENT MESSAGE ──────────────────────────────
function createMessageEl(msg) {
  const div = document.createElement('div');
  div.className = `message ${msg.type}`;

  if (msg.type === 'received') {
    div.innerHTML = `
      <div class="msg-avatar">${msg.sender ? msg.sender.substring(0, 2).toUpperCase() : 'SK'}</div>
      <div class="msg-content">
        <span class="msg-sender">${msg.sender || 'Skiller'}</span>
        <p>${msg.text}</p>
        <span class="msg-time">${msg.time}</span>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="msg-content">
        <p>${msg.text}</p>
        <span class="msg-time">${msg.time} <i class="fa-solid fa-check-double" style="color:var(--lime);font-size:0.65rem"></i></span>
      </div>
    `;
  }

  // Animation d'entrée
  div.style.opacity = '0';
  div.style.transform = msg.type === 'sent' ? 'translateX(20px)' : 'translateX(-20px)';
  requestAnimationFrame(() => {
    div.style.transition = 'all 0.25s ease';
    div.style.opacity = '1';
    div.style.transform = 'translateX(0)';
  });

  return div;
}

// ─── ENVOYER UN MESSAGE ────────────────────────────────────
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  const now = new Date();
  const time = `${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`;

  const msg = { type: 'sent', text, time };
  state.conversations[state.activeConv].messages.push(msg);
  state.conversations[state.activeConv].preview = text;
  state.conversations[state.activeConv].time = time;

  const el = createMessageEl(msg);
  chatMessages.appendChild(el);
  scrollToBottom();

  msgInput.value = '';
  msgInput.focus();

  renderConvList(searchConv.value);

  // Réponse automatique après 1.2s
  setTimeout(() => autoReply(state.activeConv), 1200);
}

// ─── RÉPONSE AUTO ──────────────────────────────────────────
function autoReply(convId) {
  const replies = [
    'Bonne idée ! Continuons 🚀',
    'Super, je note ça dans le projet 📝',
    'Excellent ! Tu avances bien 💪',
    'Parfait, on est sur la bonne track 🟢',
    'Intéressant ! T as pensé à GitHub pour ça ? 🐙'
  ];

  const now = new Date();
  const time = `${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`;
  const conv = state.conversations[convId];

  const msg = {
    type: 'received',
    sender: conv.name,
    text: replies[Math.floor(Math.random() * replies.length)],
    time
  };

  conv.messages.push(msg);
  conv.preview = msg.text;
  conv.time = time;

  if (state.activeConv === convId) {
    const el = createMessageEl(msg);
    chatMessages.appendChild(el);
    scrollToBottom();
  }

  renderConvList(searchConv.value);
}

// ─── NOUVELLE CONVERSATION ─────────────────────────────────
function newConversation() {
  const name = prompt('Nom de la nouvelle conversation :');
  if (!name || !name.trim()) return;

  const initiales = name.trim().substring(0, 2).toUpperCase();
  const newConv = {
    id: state.conversations.length,
    name: name.trim(),
    avatar: initiales,
    avatarClass: '',
    preview: 'Nouvelle conversation',
    time: 'maintenant',
    messages: [
      {
        type: 'received',
        sender: 'Skiller',
        text: `Bienvenue dans « ${name.trim()} » ! 👋`,
        time: 'maintenant'
      }
    ]
  };

  state.conversations.unshift(newConv);
  // Réindexer les IDs
  state.conversations.forEach((c, i) => c.id = i);
  state.activeConv = 0;

  renderConvList();
  renderMessages(0);
}

// ─── CONNEXION GITHUB ──────────────────────────────────────
function connectGitHub() {
  if (state.githubConnected) {
    disconnectGitHub();
    return;
  }

  // Simulation de connexion GitHub OAuth
  btnGithub.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connexion...';
  btnGithub.disabled = true;

  setTimeout(() => {
    state.githubConnected = true;
    state.githubUser = 'Alexmarceauprevost812';

    btnGithub.innerHTML = '<i class="fa-brands fa-github"></i> Connecté ✓';
    btnGithub.classList.add('connected');
    btnGithub.disabled = false;
    githubStatus.textContent = '@' + state.githubUser;
    githubStatus.classList.add('online');

    loadGitHubRepos();

    // Message de confirmation dans le chat actif
    const now = new Date();
    const time = `${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`;
    const msg = {
      type: 'received',
      sender: 'GitHub',
      text: `✅ Connecté en tant que @${state.githubUser} ! Tes repos sont chargés 🐙`,
      time
    };
    state.conversations[state.activeConv].messages.push(msg);
    const el = createMessageEl(msg);
    chatMessages.appendChild(el);
    scrollToBottom();
  }, 1800);
}

function disconnectGitHub() {
  state.githubConnected = false;
  state.githubUser = null;
  btnGithub.innerHTML = '<i class="fa-brands fa-github"></i> Connecter GitHub';
  btnGithub.classList.remove('connected');
  githubStatus.textContent = 'Non connecté';
  githubStatus.classList.remove('online');
  reposList.innerHTML = '<div class="repo-placeholder">Connecte GitHub pour voir tes repos</div>';
}

// ─── CHARGER LES REPOS GITHUB ──────────────────────────────
function loadGitHubRepos() {
  const repos = [
    { name: 'texte-1', lang: 'JS', branch: 'Alex', stars: 2 },
    { name: 'portfolio', lang: 'HTML', branch: 'main', stars: 5 },
    { name: 'skiller-app', lang: 'JS', branch: 'dev', stars: 1 },
    { name: 'api-rest', lang: 'Node', branch: 'main', stars: 3 }
  ];

  reposList.innerHTML = '';
  repos.forEach(repo => {
    const div = document.createElement('div');
    div.className = 'repo-item';
    div.innerHTML = `
      <i class="fa-solid fa-code-branch"></i>
      <div class="repo-details">
        <span class="repo-name">${repo.name}</span>
        <span class="repo-branch"><i class="fa-solid fa-code-branch" style="font-size:0.6rem"></i> ${repo.branch}</span>
      </div>
      <div class="repo-meta">
        <span class="repo-lang">${repo.lang}</span>
        <span class="repo-stars"><i class="fa-solid fa-star" style="color:var(--orange);font-size:0.6rem"></i> ${repo.stars}</span>
      </div>
    `;
    div.addEventListener('click', () => openRepo(repo));
    reposList.appendChild(div);
  });
}

function openRepo(repo) {
  const url = `https://github.com/Alexmarceauprevost812/${repo.name}`;
  window.open(url, '_blank');
}

// ─── ANIMATIONS SKILL BARS ─────────────────────────────────
function animateSkillBars() {
  const bars = document.querySelectorAll('.skill-fill');
  bars.forEach(bar => {
    const target = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.transition = 'width 1s cubic-bezier(0.4, 0, 0.2, 1)';
      bar.style.width = target;
    }, 400);
  });
}

// ─── NAV SIDEBAR ───────────────────────────────────────────
function bindNavBtns() {
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ─── SCROLL BAS ────────────────────────────────────────────
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// ─── BIND EVENTS ───────────────────────────────────────────
function bindEvents() {
  // Envoyer avec bouton
  btnSend.addEventListener('click', sendMessage);

  // Envoyer avec Enter
  msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Nouvelle conversation
  btnNewConv.addEventListener('click', newConversation);

  // Recherche conversations
  searchConv.addEventListener('input', e => {
    renderConvList(e.target.value);
  });

  // GitHub
  btnGithub.addEventListener('click', connectGitHub);

  // Nav sidebar
  bindNavBtns();
}

// ─── DÉMARRAGE ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);