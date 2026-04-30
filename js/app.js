// ═══ APP.JS — Init principal + navigation ═══

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initRightPanel();
  animateBars();
  // Message de bienvenue
  const key = localStorage.getItem('sk_key') || '';
  addMsg(
    'in',
    key
      ? 'Cle API chargee ! Je suis Claude, ton Codex AI. Comment puis-je t aider aujourd hui ? 🚀'
      : 'Bienvenue sur Skiller Codex AI ! Va dans Parametres (engrenage) pour entrer ta cle API Anthropic et activer Claude. 🔑',
    'Claude'
  );
});

// ── Navigation sidebar ──────────────────────────────────────
function initNav() {
  document.querySelectorAll('.nb[data-p]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Activer le bouton
      document.querySelectorAll('.nb').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      // Afficher le bon panneau
      document.querySelectorAll('.pview').forEach(p => p.classList.remove('on'));
      const target = document.getElementById('p-' + btn.dataset.p);
      if (target) target.classList.add('on');
    });
  });
}

// ── Right panel ─────────────────────────────────────────────
function initRightPanel() {
  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) {
    btnRefresh.onclick = () => {
      if (window.SK && window.SK.ghConn) loadRepos();
    };
  }
}