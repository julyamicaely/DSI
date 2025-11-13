import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { useState } from "react";
import { deleteUserAccount } from "../../../services/firebase.service";

export default function Logout() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteRequest = () => {
    Alert.alert(
      "⚠️ Confirmação de Exclusão",
      "Tem certeza que deseja excluir sua conta?\n\n" +
        "Esta ação irá:\n" +
        "• Remover todos os seus dados permanentemente\n" +
        "• Deletar hábitos, consultas e favoritos\n" +
        "• Excluir sua foto de perfil\n" +
        "• Apagar sua conta do sistema\n\n" +
        "Esta ação NÃO pode ser desfeita!",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => setShowPasswordModal(true),
        },
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (!password.trim()) {
      Alert.alert("Atenção", "Por favor, digite sua senha para confirmar.");
      return;
    }

    setDeleting(true);

    try {
      await deleteUserAccount(password);

      // Limpar estado do contexto
      logout();

      Alert.alert(
        "Conta excluída",
        "Sua conta foi excluída permanentemente.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error);

      if (error.message === "REQUIRES_RECENT_LOGIN") {
        Alert.alert(
          "Reautenticação necessária",
          "Por questões de segurança, você precisa fazer login novamente antes de excluir sua conta."
        );
        setShowPasswordModal(false);
        setPassword("");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Erro", "Senha incorreta. Tente novamente.");
      } else {
        Alert.alert("Erro", "Não foi possível excluir a conta. Tente novamente.");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: user?.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        }}
        style={styles.avatar}
      />
      <Text style={styles.title}>{user?.displayName || "Usuário"}</Text>

      <View style={styles.card}>
        <Text style={styles.text}>
          Tem certeza que deseja excluir sua conta no LifeBeat?{"\n\n"}
          Essa ação é permanente e não pode ser desfeita.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancel]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.delete]}
            onPress={handleDeleteRequest}
          >
            <Text style={styles.buttonText}>Excluir conta</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de confirmação com senha */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !deleting && setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirme sua senha</Text>
            <Text style={styles.modalText}>
              Para excluir sua conta, digite sua senha:
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!deleting}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                }}
                disabled={deleting}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirm,
                  deleting && styles.disabledButton,
                ]}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.confirmText]}>
                    Confirmar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20, backgroundColor: "#fff" },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  card: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  text: { textAlign: "center", marginBottom: 20, color: "#555" },
  buttons: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancel: { backgroundColor: "#ccc" },
  delete: { backgroundColor: "#E53935" },
  buttonText: { color: "#fff", fontWeight: "bold" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancel: {
    backgroundColor: "#ccc",
  },
  modalConfirm: {
    backgroundColor: "#E53935",
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  modalButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmText: {
    color: "#fff",
  },
});
