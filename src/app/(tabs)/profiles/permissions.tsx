import { View, Text, StyleSheet, Switch } from "react-native";
import { useState } from "react";

export default function Permissions() {
  const [perms, setPerms] = useState({
    notificacoes: false,
    compartilharDados: false,
    lembretes: false,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Permissões</Text>

      {Object.entries(perms).map(([key, value]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>
            {key === "notificacoes"
              ? "Notificações"
              : key === "compartilharDados"
              ? "Compartilhar dados"
              : "Lembretes automáticos"}
          </Text>
          <Switch
            value={value}
            onValueChange={(val) => setPerms({ ...perms, [key]: val })}
            trackColor={{ false: "#ccc", true: "#E53935" }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  label: { fontSize: 16 },
});
