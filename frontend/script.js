// ==========================================================================
// FutureMe Frontend Logic
// ==========================================================================

// Config: Auto-detect API location
// - On Vercel (or any https/http host that is NOT localhost), use relative path so
//   the browser calls the same Vercel deployment's /api/* routes.
// - When running directly from a file:// or on localhost (dev), point to the local backend.
const isLocalDev = window.location.protocol === 'file:' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const API_BASE = isLocalDev ? 'http://localhost:5000' : '';

// App State
const state = {
  userProfile: null,
  futureMeData: null,
  chatHistory: [], // stores { role: 'user' | 'futureme', message: '...' }
  dailyPlan: null
};

// DOM Elements
const elements = {
  name: document.getElementById('name'),
  age: document.getElementById('age'),
  goal: document.getElementById('goal'),
  struggle: document.getElementById('struggle'),
  year: document.getElementById('year'),
  tone: document.getElementById('tone'),
  
  submitBtn: document.getElementById('submit-btn'),
  errorBlock: document.getElementById('error'),
  loadingBlock: document.getElementById('loading'),
  resultBlock: document.getElementById('result'),

  resIdentity: document.getElementById('res-future-identity'),
  resMessage: document.getElementById('res-message'),
  resSignature: document.getElementById('res-signature'),
  resNextMoves: document.getElementById('res-next-moves'),
  resHabit: document.getElementById('res-habit'),
  resWarning: document.getElementById('res-warning'),
  resMantra: document.getElementById('res-mantra'),

  chatMessages: document.getElementById('chat-messages'),
  chatTyping: document.getElementById('chat-typing'),
  chatSuggestions: document.getElementById('chat-suggestions'),
  chatInput: document.getElementById('chat-input'),
  chatSendBtn: document.getElementById('chat-send-btn'),
  chatForm: document.getElementById('chat-form'),

  toast: document.getElementById('toast'),

  planLoading: document.getElementById('plan-loading'),
  planContainer: document.getElementById('daily-plan-container'),
  planFocus: document.getElementById('plan-focus'),
  planScheduleGrid: document.getElementById('plan-schedule-grid'),
  planQuote: document.getElementById('plan-quote'),
  generatePlanBtn: document.getElementById('generate-plan-btn')
};

// Loading Texts Loop
const loadingTexts = [
  "Creating your future identity...",
  "Syncing timeline dimensions...",
  "Consulting your future self...",
  "Structuring next moves...",
  "Finalizing neural link..."
];
let loadingTimer = null;

// Intersection Observer for scroll reveal animations
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ==========================================================================
// Toast Alerts
// ==========================================================================
function triggerToast(message) {
  elements.toast.innerText = message;
  elements.toast.style.display = 'block';
  setTimeout(() => {
    elements.toast.style.display = 'none';
  }, 4000);
}

