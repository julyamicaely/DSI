// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB45tGtVViBLXWS1V6fz0TrP1xr4c3vCKM",
  authDomain: "lifebeauty.firebaseapp.com",
  projectId: "lifebeauty",
  storageBucket: "lifebeauty.firebasestorage.app",
  messagingSenderId: "1051441526191",
  appId: "1:1051441526191:web:c9b7eef391308cf15ceb5a"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;