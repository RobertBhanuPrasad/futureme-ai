import { setCors, genAI, cleanAndParseJSON, getMockDailyPlan } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userProfile } = req.body;
  if (!userProfile) {
    return res.status(400).json({ success: false, error: 'Missing userProfile.' });
  }

  if (!genAI) {
    return res.json({ success: true, plan: getMockDailyPlan(userProfile) });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are FutureMe. Create a detailed daily schedule for:\nName=${userProfile.name}, Goal=${userProfile.goal}, Struggle=${userProfile.struggle}, Vision=${userProfile.oneYearVision}, Tone=${userProfile.tone}.\n\nReturn only valid JSON:\n{"focus":"short powerful focus statement","schedule":[{"time":"06:00 AM - 07:30 AM","activity":"concrete activity","leverage":"High","motivation":"short motivation"},{"time":"08:30 AM - 12:00 PM","activity":"concrete activity","leverage":"Critical","motivation":"short motivation"},{"time":"01:30 PM - 04:30 PM","activity":"concrete activity","leverage":"Medium","motivation":"short motivation"},{"time":"08:00 PM - 09:00 PM","activity":"concrete activity","leverage":"High","motivation":"short motivation"}],"mantra":"daily planner mantra","motivationalQuote":"personalized quote"}`;
    const result = await model.generateContent(prompt);
    const plan = cleanAndParseJSON(result.response.text());
    return res.json({ success: true, plan });
  } catch (err) {
    console.error('daily-plan:', err.message);
    if (err.message.includes('suspended') || err.message.includes('API key') || err.message.includes('Forbidden') || err.message.includes('API_KEY_INVALID')) {
      return res.json({ success: true, plan: getMockDailyPlan(userProfile) });
    }
    return res.status(500).json({ success: false, error: 'Could not generate daily plan. Try again.' });
  }
}
