# Hirer E-Taxi Web App

A ride-hailing web app using **Firebase** for authentication, Firestore for database, and **MTN MoMo API** for payments.

---

## 🚀 Steps to Deploy

### 1. Firebase Setup
- Create a Firebase project.
- Enable **Authentication → Email/Password**.
- Enable **Firestore Database → Start in test mode**.
- Copy your Firebase config to `firebase/firebase-config.js`.

### 2. Hosting
You can deploy on Firebase or Vercel.

#### 🔹 Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
