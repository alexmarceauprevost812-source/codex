import React, { useState } from 'react';

export default function TaskList() {
  const [taches, setTaches] = useState([
    { id: 1, texte: 'Faire le café ☕', fait: false },
    { id: 2, texte: 'Pousser le code sur Git 🚀', fait: false },
    { id: 3, texte: 'Réviser la PR 👀', fait: true },
  ]);
  const [nouvelleTache, setNouvelleTache] = useState('');

  const ajouterTache = () => {
    const trimmed = nouvelleTache.trim();
    if (!trimmed) return;
    setTaches([
      ...taches,
      { id: Date.now(), texte: trimmed, fait: false },
    ]);
    setNouvelleTache('');
  };

  const toggleTache = (id) => {
    setTaches(taches.map((t) => (t.id === id ? { ...t, fait: !t.fait } : t)));
  };

  const supprimerTache = (id) => {
    setTaches(taches.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') ajouterTache();
  };

  return (
    <div className="task-list">
      <div className="task-input">
        <input
          type="text"
          placeholder="Nouvelle tâche..."
          value={nouvelleTache}
          onChange={(e) => setNouvelleTache(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={ajouterTache}>Ajouter</button>
      </div>

      <ul>
        {taches.map((tache) => (
          <li key={tache.id} className={tache.fait ? 'fait' : ''}>
            <span onClick={() => toggleTache(tache.id)}>
              {tache.fait ? '✅' : '⬜'} {tache.texte}
            </span>
            <button className="btn-delete" onClick={() => supprimerTache(tache.id)}>🗑️</button>
          </li>
        ))}
      </ul>

      <p className="compteur">
        {taches.filter((t) => t.fait).length} / {taches.length} complétées
      </p>
    </div>
  );
}