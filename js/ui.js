// ═══ UI.JS — État global + helpers UI ═══

// État global partagé entre tous les modules
window.SK = {
  key:        localStorage.getItem('sk_key') || '',
  model:      localStorage.getItem('sk_model') || 'claude-sonnet-4-5',
  ghConn:     false,
  ghUser:     null,
  msgs:       [],       // messages API Claude (historique)
  busy:       false,    // en attente réponse
  activeConv: 0,
  convs: [
    { id: 0, name: 'Codex AI', prev: 'Nouvelle conversation', time: 'maintenant', msgs: [] }
  ]
};

// ── Helpers ─────────────────────────────────────────────────

/** Timestamp format 14h05 */
function now() {
  const d = new Date();
  return d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0');
}

/** Escape HTML */
function esc(t) {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

/** Scroll vers le bas du chat */
function scrollBottom() {
  const msgs = document.getElementById('msgs');
  if (msgs) requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });
}

/** Ajouter un message dans le chat */
function addMsg(type, text, sender) {
  const el = makeMsgEl({ type, text, sender, time: now() });
  const container = document.getElementById('msgs');
  if (!container) return el;
  container.appendChild(el);
  scrollBottom();
  return el;
}

/** Créer l'élément DOM d'un message */
function makeMsgEl(m) {
  const d = document.createElement('div');
  d.className = 'msg ' + (m.type === 'out' ? 'out' : 'in');

  if (m.type === 'in') {
    d.innerHTML = `
      <div class="mav">${(m.sender || 'AI').substring(0, 2).toUpperCase()}</div>
      <div class="mc">
        <span class="msnd">${m.sender || 'Claude'}</span>
        <p>${esc(m.text)}</p>
        <span class="mt">${m.time}</span>
      </div>`;
  } else {
    d.innerHTML = `
      <div class="mc">
        <p>${esc(m.text)}</p>
        <span class="mt">
          ${m.time}
          <i class="fa-solid fa-check-double" style="color:var(--a);font-size:.55rem"></i>
        </span>
      </div>`;
  }

  // Animation d'entrée
  d.style.opacity = '0';
  d.style.transform = m.type === 'out' ? 'translateX(16px)' : 'translateX(-16px)';
  requestAnimationFrame(() => {
    d.style.transition = 'all .22s ease';
    d.style.opacity = '1';
    d.style.transform = 'none';
  });

  return d;
}

/** Ajouter l'indicateur typing (...) */
function addTyping() {
  const id = 'typ-' + Date.now();
  const container = document.getElementById('msgs');
  if (!container) return id;

  const d = document.createElement('div');
  d.id = id;
  d.className = 'msg in';
  d.innerHTML = `
    <div class="mav">AI</div>
    <div class="mc">
      <span class="msnd">Claude</span>
      <p style="display:flex;gap:5px;align-items:center;padding:8px 14px">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </p>
    </div>`;

  container.appendChild(d);
  scrollBottom();
  return id;
}

/** Retirer l'indicateur typing */
function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/** Animer les barres de progression */
function animateBars() {
  document.querySelectorAll('.skfill, .rfill').forEach(bar => {
    const target = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.transition = 'width 1s cubic-bezier(.4,0,.2,1)';
      bar.style.width = target;
    }, 500);
  });
}

/** Rendre la liste des conversations */
function renderConvs(filter = '') {
  const list = document.getElementById('clist');
  if (!list) return;
  list.innerHTML = '';

  SK.convs
    .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach(c => {
      const li = document.createElement('li');
      li.className = 'ci' + (c.id === SK.activeConv ? ' on' : '');
      li.innerHTML = `
        <div class="cav">${c.name.substring(0, 2).toUpperCase()}</div>
        <div class="cinfo">
          <span class="cname">${c.name}</span>
          <span class="cprev">${c.prev}</span>
        </div>
        <span class="ctime">${c.time}</span>`;
      li.onclick = () => selectConv(c.id);
      list.appendChild(li);
    });
}

/** Sélectionner une conversation */
function selectConv(id) {
  SK.activeConv = id;
  SK.msgs = SK.convs.find(c => c.id === id)?.msgs || [];
  renderConvs();

  const msgEl = document.getElementById('msgs');
  if (msgEl) {
    msgEl.innerHTML = '';
    SK.msgs.forEach(m => {
      const type = m.role === 'user' ? 'out' : 'in';
      const text = typeof m.content === 'string' ? m.content : m.content[0]?.text || '';
      msgEl.appendChild(makeMsgEl({ type, text, sender: 'Claude', time: '' }));
    });
    scrollBottom();
  }
}

/** Mettre à jour header du chat */
function updateChatHeader(name, sub) {
  const title = document.getElementById('chtitle');
  const subtitle = document.getElementById('chsub');
  if (title) title.textContent = name || 'Codex AI';
  if (subtitle) subtitle.textContent = sub || 'Claude actif';
}