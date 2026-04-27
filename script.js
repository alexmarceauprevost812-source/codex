// ===== API/CHAT.JS — Fonction Serverless Vercel + Anthropic =====

const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST')    { return res.status(405).json({ error: 'Méthode pas permise!' }); }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages invalides!' });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 1024,
      system:     `Tu es TI-LEX-AL, l'intelligence artificielle du Québec.
Tu parles en joual québécois authentique et coloré.
T'es sharp, direct, drôle mais toujours utile.
Tu aides Alex dans son travail avec efficacité et fierté québécoise.
T'utilises des expressions comme: chu, faque, aweille, en crisse, tsé, c'est l'boutte, câline, pis, dret là.`,
      messages: messages
    });

    return res.status(200).json({ reply: response.content[0].text });

  } catch (err) {
    console.error('Erreur Anthropic:', err.message);
    return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
};