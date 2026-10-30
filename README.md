# Intelligent Helpdesk Ticketing System with Automated Root Cause Category Mapping

An enterprise-grade, full-stack AI-powered helpdesk web application. The platform automatically analyzes incoming support ticket descriptions using a Machine Learning Natural Language Processing (NLP) pipeline to predict root-cause categories, assign confidence scores, and streamline engineer troubleshooting workflows.

---

## 🎨 Design Philosophy & Color Palette

Designed with a clean, professional aesthetic:
- **Pastel Purple (`#7C5CFC`)**: Primary brand identity, buttons, active indicators, and AI highlights.
- **Icy Blue (`#0284C7` / `#E0F2FE` / `#38BDF8`)**: Secondary accents, background cards, and status tags.
- **Crisp White (`#FFFFFF`)**: High-contrast, clean elevated cards with rounded corners (`12px` – `20px`) and subtle drop shadows.
- **Slate Slate (`#F8FAFC`)**: Page background that reduces eye strain while maintaining a bright appearance.

---

## 🏗️ Architecture & Technology Stack

```
   ┌────────────────────────────────────────────────────────────┐
   │                  React.js + Vite Frontend                  │
   │           (Pastel Purple / Icy Blue Dashboard UI)          │
   └─────────────────────────────┬──────────────────────────────┘
                                 │ REST API (JSON / JWT)
                                 ▼
   ┌────────────────────────────────────────────────────────────┐
   │                   Node.js & Express API                    │
   │          (Auth, RBAC, Ticket Lifecycle, Analytics)         │
   └─────────────────┬───────────────────────────┬──────────────┘
                     │                           │
    Internal REST API│                           │ Mongoose ODM
                     ▼                           ▼
   ┌──────────────────────────────────┐ ┌───────────────────────┐
   │   Python ML Flask Microservice   │ │     MongoDB Atlas     │
   │  - Scikit-Learn (MultinomialNB)  │ │      (or Local DB)    │
   │  - TF-IDF Vectorizer             │ │  - Users & Tickets    │
   │  - Root Cause Confidence Scoring │ │  - Audit Logs & Notes │
   └──────────────────────────────────┘ └───────────────────────┘
```

- **Frontend**: React 18, Vite, Lucide Icons, Modern responsive CSS.
- **Backend API**: Node.js, Express.js, JWT Authentication, Bcrypt password hashing, Mongoose ODM.
- **Database**: MongoDB Atlas (or local MongoDB).
- **Machine Learning**: Python 3.12, Scikit-Learn, Pandas, NumPy, TF-IDF Feature Extraction, Multinomial Naive Bayes classifier.

---

## 👥 User Roles & Ready-to-Test Demo Accounts

The application includes 3 pre-configured demo user accounts accessible via **1-Click Demo Switcher buttons** directly in the top navigation bar and login modal:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@helpdesk.com` | `password123` | Submit tickets, preview real-time AI root cause mapping, view personal ticket history, track status and assigned engineers, chat with support. |
| **Support Engineer** | `engineer@helpdesk.com` | `password123` | View assigned & unassigned queue, update status (`Open`, `In Progress`, `Resolved`, `Closed`), record diagnostic notes, re-classify root cause with AI. |
| **Administrator** | `admin@helpdesk.com` | `admin123` | Global KPIs, live Category Distribution charts, assign tickets to engineers, manage user roles (Customer ↔ Engineer ↔ Admin), view Scikit-Learn AI evaluation metrics. |

---

## 🤖 AI Root-Cause Category Mapping Pipeline

When a ticket is created, the system maps the text into one of 7 root-cause categories:
1. **Network Issues** (VPN, WiFi, DNS, firewall, packet loss, bandwidth)
2. **Hardware Issues** (Laptop screens, keyboards, docking stations, printers, batteries)
3. **Software Issues** (Application crashes, Excel freezes, DLL errors, exceptions)
4. **Login and Authentication** (Password resets, MFA/2FA tokens, SSO Okta loops, account lockouts)
5. **Database Issues** (SQL deadlocks, pool exhaustion, slow queries, replica lag)
6. **Email and Communication** (Outlook sync, Exchange queues, bounce code 550, Slack/Teams)
7. **Other / Unknown** (General office inquiries, low-confidence or ambiguous submissions)

### Scientific Evaluation (Held-Out Test Set):
- **Model**: TF-IDF (Unigrams, English stop words removed) + Multinomial Naive Bayes Classifier
- **Overall Accuracy**: **67.86%**
- **Weighted Precision**: **0.7350**
- **Weighted Recall**: **0.6786**
- **Weighted F1-Score**: **0.6828**
- **Dataset**: 140 curated, balanced samples across all 7 categories (112 training / 28 held-out test).

---

## 🚀 How to Run the Application

The project consists of three services that can be started concurrently:

### Prerequisites:
- Node.js (v18+)
- Python (v3.10+)
- MongoDB (Atlas account or local instance)

---

### Step 1: Start the Python ML Microservice (Port 5001)

```bash
cd ml-service

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Re-train and evaluate model
python train_model.py

