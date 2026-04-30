// ============================================================
//  CODEX VIVANT — script.js
// ============================================================

const App = {

  // ---------- STATE ----------
  users: JSON.parse(localStorage.getItem('codex_users') || '[]'),
  currentUser: JSON.parse(localStorage.getItem('codex_current') || 'null'),
  chatHistory: [],
  currentCode: '',

  // ---------- INIT ----------
  init() {
    this.buildDOM();
    this.startMatrix();
    setTimeout(() => this.showAuth(), 3200);
  },

  // ---------- DOM BUILDER ----------
  buildDOM() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div id="auth-screen">
        <div class="auth-title">✦ CODEX VIVANT ✦</div>
        <div class="auth-subtitle">— système de connaissance —</div>
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Connexion</button>
          <button class="auth-tab" data-tab="register">Inscription</button>
        </div>
        <form class="auth-form active" id="form-login">
          <input class="auth-input" id="login-user" type="text" placeholder="Nom d'utilisateur" autocomplete="off" />
          <input class="auth-input" id="login-pass" type="password" placeholder="Mot de passe" />
          <div class="auth-msg" id="login-msg"></div>
          <button class="auth-btn" type="submit">⚡ ENTRER</button>
        </form>
        <form class="auth-form" id="form-register">
          <input class="auth-input" id="reg-user" type="text" placeholder="Nom d'utilisateur" autocomplete="off" />
          <input class="auth-input" id="reg-pass" type="password" placeholder="Mot de passe" />
          <input class="auth-input" id="reg-pass2" type="password" placeholder="Confirmer mot de passe" />
          <div class="auth-msg" id="reg-msg"></div>
          <button class="auth-btn" type="submit">✏️ CRÉER MON COMPTE</button>
        </form>
      </div>

      <div id="codex-screen">
        <div class="codex-topbar">
          <span class="codex-topbar-title">✦ CODEX VIVANT</span>
          <span class="topbar-user" id="topbar-username"></span>
          <button class="topbar-logout" id="btn-logout">Déconnexion</button>
        </div>
        <div class="panel-left">
          <div class="panel-title">📚 Navigation</div>
          <div class="menu-section">Général</div>
          <div class="menu-item active" data-section="accueil">🏠 Accueil</div>
          <div class="menu-item" data-section="notes">📝 Mes notes</div>
          <div class="menu-item" data-section="projets">🚀 Projets</div>
          <div class="menu-section">Codex</div>
          <div class="menu-item" data-section="entries">📖 Entrées</div>
          <div class="menu-item" data-section="tags">🏷️ Tags</div>
          <div class="menu-item" data-section="archive">📦 Archives</div>
          <div class="menu-section">Outils</div>
          <div class="menu-item" data-section="settings">⚙️ Paramètres</div>
          <div class="menu-item" data-section="about">ℹ️ À propos</div>
        </div>
        <div class="panel-center">
          <div class="chat-messages" id="chat-messages">
            <div class="chat-msg bot">Bienvenue dans le Codex Vivant ! Je suis AL, ton assistant. Écris-moi du code ou pose-moi une question !</div>
          </div>
          <div class="chat-input-bar">
            <input class="chat-input" id="chat-input" type="text" placeholder="Écris ton message ou du code..." autocomplete="off" />
            <button class="chat-send" id="chat-send">Envoyer ▶</button>
          </div>
        </div>
        <div class="panel-right">
          <div class="panel-title">💻 Code en direct</div>
          <div class="code-area" id="code-area"><span class="cmt">// Le code apparaît ici...</span></div>
          <button class="code-deploy-btn" id="deploy-btn">🚀 Déployer</button>
        </div>
      </div>

      <div id="deploy-overlay">
        <div class="deploy-title">🚀 DÉPLOIEMENT EN COURS...</div>
        <div class="deploy-log" id="deploy-log"></div>
        <div class="deploy-bar-wrap">
          <div class="deploy-bar" id="deploy-bar"></div>
        </div>
        <div class="deploy-done" id="deploy-done">✅ DÉPLOIEMENT COMPLÉTÉ !</div>
      </div>
    `;
    this.bindEvents();
  },

  // ---------- MATRIX ----------
  startMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = 'アイウエオカキクケコABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const fontSize = 16;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);
    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + 'px monospace';
      drops.forEach((y, i) => {
        ctx.fillStyle = Math.random() > 0.7 ? '#ff6a00' : '#0f0';
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };
    this._matrixInterval = setInterval(draw, 40);
    setTimeout(() => {
      clearInterval(this._matrixInterval);
      canvas.classList.add('fade-out');
    }, 3000);
  },

  // ---------- SHOW AUTH ----------
  showAuth() {
    const auth = document.getElementById('auth-screen');
    auth.classList.add('visible');
    if (this.currentUser) {
      setTimeout(() => this.showCodex(), 600);
    }
  },

  // ---------- BIND EVENTS ----------
  bindEvents() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('form-' + tab.dataset.tab).classList.add('active');
      });
    });
    document.getElementById('form-login').addEventListener('submit', e => {
      e.preventDefault();
      this.login();
    });
    document.getElementById('form-register').addEventListener('submit', e => {
      e.preventDefault();
      this.register();
    });
    document.getElementById('btn-logout').addEventListener('click', () => this.logout());
    document.getElementById('chat-send').addEventListener('click', () => this.sendChat());
    document.getElementById('chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.sendChat();
    });
    document.getElementById('deploy-btn').addEventListener('click', () => this.deployCode());
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  },

  // ---------- AUTH LOGIC ----------
  login() {
    const username = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;
    const msg = document.getElementById('login-msg');
    if (!username || !password) { msg.textContent = 'Remplis tous les champs !'; return; }
    const user = this.users.find(u => u.username === username && u.password === password);
    if (!user) { msg.textContent = 'Mauvais identifiants !'; return; }
    this.currentUser = user;
    localStorage.setItem('codex_current', JSON.stringify(user));
    msg.textContent = '';
    this.showCodex();
  },

  register() {
    const username = document.getElementById('reg-user').value.trim();
    const password = document.getElementById('reg-pass').value;
    const password2 = document.getElementById('reg-pass2').value;
    const msg = document.getElementById('reg-msg');
    if (!username || !password) { msg.textContent = 'Remplis tous les champs !'; return; }
    if (password !== password2) { msg.textContent = 'Les mots de passe ne matchent pas !'; return; }
    if (this.users.find(u => u.username === username)) { msg.textContent = 'Ce nom est déjà pris !'; return; }
    const newUser = { username, password, id: Date.now() };
    this.users.push(newUser);
    localStorage.setItem('codex_users', JSON.stringify(this.users));
    this.currentUser = newUser;
    localStorage.setItem('codex_current', JSON.stringify(newUser));
    msg.style.color = '#0f0';
    msg.textContent = 'Compte créé !';
    setTimeout(() => this.showCodex(), 800);
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('codex_current');
    const codex = document.getElementById('codex-screen');
    codex.classList.remove('visible');
    codex.style.display = 'none';
    const auth = document.getElementById('auth-screen');
    auth.style.display = 'flex';
    auth.style.opacity = '1';
  },

  // ---------- SHOW CODEX ----------
  showCodex() {
    const auth = document.getElementById('auth-screen');
    const codex = document.getElementById('codex-screen');
    auth.style.opacity = '0';
    setTimeout(() => {
      auth.style.display = 'none';
      codex.classList.add('visible');
      document.getElementById('topbar-username').textContent = '👤 ' + this.currentUser.username;
    }, 500);
  },

  // ---------- CHAT ----------
  sendChat() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    this.addChatMsg(text, 'user');
    setTimeout(() => this.botReply(text), 600);
  },

  addChatMsg(text, type) {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg ' + type;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  },

  botReply(text) {
    const lower = text.toLowerCase();
    let reply = '';
    let code = '';

    if (lower.includes('function') || lower.includes('const') || lower.includes('var') || lower.includes('let') || lower.includes('def ') || lower.includes('class ') || lower.includes('</') || lower.includes('{')) {
      code = text;
      reply = 'J\'ai reçu ton code ! Je l\'ai mis dans le panneau de droite. Clique sur 🚀 Déployer quand t\'es prêt !';
      this.setCode(code);
    } else if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('allo')) {
      reply = 'Salut ! Prêt à coder quelque chose de sick aujourd\'hui ?';
    } else if (lower.includes('aide') || lower.includes('help')) {
      reply = 'Envoie-moi du code et je vais le mettre dans le panneau de droite. Quand c\'est prêt, clique Déployer !';
    } else if (lower.includes('déployer') || lower.includes('deploy')) {
      reply = 'Clique sur le bouton 🚀 Déployer dans le panneau de droite !';
    } else {
      const replies = [
        'Intéressant ! T\'as du code à me soumettre ?',
        'Bonne idée ! Envoie le code pis je m\'en occupe.',
        'Roger ça ! C\'est noté dans le Codex.',
        'Ah ouin ? Dis-moi en plus !',
        'Parfait, on continue à construire le Codex !'
      ];
      reply = replies[Math.floor(Math.random() * replies.length)];
    }

    this.addChatMsg(reply, 'bot');
  },

  // ---------- CODE PANEL ----------
  setCode(code) {
    this.currentCode = code;
    const area = document.getElementById('code-area');
    area.innerHTML = this.highlightCode(code);

    // Auto-deploy après 2 secondes
    clearTimeout(this._autoDeployTimer);
    this._autoDeployTimer = setTimeout(() => {
      this.deployCode();
    }, 2000);
  },

  highlightCode(code) {
    const keywords = ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'new', 'this', 'true', 'false', 'null', 'undefined', 'def', 'print', 'from'];
    let escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Strings
    escaped = escaped.replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="str">$1</span>');
    // Comments
    escaped = escaped.replace(/(//.*)/g, '<span class="cmt">$1</span>');
    // Numbers
    escaped = escaped.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
    // Keywords
    keywords.forEach(kw => {
      const re = new RegExp('\\b(' + kw + ')\\b', 'g');
      escaped = escaped.replace(re, '<span class="kw">$1</span>');
    });
    return escaped;
  },

  // ---------- DEPLOY ----------
  deployCode() {
    if (!this.currentCode) {
      this.addChatMsg('Pas de code à déployer ! Envoie-moi du code d\'abord.', 'bot');
      return;
    }
    const overlay = document.getElementById('deploy-overlay');
    const log = document.getElementById('deploy-log');
    const bar = document.getElementById('deploy-bar');
    const done = document.getElementById('deploy-done');
    overlay.classList.add('active');
    log.innerHTML = '';
    bar.style.width = '0%';
    done.style.display = 'none';

    const steps = [
      { msg: '> Initialisation du déploiement...', pct: 10 },
      { msg: '> Analyse du code...', pct: 25 },
      { msg: '> Compilation des modules...', pct: 40 },
      { msg: '> Optimisation des assets...', pct: 55 },
      { msg: '> Tests unitaires...', pct: 70 },
      { msg: '> Build production...', pct: 82 },
      { msg: '> Upload vers le serveur...', pct: 93 },
      { msg: '> Vérification finale...', pct: 100 }
    ];

    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        done.style.display = 'block';
        setTimeout(() => {
          overlay.classList.remove('active');
          this.addChatMsg('🚀 Déploiement complété avec succès ! Le code est en ligne.', 'bot');
        }, 1500);
        return;
      }
      const step = steps[i];
      log.innerHTML += step.msg + '\n';
      log.scrollTop = log.scrollHeight;
      bar.style.width = step.pct + '%';
      i++;
      setTimeout(run, 400);
    };
    run();
  }
};

// ============================================================
// DÉMARRAGE
// ============================================================
document.addEventListener('DOMContentLoaded', () => App.init());
