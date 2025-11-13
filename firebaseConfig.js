// Importa funções do Firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB45tGtVViBLXWS1V6fz0TrP1xr4c3vCKM",
  authDomain: "lifebeauty.firebaseapp.com",
  projectId: "lifebeauty",
  storageBucket: "lifebeauty.firebasestorage.app",
  messagingSenderId: "1051441526191",
  appId: "1:1051441526191:web:c9b7eef391308cf15ceb5a"
};

// Inicializa o Firebase apenas se ainda não foi inicializado
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
