// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyBi01oAF1CUaSVwzmRQN1pIrO-1d-e8bok",
  authDomain: "hirer-tech.firebaseapp.com",
  projectId: "hirer-tech",
  storageBucket: "hirer-tech.firebasestorage.app",
  messagingSenderId: "42432389751",
  appId: "1:42432389751:web:b279071a6467c758a8dc72",
  measurementId: "G-572YE5DSZ8"
};

// ✅ Initialize app
export const app = initializeApp(firebaseConfig);

// ✅ Auth with persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("✅ Auth persistence set to LOCAL"))
  .catch((error) => console.error("⚠️ Persistence error:", error));

// ✅ Firestore + Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Functions (for MoMo API)
export const functions = getFunctions(app);
