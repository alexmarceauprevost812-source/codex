// ═══ SETTINGS.JS — Clé API + modèle Claude ═══

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
});

function initSettings() {
  const keyInp  = document.getElementById('apiKey');
  const btnSave = document.getElementById('btnSave');
  const btnClr  = document.getElementById('btnClr');
  const btnEye  = document.getElementById('btnEye');
  const kst     = document.getElementById('kst');
  const msel    = document.getElementById('msel');

  // ── Charger clé sauvegardée ──
  if (SK.key && keyInp) {
    keyInp.value = SK.key;
    showKst('ok', '✅ Cle API chargee — Claude est actif !');
  }

  // ── Charger modèle sauvegardé ──
  if (msel) {
    msel.value = SK.model;
    msel.onchange = () => {
      SK.model = msel.value;
      localStorage.setItem('sk_model', SK.model);
      showKst('ok', '✅ Modele mis a jour: ' + getModelName(SK.model));
      setTimeout(() => hideKst(), 2500);
    };
  }

  // ── Toggle visibilité clé ──
  if (btnEye) {
    btnEye.onclick = () => {
      const isPass = keyInp.type === 'password';
      keyInp.type = isPass ? 'text' : 'password';
      btnEye.innerHTML = isPass
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
    };
  }

  // ── Sauvegarder clé ──
  if (btnSave) {
    btnSave.onclick = () => {
      const val = keyInp?.value.trim();
      if (!val) {
        showKst('err', '❌ Entre une cle API valide.');
        return;
      }
      if (!val.startsWith('sk-ant-')) {
        showKst('err', '❌ La cle doit commencer par "sk-ant-..."');
        return;
      }

      SK.key = val;
      localStorage.setItem('sk_key', val);
      showKst('ok', '✅ Cle sauvegardee ! Claude est maintenant actif.');

      // Message de confirmation dans le chat
      addMsg(
        'in',
        '🔑 Cle API Anthropic activee ! Je suis Claude, pret a t aider.\nModele actif: ' + getModelName(SK.model) + ' 🚀',
        'Claude'
      );
    };
  }

  // ── Effacer clé ──
  if (btnClr) {
    btnClr.onclick = () => {
      SK.key = '';
      localStorage.removeItem('sk_key');
      if (keyInp) keyInp.value = '';
      showKst('err', '🗑️ Cle effacee. Entre une nouvelle cle pour reactiver Claude.');
      setTimeout(() => hideKst(), 3000);
    };
  }

  // ── Helpers locaux ──
  function showKst(type, msg) {
    if (!kst) return;
    kst.textContent = msg;
    kst.className = 'kst ' + type;
  }

  function hideKst() {
    if (!kst) return;
    kst.className = 'kst';
  }
}

/** Nom lisible du modèle */
function getModelName(model) {
  const names = {
    'claude-opus-4-5':    'Claude Opus 4.5',
    'claude-sonnet-4-5':  'Claude Sonnet 4.5',
    'claude-haiku-3-5':   'Claude Haiku 3.5'
  };
  return names[model] || model;
}