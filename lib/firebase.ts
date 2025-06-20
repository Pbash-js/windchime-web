// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore, enableNetwork, disableNetwork } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBASz-cW6yTWfMnCvtjRXBNmHwybKnVeLI",
  authDomain: "windchime-20927.firebaseapp.com",
  projectId: "windchime-20927",
  storageBucket: "windchime-20927.firebasestorage.app",
  messagingSenderId: "899683849904",
  appId: "1:899683849904:web:b965683ccc93351ec48d75",
  measurementId: "G-BER4E7LW9J",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: "select_account",
})

// Initialize Firestore with offline persistence
export const db = getFirestore(app)

// Enable offline persistence
if (typeof window !== "undefined") {
  // Enable offline persistence for better offline experience
  import("firebase/firestore").then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.")
      } else if (err.code === "unimplemented") {
        console.warn("The current browser does not support all of the features required to enable persistence")
      }
    })
  })
}

// Initialize Analytics (only in browser)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null

// Network status utilities
export const enableFirestoreNetwork = () => enableNetwork(db)
export const disableFirestoreNetwork = () => disableNetwork(db)

export default app
