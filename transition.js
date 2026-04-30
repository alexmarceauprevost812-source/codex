(function() {
  const overlay  = document.getElementById('accueil-overlay');
  const barreIn  = document.getElementById('barre-inner');
  const txtLoad  = document.getElementById('texte-chargement');
  const btnEnter = document.getElementById('btn-entrer');

  const ETAPES = [
    { pct: 15,  msg: 'Connexion aux neurones quantiques...' },
    { pct: 35,  msg: 'Chargement du lexique québécois 🍁...' },
    { pct: 55,  msg: 'Compilation des protocoles IA...' },
    { pct: 72,  msg: 'Synchronisation GitHub...' },
    { pct: 88,  msg: 'Calibration du studio de code...' },
    { pct: 100, msg: 'Codex prêt. Bienvenue.' },
  ];

  let etapeIdx = 0;

  function prochEtape() {
    if (etapeIdx >= ETAPES.length) {
      // Affiche le bouton
      btnEnter.style.display = 'block';
      return;
    }
    const e = ETAPES[etapeIdx++];
    barreIn.style.width  = e.pct + '%';
    txtLoad.textContent  = e.msg;

    const delai = etapeIdx < ETAPES.length
      ? 600 + Math.random() * 500
      : 400;
    setTimeout(prochEtape, delai);
  }

  // Démarrage avec petit délai
  setTimeout(prochEtape, 800);

  // Bouton → transition vers le Codex
  btnEnter.addEventListener('click', () => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      window.location.href = 'app.html';
    }, 1500);
  });
})();