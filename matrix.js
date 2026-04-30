(function() {
  const canvas  = document.getElementById('matrix-canvas');
  const ctx     = canvas.getContext('2d');

  // Caractères japonais + latins + chiffres
  const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&';

  const FONT_SIZE = 16;
  let colonnes    = [];
  let animId      = null;

  function redimensionner() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const nbCols  = Math.floor(canvas.width / FONT_SIZE);
    colonnes = Array.from({ length: nbCols }, () =>
      Math.floor(Math.random() * -canvas.height / FONT_SIZE)
    );
  }

  function dessiner() {
    // Traîne sombre semi-transparente
    ctx.fillStyle = 'rgba(13, 13, 13, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px "Share Tech Mono", monospace`;

    colonnes.forEach((y, i) => {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x    = i * FONT_SIZE;

      // Tête de colonne = blanc brillant
      ctx.fillStyle = '#ffffff';
      ctx.fillText(char, x, y * FONT_SIZE);

      // Corps vert matrix
      ctx.fillStyle = '#00ff41';
      if (y > 2) {
        const char2 = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = 'rgba(0,255,65,0.7)';
        ctx.fillText(char2, x, (y - 1) * FONT_SIZE);
      }

      // Réinitialiser aléatoirement
      if (y * FONT_SIZE > canvas.height && Math.random() > 0.975) {
        colonnes[i] = 0;
      } else {
        colonnes[i]++;
      }
    });

    animId = requestAnimationFrame(dessiner);
  }

  window.addEventListener('resize', redimensionner);
  redimensionner();
  dessiner();

  // Exposer pour la transition
  window.matrixAnimation = { stop: () => cancelAnimationFrame(animId) };
})();