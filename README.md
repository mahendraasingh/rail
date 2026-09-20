# RailTogether 🚆 — Voluntary Railway Seat-Splitting Coordinator

> **Hackathon Edition MVP**: Assistive voluntary seat-exchange coordinator helping families, groups, and senior citizens travelling on Indian Railways sit together.

---

## 1. Project Overview

**RailTogether** is an assistive full-stack web application designed to solve the common problem of railway seat splitting. When families, elderly companions, or group travelers book train tickets together, the railway reservation system often assigns seats in different bays or coaches due to algorithmic auto-allocation. 

RailTogether detects these separations within a coach, calculates physical compartment distances, and intelligently recommends mutually beneficial, voluntary seat exchanges with fellow passengers.

### ⚠️ Assistive Coordination Disclaimer
* RailTogether is **strictly an assistive, consent-based coordination tool**.
* It **does not connect to or scrape private railway/IRCTC systems**.
* It **does not automatically alter or modify official railway PNR reservations**.
* Every seat exchange requires **explicit, mutual human confirmation** between both passengers before updating the journey plan state within the app.

---

## 2. Problem Statement

When a family books tickets together:
- **Mahendra (Self)**: Assigned **B2-31** (Upper Berth, Bay 4)
- **Father (Rajesh)**: Assigned **B2-32** (Side Upper, Bay 4)
- **Mother (Sunita)**: Assigned **B2-57** (Lower Berth, Bay 8)
- **Sister (Pooja)**: Assigned **B2-58** (Middle Berth, Bay 8)

The family is split across 4 compartment bays. Mother (a senior citizen requiring a lower berth) is separated from her family base in Bay 4.

**Solution**: RailTogether identifies the split and finds solo passenger **Rahul Sharma** seated in **B2-45** (Lower Berth, Bay 6). It calculates a **91/100 Compatibility Score**, allows the family to send a voluntary request, enables Rahul to accept or decline, and upon mutual consent, updates the journey seating arrangement.

---

## 3. Key Features

- **Coach Bay Split Detection**: Calculates physical coach distances and detects when group members are separated across different compartment bays.
- **Deterministic Transparent Matching**: Evaluates compatibility based on coach, berth type, distance reduction, solo passenger status, and passenger preferences.
- **Explainable Recommendations ("Why this match?")**: Every recommendation clearly lists why it was generated (e.g., *Same coach*, *Compatible lower berth*, *Reduces group walking distance*).
- **Interactive Coach Seat Map**: Visual 72-berth 3AC/Sleeper coach representation with color-coded markers (Group member, separated member, swap candidate, other passenger).
- **Consent-Driven Exchange Flow**: Requester initiates voluntary request -> Target passenger reviews and accepts/rejects -> Seats dynamically rearrange in the application state.
- **1-Click Hackathon Demo Mode**: Pre-loaded with 12011 Shatabdi Express scenario to test the full 15-step demo flow instantly.
- **Plug-and-Play Synthetic Dataset Architecture**: Dedicated dataset service supporting future CSV/JSON uploads in `server/dataset/uploads/` with resilient fallback.

---

## 4. Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB with Mongoose ODM (includes in-memory fallback for environments without active MongoDB).
- **Authentication**: JWT-based auth with demo bypass mode.

---

## 5. Folder Structure

```text
rail-together/
├── client/                      # React Frontend (Vite)
│   ├── public/
│   │   └── train-logo.svg
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, SeatMap, MatchCard, SwapRequestCard, etc.
│   │   ├── pages/               # Landing, Login, Register, Dashboard, CreateJourney, JourneyDetails, etc.
│   │   ├── services/            # Axios API wrappers (auth, journey, passenger, swap)
│   │   ├── context/             # AuthContext
│   │   ├── hooks/               # useAuth hook
│   │   ├── utils/               # seatUtils, formatters, constants
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Express Backend
│   ├── config/                  # MongoDB connection (db.js)
│   ├── controllers/             # authController, journeyController, passengerController, swapController
│   ├── models/                  # User, Journey, Passenger, SwapRequest (Mongoose)
│   ├── routes/                  # authRoutes, journeyRoutes, passengerRoutes, swapRoutes, datasetRoutes
│   ├── services/                # matchingService, seatService, datasetService
│   ├── middleware/              # authMiddleware, errorMiddleware
│   ├── utils/                   # matchingUtils, seatUtils
│   ├── dataset/
│   │   ├── README.md            # Dataset specifications
│   │   └── uploads/             # Place synthetic CSV / JSON datasets here
│   │       └── .gitkeep
│   ├── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
├── package.json                 # Root orchestrator scripts
└── README.md
```

---

## 6. Installation & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- Optional: MongoDB running on `mongodb://127.0.0.1:27017` (If MongoDB is not running, the backend automatically uses its resilient In-Memory store for all operations).

### Step 1: Clone or Navigate to Directory
```bash
cd rail
```

