import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize dotenv to load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = reportAppUpdates(express());
const PORT = process.env.PORT || 5000;

function reportAppUpdates(instance) {
  return instance;
}

// Enable CORS and JSON parsing
// Explicitly allow the Vercel frontend and local dev origins
const allowedOrigins = [
  'https://build-new-u4yq.vercel.app',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, Postman, same-origin server calls)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: origin ${origin} is not allowed.`), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors());

app.use(express.json());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey && apiKey !== 'your_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Utility function to safely parse Gemini JSON responses
function cleanAndParseJSON(text) {
  let cleanText = text.trim();
  
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3);
  }
  
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  
  cleanText = cleanText.trim();
  
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    const startIndex = cleanText.indexOf('{');
    const endIndex = cleanText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const possibleJson = cleanText.substring(startIndex, endIndex + 1);
      return JSON.parse(possibleJson);
    }
    throw error;
  }
}

// Simulated Fallback Data Generator
function getMockReflection(name, age, goal, struggle, oneYearVision, tone) {
  const identities = {
    'Motivational': `The Inspired Catalyst`,
    'Brutally Honest': `The Uncompromising Architect`,
    'Calm Mentor': `The Grounded Sage`,
    'CEO Mode': `The Execution Specialist`
  };

  const messages = {
    'Motivational': `Hey ${name}, I am writing to you from exactly one year in the future. Looking back at when you were ${age}, I know how hard it was to deal with ${struggle}. But you held on. The dream to "${goal}" was worth every single sleepless night. You shifted your identity, built momentum daily, and now we are living the vision: "${oneYearVision}". Keep pushing, you are closer than you think!`,
    'Brutally Honest': `Listen ${name}. Cut the excuses. When you were ${age}, you spent too much time negotiating with your dreams because of "${struggle}". The only reason we reached the goal of "${oneYearVision}" is because you stopped talking and started acting. Either your daily habits match your ambition to "${goal}", or you are just playing a game. Build discipline now.`,
    'Calm Mentor': `Hello ${name}. Breathe. The uncertainty you felt at ${age} was a necessary part of your growth. Your struggle with "${struggle}" was not a failure; it was a lesson in disguise. By committing to "${goal}" with patience and quiet confidence, we reached the milestone: "${oneYearVision}". Focus on the step directly in front of you.`,
    'CEO Mode': `Let's look at the metrics, ${name}. We had a clear target to "${goal}" and reach "${oneYearVision}", but at ${age}, your biggest blocker was "${struggle}". The turnaround happened when you treated your life like a high-growth startup and ruthlessly optimized your schedule. Track execution daily, eliminate waste, and scale.`
  };

  const moves = {
    'Motivational': [
      `Write down your top 3 daily priorities every single morning.`,
      `Dedicate 1 hour of deep work towards "${goal}" without checking your phone.`,
      `Celebrate small wins every evening to train your brain for progress.`
    ],
    'Brutally Honest': [
      `Delete all time-wasting apps and establish strict focus windows.`,
      `Commit to working on "${goal}" at least 3 hours daily before doing anything else.`,
      `Stop asking for permission or waiting for inspiration; just execute.`
    ],
    'Calm Mentor': [
      `Spend 10 minutes in silence every morning to align your mind.`,
      `Slow down and focus entirely on mastering one skill needed for "${goal}".`,
      `Practice self-compassion when you make mistakes, but don't lose direction.`
    ],
    'CEO Mode': [
      `Build a weekly tracking dashboard for your progress on "${goal}".`,
      `Delegate or automate at least 2 non-essential tasks in your life.`,
      `Schedule a weekly review session to audit your inputs and outputs.`
    ]
  };

  const habits = {
    'Motivational': `Write down one thing you are grateful for and one key target every morning.`,
    'Brutally Honest': `Wake up at 5:30 AM and work on your business first. No exceptions.`,
    'Calm Mentor': `Take a 5-minute breathing pause whenever you feel overwhelmed.`,
    'CEO Mode': `Time-block your calendar the night before and follow it strictly.`
  };

  const warnings = {
    'Motivational': `Don't let temporary setbacks make you doubt your ultimate potential.`,
    'Brutally Honest': `If you continue letting "${struggle}" rule your day, you will stay in the exact same spot.`,
    'Calm Mentor': `Do not rush the process; sustainable habits are built brick by brick.`,
    'CEO Mode': `Beware of fake work that feels productive but doesn't move the needle.`
  };

  const mantras = {
    'Motivational': `I am the creator of my destiny and I grow stronger daily.`,
    'Brutally Honest': `Action over excuses. The future is built on execution, not planning.`,
    'Calm Mentor': `I am grounded in the present, moving steadily towards my future.`,
    'CEO Mode': `Focus on high-leverage tasks. Ruthless prioritization builds empires.`
  };

  return {
    message: messages[tone] || messages['Motivational'],
    futureIdentity: identities[tone] || identities['Motivational'],
    nextMoves: moves[tone] || moves['Motivational'],
    habit: habits[tone] || habits['Motivational'],
    warning: warnings[tone] || warnings['Motivational'],
    mantra: mantras[tone] || mantras['Motivational']
  };
}

