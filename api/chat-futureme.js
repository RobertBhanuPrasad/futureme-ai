import { setCors, genAI, getMockChatReply } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userProfile, chatHistory, question } = req.body;
  if (!userProfile || !question) {
    return res.status(400).json({ success: false, error: 'Missing userProfile or question.' });
  }

  if (!genAI) {
    return res.json({ success: true, reply: getMockChatReply(userProfile, question) });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const history = (chatHistory || []).map(c => `${c.role === 'user' ? 'User' : 'FutureMe'}: ${c.message}`).join('\n');
    const prompt = `You are FutureMe, the future version of ${userProfile.name} who already achieved their one-year vision. Reply to the user's question directly. Be personal, sharp, honest, and useful. Do not say you are an AI.\n\nProfile: Name=${userProfile.name}, Goal=${userProfile.goal}, Struggle=${userProfile.struggle}, Vision=${userProfile.oneYearVision}, Tone=${userProfile.tone}\n\nChat history:\n${history}\n\nQuestion: ${question}\n\nReply in 2-5 short paragraphs with at least one clear action.`;
    const result = await model.generateContent(prompt);
    return res.json({ success: true, reply: result.response.text().trim() });
  } catch (err) {
    console.error('chat-futureme:', err.message);
    if (err.message.includes('suspended') || err.message.includes('API key') || err.message.includes('Forbidden') || err.message.includes('API_KEY_INVALID')) {
      return res.json({ success: true, reply: getMockChatReply(userProfile, question) });
    }
    return res.status(500).json({ success: false, error: 'FutureMe could not respond right now. Try again.' });
  }
}
