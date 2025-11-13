import { auth, db, storage } from "../../firebaseConfig";
import {
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
  uploadBytes,
} from "firebase/storage";
import * as FileSystem from "expo-file-system";

// ============================================
// 1. PERFIL E FOTO DE PERFIL
// ============================================

/**
 * Faz upload da foto de perfil para o Firebase Storage usando REST API
 * @param userId - UID do usuário
 * @param imageUri - URI local da imagem
 * @returns URL pública da imagem
 */
export async function uploadProfilePhoto(
  userId: string,
  imageUri: string
): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    console.log("📤 Iniciando upload da foto...");
    console.log("👤 User ID:", userId);
    console.log("🔑 User UID:", user.uid);
    console.log("📧 User Email:", user.email);
    console.log("URI da imagem:", imageUri);

    // Verificar se userId corresponde ao user.uid
    if (userId !== user.uid) {
      console.error("❌ ERRO: userId não corresponde ao user.uid");
      console.error("userId passado:", userId);
      console.error("user.uid atual:", user.uid);
    }

    // Obter token de autenticação
    const token = await user.getIdToken();
    console.log("✅ Token obtido (primeiros 50 chars):", token.substring(0, 50) + "...");

    // Ler o arquivo como base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("✅ Arquivo lido, tamanho:", base64.length, "caracteres");

    // Configuração do upload
    const bucket = "lifebeauty.firebasestorage.app";
    const timestamp = Date.now();
    const filename = `profilePictures/${user.uid}/${timestamp}.jpg`;
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(filename)}`;

    console.log("📁 Upload para:", filename);
    console.log("🔗 URL completa:", uploadUrl);

    // Fazer upload via fetch com base64
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "image/jpeg",
      },
      body: Uint8Array.from(atob(base64), c => c.charCodeAt(0)),
    });

    console.log("📊 Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro do servidor:", errorText);
      
      if (response.status === 404) {
        throw new Error(
          "Firebase Storage não encontrado.\n\n" +
          "Verifique:\n" +
          "1. Storage está ativado no console?\n" +
          "2. O bucket 'lifebeauty.firebasestorage.app' existe?"
        );
      }
      
      if (response.status === 403) {
        throw new Error(
          "Sem permissão para fazer upload.\n\n" +
          "Verifique as regras de segurança:\n" +
          "Storage → Rules"
        );
      }
      
      throw new Error(`Upload falhou: ${response.status} - ${errorText}`);
    }

    // Construir URL de download
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filename)}?alt=media`;

    console.log("✅ Upload concluído!");
    console.log("🔗 URL:", downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error("❌ Erro ao fazer upload:", error.message);
    throw error;
  }
}

/**
 * Atualiza a foto de perfil do usuário (Auth + Firestore)
 * @param photoURL - URL da foto
 */
export async function updateUserPhoto(photoURL: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  try {
    // Atualizar no Firebase Auth
    await updateProfile(user, { photoURL });

    // Atualizar no Firestore
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { photoUrl: photoURL }, { merge: true });
  } catch (error) {
    console.error("Erro ao atualizar foto de perfil:", error);
    throw error;
  }
}

// ============================================
// 2. DADOS DO USUÁRIO (FIRESTORE)
// ============================================

export interface UserData {
  displayName?: string;
  email?: string;
  phone?: string;
  address?: string;
  additionalInfo?: string;
  photoUrl?: string;
}

/**
 * Busca dados do usuário no Firestore
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    throw error;
  }
}

/**
 * Atualiza informações do usuário (Auth + Firestore)
 */
export async function updateUserInfo(data: UserData): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  try {
    // Atualizar displayName no Auth se fornecido
    if (data.displayName) {
      await updateProfile(user, { displayName: data.displayName });
    }

    // Atualizar dados no Firestore
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(
      userDocRef,
      {
        displayName: data.displayName || user.displayName,
        email: user.email,
        phone: data.phone || "",
        address: data.address || "",
        additionalInfo: data.additionalInfo || "",
        photoUrl: data.photoUrl || user.photoURL || "",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Erro ao atualizar informações do usuário:", error);
    throw error;
  }
}

// ============================================
// 3. PERMISSÕES E PREFERÊNCIAS
// ============================================

export interface UserPermissions {
  notifications: boolean;
  location: boolean;
  autoReminders: boolean;
  dataSharing: boolean;
}

/**
 * Salva preferências de permissões do usuário
 */
export async function saveUserPermissions(
  permissions: UserPermissions
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  try {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(
      userDocRef,
      {
        permissions,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Erro ao salvar permissões:", error);
    throw error;
  }
}

/**
 * Busca preferências de permissões do usuário
 */
export async function getUserPermissions(
  userId: string
): Promise<UserPermissions> {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().permissions) {
      return userDoc.data().permissions as UserPermissions;
    }

    // Padrão: tudo desativado
    return {
      notifications: false,
      location: false,
      autoReminders: false,
      dataSharing: false,
    };
  } catch (error) {
    console.error("Erro ao buscar permissões:", error);
    throw error;
  }
}

// ============================================
// 4. EXCLUSÃO DE CONTA
// ============================================

/**
 * Deleta todos os dados do usuário no Firestore
 */
async function deleteUserFirestoreData(userId: string): Promise<void> {
  const batch = writeBatch(db);

  try {
    // Deletar documento do usuário
    const userDocRef = doc(db, "users", userId);
    batch.delete(userDocRef);

    // Deletar hábitos do usuário
    const habitsQuery = query(
      collection(db, "habits"),
      where("userId", "==", userId)
    );
    const habitsSnapshot = await getDocs(habitsQuery);
    habitsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Deletar consultas do usuário (se tiver userId)
    const consultasQuery = query(
      collection(db, "consultas"),
      where("userId", "==", userId)
    );
    const consultasSnapshot = await getDocs(consultasQuery);
    consultasSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Deletar favoritos do usuário
    const favoritesQuery = query(
      collection(db, "favorites"),
      where("userId", "==", userId)
    );
    const favoritesSnapshot = await getDocs(favoritesQuery);
    favoritesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Executar todas as deleções
    await batch.commit();
  } catch (error) {
    console.error("Erro ao deletar dados do Firestore:", error);
    throw error;
  }
}

/**
 * Deleta a foto de perfil do Storage
 */
async function deleteProfilePhoto(userId: string): Promise<void> {
  try {
    const photoRef = ref(storage, `profilePictures/${userId}.jpg`);
    await deleteObject(photoRef);
  } catch (error) {
    // Ignora erro se a foto não existir
    console.log("Foto de perfil não encontrada ou já deletada");
  }
}

/**
 * Deleta completamente a conta do usuário
 * @param password - Senha para reautenticação (se necessário)
 */
export async function deleteUserAccount(password?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  try {
    // Se a senha foi fornecida, reautenticar
    if (password && user.email) {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    }

    // 1. Deletar dados do Firestore
    await deleteUserFirestoreData(user.uid);

    // 2. Deletar foto de perfil do Storage
    await deleteProfilePhoto(user.uid);

    // 3. Deletar usuário do Firebase Auth
    await deleteUser(user);
  } catch (error: any) {
    // Erro de reautenticação necessária
    if (error.code === "auth/requires-recent-login") {
      throw new Error("REQUIRES_RECENT_LOGIN");
    }
    console.error("Erro ao deletar conta:", error);
    throw error;
  }
}