function getMockDailyPlan(userProfile) {
  const plans = {
    'Motivational': {
      focus: "Establish a high-momentum start and protect your deep work window.",
      schedule: [
        { time: "06:00 AM - 07:30 AM", activity: "Rise & Align: Hydrate, plan your day, and do 10 minutes of reflection.", leverage: "High", motivation: "Winning the morning is winning the day." },
        { time: "08:30 AM - 11:30 AM", activity: `Deep Focus Block: Work uninterrupted on your goal of "${userProfile.goal}".`, leverage: "Critical", motivation: "This is where the actual progress is built." },
        { time: "01:30 PM - 04:30 PM", activity: "Leverage Work: Handle emails, administrative tasks, and minor project updates.", leverage: "Medium", motivation: "Keep momentum going without burning out." },
        { time: "08:00 PM - 09:00 PM", activity: `Review & Wind Down: Track completed tasks and review your struggle with "${userProfile.struggle}".`, leverage: "High", motivation: "Refining tomorrow's approach tonight." }
      ],
      mantra: "Every small task checked off is a brick in our future empire.",
      motivationalQuote: "The future belongs to those who execute in the present."
    },
    'Brutally Honest': {
      focus: "Stop planning. Start doing. Eliminate distractions ruthlessly today.",
      schedule: [
        { time: "05:30 AM - 07:00 AM", activity: "No-Snooze Block: Get out of bed instantly. Work on your key priority.", leverage: "High", motivation: "Excuses don't pay bills. Do the work." },
        { time: "08:30 AM - 12:00 PM", activity: `Isolation Focus: Put phone in another room. Work on "${userProfile.goal}".`, leverage: "Critical", motivation: "If you touch social media or games here, you choose to fail." },
        { time: "02:00 PM - 05:00 PM", activity: "System Maintenance: Perform necessary follow-ups and business admin.", leverage: "Medium", motivation: "Be efficient and brief. Get back to execution." },
        { time: "08:30 PM - 09:30 PM", activity: `Truth Audit: Review your day. Did you let "${userProfile.struggle}" win? Write down the honest score.`, leverage: "High", motivation: "Lying to yourself is the worst form of sabotage." }
      ],
      mantra: "Consistency over comfort. Execution over intentions.",
      motivationalQuote: "You are either building your dreams or negotiating them away."
    },
    'Calm Mentor': {
      focus: "Align actions with intent and cultivate presence in each block.",
      schedule: [
        { time: "06:30 AM - 08:00 AM", activity: "Mindful Morning: Breathe, journal, and read one article about your industry.", leverage: "High", motivation: "A quiet mind makes better strategic decisions." },
        { time: "09:00 AM - 12:00 PM", activity: `Focused Effort: Work with patience on a key milestone for "${userProfile.goal}".`, leverage: "Critical", motivation: "Do not rush. Quality requires focused attention." },
        { time: "02:00 PM - 04:30 PM", activity: "Collaborative Actions: Engage with users, research, or refine details calmly.", leverage: "Medium", motivation: "Connection builds sustainability." },
        { time: "08:00 PM - 09:00 PM", activity: `Gratitude & Planning: Acknowledge today's efforts and release the tension of "${userProfile.struggle}".`, leverage: "High", motivation: "Patience with the journey is power." }
      ],
      mantra: "Slow is smooth. Smooth is fast. We are walking the path steadily.",
      motivationalQuote: "Nature does not hurry, yet everything is accomplished."
    },
    'CEO Mode': {
      focus: "Maximize high-leverage outcomes and track input metrics.",
      schedule: [
        { time: "05:45 AM - 07:15 AM", activity: "Strategic Review: Analyze metrics, prioritize high-value tasks, and check timeline goals.", leverage: "High", motivation: "Set the daily vision before the noise starts." },
        { time: "08:30 AM - 12:00 PM", activity: `Core Deliverable: Focus entirely on the main growth task for "${userProfile.goal}".`, leverage: "Critical", motivation: "Delegate the rest. Focus on high leverage." },
        { time: "01:30 PM - 04:30 PM", activity: "Operations & Audits: Sync with collaborators, test features, or refine strategies.", leverage: "Medium", motivation: "Keep the machine running smoothly." },
        { time: "07:30 PM - 08:30 PM", activity: `KPI Review: Did you minimize the impact of "${userProfile.struggle}"? Log your daily productivity index.`, leverage: "High", motivation: "What gets measured gets managed." }
      ],
      mantra: "Protect your time. It is your only non-renewable asset.",
      motivationalQuote: "Efficiency is doing things right; effectiveness is doing the right things."
    }
  };

  return plans[userProfile.tone] || plans['Motivational'];
}

