# SmartHire - Placement Preparation & Interview Management Portal

SmartHire is a full-stack web platform designed to streamline student placement preparation, testing, and performance analytics. It offers modular systems for aptitude test taking, coding practice inside Monaco Editor, and predictive analytics regarding placement readiness.

---

## Technical Architecture

SmartHire utilizes a decoupled, monorepo architecture structure:

```
                  ┌───────────────────────┐
                  │   Vite + React.js     │
                  │   (Frontend UI)       │
                  └───────────┬───────────┘
                              │
                              │ REST API Requests
                              ▼
                  ┌───────────────────────┐
                  │   Node.js + Express   │
                  │   (Main Backend API)  │
                  └─────┬───────────▲─────┘
                        │           │
     Read/Write Queries │           │ JSON payload analytics
                        ▼           ▼
                 ┌──────────┐  ┌───────────────────────┐
                 │ MongoDB  │  │   Python FastAPI      │
                 │ Database │  │   (Analytics Service) │
                 └──────────┘  └───────────────────────┘
```

- **Frontend (`client/`)**: Single Page Application built with React, Vite, and Tailwind CSS. State management uses React Context, styling incorporates glassmorphic cards and dynamic transitions, and performance charting integrates Recharts.
- **Backend (`server/`)**: Express REST API following MVC patterns. Connects to MongoDB via Mongoose, evaluates quiz scoring on-the-fly to prevent frontend cheats, and manages authentication using cryptographically signed JSON Web Tokens.
- **Analytics Service (`analytics/`)**: Lightweight Python service utilizing FastAPI and Pandas. Takes student test histories to compute a weighted placement readiness score and generates improvement recommendations.

---

## Core Features

- **JWT Authentication**: Secure user registration and login workflows with custom password salting/hashing and role verification.
- **Role-Based Routing**: Restricts administrative controls (question pool management, test template builders) to admins and dashboard operations to students.
- **Aptitude Testing System**: Features an interactive MCQ examination interface with running timer, quiz progress indicators, auto-save local recovery (if browser is refreshed), and auto-submission on timeout.
- **Results & Recharts Visualizations**: Aggregates scoring details immediately, computing accuracy categories and generating responsive Area and Bar charts showing student progression.
- **Python-Based Placement Analytics**: Microservice analyzing category averages to discover weaknesses and predict placement readiness percentage.
- **Monaco Coding Editor**: In-browser workspace supporting multi-language syntax formatting (JavaScript and Python) with automated test case evaluation.

---

## Directory Schema

```
smartHire/
├── client/                 # React.js SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/     # Reusable UI elements (ProtectedRoute, etc.)
│   │   ├── context/        # Auth Context provider
│   │   ├── layouts/        # Dashboard layout with theme switchers
│   │   ├── pages/          # Login, Register, Dashboards, Testing, Coding, Results
│   │   └── services/       # Axios API layer configurations
│
├── server/                 # Express backend REST service
│   ├── config/             # Mongoose MongoDB connectivity config
│   ├── controllers/        # Controllers handling User, Question, Test, and Results
│   ├── middlewares/        # Express error, authentication, and role authorization helpers
│   ├── models/             # Mongoose Schemas (User, Question, Test, Result)
│   └── routes/             # Route configurations mapping endpoints
│
└── analytics/              # Python FastAPI analytics service
    ├── app/
    │   ├── main.py         # App entry and API paths
    │   └── analyzer.py     # Pandas analysis and scoring logic
    └── requirements.txt    # Python package lists
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB running locally on `mongodb://localhost:27017`

### Step 1: Clone and Set Up Main Server
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Create a `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/smarthire
   JWT_SECRET=smarthire_jwt_secret_key_987654321
   PYTHON_SERVICE_URL=http://127.0.0.1:8000
   ```
3. Install dependencies and start server:
   ```bash
   npm install
   npm run dev
   ```

### Step 2: Set Up React Frontend
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (proxies API requests to port 5000):
   ```bash
   npm run dev
   ```

### Step 3: Start Python Analytics Service
1. Navigate to the analytics folder:
   ```bash
   cd ../analytics
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Authenticate user session
- `GET /api/auth/profile` - Fetch profile (auth required)

### Question Bank (Admin Protected)
- `GET /api/questions` - Query questions (supports search, category, page)
- `POST /api/questions` - Add new question
- `PUT /api/questions/:id` - Edit question details
- `DELETE /api/questions/:id` - Delete question

### Tests & Assessments
- `GET /api/tests` - List available quizzes
- `GET /api/tests/:id` - Fetch test (omits correct answers for student roles)
- `POST /api/tests` - Admin bundles test templates

### Results & Python Analytics
- `POST /api/results/submit` - Evaluates test submission
- `GET /api/results/my` - Fetch test logs for current student
- `GET /api/results/leaderboard` - Ranks top students
- `GET /api/results/analytics` - Pulls Python performance readiness reports
- `GET /api/results/stats` - Overall platform metrics (Admin only)
