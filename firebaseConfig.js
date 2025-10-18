// Importa funções do Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase (copie do console e confirme o storageBucket)
const firebaseConfig = {
  apiKey: "AIzaSyB45tGtVViBLXWS1V6fz0TrP1xr4c3vCKM",
  authDomain: "lifebeauty.firebaseapp.com",
  projectId: "lifebeauty",
  storageBucket: "lifebeauty.appspot.com", // ✅ corrigido
  messagingSenderId: "1051441526191",
  appId: "1:1051441526191:web:c9b7eef391308cf15ceb5a"
};

// Inicializa o Firebase uma única vez
const app = initializeApp(firebaseConfig);

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
