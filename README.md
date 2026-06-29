# CrashGuard — Frontend

> React dashboard for startup financial crash prediction — built with Vite, React Router, and Recharts.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Pages and Routes](#pages-and-routes)
- [Authentication Flow](#authentication-flow)
- [Admin Panel](#admin-panel)
- [Environment Setup](#environment-setup)
- [Deployment](#deployment)

---

## Overview

CrashGuard's frontend is a multi-page React application that connects to the FastAPI backend. It provides:

- **User registration** with email OTP verification
- **Secure login** with JWT access and refresh tokens
- **Business onboarding** with company profile setup
- **Analysis dashboard** — manual data entry or CSV upload
- **Interactive charts** — revenue vs expenses, burn rate, churn trend, risk radar
- **Analysis history** — all past reports saved and expandable
- **Forgot password** and **change password** flows
- **Separate admin panel** with its own login, user management, and platform stats

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | React Icons |
| Styling | Plain CSS with CSS variables |
| Fonts | Syne (display) + DM Sans (body) + DM Mono |

---

## Project Structure

```
crashguard-frontend/
│
├── index.html                         # Root HTML with Google Fonts
├── vite.config.js                     # Vite config with API proxy
├── package.json
│
└── src/
    ├── main.jsx                       # React entry point
    ├── App.jsx                        # Router setup — all routes defined here
    │
    ├── context/
    │   └── AuthContext.jsx            # Global auth state + user + admin API instances
    │
    ├── components/
    │   ├── ProtectedRoute.jsx         # Route guards (4 types)
    │   └── Toast.jsx                  # Global toast notification system
    │
    ├── styles/
    │   └── globals.css                # Design system — CSS variables, animations, base styles
    │
    └── pages/
        ├── Login.jsx / Login.css              # User sign in + forgot password link
        ├── Register.jsx / Register.css        # 2-step register → OTP verify
        ├── ForgotPassword.jsx                 # 3-step forgot password flow
        ├── Onboarding.jsx / Onboarding.css    # Business profile setup
        ├── DashboardLayout.jsx / Dashboard.css # Sidebar layout wrapper
        ├── Overview.jsx / Overview.css         # Home — gauge, scores, metrics
        ├── Analyze.jsx / Analyze.css           # Run analysis + charts
        ├── History.jsx / History.css           # Past analyses accordion
        ├── Profile.jsx / Profile.css           # Account + password + business profile
        ├── AdminLogin.jsx / AdminLogin.css     # Separate admin login
        └── Admin.jsx / Admin.css               # Admin panel — users, stats, analyses
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- The CrashGuard backend running (locally or deployed)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/crashguard-frontend.git
cd crashguard-frontend

# 2. Install dependencies
npm install

# 3. Configure the API proxy (see Environment Setup below)

# 4. Start the development server
npm run dev
```

The app will be running at `http://localhost:5173`

---

## Pages and Routes

| Route | Page | Access |
|---|---|---|
| `/login` | Login | Public only |
| `/register` | Register + OTP verify | Public only |
| `/forgot-password` | Forgot password flow | Public only |
| `/onboarding` | Business profile setup | Logged in + not onboarded |
| `/dashboard` | Overview with risk gauge | Logged in |
| `/dashboard/analyze` | Run analysis + charts | Logged in |
| `/dashboard/history` | Analysis history | Logged in |
| `/dashboard/profile` | Profile + password | Logged in |
| `/admin/login` | Admin sign in | Public |
| `/admin/dashboard` | Admin panel | Admin JWT only |

---

## Authentication Flow

### Registration

```
User fills form → POST /auth/register
→ Backend creates account + sends OTP email
→ User enters 6-digit OTP
→ POST /auth/verify-otp
→ Email verified → auto login → /onboarding
```

### Login

```
User enters email + password → POST /auth/login
→ Receives access_token + refresh_token
→ Stored in localStorage
→ Every API request sends Authorization: Bearer <access_token>
→ On 401, auto-refresh using refresh_token
→ On refresh failure, redirect to /login
```

### Forgot Password

```
Enter email → POST /auth/forgot-password → OTP sent
→ Enter OTP (6 digits)
→ Enter new password → POST /auth/reset-password
→ All sessions revoked → redirect to /login
```

### Change Password (logged in)

```
Profile page → enter current password + new password
→ POST /auth/change-password
→ All sessions revoked → redirect to /login
```

---

## Route Guards

Four types of route protection are defined in `ProtectedRoute.jsx`:

| Guard | Used for | Behaviour |
|---|---|---|
| `ProtectedRoute` | Dashboard pages | Redirects to `/login` if not logged in |
| `OnboardingRoute` | `/onboarding` | Redirects to `/register` if not logged in. Redirects to `/dashboard` if already onboarded |
| `PublicRoute` | Login, Register, Forgot Password | Redirects to `/dashboard` if already logged in |
| `AdminRoute` | `/admin/dashboard` | Redirects to `/admin/login` if no admin token in localStorage |

---

## Admin Panel

The admin panel is **completely separate** from the user dashboard:

- Lives at `/admin/login` and `/admin/dashboard`
- Uses a different token (`admin_token`) stored separately in localStorage
- Uses a separate `adminAPI` axios instance that reads `admin_token`
- Has its own header bar and logout — fully independent of user auth
- Regular users have no way to access the admin panel
- Automatically redirects to `/admin/login` if admin token is missing or expired

### Admin features
- Platform stats — total users, verified, total analyses, high risk count
- Search users by name, email, or company
- Expand any user to see their business profile and analysis history
- Mini revenue vs expenses chart per user from their latest analysis
- Delete user and all associated data

---

## Environment Setup

The frontend talks to the backend via a **Vite proxy** — all `/api` requests are forwarded to the backend URL.

In `vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',   // Change this to your deployed backend URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

**For local development** — target is `http://127.0.0.1:8000`

**For production** — change target to your deployed backend URL:
```js
target: 'https://crashguard-backend.onrender.com'
```

---

## Design System

All design tokens are defined as CSS variables in `src/styles/globals.css`:

```css
--obsidian: #080b12;        /* Main background */
--surface: #161d2b;         /* Card background */
--acid: #00ff87;            /* Primary accent — green */
--ember: #ff4d4d;           /* Danger — red */
--amber: #f59e0b;           /* Warning — yellow */
--blue: #3b82f6;            /* Info — blue */
--text-1: #f0f4ff;          /* Primary text */
--text-2: #9ba8c0;          /* Secondary text */
--text-3: #5a6882;          /* Muted text */
```

**Fonts:**
- `Syne` — headings and labels (bold, geometric)
- `DM Sans` — body text (clean, readable)
- `DM Mono` — numbers, codes, badges

---

## Key Components

### AuthContext
Global context that provides:
- `user` — current logged-in user object
- `login(email, password)` — logs in and sets user
- `logout()` — revokes token and clears state
- `updateUser(data)` — updates user in context after profile changes
- `API` — axios instance for user requests (auto-attaches token)
- `adminAPI` — separate axios instance for admin requests

### Toast
Global notification system. Use anywhere with:
```jsx
const toast = useToast();
toast('Message here', 'success'); // success | error | info
```

### Charts (in Analyze.jsx)
Four charts rendered after every analysis:
- **Area chart** — Revenue vs Expenses over time
- **Bar chart** — Profit/Loss per month (green = profit, red = loss)
- **Line chart** — Customer churn rate trend
- **Radar chart** — Risk breakdown across all four signals

---

## Deployment on Vercel

1. Push code to GitHub
2. Go to **vercel.com** → New Project → Import your repo
3. Vercel auto-detects Vite — no configuration needed
4. Add one environment variable if needed (usually the proxy handles it)
5. Click Deploy

After deploying, update `vite.config.js` or set the backend URL in your Vercel project settings, then update `FRONTEND_URL` in your backend environment variables to your Vercel URL.

> **Note:** The Vite proxy only works in development. For production builds on Vercel, API calls go directly to the backend URL. Update `axios.create({ baseURL: '...' })` in `AuthContext.jsx` to your full backend URL for production, or use Vercel's environment variables.

---

## Available Scripts

```bash
npm run dev       # Start development server at localhost:5173
npm run build     # Build for production (output in /dist)
npm run preview   # Preview production build locally
```

---

## License

This project was built as a final year academic project.
