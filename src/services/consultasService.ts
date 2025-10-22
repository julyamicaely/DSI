import { db } from "../../firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const consultasRef = collection(db, "consultas");

export const adicionarConsulta = async (dados: any) => {
  await addDoc(consultasRef, dados);
};

export const listarConsultas = async () => {
  const snapshot = await getDocs(consultasRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const atualizarConsulta = async (id: string, dados: any) => {
  const ref = doc(db, "consultas", id);
  await updateDoc(ref, dados);
};

export const deletarConsulta = async (id: string) => {
  const ref = doc(db, "consultas", id);
  await deleteDoc(ref);
};