### Step 2: Install All Dependencies
You can install all root, backend, and frontend dependencies with one command:
```bash
npm run install:all
```
Or install individually:
```bash
# In server directory:
cd server
npm install

# In client directory:
cd ../client
npm install
```

---

## 7. Environment Variables

Create `.env` inside `server/` (or copy `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/railtogether
JWT_SECRET=railtogether_hackathon_super_secure_jwt_secret_key_2026
CLIENT_URL=http://localhost:5173
```

---

## 8. Running the Application

### Option A: Run Both Client & Server Concurrently (Root)
```bash
npm run dev
```

### Option B: Run Individually in Separate Terminals

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
# Starts backend on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Starts Vite dev server on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 9. Synthetic Dataset Folder & Integration

- **Upload Folder**: `server/dataset/uploads/`
- **Current State**: Empty (contains only `.gitkeep`).
- **How It Works**: `server/services/datasetService.js` detects files placed in `server/dataset/uploads/` dynamically.
- **Graceful Fallback**: If no dataset file is present, the app returns:
  > *"No dataset uploaded. Please upload a synthetic railway dataset."*
  and runs smoothly using manual entries or 1-click demo data.
- **Supported Formats**: `.json` and `.csv` containing journey and passenger entity records.

---

## 10. Matching Algorithm & Scoring Logic

The matching engine (`server/services/matchingService.js`) uses a deterministic, explainable scoring formula (Max: 100 points):

| Factor | Max Points | Explanation |
| :--- | :--- | :--- |
| **Same Coach** | **+30** | Both passengers are in the same coach (e.g. Coach B2). |
| **Berth Type Match** | **+20** | Exact matching berth type (e.g., Lower to Lower) or compatible comfort category. |
| **Proximity Improvement** | **+30** | Relocates the separated passenger closer to or directly into the group's main bay. |
| **Solo Traveller Status** | **+10** | Target passenger has no group conflicts and can voluntarily exchange. |
| **Special Compatibility** | **+10** | Preferential allocation (e.g., senior citizen needing lower berth). |

---

## 11. Complete Hackathon Demo Walkthrough (15-Step Flow)

1. Open the landing page (`http://localhost:5173`).
2. Click **"Explore Demo (1-Click)"** on the Hero section or **"Try Demo"** on the Navbar.
3. The demo journey (PNR `8493027156`, Train `12011 Shatabdi Express`, Coach `B2`) loads.
4. The **Dashboard** and **Journey Details** show 4 family members with status: **"Group Split Detected"** (Members in Bay 4 and Bay 8).
5. Open the **Interactive Seat Map** (`/journey/:id/seats`) to see the color-coded 72-berth layout with separated members highlighted in red and swap opportunities in yellow.
6. Click **"Find Exchange Opportunities"** (`/journey/:id/recommendations`).
7. View recommendation cards: **Mother (B2-57) ↕ Rahul Sharma (B2-45)** with a **91/100 Compatibility Score** and detailed checklist of reasons.
8. Click **"Request Exchange"** -> Review the voluntary consent modal -> Click **"Send Request"**.
9. Status updates to **PENDING**.
10. Navigate to **Exchange Requests** (`/swaps`).
11. View the incoming request as the target passenger and click **"Accept Exchange"**.
12. System confirms: **"Exchange Confirmed"**.
13. Seating records dynamically rearrange in application state: Mother moves to B2-45 (Bay 6, closer to family), and Rahul takes B2-57.
14. The official assistive disclaimer is clearly presented across all steps.

---

## 12. API Reference Summary

### Authentication
- `POST /api/auth/register` — Register a new passenger
- `POST /api/auth/login` — Login passenger
- `GET /api/auth/me` — Current profile

### Journeys
- `GET /api/journeys` — List journeys
- `POST /api/journeys` — Create journey with passengers
- `GET /api/journeys/:id` — Get journey with split analysis
- `GET /api/journeys/:id/seatmap` — Generate coach layout

### Matching & Swaps
- `GET /api/journeys/:journeyId/matches` — Compute recommendations
- `POST /api/swaps` — Initiate voluntary swap request
- `GET /api/swaps/received` — List incoming swap requests
- `GET /api/swaps/sent` — List outgoing swap requests
- `POST /api/swaps/:id/accept` — Confirm and rearrange seats
- `POST /api/swaps/:id/reject` — Decline swap request
- `POST /api/swaps/:id/cancel` — Cancel sent request
- `GET /api/swaps/notifications` — Journey and swap alerts

### Synthetic Dataset
- `GET /api/dataset/status` — Inspect `uploads/` folder status
- `POST /api/dataset/load` — Parse and load synthetic dataset

---

## 13. Future Roadmap

- Real-time WebSocket notifications for instant passenger messaging.
- QR-code in-coach mutual verification handshake.
- Support for AC 2-Tier (2AC), AC First Class (1AC), and Chair Car (CC) layout configurations.
- Optional train-ticket PNR OCR parser (client-side simulation).
- Integration with official railway APIs when public voluntary swap endpoints become available.
