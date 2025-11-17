import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { adicionarConsulta, listarConsultas, atualizarConsulta, deletarConsulta } from "../../services/consultasService";
import { 
  predictCardiovascularRisk, 
  formatPredictionForDisplay,
  type PatientClinicalData,
  type PredictionResult 
} from "../../services/mlPrediction.service";

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
  // Novos campos para ML
  fumante?: string;
  alcool?: string;
  ativo?: string;
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
    fumante: "",
    alcool: "",
    ativo: "",
  });

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  // Estados para predição ML
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<PredictionResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    carregarConsultas();
  }, []);

  const carregarConsultas = async () => {
    const data = await listarConsultas();
    setConsultas(data as Consulta[]);
  };

  const handleSalvar = async () => {
    // Validar apenas os campos obrigatórios (excluir IMC que é calculado automaticamente)
    const camposObrigatorios: (keyof Consulta)[] = [
      'idade', 'genero', 'altura', 'peso', 
      'pressaoAlta', 'pressaoBaixa', 'colesterol', 'glicose',
      'fumante', 'alcool', 'ativo'
    ];
    
    const campoVazio = camposObrigatorios.find(campo => !consulta[campo] || consulta[campo]?.trim() === '');
    if (campoVazio) {
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
      fumante: "",
      alcool: "",
      ativo: "",
    });

    carregarConsultas();
  };

  /**
   * Realiza a análise de risco cardiovascular usando ML
   */
  const handleAnalisarRisco = async () => {
    // Validar campos obrigatórios
    const camposObrigatorios = [
      'idade', 'genero', 'altura', 'peso', 
      'pressaoAlta', 'pressaoBaixa', 'colesterol', 'glicose',
      'fumante', 'alcool', 'ativo'
    ];
    
    const campoVazio = camposObrigatorios.find(campo => !consulta[campo as keyof Consulta]);
    if (campoVazio) {
      Alert.alert("Atenção", "Preencha todos os campos antes de analisar o risco.");
      return;
    }

    setAnalisando(true);
    
    try {
      // Preparar dados para o modelo ML
      const patientData: PatientClinicalData = {
        gender: consulta.genero.toLowerCase() === 'masculino' ? 1 : 0,
        age_years: parseInt(consulta.idade),
        height_cm: parseFloat(consulta.altura),
        weight_kg: parseFloat(consulta.peso),
        ap_hi: parseInt(consulta.pressaoAlta),
        ap_lo: parseInt(consulta.pressaoBaixa),
        cholesterol_high: consulta.colesterol.toLowerCase() === 'alto' ? 1 : 0,
        gluc_high: consulta.glicose.toLowerCase() === 'alta' ? 1 : 0,
        smoke: consulta.fumante?.toLowerCase() === 'sim' ? 1 : 0,
        alco: consulta.alcool?.toLowerCase() === 'sim' ? 1 : 0,
        active: consulta.ativo?.toLowerCase() === 'sim' ? 1 : 0,
      };

      // Realizar predição
      const prediction = await predictCardiovascularRisk(patientData);
      
      setResultado(prediction);
      setModalVisible(true);
      
    } catch (error) {
      console.error('[ClinicalData] Erro na análise:', error);
      Alert.alert(
        "Erro", 
        "Ocorreu um erro ao analisar os dados. Verifique se todos os campos estão preenchidos corretamente."
      );
    } finally {
      setAnalisando(false);
    }
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

  // Validar apenas os campos obrigatórios (excluir IMC que é calculado automaticamente)
  const camposObrigatoriosValidacao: (keyof Consulta)[] = [
    'idade', 'genero', 'altura', 'peso', 
    'pressaoAlta', 'pressaoBaixa', 'colesterol', 'glicose',
    'fumante', 'alcool', 'ativo'
  ];
  const todosPreenchidos = camposObrigatoriosValidacao.every(campo => 
    consulta[campo] && consulta[campo]?.trim() !== ''
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Header */}
        <Text style={styles.titulo}>Dados Clínicos</Text>
        <Text style={styles.subtitulo}>Preencha seus dados para análise de risco cardiovascular</Text>

        {/* Formulário */}
        <View style={styles.form}>
          {/* Seção: Dados Demográficos */}
          <Text style={styles.secaoTitulo}>📋 Dados Demográficos</Text>
          
          <Text style={styles.label}>Idade (anos)</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            placeholder="Ex: 45"
            value={consulta.idade} 
            onChangeText={v => setConsulta({ ...consulta, idade: v })} 
          />

          <Text style={styles.label}>Gênero</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, consulta.genero === 'Masculino' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, genero: 'Masculino' })}
            >
              <Text style={[styles.optionButtonText, consulta.genero === 'Masculino' && styles.optionButtonTextSelected]}>
                Masculino
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, consulta.genero === 'Feminino' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, genero: 'Feminino' })}
            >
              <Text style={[styles.optionButtonText, consulta.genero === 'Feminino' && styles.optionButtonTextSelected]}>
                Feminino
              </Text>
            </TouchableOpacity>
          </View>

          {/* Seção: Medidas Físicas */}
          <Text style={styles.secaoTitulo}>📏 Medidas Físicas</Text>

          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric"
            placeholder="Ex: 175" 
            value={consulta.altura} 
            onChangeText={v => setConsulta({ ...consulta, altura: v })} 
          />

          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="decimal-pad"
            placeholder="Ex: 80" 
            value={consulta.peso} 
            onChangeText={v => setConsulta({ ...consulta, peso: v })} 
          />

          {/* Seção: Pressão Arterial */}
          <Text style={styles.secaoTitulo}>❤️ Pressão Arterial</Text>

          <Text style={styles.label}>Pressão Sistólica (Alta) - mmHg</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric"
            placeholder="Ex: 120" 
            value={consulta.pressaoAlta} 
            onChangeText={v => setConsulta({ ...consulta, pressaoAlta: v })} 
          />

          <Text style={styles.label}>Pressão Diastólica (Baixa) - mmHg</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric"
            placeholder="Ex: 80" 
            value={consulta.pressaoBaixa} 
            onChangeText={v => setConsulta({ ...consulta, pressaoBaixa: v })} 
          />

          {/* Seção: Exames Laboratoriais */}
          <Text style={styles.secaoTitulo}>🔬 Exames Laboratoriais</Text>

          <Text style={styles.label}>Colesterol</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, consulta.colesterol === 'Normal' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, colesterol: 'Normal' })}
            >
              <Text style={[styles.optionButtonText, consulta.colesterol === 'Normal' && styles.optionButtonTextSelected]}>
                Normal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, consulta.colesterol === 'Alto' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, colesterol: 'Alto' })}
            >
              <Text style={[styles.optionButtonText, consulta.colesterol === 'Alto' && styles.optionButtonTextSelected]}>
                Alto
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Glicose</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, consulta.glicose === 'Normal' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, glicose: 'Normal' })}
            >
              <Text style={[styles.optionButtonText, consulta.glicose === 'Normal' && styles.optionButtonTextSelected]}>
                Normal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, consulta.glicose === 'Alta' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, glicose: 'Alta' })}
            >
              <Text style={[styles.optionButtonText, consulta.glicose === 'Alta' && styles.optionButtonTextSelected]}>
                Alta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Seção: Hábitos de Vida */}
          <Text style={styles.secaoTitulo}>🏃 Hábitos de Vida</Text>

          <Text style={styles.label}>Você fuma?</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, consulta.fumante === 'Não' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, fumante: 'Não' })}
            >
              <Text style={[styles.optionButtonText, consulta.fumante === 'Não' && styles.optionButtonTextSelected]}>
                Não
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, consulta.fumante === 'Sim' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, fumante: 'Sim' })}
            >
              <Text style={[styles.optionButtonText, consulta.fumante === 'Sim' && styles.optionButtonTextSelected]}>
                Sim
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Consome álcool regularmente?</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, consulta.alcool === 'Não' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, alcool: 'Não' })}
            >
              <Text style={[styles.optionButtonText, consulta.alcool === 'Não' && styles.optionButtonTextSelected]}>
                Não
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, consulta.alcool === 'Sim' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, alcool: 'Sim' })}
            >
              <Text style={[styles.optionButtonText, consulta.alcool === 'Sim' && styles.optionButtonTextSelected]}>
                Sim
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Pratica atividade física regular?</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, consulta.ativo === 'Não' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, ativo: 'Não' })}
            >
              <Text style={[styles.optionButtonText, consulta.ativo === 'Não' && styles.optionButtonTextSelected]}>
                Não
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, consulta.ativo === 'Sim' && styles.optionButtonSelected]}
              onPress={() => setConsulta({ ...consulta, ativo: 'Sim' })}
            >
              <Text style={[styles.optionButtonText, consulta.ativo === 'Sim' && styles.optionButtonTextSelected]}>
                Sim
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botões de Ação */}
          <TouchableOpacity style={styles.botaoSalvar} onPress={handleSalvar}>
            <Ionicons name="save-outline" size={20} color="#FFF" />
            <Text style={styles.textoBotao}>{editandoId ? "Atualizar Consulta" : "Salvar Consulta"}</Text>
          </TouchableOpacity>

          {todosPreenchidos && (
            <TouchableOpacity 
              style={[styles.botaoRisco, analisando && styles.botaoRiscoDisabled]} 
              onPress={handleAnalisarRisco}
              disabled={analisando}
            >
              {analisando ? (
                <>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.textoBotao}>Analisando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="analytics-outline" size={20} color="#FFF" />
                  <Text style={styles.textoBotao}>Análise de Risco Cardiovascular</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de Consultas Salvas */}
        <Text style={styles.listaTitulo}>Consultas Salvas</Text>
        {consultas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>Nenhuma consulta salva</Text>
          </View>
        ) : (
          consultas.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTexto}>Idade: {item.idade} | Gênero: {item.genero}</Text>
              <Text style={styles.cardTexto}>Peso: {item.peso}kg | Altura: {item.altura}cm</Text>
              <Text style={styles.cardTexto}>Pressão: {item.pressaoAlta}/{item.pressaoBaixa} mmHg</Text>
              <View style={styles.cardBotoes}>
                <TouchableOpacity style={styles.botaoEditar} onPress={() => handleEditar(item)}>
                  <Ionicons name="create-outline" size={16} color="#FFF" />
                  <Text style={styles.textoBotao}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoExcluir} onPress={() => handleRemover(item.id)}>
                  <Ionicons name="trash-outline" size={16} color="#FFF" />
                  <Text style={styles.textoBotao}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de Resultado */}
      {renderResultModal()}
    </View>
  );

  /**
   * Renderiza o modal com os resultados da predição
   */
  function renderResultModal() {
    if (!resultado) return null;

    const displayInfo = formatPredictionForDisplay(resultado);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header do Modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Análise de Risco Cardiovascular</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close-circle" size={32} color="#95A5A6" />
                </TouchableOpacity>
              </View>

              {resultado.success ? (
                <>
                  {/* Card de Risco Principal */}
                  <View style={[styles.riskCard, { backgroundColor: displayInfo.riskColor }]}>
                    <Text style={styles.riskEmoji}>{displayInfo.riskEmoji}</Text>
                    <Text style={styles.riskTitle}>{displayInfo.riskText}</Text>
                    <Text style={styles.riskProbability}>{resultado.probability.toFixed(1)}%</Text>
                    <Text style={styles.riskSubtitle}>Probabilidade de Risco</Text>
                  </View>

                  {/* Recomendação */}
                  <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationTitle}>📋 Recomendação Médica</Text>
                    <Text style={styles.recommendationText}>{resultado.recommendation}</Text>
                  </View>

                  {/* Principais Fatores de Risco */}
                  {resultado.top_risk_factors.length > 0 && (
                    <View style={styles.factorsCard}>
                      <Text style={styles.factorsTitle}>⚠️ Principais Fatores de Risco</Text>
                      {resultado.top_risk_factors.slice(0, 5).map((factor, index) => (
                        <View key={index} style={styles.factorItem}>
                          <View style={styles.factorHeader}>
                            <Text style={styles.factorName}>{factor.factor}</Text>
                            <View style={[
                              styles.severityBadge,
                              { backgroundColor: 
                                factor.severity === 'CRÍTICO' ? '#E74C3C' :
                                factor.severity === 'ALTO' ? '#E67E22' :
                                factor.severity === 'MODERADO' ? '#F39C12' : '#27AE60'
                              }
                            ]}>
                              <Text style={styles.severityText}>{factor.severity}</Text>
                            </View>
                          </View>
                          <Text style={styles.factorDescription}>{factor.description}</Text>
                          <View style={styles.importanceBar}>
                            <View style={[styles.importanceFill, { width: `${factor.importance * 100}%` }]} />
                          </View>
                          <Text style={styles.importanceText}>
                            Importância: {(factor.importance * 100).toFixed(1)}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Importância das Variáveis (Top 5) */}
                  <View style={styles.featuresCard}>
                    <Text style={styles.featuresTitle}>📊 Variáveis Mais Importantes</Text>
                    <Text style={styles.featuresSubtitle}>
                      Estas são as variáveis que mais influenciaram sua análise
                    </Text>
                    {resultado.feature_importance.slice(0, 5).map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <View style={styles.featureHeader}>
                          <Text style={styles.featureRank}>#{index + 1}</Text>
                          <Text style={styles.featureName}>{feature.feature_name}</Text>
                        </View>
                        <View style={styles.featureDetails}>
                          <Text style={styles.featureValue}>Seu valor: {feature.value_display}</Text>
                          <Text style={styles.featureImportance}>
                            {feature.importance_percentage.toFixed(1)}%
                          </Text>
                        </View>
                        <View style={styles.featureBar}>
                          <View style={[styles.featureBarFill, { width: `${feature.importance_percentage}%` }]} />
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Botão de Fechar */}
                  <TouchableOpacity 
                    style={styles.modalCloseButton} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.errorCard}>
                  <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
                  <Text style={styles.errorTitle}>Erro na Análise</Text>
                  <Text style={styles.errorMessage}>{resultado.error || 'Erro desconhecido'}</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 10,
  },
  subtitulo: {
    fontSize: 14,
    color: "#7F8C8D",
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
  secaoTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    marginTop: 20,
    marginBottom: 15,
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
    padding: 12,
    fontSize: 16,
    color: "#2C3E50",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
  },
  optionButton: {
    flex: 1,
    backgroundColor: "#ECF0F1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionButtonSelected: {
    backgroundColor: "#3498DB",
    borderColor: "#2980B9",
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  optionButtonTextSelected: {
    color: "#FFF",
  },
  botaoSalvar: {
    backgroundColor: "#3498DB",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  botaoRisco: {
    backgroundColor: "#27AE60",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  botaoRiscoDisabled: {
    backgroundColor: "#95A5A6",
  },
  textoBotao: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  listaTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2C3E50",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#95A5A6",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTexto: {
    fontSize: 14,
    color: "#34495E",
    marginBottom: 4,
  },
  cardBotoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  botaoEditar: {
    backgroundColor: "#F39C12",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  botaoExcluir: {
    backgroundColor: "#E74C3C",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 20,
    width: "100%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  // Card de Risco
  riskCard: {
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  riskEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  riskTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  riskProbability: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFF",
  },
  riskSubtitle: {
    fontSize: 16,
    color: "#FFF",
    opacity: 0.9,
    marginTop: 5,
  },
  riskConfidence: {
    fontSize: 14,
    color: "#FFF",
    opacity: 0.8,
    marginTop: 10,
  },
  // Recomendação
  recommendationCard: {
    backgroundColor: "#ECF0F1",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 15,
    color: "#34495E",
    lineHeight: 22,
  },
  // Fatores de Risco
  factorsCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  factorsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 15,
  },
  factorItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  factorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  factorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  factorDescription: {
    fontSize: 14,
    color: "#34495E",
    marginBottom: 8,
  },
  factorRecommendation: {
    fontSize: 13,
    color: "#7F8C8D",
    fontStyle: "italic",
    marginBottom: 10,
  },
  importanceBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  importanceFill: {
    height: "100%",
    backgroundColor: "#3498DB",
  },
  importanceText: {
    fontSize: 11,
    color: "#95A5A6",
    textAlign: "right",
  },
  // Features Card
  featuresCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  featuresSubtitle: {
    fontSize: 13,
    color: "#7F8C8D",
    marginBottom: 15,
  },
  featureItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  featureRank: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3498DB",
  },
  featureName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    flex: 1,
  },
  featureDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  featureValue: {
    fontSize: 14,
    color: "#34495E",
  },
  featureImportance: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3498DB",
  },
  featureBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  featureBarFill: {
    height: "100%",
    backgroundColor: "#3498DB",
  },
  // Erro
  errorCard: {
    alignItems: "center",
    padding: 30,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E74C3C",
    marginTop: 15,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 15,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: "#3498DB",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
