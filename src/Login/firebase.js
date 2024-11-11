// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAN2HePfmhMf6y-1UgngZ80HUiUvvT903M",
  authDomain: "food-delivery-ba690.firebaseapp.com",
  projectId: "food-delivery-ba690",
  storageBucket: "food-delivery-ba690.firebasestorage.app",
  messagingSenderId: "233567226813",
  appId: "1:233567226813:web:91810718314fc88e63e0d4",
  measurementId: "G-6BWC2WN3XN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };