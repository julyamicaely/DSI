import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { adicionarConsulta, listarConsultas, atualizarConsulta, deletarConsulta } from "../../services/consultasService";


interface Consulta {
  id?: string;
  idade: string;
  genero: string;
  altura: string;
  peso: string;
  pressaoAlta: string;
  pressaoBaixa: string;
  colesterol: string;
  glicose: string;
  imc: string;
}

export default function DadosClinicosScreen() {
  const [consulta, setConsulta] = useState<Consulta>({
    idade: "",
    genero: "",
    altura: "",
    peso: "",
    pressaoAlta: "",
    pressaoBaixa: "",
    colesterol: "",
    glicose: "",
    imc: "",
  });

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarConsultas();
  }, []);

  const carregarConsultas = async () => {
    const data = await listarConsultas();
    setConsultas(data as Consulta[]);
  };

  const handleSalvar = async () => {
    const campos = Object.values(consulta);
    if (campos.some(campo => campo === "")) {
      Alert.alert("Atenção", "Preencha todos os campos antes de salvar.");
      return;
    }

    if (editandoId) {
      await atualizarConsulta(editandoId, consulta);
      Alert.alert("Sucesso", "Consulta atualizada!");
      setEditandoId(null);
    } else {
      await adicionarConsulta(consulta);
      Alert.alert("Sucesso", "Consulta salva!");
    }

    setConsulta({
      idade: "",
      genero: "",
      altura: "",
      peso: "",
      pressaoAlta: "",
      pressaoBaixa: "",
      colesterol: "",
      glicose: "",
      imc: "",
    });

    carregarConsultas();
  };

  const handleEditar = (item: Consulta) => {
    setConsulta(item);
    setEditandoId(item.id || null);
  };

  const handleRemover = async (id?: string) => {
    if (!id) return;
    await deletarConsulta(id);
    Alert.alert("Removido", "Consulta deletada!");
    carregarConsultas();
  };

  const todosPreenchidos = Object.values(consulta).every(v => v.trim() !== "");

  return (
    <FlatList
      style={styles.container}
      data={consultas}
      keyExtractor={(item) => item.id!}
      ListHeaderComponent={
        <>
          <Text style={styles.titulo}>Dados Clínicos</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Idade</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={consulta.idade} onChangeText={v => setConsulta({ ...consulta, idade: v })} />

            <Text style={styles.label}>Gênero</Text>
            <TextInput style={styles.input} placeholder="Masculino / Feminino" value={consulta.genero} onChangeText={v => setConsulta({ ...consulta, genero: v })} />

            <Text style={styles.label}>Altura (cm)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={consulta.altura} onChangeText={v => setConsulta({ ...consulta, altura: v })} />

            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={consulta.peso} onChangeText={v => setConsulta({ ...consulta, peso: v })} />

            <Text style={styles.label}>Pressão Sistólica (Alta)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={consulta.pressaoAlta} onChangeText={v => setConsulta({ ...consulta, pressaoAlta: v })} />

            <Text style={styles.label}>Pressão Diastólica (Baixa)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={consulta.pressaoBaixa} onChangeText={v => setConsulta({ ...consulta, pressaoBaixa: v })} />

            <Text style={styles.label}>Colesterol</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={consulta.colesterol} onChangeText={v => setConsulta({ ...consulta, colesterol: v })} />

            <Text style={styles.label}>Glicose</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={consulta.glicose} onChangeText={v => setConsulta({ ...consulta, glicose: v })} />

            <Text style={styles.label}>IMC</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={consulta.imc} onChangeText={v => setConsulta({ ...consulta, imc: v })} />

            <TouchableOpacity style={styles.botaoSalvar} onPress={handleSalvar}>
              <Text style={styles.textoBotao}>{editandoId ? "Atualizar Consulta" : "Salvar Consulta"}</Text>
            </TouchableOpacity>

            {todosPreenchidos && (
              <TouchableOpacity style={styles.botaoRisco} onPress={() => Alert.alert("Análise de risco", "Função ainda não implementada")}>
                <Text style={styles.textoBotao}>Análise de Risco</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.subtitulo}>Consultas Salvas</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTexto}>Idade: {item.idade} | Gênero: {item.genero}</Text>
          <Text style={styles.cardTexto}>Peso: {item.peso}kg | Altura: {item.altura}cm</Text>
          <View style={styles.cardBotoes}>
            <TouchableOpacity style={styles.botaoEditar} onPress={() => handleEditar(item)}>
              <Text style={styles.textoBotao}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoExcluir} onPress={() => handleRemover(item.id)}>
              <Text style={styles.textoBotao}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    padding: 20,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 20,
  },
  form: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#ECF0F1",
    borderRadius: 15,
    padding: 10,
    fontSize: 16,
  },
  botaoSalvar: {
    backgroundColor: "#3498DB",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  botaoRisco: {
    backgroundColor: "#27AE60",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  textoBotao: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  subtitulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2C3E50",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardTexto: {
    fontSize: 14,
    color: "#34495E",
  },
  cardBotoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  botaoEditar: {
    backgroundColor: "#F39C12",
    padding: 10,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  botaoExcluir: {
    backgroundColor: "#E74C3C",
    padding: 10,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
});
