// ═══ CHAT.JS — Chat + appel API Claude ═══

document.addEventListener('DOMContentLoaded', () => {
  initChat();
  renderConvs();
});

// ── Init chat ────────────────────────────────────────────────
function initChat() {
  const inp     = document.getElementById('inp');
  const btnSend = document.getElementById('btnSend');
  const btnClr  = document.getElementById('btnClrChat');
  const btnNew  = document.getElementById('btnNew');
  const srch    = document.getElementById('srchInp');

  if (btnSend) btnSend.onclick = sendMsg;
  if (inp) inp.onkeydown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  };
  if (btnClr) btnClr.onclick = clearChat;
  if (btnNew)  btnNew.onclick  = newConv;
  if (srch)    srch.oninput    = e => renderConvs(e.target.value);
}

// ── Effacer le chat ─────────────────────────────────────────
function clearChat() {
  const msgs = document.getElementById('msgs');
  if (msgs) msgs.innerHTML = '';
  SK.msgs = [];
  const conv = SK.convs.find(c => c.id === SK.activeConv);
  if (conv) { conv.msgs = []; conv.prev = 'Chat efface'; conv.time = now(); }
  renderConvs();
  addMsg('in', 'Chat efface ! Nouvelle conversation prete. 🧹', 'Claude');
}

// ── Nouvelle conversation ───────────────────────────────────
function newConv() {
  const name = prompt('Nom de la conversation:');
  if (!name || !name.trim()) return;

  const id = SK.convs.length;
  SK.convs.unshift({
    id,
    name: name.trim(),
    prev: 'Nouvelle conversation',
    time: now(),
    msgs: []
  });
  // Réindexer
  SK.convs.forEach((c, i) => c.id = i);
  SK.activeConv = 0;
  SK.msgs = [];

  const msgEl = document.getElementById('msgs');
  if (msgEl) msgEl.innerHTML = '';

  renderConvs();
  updateChatHeader(name.trim(), 'Nouvelle conversation');
  addMsg('in', 'Bienvenue dans "' + name.trim() + '" ! 👋 Comment puis-je t aider ?', 'Claude');
}

// ── Envoyer un message ──────────────────────────────────────
async function sendMsg() {
  const inp = document.getElementById('inp');
  const txt = inp?.value.trim();
  if (!txt || SK.busy) return;

  // Afficher le message utilisateur
  addMsg('out', txt);
  SK.msgs.push({ role: 'user', content: txt });
  inp.value = '';

  // Mettre à jour la preview de conversation
  const conv = SK.convs.find(c => c.id === SK.activeConv);
  if (conv) {
    conv.prev = txt.length > 40 ? txt.substring(0, 40) + '...' : txt;
    conv.time = now();
    conv.msgs = [...SK.msgs];
    renderConvs();
  }

  // Vérifier la clé API
  if (!SK.key) {
    addMsg('in', 'Aucune cle API ! Va dans Parametres (engrenage ⚙️) pour entrer ta cle Anthropic et activer Claude. 🔑', 'Claude');
    return;
  }

  await callClaude();
}

// ── Appel API Anthropic Claude ──────────────────────────────
async function callClaude() {
  SK.busy = true;

  const btnSend = document.getElementById('btnSend');
  if (btnSend) {
    btnSend.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btnSend.disabled = true;
  }

  const typingId = addTyping();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SK.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: SK.model,
        max_tokens: 2048,
        system: `Tu es Codex AI, un assistant de developpement integre dans la plateforme Skiller.
Tu aides avec:
- Le code (JS, Python, HTML, CSS, Node.js, React)
- Le debug et les erreurs
- L architecture et les bonnes pratiques
- Les explications claires et concises
- L integration GitHub et les workflows Git

Reponds toujours en francais. Sois precis, concis et oriente solution.
Si on te demande du code, fournis du code complet et fonctionnel.`,
        messages: SK.msgs
      })
    });

    removeTyping(typingId);

    if (!response.ok) {
      const err = await response.json();
      const errMsg = err.error?.message || 'Erreur API inconnue';
      addMsg('in', '❌ Erreur API Anthropic: ' + errMsg, 'Claude');
      return;
    }

    const data = await response.json();
    const reply = data.content[0].text;

    // Sauvegarder la réponse
    SK.msgs.push({ role: 'assistant', content: reply });

    const conv = SK.convs.find(c => c.id === SK.activeConv);
    if (conv) {
      conv.msgs = [...SK.msgs];
      conv.prev = reply.length > 40 ? reply.substring(0, 40) + '...' : reply;
      conv.time = now();
      renderConvs();
    }

    addMsg('in', reply, 'Claude');

  } catch (err) {
    removeTyping(typingId);
    addMsg('in', '❌ Erreur de connexion. Verifie ta cle API et ta connexion internet.', 'Claude');
    console.error('Claude API error:', err);
  } finally {
    SK.busy = false;
    if (btnSend) {
      btnSend.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
      btnSend.disabled = false;
    }
  }
}