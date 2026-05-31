# FutureMe

FutureMe is an AI-powered personal reflection experience. Users enter details about their current life, goals, struggles, habits, and future vision. The app connects to the Gemini API via a secure backend to generate an emotional, actionable, and personal message from their future self, alongside custom next moves, habits, warnings, and mantras. It also includes an interactive real-time chat interface to talk directly to their future self under different selected personality tones.

---

## Technical Stack
- **Frontend**: Premium HTML5, CSS3 (Vanilla Glassmorphic design), and Javascript.
- **Backend**: Node.js, Express, Cors, Dotenv.
- **AI Engine**: Google Gemini API (`@google/generative-ai` SDK using `gemini-1.5-flash`).

---

## Directory Structure
```text
futureme/                     # Workspace root
  ├── frontend/               # Glassmorphic Apple-style Frontend
  │     ├── index.html        # Main layouts (Form, Loading, Result, Chat)
  │     ├── style.css         # Customized animations and variables
  │     └── script.js         # State and fetch controllers
  ├── backend/                # Express & Gemini API Server
  │     ├── server.js         # API Routes and Static serving setup
  │     ├── package.json      # Node scripts and dependencies
  │     └── .env.example      # Example environment config
  └── README.md               # Setup and usage guide
```

---

## Setup & Running the Product

### 1. Install Dependencies
Navigate into the backend directory and install the required modules:
```bash
cd backend
npm install
```

### 2. Configure Gemini API Key
Create a `.env` file in the `backend/` directory (you can copy `.env.example` as a starting point) and add your Google Gemini API key:
```bash
cp .env.example .env
```
Open the `.env` file and insert your API Key:
```text
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
```

### 3. Start the Server
Run the backend server in development mode (which automatically restarts on code changes using `nodemon`):
```bash
npm run dev
```
Alternatively, for production mode:
```bash
npm start
```

### 4. Access the Product
Once the server starts:
1. Open your browser and navigate to **`http://localhost:5000`** to view the app directly.
2. The Express server serves the static frontend files automatically. You can also open the `frontend/index.html` file directly in a browser or via a static dev server if needed, since CORS is fully configured.

---

## API Routes Documentation

### 1. POST `/api/generate-futureme`
Generates the initial timeline message and action points.

**Request Body Format:**
```json
{
  "name": "Robert",
  "age": "23",
  "goal": "Build a successful AI startup",
  "struggle": "Lack of consistency",
  "oneYearVision": "Running a profitable AI company",
  "tone": "Brutally Honest"
}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "message": "A powerful 120-180 word message from the future self...",
    "futureIdentity": "The Visionary Founder",
    "nextMoves": [
      "Wake up at 5 AM and commit to coding 3 hours without distractions.",
      "Launch the landing page of the AI product by Thursday night.",
      "Conduct 5 customer validation interviews to refine the value proposition."
    ],
    "habit": "Write down your daily main task and don't sleep until it is 100% done.",
    "warning": "Do not get distracted by chasing multiple business models simultaneously.",
    "mantra": "Discipline is the bridge between goals and accomplishments."
  }
}
```

### 2. POST `/api/chat-futureme`
Maintains an interactive discussion with FutureMe.

**Request Body Format:**
```json
{
  "userProfile": {
    "name": "Robert",
    "age": "23",
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  },
  "chatHistory": [
    {
      "role": "futureme",
      "message": "Listen, Robert. We don't have time to beat around the bush..."
    },
    {
      "role": "user",
      "message": "Will I actually make it?"
    }
  ],
  "question": "What should I focus on this week?"
}
```

**Response Format:**
```json
{
  "success": true,
  "reply": "Focus on shipping the MVP. Your biggest issue is overthinking the details. Design the UI, code the primary handler, and show it to three prospects. Nothing else matters this week. Execution builds confidence."
}
```
