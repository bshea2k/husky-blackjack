import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// firebase config info
const firebaseConfig = {
  apiKey: "AIzaSyCExnjLmFw-Sq6FfTbda-x-C4qlGvgIMr0",
  authDomain: "husky-blackjack-a8aaf.firebaseapp.com",
  projectId: "husky-blackjack-a8aaf",
  storageBucket: "husky-blackjack-a8aaf.firebasestorage.app",
  messagingSenderId: "357811435292",
  appId: "1:357811435292:web:46b33c9dbf32ebc7af6cd9"
};

// initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// handle sign-in
document.getElementById("google-signin").addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("Signed in as:", user.displayName);
      window.location.href = "../index.html"; 
    })
    .catch((error) => {
      console.error("Sign-in failed:", error.message);
      alert("Sign-in failed: " + error.message);
    });
});
