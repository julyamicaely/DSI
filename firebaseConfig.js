// Importa funções do Firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Inicializa Auth com persistência AsyncStorage
/** @type {import('firebase/auth').Auth} */
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Se já foi inicializado, apenas obtém a instância
  auth = getAuth(app);
}

// Exporta os serviços
export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
