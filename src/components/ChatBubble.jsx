import React, { useState } from 'react';

export default function ChatBubble() {
  const [ouverte, setOuverte] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, texte: 'Salut! Besoin d\'aide? 👋', auteur: 'bot' },
  ]);
  const [input, setInput] = useState('');

  const envoyerMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const nouveauMessage = { id: Date.now(), texte: trimmed, auteur: 'user' };
    const reponse = {
      id: Date.now() + 1,
      texte: 'Reçu 5 sur 5! 🤙',
      auteur: 'bot',
    };

    setMessages((prev) => [...prev, nouveauMessage, reponse]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') envoyerMessage();
  };

  return (
    <div className="chat-bubble-wrapper">
      {ouverte && (
        <div className="chat-window">
          <div className="chat-header">
            <span>💬 Assistant</span>
            <button onClick={() => setOuverte(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.map((m) => (
              <div key={m.id} className={`message ${m.auteur}`}>
                {m.texte}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Écris un message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={envoyerMessage}>➤</button>
          </div>
        </div>
      )}
      <button
        className={`chat-toggle ${ouverte ? 'actif' : ''}`}
        onClick={() => setOuverte(!ouverte)}
      >
        {ouverte ? '✕' : '💬'}
      </button>
    </div>
  );
}