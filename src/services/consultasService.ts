import { db, auth } from "../../firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";

const consultasRef = collection(db, "consultas");

export const adicionarConsulta = async (dados: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");
  await addDoc(consultasRef, { ...dados, userId: user.uid });
};

export const listarConsultas = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const q = query(consultasRef, where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
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
