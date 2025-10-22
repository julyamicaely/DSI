import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";

export default function ProfileIndex() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
        style={styles.avatar}
      />

      {/* Nome do usuário */}
      <Text style={styles.name}>{user?.displayName || "Usuário"}</Text>

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
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  name: { fontSize: 20, fontWeight: "bold", marginBottom: 30, color: "#333" },
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