function getMockChatReply(userProfile, question) {
  const replies = {
    'Motivational': [
      `You're asking the right questions, ${userProfile.name}. The first step is to focus on what you can control. Tomorrow morning, wake up and give yourself 45 minutes of quiet time to plan. You have everything it takes to reach "${userProfile.goal}".`,
      `I remember feeling that exact doubt. But every small choice you make to conquer "${userProfile.struggle}" adds up. Trust the process and keep taking massive action towards "${userProfile.oneYearVision}".`,
      `Keep your chin up. The road is long but you are already building momentum. Let's make sure that tomorrow morning you dedicate at least one hour of uninterrupted time to executing.`
    ],
    'Brutally Honest': [
      `Stop looking for a magic pill, ${userProfile.name}. The answer is simple: you need to work. Your struggle with "${userProfile.struggle}" is entirely self-inflicted. Tomorrow morning, get up, block out the noise, and do the hard work for "${userProfile.goal}".`,
      `You're overcomplicating it to avoid doing the actual execution. Pick one task that moves you closer to "${userProfile.oneYearVision}" and finish it. No excuses.`,
      `If you don't master "${userProfile.struggle}" now, we won't make it. The first action is to block out all distractions tomorrow morning and work on "${userProfile.goal}" for 3 hours.`
    ],
    'Calm Mentor': [
      `It is normal to seek immediate answers, ${userProfile.name}. But clarity comes through steady, mindful actions. Focus on neutralizing "${userProfile.struggle}" by introducing one positive habit. Tomorrow, start by doing 15 minutes of quiet planning.`,
      `Be patient with yourself. The vision of "${userProfile.oneYearVision}" is a mountain, and you climb it one step at a time. Keep your focus grounded and remember why you started.`,
      `Take a step back. The key is consistency, not intensity. Dedicate a small window tomorrow morning to write down your plan, then execute with calm focus.`
    ],
    'CEO Mode': [
      `Let's analyze the input-output loop, ${userProfile.name}. To achieve "${userProfile.goal}", you must optimize your daily output. The presence of "${userProfile.struggle}" indicates a lack of structure. Block out tomorrow morning for pure execution.`,
      `Treat your daily tasks like key performance indicators (KPIs). If a task doesn't contribute directly to reaching "${userProfile.oneYearVision}", deprioritize it immediately.`,
      `Let's focus on execution metrics. Your primary target tomorrow is to address "${userProfile.struggle}". Establish a 90-minute block for deep work and track your completion rate.`
    ]
  };

  const pool = replies[userProfile.tone] || replies['Motivational'];
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('first step') || lowerQ.includes('tomorrow') || lowerQ.includes('start') || lowerQ.includes('focus') || lowerQ.includes('do')) {
    return pool[0];
  }
  if (lowerQ.includes('will i') || lowerQ.includes('fail') || lowerQ.includes('make it') || lowerQ.includes('happy')) {
    return pool[1];
  }
  return pool[2];
}

