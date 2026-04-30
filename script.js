/**
 * script.js — Logique page d'accueil TI-LEX-AL
 * Boutons 3D + modals connexion/inscription + tilt effect
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── ÉLÉMENTS ──────────────────────────────────────────
  const overlay      = document.getElementById('modal-overlay');
  const modalLogin   = document.getElementById('modal-login');
  const modalSignup  = document.getElementById('modal-signup');
  const btnLogin     = document.getElementById('btn-login');
  const btnSignup    = document.getElementById('btn-signup');

  // ── OUVRIR MODAL ──────────────────────────────────────
  function openModal(type) {
    // Cache les deux d'abord
    modalLogin.classList.remove('active');
    modalSignup.classList.remove('active');
    modalLogin.style.display  = 'none';
    modalSignup.style.display = 'none';

    const target = type === 'login' ? modalLogin : modalSignup;

    overlay.classList.add('active');
    target.style.display = 'block';

    // Petit délai pour que la transition CSS joue
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.classList.add('active');
      });
    });

    document.body.style.overflow = 'hidden';
  }

  // ── FERMER MODAL ──────────────────────────────────────
  function closeModal() {
    modalLogin.classList.remove('active');
    modalSignup.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';

    // Cache après transition
    setTimeout(() => {
      modalLogin.style.display  = 'none';
      modalSignup.style.display = 'none';
    }, 350);
  }

  // ── BOUTONS HERO ──────────────────────────────────────
  btnLogin.addEventListener('click',  () => openModal('login'));
  btnSignup.addEventListener('click', () => openModal('signup'));

  // ── BOUTONS FERMER (×) ────────────────────────────────
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // ── CLIC SUR L'OVERLAY ────────────────────────────────
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // ── TOUCHE ESCAPE ─────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ── SWITCH LOGIN ↔ SIGNUP ─────────────────────────────
  document.querySelectorAll('[data-switch]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(link.dataset.switch);
    });
  });

  // ── SOUMISSION FORMULAIRES ────────────────────────────
  document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin();
  });

  document.getElementById('form-signup').addEventListener('submit', (e) => {
    e.preventDefault();
    handleSignup();
  });

  function handleLogin() {
    const btn = document.querySelector('#form-login .modal-btn');
    btn.textContent = 'Connexion en cours...';
    btn.disabled = true;

    // Simule une connexion (remplace par ton vrai appel API)
    setTimeout(() => {
      closeModal();
      loadPlatform();
    }, 1200);
  }

  function handleSignup() {
    const btn = document.querySelector('#form-signup .modal-btn');
    btn.textContent = 'Création du compte...';
    btn.disabled = true;

    // Simule une inscription
    setTimeout(() => {
      closeModal();
      loadPlatform();
    }, 1400);
  }

  // ── CHARGER LA PLATEFORME ─────────────────────────────
  function loadPlatform() {
    const hero     = document.querySelector('.hero');
    const platform = document.getElementById('platform');

    // Fade out hero
    hero.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    hero.style.opacity    = '0';
    hero.style.transform  = 'scale(0.95)';

    setTimeout(() => {
      hero.style.display = 'none';
      platform.style.display = 'flex';
      platform.style.flexDirection = 'column';
      platform.style.minHeight = '100vh';
      platform.style.opacity = '0';

      platform.innerHTML = buildPlatformHTML();

      requestAnimationFrame(() => {
        platform.style.transition = 'opacity 0.6s ease';
        platform.style.opacity = '1';
        initPlatform();
      });
    }, 600);
  }

  // ── HTML DE LA PLATEFORME ─────────────────────────────
  function buildPlatformHTML() {
    return `
      <div class="platform-wrap">

        <!-- SIDEBAR -->
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-logo">
            <span class="s-logo-al">AL</span>
            <span class="s-logo-text">TI-LEX-AL</span>
          </div>

          <nav class="sidebar-nav">
            <button class="nav-item active" data-view="chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>Codex Chat</span>
            </button>
            <button class="nav-item" data-view="files">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
              <span>Fichiers</span>
            </button>
            <button class="nav-item" data-view="history">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Historique</span>
            </button>
            <button class="nav-item" data-view="settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
              <span>Paramètres</span>
            </button>
          </nav>

          <div class="sidebar-footer">
            <button class="logout-btn" id="logout-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
          </div>
        </aside>

        <!-- MAIN CONTENT -->
        <div class="platform-main" id="platform-main">

          <!-- TOPBAR -->
          <header class="topbar">
            <button class="sidebar-toggle" id="sidebar-toggle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 class="topbar-title" id="topbar-title">Codex Chat</h2>
            <div class="topbar-status">
              <span class="status-dot"></span>
              <span>AL en ligne</span>
            </div>
          </header>

          <!-- VIEWS -->
          <div class="view active" id="view-chat">
            <div class="chat-messages" id="chat-messages">
              <div class="msg msg-al">
                <div class="msg-avatar">AL</div>
                <div class="msg-bubble">
                  <p>Allo! Bienvenue sur ton Codex TI-LEX-AL 🔥</p>
                  <p>Dis-moi c'est quoi ton projet pis on décolle!</p>
                </div>
              </div>
            </div>
            <div class="chat-input-bar">
              <textarea
                class="chat-input"
                id="chat-input"
                placeholder="Décris ton projet, pose une question..."
                rows="1"
              ></textarea>
              <button class="chat-send" id="chat-send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>

          <div class="view" id="view-files">
            <div class="empty-state">
              <span style="font-size:3rem">📁</span>
              <h3>Fichiers du projet</h3>
              <p>Bientôt disponible!</p>
            </div>
          </div>

          <div class="view" id="view-history">
            <div class="empty-state">
              <span style="font-size:3rem">🕐</span>
              <h3>Historique</h3>
              <p>Tes conversations passées vont apparaître ici.</p>
            </div>
          </div>

          <div class="view" id="view-settings">
            <div class="empty-state">
              <span style="font-size:3rem">⚙️</span>
              <h3>Paramètres</h3>
              <p>Configuration bientôt disponible!</p>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // ── INIT PLATEFORME ───────────────────────────────────
  function initPlatform() {

    // Navigation sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const view = item.dataset.view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + view).classList.add('active');
        document.getElementById('topbar-title').textContent =
          item.querySelector('span').textContent;
      });
    });

    // Toggle sidebar mobile
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Déconnexion
    document.getElementById('logout-btn').addEventListener('click', () => {
      location.reload();
    });

    // Auto-resize textarea
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
    });

    // Envoyer message
    document.getElementById('chat-send').addEventListener('click', sendMsg);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMsg();
      }
    });

    function sendMsg() {
      const val = chatInput.value.trim();
      if (!val) return;

      addMsg(val, 'user');
      chatInput.value = '';
      chatInput.style.height = 'auto';

      // Réponse simulée d'AL
      setTimeout(() => {
        const replies = [
          'Bonne question! Laisse-moi analyzer ça...',
          'C\'est une bonne piste! On peut partir avec ça.',
          'Faque tu veux qu\'on construise ça en JavaScript? Parfait!',
          'OK, je vois c\'est quoi le pattern. On va régler ça ensemble.',
          'Voilà une approche solide pour ce problème-là!'
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        addMsg(reply, 'al');
      }, 800);
    }

    function addMsg(text, from) {
      const container = document.getElementById('chat-messages');
      const div = document.createElement('div');
      div.className = 'msg msg-' + from;
      div.innerHTML = `
        <div class="msg-avatar">${from === 'al' ? 'AL' : 'Toi'}</div>
        <div class="msg-bubble"><p>${escapeHtml(text)}</p></div>
      `;
      container.appendChild(div);
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    function escapeHtml(str) {
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  }

  // ── EFFET TILT 3D SUR LES BOUTONS ────────────────────
  document.querySelectorAll('.btn-3d').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect   = btn.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotX   = -dy * 12;
      const rotY   =  dx * 12;
      btn.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.05)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s ease';
      setTimeout(() => btn.style.transition = '', 400);
    });
  });

  // ── PARTICULES ────────────────────────────────────────
  const particleContainer = document.getElementById('particles');
  if (particleContainer) {
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left     = Math.random() * 100 + 'vw';
      p.style.width    = (Math.random() * 3 + 1) + 'px';
      p.style.height   = p.style.width;
      p.style.animationDuration  = (Math.random() * 12 + 8) + 's';
      p.style.animationDelay     = (Math.random() * 10) + 's';
      p.style.opacity  = Math.random() * 0.7;
      particleContainer.appendChild(p);
    }
  }

});
