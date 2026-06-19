import { setCors, genAI, cleanAndParseJSON, getMockReflection } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, age, goal, struggle, oneYearVision, tone } = req.body;
  if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
    return res.status(400).json({ success: false, error: 'Missing required profile fields.' });
  }

  if (!genAI) {
    return res.json({ success: true, data: getMockReflection(name, age, goal, struggle, oneYearVision, tone) });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are FutureMe, the future successful version of the user. Tone: ${tone} (Motivational=warm/inspiring, Brutally Honest=direct/no-excuses, Calm Mentor=peaceful/wise, CEO Mode=strategic/execution-heavy).\n\nUser: Name=${name}, Age=${age}, Goal=${goal}, Struggle=${struggle}, OneYearVision=${oneYearVision}.\n\nReturn only valid JSON:\n{"message":"120-180 word personal message from future self","futureIdentity":"who they are becoming","nextMoves":["Action1","Action2","Action3"],"habit":"one daily habit","warning":"one warning from future self","mantra":"short daily mantra"}`;
    const result = await model.generateContent(prompt);
    const data = cleanAndParseJSON(result.response.text());
    return res.json({ success: true, data });
  } catch (err) {
    console.error('generate-futureme:', err.message);
    if (err.message.includes('suspended') || err.message.includes('API key') || err.message.includes('Forbidden') || err.message.includes('API_KEY_INVALID')) {
      return res.json({ success: true, data: getMockReflection(name, age, goal, struggle, oneYearVision, tone) });
    }
    return res.status(500).json({ success: false, error: 'FutureMe could not respond right now. Try again.' });
  }
}