// ==========================================================================
// Generation Flow
// ==========================================================================
async function generateFuture() {
  const fields = ['name', 'age', 'goal', 'struggle', 'year'];
  let isValid = true;

  // Validate inputs
  fields.forEach(id => {
    const val = document.getElementById(id).value.trim();
    if (!val) isValid = false;
  });

  if (!isValid) {
    elements.errorBlock.style.display = 'block';
    elements.errorBlock.innerText = 'Please fill all fields.';
    return;
  }

  // Clear previous states
  elements.errorBlock.style.display = 'none';
  elements.loadingBlock.style.display = 'block';
  elements.resultBlock.style.display = 'none';
  elements.submitBtn.disabled = true;

  // Start cycling loading text
  let loadIdx = 0;
  elements.loadingBlock.innerText = loadingTexts[0];
  loadingTimer = setInterval(() => {
    loadIdx = (loadIdx + 1) % loadingTexts.length;
    elements.loadingBlock.innerText = loadingTexts[loadIdx];
  }, 2000);

  // Setup profile payload (maps HTML "year" input to backend API "oneYearVision")
  const profile = {
    name: elements.name.value.trim(),
    age: elements.age.value.trim(),
    goal: elements.goal.value.trim(),
    struggle: elements.struggle.value.trim(),
    oneYearVision: elements.year.value.trim(),
    tone: elements.tone.value
  };

  try {
    const response = await fetch(`${API_BASE}/api/generate-futureme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    });

    const result = await response.json();
    clearInterval(loadingTimer);

    if (result.success && result.data) {
      state.userProfile = profile;
      state.futureMeData = result.data;
      
      // Render results details
      renderResultDashboard(result.data);
      
      // Setup chat system
      initializeChatSystem();

      elements.loadingBlock.style.display = 'none';
      elements.resultBlock.style.display = 'block';
      
      // Update preview card in hero just for visual excellence
      const preview = document.getElementById('preview-text');
      if (preview) {
        preview.innerText = result.data.message.substring(0, 110) + "...";
      }

      triggerToast(`Timeline sync complete. Welcome to 2027, ${profile.name}.`);
    } else {
      elements.loadingBlock.style.display = 'none';
      elements.errorBlock.style.display = 'block';
      elements.errorBlock.innerText = result.error || "FutureMe could not respond right now. Try again.";
      triggerToast("Timeline connection lost. Please try again.");
    }
  } catch (err) {
    console.error('Error generating FutureMe:', err);
    clearInterval(loadingTimer);
    elements.loadingBlock.style.display = 'none';
    elements.errorBlock.style.display = 'block';
    elements.errorBlock.innerText = "FutureMe could not respond right now. Try again.";
    triggerToast("Server response failed. Check your API key configure.");
  } finally {
    elements.submitBtn.disabled = false;
  }
}

// Render values into result dashboard
function renderResultDashboard(data) {
  elements.resIdentity.innerText = data.futureIdentity || 'The High-Value Contender';
  elements.resMessage.innerText = data.message || '';
  elements.resSignature.innerHTML = `Best regards,<br>Future ${state.userProfile.name}`;

  // Buildmoves list
  elements.resNextMoves.innerHTML = '';
  if (data.nextMoves && Array.isArray(data.nextMoves)) {
    data.nextMoves.forEach(move => {
      const li = document.createElement('li');
      li.innerText = move;
      elements.resNextMoves.appendChild(li);
    });
  }

  elements.resHabit.innerText = data.habit || 'N/A';
  elements.resWarning.innerText = data.warning || 'N/A';
  elements.resMantra.innerText = data.mantra ? `“${data.mantra}”` : 'N/A';
}

function resetForm() {
  const fields = ['name', 'age', 'goal', 'struggle', 'year'];
  fields.forEach(id => {
    document.getElementById(id).value = '';
  });
  elements.resultBlock.style.display = 'none';
  elements.errorBlock.style.display = 'none';
  elements.planContainer.style.display = 'none';
  elements.planLoading.style.display = 'none';
  state.dailyPlan = null;
  document.getElementById('create').scrollIntoView({ behavior: 'smooth' });
}

function scrollToChat() {
  document.getElementById('chat').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================================================
// Chat Controller
// ==========================================================================
function getInitialGreeting(name, tone) {
  switch (tone) {
    case 'Motivational':
      return `Hey ${name}, I'm so glad we are talking. Looking back at age ${state.userProfile.age}, I remember how heavy everything felt. But trust me: every single obstacle was just preparing us for what was to come. Let's work through this together. What is on your mind?`;
    case 'Brutally Honest':
      return `Listen, ${name}. We don't have time to beat around the bush. I am here because you wanted the truth. Your habits at ${state.userProfile.age} are either building our empire or negotiating away our dreams. Ask me anything, but be ready for the answer.`;
    case 'Calm Mentor':
      return `Welcome, ${name}. Take a deep breath. It is natural to feel uncertain about the path ahead. Rest assured that the clarity you seek is already within you. Let's explore your questions with patience and an open heart. What would you like to discuss?`;
    case 'CEO Mode':
      return `Let's get straight to it, ${name}. We've aligned our targets and built a vision that works, but the gap is in our day-to-day execution. Time is our highest leverage asset. What is the current bottleneck you are facing? Let's solve it.`;
    default:
      return `Hello ${name}. I am your future self. I have lived through the struggles you are currently facing. Ask me anything about our journey.`;
  }
}

function initializeChatSystem() {
  const profile = state.userProfile;

  // Enable fields
  elements.chatInput.disabled = false;
  elements.chatSendBtn.disabled = false;

  // Build Greeting message
  const greeting = getInitialGreeting(profile.name, profile.tone);
  state.chatHistory = [
    { role: 'futureme', message: greeting }
  ];

  // Set suggestion chips
  setupChatSuggestions(profile.tone);

  renderChatBubbles();
}

function setupChatSuggestions(tone) {
  let suggestions = [];
  if (tone === 'Motivational') {
    suggestions = [
      "Will I be happy in the future?",
      "How do I stay inspired daily?",
      "What should I tell myself when I fail?"
    ];
  } else if (tone === 'Brutally Honest') {
    suggestions = [
      "Am I lying to myself about progress?",
      "What is my worst habit right now?",
      "How do I stop making excuses?"
    ];
  } else if (tone === 'Calm Mentor') {
    suggestions = [
      "How do I find peace in the chaos?",
      "What is the lesson in my current struggle?",
      "How do I build patience?"
    ];
  } else { // CEO Mode
    suggestions = [
      "What is my highest leverage task this week?",
      "How should I structure my work day?",
      "How do I scale my goals faster?"
    ];
  }

  elements.chatSuggestions.innerHTML = '';
  suggestions.forEach(text => {
    const chip = document.createElement('button');
    chip.className = 'suggestion-chip';
    chip.innerText = text;
    chip.type = 'button';
    chip.addEventListener('click', () => {
      elements.chatInput.value = text;
      elements.chatInput.focus();
    });
    elements.chatSuggestions.appendChild(chip);
  });
}

function renderChatBubbles() {
  elements.chatMessages.innerHTML = '';
  state.chatHistory.forEach(msg => {
    const bubble = document.createElement('div');
    const roleClass = msg.role === 'user' ? 'user' : 'ai';
    bubble.className = `bubble ${roleClass}`;
    bubble.innerText = msg.message;
    elements.chatMessages.appendChild(bubble);
  });
  // Auto Scroll
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

async function sendChatMessage() {
  const text = elements.chatInput.value.trim();
  if (!text) return;

  // Append user bubble
  state.chatHistory.push({ role: 'user', message: text });
  renderChatBubbles();
  elements.chatInput.value = '';

  // Disable controls during call
  elements.chatInput.disabled = true;
  elements.chatSendBtn.disabled = true;
  elements.chatTyping.style.display = 'block';
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

  try {
    const response = await fetch(`${API_BASE}/api/chat-futureme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userProfile: state.userProfile,
        chatHistory: state.chatHistory.slice(0, -1), // skip last user message
        question: text
      })
    });

    const result = await response.json();
    elements.chatTyping.style.display = 'none';

    if (result.success && result.reply) {
      state.chatHistory.push({ role: 'futureme', message: result.reply });
      renderChatBubbles();
    } else {
      state.chatHistory.push({ role: 'futureme', message: "FutureMe could not respond right now. Try again." });
      renderChatBubbles();
      triggerToast("Lost connection to the future. Try again.");
    }
  } catch (err) {
    console.error('Chat error:', err);
    elements.chatTyping.style.display = 'none';
    state.chatHistory.push({ role: 'futureme', message: "FutureMe could not respond right now. Try again." });
    renderChatBubbles();
    triggerToast("Server response failed.");
  } finally {
    elements.chatInput.disabled = false;
    elements.chatSendBtn.disabled = false;
    elements.chatInput.focus();
  }
}

// ==========================================================================
// Sharing / Clipboard
// ==========================================================================
function getFormattedReflectionText() {
  if (!state.futureMeData) return '';
  const profile = state.userProfile;
  const data = state.futureMeData;

  return `
✨ FUTUREME AI REFLECTION ✨
-----------------------------------------
Profile: ${profile.name} (Age: ${profile.age})
Personality Tone: ${profile.tone}
Future Identity: ${data.futureIdentity}

--- MESSAGE FROM YOUR FUTURE SELF ---
"${data.message}"

--- NEXT 3 MOVES ---
1. ${data.nextMoves[0] || 'N/A'}
2. ${data.nextMoves[1] || 'N/A'}
3. ${data.nextMoves[2] || 'N/A'}

--- DAILY HABIT ---
${data.habit}

--- TIMELINE WARNING ---
${data.warning}

--- DAILY MANTRA ---
"${data.mantra}"
-----------------------------------------
Generated via FutureMe AI.
`.trim();
}

function copyReflection() {
  const text = getFormattedReflectionText();
  if (!text) {
    triggerToast("Create a FutureMe report first!");
    return;
  }

  navigator.clipboard.writeText(text)
    .then(() => {
      triggerToast("Your FutureMe reflection has been copied!");
    })
    .catch(err => {
      console.error('Copy failed:', err);
      triggerToast("Failed to copy. Please select manually.");
    });
}

function shareMoment() {
  const text = getFormattedReflectionText();
  if (!text) {
    // If no report generated yet, copy a general description
    navigator.clipboard.writeText("Meet the version of you who already made it. Check out FutureMe!")
      .then(() => {
         triggerToast("FutureMe link copied to share!");
      });
    return;
  }

  navigator.clipboard.writeText(text)
    .then(() => {
      triggerToast("Your FutureMe moment is copied and ready to share!");
    });
}

// ==========================================================================
// Daily Action Planner Controller
// ==========================================================================
async function generateDailyPlan() {
  if (!state.userProfile) {
    triggerToast("Create your FutureMe reflection first.");
    return;
  }

  elements.planLoading.style.display = 'block';
  elements.planContainer.style.display = 'none';
  elements.generatePlanBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/daily-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userProfile: state.userProfile })
    });

    const result = await response.json();
    elements.planLoading.style.display = 'none';

    if (result.success && result.plan) {
      state.dailyPlan = result.plan;
      renderDailyPlan(result.plan);
      elements.planContainer.style.display = 'block';
      elements.planContainer.scrollIntoView({ behavior: 'smooth' });
      triggerToast("Daily plan generated! Check off tasks as you complete them.");
    } else {
      triggerToast(result.error || "Failed to generate daily plan. Try again.");
    }
  } catch (err) {
    console.error('Error generating daily plan:', err);
    elements.planLoading.style.display = 'none';
    triggerToast("Server response failed. Please try again.");
  } finally {
    elements.generatePlanBtn.disabled = false;
  }
}

function renderDailyPlan(plan) {
  elements.planFocus.innerText = `Today's Focus: "${plan.focus}"`;
  elements.planQuote.innerText = `“${plan.motivationalQuote}”\n— Mantra: ${plan.mantra}`;

  elements.planScheduleGrid.innerHTML = '';
  plan.schedule.forEach((block, idx) => {
    const blockEl = document.createElement('div');
    blockEl.className = 'glass';
    blockEl.style.display = 'grid';
    blockEl.style.gridTemplateColumns = 'auto 1fr';
    blockEl.style.gap = '15px';
    blockEl.style.padding = '15px';
    blockEl.style.alignItems = 'start';
    blockEl.style.borderRadius = '16px';
    blockEl.style.transition = 'all 0.3s ease';

    // Badge styling based on Leverage priority
    let badgeColor = 'rgba(79, 70, 229, 0.15)';
    let badgeTextColor = '#a78bfa';
    if (block.leverage.toLowerCase() === 'critical') {
      badgeColor = 'rgba(239, 68, 68, 0.15)';
      badgeTextColor = '#fca5a5';
    } else if (block.leverage.toLowerCase() === 'high') {
      badgeColor = 'rgba(245, 158, 11, 0.15)';
      badgeTextColor = '#fde047';
    }

    blockEl.innerHTML = `
      <input type="checkbox" onchange="togglePlanTask(this, '${state.userProfile.name}')" style="width: 22px; height: 22px; margin-top: 3px; cursor: pointer; accent-color: #06b6d4;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">
          <strong style="color: #06b6d4; font-size: 0.95rem;">${block.time}</strong>
          <span class="badge" style="font-size: 0.75rem; padding: 3px 8px; margin: 0; background: ${badgeColor}; color: ${badgeTextColor}; border: none;">${block.leverage} Leverage</span>
        </div>
        <p class="activity-text" style="margin-top: 8px; color: #fff; font-size: 0.95rem; line-height: 1.5;">${block.activity}</p>
        <small style="display: block; margin-top: 6px; color: #9ca3af; font-style: italic;">Motivation: ${block.motivation}</small>
      </div>
    `;
    elements.planScheduleGrid.appendChild(blockEl);
  });
}

function togglePlanTask(checkbox, userName) {
  const container = checkbox.closest('.glass');
  const activityText = container.querySelector('.activity-text');
  
  if (checkbox.checked) {
    container.style.opacity = '0.6';
    container.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    container.style.background = 'rgba(16, 185, 129, 0.03)';
    activityText.style.textDecoration = 'line-through';
    
    // Motivational messages from FutureSelf
    const messages = [
      `Future ${userName} is incredibly proud of your discipline!`,
      "Action builds confidence. Outstanding work!",
      "You checked off a block. Keep this momentum!",
      "Consistency beats talent. You are winning today!",
      "Boom! Another brick added to the foundation.",
      "No excuses. You decided to win, and you are doing it."
    ];
    const randMsg = messages[Math.floor(Math.random() * messages.length)];
    triggerToast(randMsg);
  } else {
    container.style.opacity = '1';
    container.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    container.style.background = 'rgba(255, 255, 255, 0.06)';
    activityText.style.textDecoration = 'none';
  }
}

function copyDailyPlan() {
  if (!state.dailyPlan) return;
  const plan = state.dailyPlan;
  
  let text = `📅 MY DAILY ACTION PLAN (Generated by FutureMe)\n`;
  text += `--------------------------------------------------\n`;
  text += `Today's Focus: ${plan.focus}\n\n`;
  
  plan.schedule.forEach(block => {
    text += `[ ] ${block.time} - ${block.activity}\n`;
    text += `    (Priority: ${block.leverage} | Motivation: ${block.motivation})\n\n`;
  });
  
  text += `Mantra: "${plan.mantra}"\n`;
  text += `Motto: "${plan.motivationalQuote}"\n`;
  text += `--------------------------------------------------\n`;

  navigator.clipboard.writeText(text)
    .then(() => {
      triggerToast("Daily plan copied to clipboard!");
    })
    .catch(err => {
      console.error('Failed to copy daily plan:', err);
      triggerToast("Failed to copy daily plan.");
    });
}