# Start Flask Microservice
python app.py
```
*Microservice will run at `http://127.0.0.1:5001`.*

---

### Step 2: Start the Node.js Express Backend (Port 5000)

```bash
cd server

# Install dependencies
npm install

# Configure environment variables in server/.env
# PORT=5000
# MONGODB_URI=mongodb://127.0.0.1:27017/helpdesk_db
# JWT_SECRET=helpdesk_jwt_secret_dev_key_2026_secure
# ML_SERVICE_URL=http://127.0.0.1:5001

# Start backend server
npm start
```
*Backend API will run at `http://localhost:5000`.*

---

### Step 3: Start the React Frontend (Port 3000)

```bash
cd client

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Open your browser and navigate to `http://localhost:3000`.*

---

## 🧪 Running Automated Tests

Run the full end-to-end integration and security test suite:

```bash
# In the project root directory
node tests/test_suite.js
```

### What the test suite verifies:
- ✅ ML Microservice health check and probability generation.
- ✅ Machine Learning classification accuracy across multiple categories.
- ✅ Customer, Support Engineer, and Administrator JWT authentication.
- ✅ Automated ticket creation and Root Cause mapping persistence in MongoDB.
- ✅ Role-Based Access Control (RBAC): verifies that Customer cannot access Admin stats, user management, or modify other users' tickets (returns HTTP 403 Forbidden).
- ✅ Support Engineer ticket assignment, status progression, and resolution notes recording.
- ✅ Administrator real-time analytics aggregation.

---

## 🌐 Connecting to MongoDB Atlas (Cloud Database)

To connect your project to a free cloud MongoDB Atlas cluster:
1. Sign up for free at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free **M0 Sandbox Cluster**.
3. Under **Database Access**, create a user (e.g. `helpdesk_user`) with a secure password.
4. Under **Network Access**, add IP Address `0.0.0.0/0` (Allow access from anywhere for development).
5. Click **Connect** > **Drivers** > Copy your connection string.
6. Paste the connection string into `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://helpdesk_user:YourPassword@cluster0.mongodb.net/helpdesk_db?retryWrites=true&w=majority
   ```
7. Restart the backend server. The backend will automatically connect to Atlas!

---

## 📂 Project Directory Structure

```
intelligent-helpdesk-system/
├── client/                     # React.js frontend with Vite
│   ├── src/
│   │   ├── components/         # Dashboard, Modals, Navbar, AI widgets
│   │   ├── services/api.js     # REST API client integration
│   │   ├── index.css           # Pastel purple & icy blue custom styles
│   │   ├── App.jsx             # Role-based dashboard router
│   │   └── main.jsx            # React root
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js & Express REST API
│   ├── src/
│   │   ├── config/db.js        # MongoDB connection configuration
│   │   ├── controllers/        # Auth, Ticket, Stats, and User handlers
│   │   ├── middleware/auth.js  # JWT and RBAC protection middleware
│   │   ├── models/             # Mongoose User & Ticket schemas
│   │   ├── routes/             # REST API endpoint definitions
│   │   ├── services/aiService.js # Integration with Python ML microservice
│   │   └── server.js           # Express app entrypoint & demo seeder
│   ├── .env                    # Environment variables
│   ├── .env.example
│   └── package.json
│
├── ml-service/                 # Machine Learning classification service
│   ├── dataset/                # Labeled ticket training dataset CSV
│   ├── model/                  # Serialized classifier, vectorizer & metrics
│   ├── app.py                  # Flask REST API (/predict, /health, /metrics)
│   ├── train_model.py          # TF-IDF & MultinomialNB training pipeline
│   └── requirements.txt        # Python package requirements
│
├── tests/                      # Automated end-to-end integration tests
│   └── test_suite.js           # 25 automated assertion tests
│
└── README.md                   # Complete documentation
```
