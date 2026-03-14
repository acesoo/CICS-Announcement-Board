# CICS Announcement Board

> **Official Document Repository for the College of Information and Computing Sciences**
> New Era University — Quezon City, Philippines

A full-stack web application that serves as the central hub for CICS documents, announcements, forms, and guidelines. Built with React and Firebase, it provides a personalized experience for students and full management capabilities for administrators.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Firestore Data Schema](#firestore-data-schema)
- [Security Rules](#security-rules)
- [Deployment](#deployment)
- [User Roles](#user-roles)
- [Pages & Routes](#pages--routes)
- [How Document Sharing Works](#how-document-sharing-works)
- [Future Improvements](#future-improvements)

---

## Overview

The CICS Announcement Board is an internal web platform restricted exclusively to `@neu.edu.ph` Google accounts. It replaces scattered document sharing with a centralized, secure, and searchable repository.

Students get a personalized dashboard showing documents relevant to their program (CS, IT, IS, or EMC). Administrators have full control over documents, user access, and can view a complete audit trail of all activity on the platform.

---

## Features

### Student
| Feature | Description |
|---|---|
| Google Sign-In | Restricted to `@neu.edu.ph` accounts only |
| Personalized Dashboard | Shows documents relevant to the student's assigned program |
| Recently Viewed | Quick access to the last 4 documents opened |
| Live Clock & Calendar | Real-time clock and mini calendar on the dashboard |
| Document Library | Full searchable library with filters by program, category, and year |
| Download & Open | One-click download or open documents via Google Drive |
| Category Chips | Filter dashboard by Announcement, Form, Guideline, or Memo |

### Admin
| Feature | Description |
|---|---|
| Admin Dashboard | Real-time stats — logins, downloads, documents, unique users |
| Activity Charts | Line graph of login and download activity over a selected period |
| Period of Inquiry | Toggle between Daily, Weekly, Monthly, or custom date range |
| Upload Documents | Add documents via Google Drive link with full metadata tagging |
| Hide / Show Documents | Toggle document visibility without deleting |
| Delete Documents | Permanently remove documents with a confirmation modal |
| Access Control | Manage all registered accounts — assign programs, block/unblock users |
| Whitelist System | Only registered accounts can log in; new logins are auto-detected |
| Audit History | Full log of all logins, downloads, and views with filters |
| Block with Reason | Block accounts with a reason stored for audit purposes |

### General
- Mobile-first responsive design — works on all screen sizes
- Sidebar navigation on desktop, bottom nav on mobile
- NEU branding — official logo, Quezon City location
- Domain-restricted login with clear error messages for unregistered accounts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS with CSS variables |
| Authentication | Firebase Auth — Google OAuth |
| Database | Cloud Firestore |
| File Hosting | Google Drive (linked via shareable URLs) |
| Charts | Chart.js + react-chartjs-2 |
| Date Picker | react-datepicker |
| Hosting | Firebase Hosting |

---

## Project Structure

```
cics-announcement-board/
├── public/
│   └── index.html
├── src/
│   ├── assets/
│   │   └── neu-logo.png              # Official NEU seal
│   ├── components/
│   │   ├── AppShell.jsx              # Sidebar + mobile nav layout
│   │   ├── AppShell.css
│   │   ├── DocumentCard.jsx          # Reusable doc card (student + admin views)
│   │   ├── DocumentCard.css
│   │   └── ProtectedRoute.jsx        # Route guard — auth, role, blocked check
│   ├── lib/
│   │   ├── firebase.js               # Firebase init + all Firestore helpers
│   │   └── AuthContext.jsx           # Global auth state via React Context
│   ├── pages/
│   │   ├── LoginPage.jsx             # Google Sign-In with domain + whitelist check
│   │   ├── OnboardingPage.jsx        # Auto-setup screen after first login
│   │   ├── StudentDashboard.jsx      # Student home — announcements + calendar
│   │   ├── AdminDashboard.jsx        # Admin home — stats, chart, trending docs
│   │   ├── LibraryPage.jsx           # Full document library with filters
│   │   ├── UploadPage.jsx            # Upload via Google Drive link + metadata
│   │   ├── WhitelistPage.jsx         # Access Control — manage accounts
│   │   ├── AuditPage.jsx             # Audit History — all events log
│   │   └── BlockedPage.jsx           # Shown to blocked/revoked accounts
│   ├── styles/
│   │   └── globals.css               # CSS variables, base styles, shared components
│   ├── App.jsx                       # Router + all route definitions
│   └── index.js                      # React entry point
├── firestore.rules                   # Firestore security rules
├── firestore.indexes.json            # Composite index definitions
├── storage.rules                     # Firebase Storage security rules
├── firebase.json                     # Firebase hosting config
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher
- A Firebase project (see [Firebase Setup](#firebase-setup))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cics-announcement-board.git
cd cics-announcement-board

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Fill in your Firebase credentials in .env

# Start the development server
npm start
```

The app runs at [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create a `.env` file in the root directory. **Never commit this file — it contains your API keys.**

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX
```

Then update `src/lib/firebase.js` to use environment variables:

```js
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};
```

---

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `cics-announcement-board`
3. Enable Google Analytics (recommended)

### 2. Enable Authentication

- Console → **Authentication** → Get started
- Enable **Google** as a sign-in provider
- Under **Authorized domains**, add your production domain (e.g. `cics-board.web.app`) and `localhost`

### 3. Create Firestore Database

- Console → **Firestore Database** → Create database
- Start in **production mode**
- Recommended region: `asia-southeast1` (Singapore — closest to the Philippines)

### 4. Register a Web App

- Console → **Project Settings** → **Your apps** → Add app → Web
- Copy the `firebaseConfig` values into your `.env` file

### 5. Create the First Admin Account

After your first login, manually set your account as admin in Firestore:

1. Go to Firestore Console → `whitelist` collection
2. Find your document (Document ID = your email address)
3. Set these fields:
   - `role` → `"admin"`
   - `approved` → `true` (boolean, not string)

From that point, all future account management can be done through the **Access Control** page in the app.

### 6. Deploy Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase init   # Select your existing project, choose Firestore + Hosting
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Firestore Data Schema

### `whitelist/{email}`
The source of truth for who can log in and what role/program they have.
```json
{
  "email": "student@neu.edu.ph",
  "displayName": "Juan Santos",
  "photoURL": "https://...",
  "role": "student",
  "approved": true,
  "program": "CS",
  "pending": false,
  "blocked": false,
  "blockReason": "",
  "addedAt": "Timestamp",
  "lastLogin": "Timestamp"
}
```

### `users/{uid}`
User profile — created automatically on first login.
```json
{
  "uid": "string",
  "email": "student@neu.edu.ph",
  "displayName": "Juan Santos",
  "photoURL": "https://...",
  "program": "CS",
  "role": "student",
  "blocked": false,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "lastLogin": "Timestamp"
}
```

### `documents/{docId}`
```json
{
  "title": "AY 2025–2026 Enrollment Schedule",
  "category": "Announcement",
  "year": "2025–2026",
  "programs": ["All"],
  "tags": ["enrollment", "schedule"],
  "fileUrl": "https://drive.google.com/...",
  "downloadUrl": "https://drive.google.com/uc?export=download&id=...",
  "driveFileId": "string",
  "hidden": false,
  "downloads": 42,
  "uploadedBy": "admin-uid",
  "createdAt": "Timestamp"
}
```

### `loginEvents/{eventId}`
```json
{ "uid": "string", "timestamp": "Timestamp" }
```

### `downloadEvents/{eventId}`
```json
{ "docId": "string", "uid": "string", "timestamp": "Timestamp" }
```

### `viewEvents/{eventId}`
```json
{ "docId": "string", "uid": "string", "timestamp": "Timestamp" }
```

---

## Security Rules

Access is controlled at two levels:

**Whitelist** — only `@neu.edu.ph` accounts that exist in the `whitelist` collection with `approved: true` can access the app. New logins are auto-detected and added as pending until an admin assigns their program.

**Firestore Rules** — `firestore.rules` enforces:
- Students can only read documents and write their own events
- Admins can read and write everything
- No user can modify the whitelist except admins
- Blocked/revoked users are denied access even if previously approved

---

## Deployment

```bash
# Build the production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

The app will be live at `https://your-project-id.web.app`

To deploy everything at once (hosting + rules + indexes):
```bash
firebase deploy
```

**Subsequent updates** — after making any code changes just run:
```bash
npm run build
firebase deploy --only hosting
```

---

## User Roles

### Student
- Logs in with `@neu.edu.ph` Google account
- Sees a personalized dashboard filtered to their assigned program
- Can browse the full Document Library
- Can download and open documents via Google Drive

### Admin
- Full access to all pages and features
- Manages the Document Library (upload, hide, delete)
- Manages Access Control (add accounts, assign programs, block/unblock)
- Views the Audit History (all logins, downloads, views)
- Views the Admin Dashboard with real-time analytics

---

## Pages & Routes

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Google Sign-In page |
| `/blocked` | Public | Shown to blocked/revoked accounts |
| `/` | Student + Admin | Dashboard (role-aware) |
| `/library` | Student + Admin | Document library with filters |
| `/upload` | Admin only | Upload document via Google Drive link |
| `/whitelist` | Admin only | Access Control — manage all accounts |
| `/audit` | Admin only | Audit History — complete activity log |

---

## How Document Sharing Works

Documents are hosted on **Google Drive** — no Firebase Storage subscription required. To add a document:

1. Upload the PDF to Google Drive
2. Right-click → **Share** → set to **"Anyone with the link"** → Viewer
3. Copy the share link
4. Paste it into the Upload Document form in the app

The app automatically extracts the Drive file ID and generates both a preview URL and a direct download URL. Documents are only discoverable through the app since it requires login.

---

## Future Improvements

- [ ] In-app PDF viewer instead of redirecting to Google Drive
- [ ] Push notifications for new announcements via Firebase Cloud Messaging
- [ ] Email notification when an account is blocked or a new document is uploaded
- [ ] Document versioning — upload updated versions of existing files
- [ ] Student "My Downloads" history page
- [ ] Bulk document upload
- [ ] Export audit logs as CSV
- [ ] Firebase App Check to prevent API abuse

---

## License

For internal use by NEU CICS only. Not for public redistribution.

---

*Built for New Era University — College of Information and Computing Sciences, Quezon City, Philippines.*
