import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import ProfilePhotoPicker from "../../../components/ProfilePhotoPicker";
import { useState, useEffect } from "react";
import { auth } from "../../../../firebaseConfig";

export default function ProfileIndex() {
  const router = useRouter();
  const { user, dataUpdateTrigger } = useAuth();
  const [userName, setUserName] = useState(user?.displayName || "Usuário");

  useEffect(() => {
    const loadUserName = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        setUserName(currentUser.displayName || "Usuário");
      }
    };

    loadUserName();
  }, [dataUpdateTrigger, user]);

  return (
    <View style={styles.container}>
      {/* Avatar com opção de editar */}
      <ProfilePhotoPicker
        userId={user?.uid || ""}
        currentPhotoUrl={user?.photoURL || ""}
        size={100}
      />

      {/* Nome do usuário */}
      <Text style={styles.name}>{userName}</Text>

      {/* Opções do perfil */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(tabs)/profiles/myinfo")}
        >
          <Text style={styles.optionText}>Minhas Informações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(tabs)/profiles/dadoscli")}
        >
          <Text style={styles.optionText}>Dados Clínicos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(tabs)/profiles/permissions")}
        >
          <Text style={styles.optionText}>Permissões</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(tabs)/profiles/conquistas")}
        >
          <Text style={styles.optionText}>Conquistas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, styles.deleteOption]}
          onPress={() => router.push("/(tabs)/profiles/logout")}
        >
          <Text style={[styles.optionText, styles.deleteText]}>
            Excluir Conta
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "#fff", padding: 30 },
  name: { fontSize: 20, fontWeight: "bold", marginTop: 15, marginBottom: 30, color: "#333" },
  optionsContainer: { width: "100%", gap: 10 },
  option: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  optionText: { fontSize: 16, color: "#333" },
  deleteOption: { backgroundColor: "#FDECEC", borderColor: "#E53935" },
  deleteText: { color: "#E53935", fontWeight: "600" },
});