// Route: POST /api/generate-futureme
app.post('/api/generate-futureme', async (req, res) => {
  const { name, age, goal, struggle, oneYearVision, tone } = req.body;

  if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
    return res.status(400).json({
      success: false,
      error: 'Missing required profile fields.'
    });
  }

  // Check if API key is initialized
  if (!genAI) {
    console.log(`[API key not set] Falling back to AI timeline simulation...`);
    const data = getMockReflection(name, age, goal, struggle, oneYearVision, tone);
    return res.json({ success: true, data });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Tone selected by user: ${tone}
(Note: Adapt the style of this tone:
- Motivational: warm, inspiring, supportive, encouraging
- Brutally Honest: direct, sharp, no excuses, eye-opening
- Calm Mentor: peaceful, wise, grounded, patient
- CEO Mode: strategic, focused, execution-heavy, action-oriented)

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return only valid JSON in this exact format:
{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily."
}

Make it specific. Avoid generic motivation. Avoid clichés. Make it emotional but practical. Do not include any JSON wrappers or other text in the response, just the JSON block.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    try {
      const data = cleanAndParseJSON(responseText);
      return res.json({
        success: true,
        data
      });
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output. Output was:', responseText, parseErr);
      return res.status(500).json({
        success: false,
        error: 'The AI model generated an invalid response format. Please try again.'
      });
    }
  } catch (error) {
    console.error('Error during generateContent:', error.message);
    
    // Check if error is due to authentication / permission / suspension issues
    if (error.message.includes('suspended') || error.message.includes('API key') || error.message.includes('Forbidden') || error.message.includes('API_KEY_INVALID')) {
      console.warn(`⚠️ [API Key Issue - Suspended or Invalid] Falling back to local AI timeline simulation...`);
      const data = getMockReflection(name, age, goal, struggle, oneYearVision, tone);
      return res.json({
        success: true,
        data
      });
    }

    return res.status(500).json({
      success: false,
      error: 'FutureMe could not respond right now. Try again.'
    });
  }
});

// Route: POST /api/chat-futureme
app.post('/api/chat-futureme', async (req, res) => {
  const { userProfile, chatHistory, question } = req.body;

  if (!userProfile || !question) {
    return res.status(400).json({
      success: false,
      error: 'Missing userProfile or question in request.'
    });
  }

  // Check if API key is initialized
  if (!genAI) {
    console.log(`[API key not set] Falling back to chat simulation...`);
    const reply = getMockChatReply(userProfile, question);
    return res.json({ success: true, reply });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Format chat history for prompt
    const formattedHistory = (chatHistory || [])
      .map(chat => {
        const roleName = chat.role === 'user' ? 'User' : 'FutureMe';
        return `${roleName}: ${chat.message}`;
      })
      .join('\n');

    const systemPrompt = `You are FutureMe, the future version of the user who already achieved their one-year vision. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

User profile:
Name: ${userProfile.name}
Age: ${userProfile.age}
Goal: ${userProfile.goal}
Struggle: ${userProfile.struggle}
One-year vision: ${userProfile.oneYearVision}
Tone: ${userProfile.tone}
(Note: Use this tone to frame your reply:
- Motivational: warm, inspiring, supportive
- Brutally Honest: direct, sharp, no excuses
- Calm Mentor: peaceful, wise, grounded
- CEO Mode: strategic, focused, execution-heavy)

Recent chat history:
${formattedHistory}

Current question:
${question}

Reply in 2-5 short paragraphs. Give at least one clear action.`;

    const result = await model.generateContent(systemPrompt);
    const replyText = result.response.text();

    return res.json({
      success: true,
      reply: replyText.trim()
    });
  } catch (error) {
    console.error('Error during chat generateContent:', error.message);

    // Fallback if API key fails or suspended
    if (error.message.includes('suspended') || error.message.includes('API key') || error.message.includes('Forbidden') || error.message.includes('API_KEY_INVALID')) {
      console.warn(`⚠️ [API Key Issue - Suspended or Invalid] Falling back to local chat simulation...`);
      const reply = getMockChatReply(userProfile, question);
      return res.json({
        success: true,
        reply
      });
    }

    return res.status(500).json({
      success: false,
      error: 'FutureMe could not respond right now. Try again.'
    });
  }
});

