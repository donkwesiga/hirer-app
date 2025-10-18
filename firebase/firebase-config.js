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

// ✅ Use your old project (hirer-5a281)
const firebaseConfig = {
  apiKey: "AIzaSyAQSbrAuQ0J_YBqFiPqbpNf5_N3JF_3vNg",
  authDomain: "hirer-5a281.firebaseapp.com",
  projectId: "hirer-5a281",
  storageBucket: "hirer-5a281.firebasestorage.app", // keep this since it's from your Spark plan
  messagingSenderId: "1040986291807",
  appId: "1:1040986291807:web:3e83efa296b100d9a7e5ea"
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
