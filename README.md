# Hirer E-Taxi Web App

## Steps to Deploy

1. **Firebase Setup**
   - Create a Firebase project.
   - Enable **Authentication → Email/Password**.
   - Enable **Firestore Database → Start in test mode**.
   - Copy your Firebase config to `firebase/firebase-config.js`.

2. **Hosting**
   - Firebase Hosting:
     - `npm install -g firebase-tools`
     - `firebase login`
     - `firebase init` → choose "Hosting"
     - `firebase deploy`
   - Or use Netlify/Vercel for static hosting.

3. **Folder Structure**
   - Keep folders: `driver/`, `rider/`, `firebase/`, `assets/`.
   - Do not rename files to ensure imports work.

4. **Usage**
   - Drivers: Register/Login → Accept rides.
   - Riders: Register/Login → Book rides → See ride history.
