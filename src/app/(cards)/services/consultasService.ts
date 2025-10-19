import { db, auth } from "../../../../firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";

export const adicionarConsulta = async (dados: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const consultasRef = collection(db, "consultas");
  await addDoc(consultasRef, {
    ...dados,
    uid: user.uid,
  });
};

export const listarConsultas = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const consultasRef = collection(db, "consultas");
  const q = query(consultasRef, where("uid", "==", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const atualizarConsulta = async (id: string, dados: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const ref = doc(db, "consultas", id);
  await updateDoc(ref, { ...dados, uid: user.uid });
};

export const deletarConsulta = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const ref = doc(db, "consultas", id);
  await deleteDoc(ref);
};