// Route: POST /api/daily-plan
app.post('/api/daily-plan', async (req, res) => {
  try {
    const { userProfile } = req.body;

    if (!userProfile) {
      return res.status(400).json({
        success: false,
        error: 'Missing userProfile in request.'
      });
    }

    if (!genAI) {
      console.log(`[API key not set] Falling back to daily plan simulation...`);
      const plan = getMockDailyPlan(userProfile);
      return res.json({ success: true, plan });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are FutureMe, the successful future version of the user. Your job is to create a detailed, realistic, and highly motivating daily schedule plan based on the user's details. The plan must help them achieve their goal while addressing their current struggle.

User details:
Name: ${userProfile.name}
Age: ${userProfile.age}
Goal: ${userProfile.goal}
Struggle: ${userProfile.struggle}
One-year vision: ${userProfile.oneYearVision}
Tone: ${userProfile.tone}

Return only valid JSON in this exact format:
{
  "focus": "A short, powerful focus statement for the day.",
  "schedule": [
    {
      "time": "Time Range (e.g. 06:00 AM - 07:30 AM)",
      "activity": "A concrete, highly actionable activity that aligns with their goal.",
      "leverage": "High, Critical, or Medium",
      "motivation": "A short sentence of motivation from their future self for this block."
    },
    {
      "time": "Time Range (e.g. 08:30 AM - 12:00 PM)",
      "activity": "Another concrete activity.",
      "leverage": "High, Critical, or Medium",
      "motivation": "Motivation sentence."
    },
    {
      "time": "Time Range (e.g. 01:30 PM - 04:30 PM)",
      "activity": "Another concrete activity.",
      "leverage": "High, Critical, or Medium",
      "motivation": "Motivation sentence."
    },
    {
      "time": "Time Range (e.g. 08:00 PM - 09:30 PM)",
      "activity": "Another concrete activity.",
      "leverage": "High, Critical, or Medium",
      "motivation": "Motivation sentence."
    }
  ],
  "mantra": "A daily planner mantra.",
  "motivationalQuote": "A personalized motivational quote."
}

Do not include any Markdown wrappers or additional text, just return the JSON block.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    try {
      const plan = cleanAndParseJSON(responseText);
      return res.json({
        success: true,
        plan
      });
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output for daily plan. Output was:', responseText, parseErr);
      return res.status(500).json({
        success: false,
        error: 'The AI model generated an invalid response format. Please try again.'
      });
    }
  } catch (error) {
    console.error('Error during daily plan generateContent:', error.message);

    // Fallback if API key fails or suspended
    if (error.message.includes('suspended') || error.message.includes('API key') || error.message.includes('Forbidden') || error.message.includes('API_KEY_INVALID')) {
      console.warn(`⚠️ [API Key Issue - Suspended or Invalid] Falling back to local daily plan simulation...`);
      const plan = getMockDailyPlan(req.body.userProfile);
      return res.json({
        success: true,
        plan
      });
    }

    return res.status(500).json({
      success: false,
      error: 'FutureMe could not generate daily plan. Try again.'
    });
  }
});

// NOTE: SPA fallback (app.get('*')) is intentionally omitted here.
// On Vercel, static file routing (frontend/*) is handled by vercel.json routes.
// Adding a wildcard Express route here would intercept ALL requests including /api/*.

// Start the server only in local development.
// On Vercel (serverless), app.listen() is NOT called — Vercel invokes the exported app directly.
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`FutureMe server is running on http://localhost:${PORT}`);
    if (!genAI) {
      console.log(`WARNING: GEMINI_API_KEY is not set or placeholder.`);
      console.log(`Please configure it in backend/.env to use AI features.`);
    } else {
      console.log(`Gemini AI service successfully initialized!`);
    }
    console.log(`==================================================`);
  });
}

// REQUIRED for Vercel @vercel/node: export the Express app as the default export.
// Without this, Vercel has no handler to invoke and returns NOT_FOUND.
export default app;
