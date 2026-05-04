/**
 * Inline script that runs before React hydrates so the user's stored
 * theme + background preferences are applied to <html> before first
 * paint (avoids a flash of default styles).
 */
export function ThemeScript() {
  const code = `
(function () {
  try {
    var COLORS = {
      orange: ['#f97316', '#000000'],
      blue: ['#3b82f6', '#ffffff'],
      yellow: ['#eab308', '#000000'],
      pink: ['#ec4899', '#ffffff'],
      purple: ['#8b5cf6', '#ffffff'],
      red: ['#ef4444', '#ffffff'],
      green: ['#22c55e', '#000000'],
      gray: ['#6b7280', '#ffffff'],
      white: ['#ffffff', '#000000']
    };
    var root = document.documentElement;
    var accent = localStorage.getItem('codex-accent');
    if (accent && COLORS[accent]) {
      root.style.setProperty('--accent', COLORS[accent][0]);
      root.style.setProperty('--accent-text', COLORS[accent][1]);
    }
    var bgMode = localStorage.getItem('codex-bg-mode');
    if (bgMode === 'video' || bgMode === 'black' || bgMode === 'white') {
      root.setAttribute('data-bg-mode', bgMode);
    } else {
      root.setAttribute('data-bg-mode', 'video');
    }
  } catch (e) {}
})();
`;
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
