import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";

export default function Logout() {
  const router = useRouter();
  const { logout } = useAuth(); // ✅ agora existe essa função

  const handleDelete = () => {
    Alert.alert("Confirmação", "Deseja realmente excluir sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
        style={styles.avatar}
      />
      <Text style={styles.title}>Julya Silva</Text>

      <View style={styles.card}>
        <Text style={styles.text}>
          Tem certeza que deseja excluir sua conta no LifeBeat?{"\n"}Essa ação é
          permanente e não pode ser desfeita.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.button, styles.cancel]} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.delete]} onPress={handleDelete}>
            <Text style={styles.buttonText}>Excluir conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20, backgroundColor: "#fff" },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  card: { padding: 20, borderRadius: 10, backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#ddd" },
  text: { textAlign: "center", marginBottom: 20, color: "#555" },
  buttons: { flexDirection: "row", justifyContent: "space-between" },
  button: { flex: 1, alignItems: "center", padding: 10, borderRadius: 10, marginHorizontal: 5 },
  cancel: { backgroundColor: "#ccc" },
  delete: { backgroundColor: "#E53935" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
