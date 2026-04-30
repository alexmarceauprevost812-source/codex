// ============================
// 🔐 SYSTÈME DE CONNEXION
// ============================

// 👤 Utilisateurs simulés (en vrai, ça vient d'un backend!)
const utilisateurs = [
  { courriel: "admin@codex.ca", motdepasse: "1234" },
  { courriel: "ti-coder@codex.ca", motdepasse: "leboute" }
];

// 📂 Ouvrir la modal
function ouvrirModal() {
  document.getElementById("modalOverlay").classList.remove("hidden");
}

// ❌ Fermer la modal
function fermerModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
  document.getElementById("erreurMsg").classList.add("hidden");
  document.getElementById("courriel").value = "";
  document.getElementById("motdepasse").value = "";
}

// 🚀 Tentative de connexion
function seConnecter() {
  const courriel   = document.getElementById("courriel").value.trim();
  const motdepasse = document.getElementById("motdepasse").value.trim();
  const erreurMsg  = document.getElementById("erreurMsg");

  // Vérification des champs vides
  if (!courriel || !motdepasse) {
    erreurMsg.textContent = "⚠️ Remplis toute les champs, câline!";
    erreurMsg.classList.remove("hidden");
    return;
  }

  // Vérification du user
  const userTrouve = utilisateurs.find(
    u => u.courriel === courriel && u.motdepasse === motdepasse
  );

  if (userTrouve) {
    // ✅ Connexion réussie!
    fermerModal();
    afficherToast("✅ Connexion réussie! Bienvenue mon chum! 🍁");

    // Changer le bouton navbar
    document.getElementById("btnConnexion").textContent = "👤 " + courriel;
    document.getElementById("btnConnexion").style.background = "#a6e3a1";
    document.getElementById("btnConnexion").onclick = null;

  } else {
    // ❌ Mauvais identifiants
    erreurMsg.textContent = "❌ Courriel ou mot de passe incorrect!";
    erreurMsg.classList.remove("hidden");

    // Shake animation
    document.querySelector(".modal").style.animation = "none";
    setTimeout(() => {
      document.querySelector(".modal").style.animation = "";
    }, 10);
  }
}

// 🔔 Afficher un toast
function afficherToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}

// ⌨️ Connexion avec la touche ENTER
document.addEventListener("keydown", function(e) {
  const modal = document.getElementById("modalOverlay");
  if (e.key === "Enter" && !modal.classList.contains("hidden")) {
    seConnecter();
  }
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    fermerModal();
  }
});

// 🔗 Placeholder pour l'inscription
function afficherInscription() {
  alert("📝 Page d'inscription — coming soon mon chum! 🍁");
}