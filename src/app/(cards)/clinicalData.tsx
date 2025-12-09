import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { adicionarConsulta, listarConsultas, atualizarConsulta, deletarConsulta } from "../../services/consultasService";
import {
  predictCardiovascularRisk,
  formatPredictionForDisplay,
  type PatientClinicalData,
  type PredictionResult
} from "../../services/mlPrediction.service";
import CustomTextInput from "../../components/CustomTextInput";
import Colors from "../../components/Colors";
import { toast } from "../../utils/toast";

interface RiskFactorSaved {
  factor: string;
  description: string;
  severity: string;
  importance: number;
  recommendation: string;
}

interface FeatureImportanceSaved {
  feature: string;
  feature_name: string;
  importance: number;
  importance_percentage: number;
  value: number | string;
  value_display: string;
}

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
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  // Resultado da análise de risco (completo)
  riskAnalysis?: {
    probability: number;
    riskLevel: string;
    riskCategory: string;
    confidence: number;
    recommendation: string;
    topRiskFactors: RiskFactorSaved[];
    featureImportance: FeatureImportanceSaved[];
    analyzedAt: string;
  };
}

export default function DadosClinicosScreen() {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const formBgAnimation = React.useRef(new Animated.Value(1)).current;

  // Refs para cada campo do formulário
  const idadeRef = React.useRef<View>(null);
  const generoRef = React.useRef<View>(null);
  const alturaRef = React.useRef<View>(null);
  const pesoRef = React.useRef<View>(null);
  const pressaoAltaRef = React.useRef<View>(null);
  const pressaoBaixaRef = React.useRef<View>(null);
  const colesterolRef = React.useRef<View>(null);
  const glicoseRef = React.useRef<View>(null);
  const fumanteRef = React.useRef<View>(null);
  const alcoolRef = React.useRef<View>(null);
  const ativoRef = React.useRef<View>(null);

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

  // Estados para seleção múltipla
  const [consultasSelecionadas, setConsultasSelecionadas] = useState<string[]>([]);
  const [lastTap, setLastTap] = useState<{ id: string; time: number } | null>(null);

  // Estado para campo com erro
  const [campoComErro, setCampoComErro] = useState<string | null>(null);

  // Estados para undo
  const [consultasParaExcluir, setConsultasParaExcluir] = useState<Consulta[]>([]);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  // Estados para swipe
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);

  // Estados para filtro por data
  type FiltroData = 'todos' | 'hoje' | 'semana' | 'mes' | 'trimestre';
  const [filtroData, setFiltroData] = useState<FiltroData>('todos');

  // Estado para mostrar gráfico
  const [mostrarGrafico, setMostrarGrafico] = useState(false);

  useEffect(() => {
    // Limpar estados ao montar o componente
    idsPendentesExclusao.current = [];
    setConsultasParaExcluir([]);
    setConsultasSelecionadas([]);
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
    }
    carregarConsultas();
  }, []);

  // Filtrar consultas por data
  const consultasFiltradas = useMemo(() => {
    if (filtroData === 'todos') return consultas;

    const agora = new Date();
    const dataLimite = new Date();

    switch (filtroData) {
      case 'hoje':
        dataLimite.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        dataLimite.setDate(agora.getDate() - 7);
        break;
      case 'mes':
        dataLimite.setMonth(agora.getMonth() - 1);
        break;
      case 'trimestre':
        dataLimite.setMonth(agora.getMonth() - 3);
        break;
    }

    return consultas.filter(c => {
      const dataConsulta = c.createdAt ? new Date(c.createdAt) : null;
      return dataConsulta && dataConsulta >= dataLimite;
    });
  }, [consultas, filtroData]);

  // Consultas com análise de risco para o gráfico
  const consultasComRisco = useMemo(() => {
    return consultas
      .filter(c => c.riskAnalysis && c.createdAt)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }, [consultas]);

  // Dados para o gráfico de evolução
  const dadosGrafico = useMemo(() => {
    if (consultasComRisco.length === 0) {
      return null;
    }

    // Pegar apenas os últimos 7 para o gráfico
    const consultasRecentes = consultasComRisco.slice(-7);

    const labels = consultasRecentes.map(c => {
      const data = new Date(c.createdAt!);
      return `${data.getDate()}/${data.getMonth() + 1}`;
    });

    const dados = consultasRecentes.map(c => c.riskAnalysis!.probability);
    const ids = consultasRecentes.map(c => c.id);

    return {
      labels,
      datasets: [{
        data: dados,
        strokeWidth: 2,
      }],
      consultaIds: ids,
    };
  }, [consultasComRisco]);

  // Refs para os cards de consulta
  const consultaRefs = useRef<{ [key: string]: View | null }>({});

  // Função para rolar até uma consulta específica
  const handleBarPress = (consultaId: string | undefined) => {
    if (!consultaId) return;

    // Fechar o gráfico
    setMostrarGrafico(false);

    // Encontrar a consulta na lista filtrada
    const consulta = consultasFiltradas.find(c => c.id === consultaId);
    if (!consulta) {
      // Se não encontrar na lista filtrada, limpar o filtro
      setFiltroData('todos');
    }

    // Esperar um pouco para o gráfico fechar e rolar até a consulta
    setTimeout(() => {
      const ref = consultaRefs.current[consultaId];
      if (ref) {
        ref.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => { }
        );
      }

      // Destacar a consulta temporariamente
      setConsultaDestacada(consultaId);
      setTimeout(() => setConsultaDestacada(null), 2000);
    }, 300);

    toast.info("Consulta selecionada", "Consulta do gráfico destacada");
  };

  // Estado para destacar consulta
  const [consultaDestacada, setConsultaDestacada] = useState<string | null>(null);

  // IDs pendentes de exclusão (para filtrar ao recarregar)
  const idsPendentesExclusao = useRef<string[]>([]);

  const carregarConsultas = async () => {
    try {
      const data = await listarConsultas();
      console.log('[ClinicalData] Consultas carregadas do Firebase:', data.length);

      // Simplesmente usar as consultas do Firebase (são a fonte da verdade)
      // Filtrar apenas consultas pendentes de exclusão local
      const consultasFiltradas = (data as Consulta[]).filter(
        c => c.id && !idsPendentesExclusao.current.includes(c.id)
      );

      console.log('[ClinicalData] Consultas após filtro:', consultasFiltradas.length);
      setConsultas(consultasFiltradas);
    } catch (error) {
      console.error('[ClinicalData] Erro ao carregar consultas:', error);
      toast.error("Erro", "Não foi possível carregar as consultas");
    }
  };

  const handleSalvar = async () => {
    // Validar apenas os campos obrigatórios (excluir IMC que é calculado automaticamente)
    const camposObrigatorios: (keyof Consulta)[] = [
      'idade', 'genero', 'altura', 'peso',
      'pressaoAlta', 'pressaoBaixa', 'colesterol', 'glicose',
      'fumante', 'alcool', 'ativo'
    ];

    const campoVazio = camposObrigatorios.find(campo => {
      const valor = consulta[campo];
      return !valor || (typeof valor === 'string' && valor.trim() === '');
    });
    if (campoVazio) {
      // Mapeamento de campos para refs e nomes amigáveis
      const campoParaRef: Record<string, { ref: React.RefObject<View | null>, nome: string }> = {
        'idade': { ref: idadeRef, nome: 'Idade' },
        'genero': { ref: generoRef, nome: 'Sexo' },
        'altura': { ref: alturaRef, nome: 'Altura' },
        'peso': { ref: pesoRef, nome: 'Peso' },
        'pressaoAlta': { ref: pressaoAltaRef, nome: 'Pressão Sistólica' },
        'pressaoBaixa': { ref: pressaoBaixaRef, nome: 'Pressão Diastólica' },
        'colesterol': { ref: colesterolRef, nome: 'Colesterol' },
        'glicose': { ref: glicoseRef, nome: 'Glicose' },
        'fumante': { ref: fumanteRef, nome: 'Fumante' },
        'alcool': { ref: alcoolRef, nome: 'Álcool' },
        'ativo': { ref: ativoRef, nome: 'Atividade Física' },
      };

      const campoInfo = campoParaRef[campoVazio];
      setCampoComErro(campoVazio);

      // Scroll para o campo vazio
      campoInfo.ref.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        },
        () => { }
      );

      toast.warning(`Campo obrigatório`, `Preencha o campo "${campoInfo.nome}"`);

      // Remove o destaque após 3 segundos
      setTimeout(() => {
        setCampoComErro(null);
      }, 3000);

      return;
    }

    // Validações de range
    const idade = parseInt(consulta.idade);
    const altura = parseInt(consulta.altura);
    const peso = parseFloat(consulta.peso);
    const pressaoAlta = parseInt(consulta.pressaoAlta);
    const pressaoBaixa = parseInt(consulta.pressaoBaixa);

    // Validar idade (18-140 anos)
    if (idade < 18 || idade > 140) {
      setCampoComErro('idade');
      idadeRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => scrollViewRef.current?.scrollTo({ y: y - 100, animated: true }),
        () => { }
      );
      toast.warning("Valor inválido", "A idade deve estar entre 18 e 140 anos");
      setTimeout(() => setCampoComErro(null), 3000);
      return;
    }

    // Validar altura (100-250 cm)
    if (altura < 100 || altura > 250) {
      setCampoComErro('altura');
      alturaRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => scrollViewRef.current?.scrollTo({ y: y - 100, animated: true }),
        () => { }
      );
      toast.warning("Valor inválido", "A altura deve estar entre 100 e 250 cm");
      setTimeout(() => setCampoComErro(null), 3000);
      return;
    }

    // Validar peso (30-300 kg)
    if (peso < 30 || peso > 300) {
      setCampoComErro('peso');
      pesoRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => scrollViewRef.current?.scrollTo({ y: y - 100, animated: true }),
        () => { }
      );
      toast.warning("Valor inválido", "O peso deve estar entre 30 e 300 kg");
      setTimeout(() => setCampoComErro(null), 3000);
      return;
    }

    // Validar pressão sistólica (60-250 mmHg)
    if (pressaoAlta < 60 || pressaoAlta > 250) {
      setCampoComErro('pressaoAlta');
      pressaoAltaRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => scrollViewRef.current?.scrollTo({ y: y - 100, animated: true }),
        () => { }
      );
      toast.warning("Valor inválido", "A pressão sistólica deve estar entre 60 e 250 mmHg");
      setTimeout(() => setCampoComErro(null), 3000);
      return;
    }

    // Validar pressão diastólica (40-150 mmHg)
    if (pressaoBaixa < 40 || pressaoBaixa > 150) {
      setCampoComErro('pressaoBaixa');
      pressaoBaixaRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => scrollViewRef.current?.scrollTo({ y: y - 100, animated: true }),
        () => { }
      );
      toast.warning("Valor inválido", "A pressão diastólica deve estar entre 40 e 150 mmHg");
      setTimeout(() => setCampoComErro(null), 3000);
      return;
    }

    // Validar que pressão sistólica > diastólica
    if (pressaoAlta <= pressaoBaixa) {
      setCampoComErro('pressaoAlta');
      pressaoAltaRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => scrollViewRef.current?.scrollTo({ y: y - 100, animated: true }),
        () => { }
      );
      toast.warning("Valor inválido", "A pressão sistólica deve ser maior que a diastólica");
      setTimeout(() => setCampoComErro(null), 3000);
      return;
    }

    if (editandoId) {
      await atualizarConsulta(editandoId, consulta);
      toast.success("Sucesso", "Consulta atualizada!");
      setEditandoId(null);
    } else {
      await adicionarConsulta(consulta);
      toast.success("Sucesso", "Consulta salva!");
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
      toast.warning("É necessário preencher todos os campos", "Preencha todos os campos antes de analisar o risco.");
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

      // Salvar resultado COMPLETO da análise na consulta
      setConsulta({
        ...consulta,
        riskAnalysis: {
          probability: prediction.probability,
          riskLevel: prediction.risk_level,
          riskCategory: prediction.risk_category,
          confidence: prediction.confidence,
          recommendation: prediction.recommendation,
          topRiskFactors: prediction.top_risk_factors.map(f => ({
            factor: f.factor,
            description: f.description,
            severity: f.severity,
            importance: f.importance,
            recommendation: f.recommendation
          })),
          featureImportance: prediction.feature_importance.map(f => ({
            feature: f.feature,
            feature_name: f.feature_name,
            importance: f.importance,
            importance_percentage: f.importance_percentage,
            value: f.value,
            value_display: f.value_display
          })),
          analyzedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[ClinicalData] Erro na análise:', error);
      toast.error(
        "Erro ao analisar",
        "Ocorreu um erro ao analisar os dados. Verifique se todos os campos estão preenchidos corretamente."
      );
    } finally {
      setAnalisando(false);
    }
  };

  const handleEditar = (item: Consulta) => {
    setConsulta(item);
    setEditandoId(item.id || null);

    // Animação de destaque do formulário
    Animated.sequence([
      Animated.timing(formBgAnimation, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(formBgAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    // Scroll suave para o topo para mostrar o formulário
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);

    toast.info("Editando", "Consulta carregada para edição");
  };

  const handleMostrarAnalise = (item: Consulta) => {
    if (!item.riskAnalysis) return;

    // Criar objeto de resultado COMPLETO a partir da análise salva
    const savedResult: PredictionResult = {
      success: true,
      probability: item.riskAnalysis.probability,
      risk_level: (item.riskAnalysis.riskLevel as 'baixo' | 'médio' | 'alto') ||
        (item.riskAnalysis.probability >= 70 ? 'alto' :
          item.riskAnalysis.probability >= 40 ? 'médio' : 'baixo'),
      risk_category: (item.riskAnalysis.riskCategory as 'sem_risco' | 'risco_moderado' | 'alto_risco') ||
        (item.riskAnalysis.probability >= 70 ? 'alto_risco' :
          item.riskAnalysis.probability >= 40 ? 'risco_moderado' : 'sem_risco'),
      confidence: item.riskAnalysis.confidence || 85,
      recommendation: item.riskAnalysis.recommendation,
      top_risk_factors: (item.riskAnalysis.topRiskFactors || []).map(f => ({
        factor: f.factor,
        description: f.description,
        severity: f.severity as 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRÍTICO',
        importance: f.importance,
        recommendation: f.recommendation
      })),
      feature_importance: (item.riskAnalysis.featureImportance || []).map(f => ({
        feature: f.feature,
        feature_name: f.feature_name,
        importance: f.importance,
        importance_percentage: f.importance_percentage,
        value: f.value,
        value_display: f.value_display
      })),
    };

    // Também carregar a consulta para mostrar a data no modal
    setConsulta(item);
    setResultado(savedResult);
    setModalVisible(true);
  };

  const handleDuploClique = (item: Consulta) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300; // 300ms para considerar duplo clique

    if (lastTap && lastTap.id === item.id && (now - lastTap.time) < DOUBLE_PRESS_DELAY) {
      // Duplo clique detectado - editar
      handleEditar(item);
      setLastTap(null);
    } else {
      // Primeiro clique
      setLastTap({ id: item.id || '', time: now });
    }
  };

  const handleToggleSelect = (consultaId: string) => {
    setConsultasSelecionadas(prev =>
      prev.includes(consultaId)
        ? prev.filter(id => id !== consultaId)
        : [...prev, consultaId]
    );
  };

  const handleDeleteSelected = () => {
    if (consultasSelecionadas.length === 0) return;

    // Cancelar qualquer timer anterior
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
      // Limpar IDs pendentes anteriores
      idsPendentesExclusao.current = [];
    }

    // Guardar consultas antes de excluir (para undo)
    const consultasAExcluir = consultas.filter(c => consultasSelecionadas.includes(c.id || ''));
    setConsultasParaExcluir(consultasAExcluir);

    // Guardar os IDs que serão excluídos
    const idsParaExcluir = [...consultasSelecionadas];

    // Marcar como pendentes de exclusão (para filtrar ao recarregar)
    idsPendentesExclusao.current = idsParaExcluir;

    // Remover da lista imediatamente (UI)
    setConsultas(prev => prev.filter(c => !idsParaExcluir.includes(c.id || '')));

    const quantidade = idsParaExcluir.length;

    // Timer de 5 segundos para excluir permanentemente
    const timer = setTimeout(async () => {
      try {
        await Promise.all(idsParaExcluir.map(id => deletarConsulta(id)));
        setConsultasParaExcluir([]);
        // Limpar IDs pendentes após exclusão bem-sucedida
        idsPendentesExclusao.current = [];
        toast.success("Excluído", `${quantidade} consulta${quantidade > 1 ? 's removidas' : ' removida'} permanentemente`);
      } catch (error) {
        // Se der erro, limpar pendentes e recarregar do banco
        idsPendentesExclusao.current = [];
        await carregarConsultas();
        toast.error("Erro", "Não foi possível excluir as consultas.");
      }
    }, 5000);

    setUndoTimer(timer);
    setConsultasSelecionadas([]);
  };

  const handleUndo = () => {
    // Cancelar timer de exclusão
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
    }

    // Limpar IDs pendentes de exclusão
    idsPendentesExclusao.current = [];

    // Restaurar consultas (evitar duplicatas)
    setConsultas(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const novaConsultas = consultasParaExcluir.filter(c => !existingIds.has(c.id));
      return [...prev, ...novaConsultas];
    });
    setConsultasParaExcluir([]);

    toast.success("Desfeito", "Consultas restauradas!");
  };

  const handleRemover = async () => {
    // Função antiga mantida por compatibilidade, mas não usada
  };

  // Componente de Card com Swipe
  const SwipeableCard = ({ item }: { item: Consulta }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const isDestacada = consultaDestacada === item.id;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 5;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            // Só permite arrastar para a esquerda
            translateX.setValue(Math.max(gestureState.dx, -80));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -40) {
            // Se arrastou mais de 40px, vai direto para edição
            handleEditar(item);
            // Volta para a posição inicial
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          } else {
            // Volta para a posição inicial
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            if (swipedItemId === item.id) {
              setSwipedItemId(null);
            }
          }
        },
      })
    ).current;

    // Fecha o swipe se outro item for aberto
    useEffect(() => {
      if (swipedItemId !== item.id && swipedItemId !== null) {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }, [swipedItemId]);

    return (
      <View
        style={[styles.swipeContainer, isDestacada && styles.cardDestacado]}
        ref={(ref) => { if (item.id) consultaRefs.current[item.id] = ref; }}
      >
        {/* Botão de Editar (atrás do card) */}
        <View style={styles.swipeEditAction}>
          <TouchableOpacity
            style={styles.swipeEditButton}
            onPress={() => {
              handleEditar(item);
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
              setSwipedItemId(null);
            }}
          >
            <Ionicons name="create-outline" size={24} color={Colors.white} />
            <Text style={styles.swipeActionText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Card que pode ser arrastado */}
        <Animated.View
          style={[
            styles.swipeableCardWrapper,
            { transform: [{ translateX }] }
          ]}
          {...panResponder.panHandlers}
        >
          <Pressable
            onPress={() => {
              if (swipedItemId === item.id) {
                // Se está aberto, fecha
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                }).start();
                setSwipedItemId(null);
              } else {
                handleDuploClique(item);
              }
            }}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
              consultasSelecionadas.includes(item.id || '') && styles.cardSelected
            ]}
          >
            <View style={styles.cardContent}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleToggleSelect(item.id || '')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={[
                  styles.checkbox,
                  consultasSelecionadas.includes(item.id || '') && styles.checkboxSelected
                ]}>
                  {consultasSelecionadas.includes(item.id || '') && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.cardInfo}>
                <View style={styles.cardMainInfo}>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTexto}>Idade: {item.idade} | Gênero: {item.genero}</Text>
                    <Text style={styles.cardTexto}>Peso: {item.peso}kg | Altura: {item.altura}cm</Text>
                    <Text style={styles.cardTexto}>Pressão: {item.pressaoAlta}/{item.pressaoBaixa} mmHg</Text>
                  </View>

                  {/* Badge de Análise de Risco */}
                  {item.riskAnalysis && (
                    <TouchableOpacity
                      style={styles.riskBadgeContainer}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleMostrarAnalise(item);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.riskBadge,
                        {
                          backgroundColor:
                            item.riskAnalysis.probability >= 70 ? '#E74C3C' :
                              item.riskAnalysis.probability >= 40 ? '#F39C12' :
                                '#27AE60'
                        }
                      ]}>
                        <Ionicons name="fitness" size={14} color="#FFF" />
                        <Text style={styles.riskBadgeText}>
                          {item.riskAnalysis.probability.toFixed(0)}%
                        </Text>
                      </View>
                      <Text style={styles.riskBadgeLabel}>
                        {item.riskAnalysis.probability >= 70 ? 'Alto Risco' :
                          item.riskAnalysis.probability >= 40 ? 'Risco Moderado' :
                            'Baixo Risco'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  // Validar apenas os campos obrigatórios (excluir IMC que é calculado automaticamente)
  const camposObrigatoriosValidacao: (keyof Consulta)[] = [
    'idade', 'genero', 'altura', 'peso',
    'pressaoAlta', 'pressaoBaixa', 'colesterol', 'glicose',
    'fumante', 'alcool', 'ativo'
  ];
  const todosPreenchidos = camposObrigatoriosValidacao.every(campo => {
    const valor = consulta[campo];
    return valor && typeof valor === 'string' && valor.trim() !== '';
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.titulo}>Dados Clínicos</Text>
          {editandoId && (
            <View style={styles.editingBadge}>
              <Ionicons name="create-outline" size={16} color={Colors.white} />
              <Text style={styles.editingBadgeText}>Editando</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitulo}>
          {editandoId
            ? "Atualize os dados da consulta abaixo"
            : "Preencha seus dados para análise de risco cardiovascular"}
        </Text>

        {/* Formulário */}
        <Animated.View
          style={[
            styles.form,
            {
              transform: [{ scale: formBgAnimation }],
            },
            editandoId && styles.formEditing
          ]}
        >
          {/* Seção: Dados Demográficos */}
          <Text style={styles.secaoTitulo}>📋 Dados Demográficos</Text>

          <View ref={idadeRef} style={campoComErro === 'idade' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Idade (anos)</Text>
            <CustomTextInput
              containerStyle={{ width: '100%' }}
              keyboardType="numeric"
              placeholder="Ex: 45"
              value={consulta.idade}
              onChangeText={v => {
                setConsulta({ ...consulta, idade: v });
                if (campoComErro === 'idade') setCampoComErro(null);
              }}
              backgroundColor={Colors.white}
              placeholderTextColor={Colors.gray}
              outlineColor={campoComErro === 'idade' ? Colors.red : Colors.gray}
              blurredBackgroundColor={Colors.lightestBlue}
            />
          </View>

          <View ref={generoRef} style={campoComErro === 'genero' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Sexo</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.genero === 'Masculino' && styles.optionButtonSelected,
                  campoComErro === 'genero' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, genero: 'Masculino' });
                  if (campoComErro === 'genero') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.genero === 'Masculino' && styles.optionButtonTextSelected]}>
                  Masculino
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.genero === 'Feminino' && styles.optionButtonSelected,
                  campoComErro === 'genero' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, genero: 'Feminino' });
                  if (campoComErro === 'genero') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.genero === 'Feminino' && styles.optionButtonTextSelected]}>
                  Feminino
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Seção: Medidas Físicas */}
          <Text style={styles.secaoTitulo}>📏 Medidas Físicas</Text>

          <View ref={alturaRef} style={campoComErro === 'altura' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Altura (cm)</Text>
            <CustomTextInput
              containerStyle={{ width: '100%' }}
              keyboardType="numeric"
              placeholder="Ex: 175"
              value={consulta.altura}
              onChangeText={v => {
                setConsulta({ ...consulta, altura: v });
                if (campoComErro === 'altura') setCampoComErro(null);
              }}
              backgroundColor={Colors.white}
              placeholderTextColor={Colors.gray}
              outlineColor={campoComErro === 'altura' ? Colors.red : Colors.gray}
              blurredBackgroundColor={Colors.lightestBlue}
            />
          </View>

          <View ref={pesoRef} style={campoComErro === 'peso' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Peso (kg)</Text>
            <CustomTextInput
              containerStyle={{ width: '100%' }}
              keyboardType="decimal-pad"
              placeholder="Ex: 80"
              value={consulta.peso}
              onChangeText={v => {
                setConsulta({ ...consulta, peso: v });
                if (campoComErro === 'peso') setCampoComErro(null);
              }}
              backgroundColor={Colors.white}
              placeholderTextColor={Colors.gray}
              outlineColor={campoComErro === 'peso' ? Colors.red : Colors.gray}
              blurredBackgroundColor={Colors.lightestBlue}
            />
          </View>

          {/* Seção: Pressão Arterial */}
          <Text style={styles.secaoTitulo}>❤️ Pressão Arterial</Text>

          <View ref={pressaoAltaRef} style={campoComErro === 'pressaoAlta' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Pressão Sistólica (Alta) - mmHg</Text>
            <CustomTextInput
              containerStyle={{ width: '100%' }}
              keyboardType="numeric"
              placeholder="Ex: 120"
              value={consulta.pressaoAlta}
              onChangeText={v => {
                setConsulta({ ...consulta, pressaoAlta: v });
                if (campoComErro === 'pressaoAlta') setCampoComErro(null);
              }}
              backgroundColor={Colors.white}
              placeholderTextColor={Colors.gray}
              outlineColor={campoComErro === 'pressaoAlta' ? Colors.red : Colors.gray}
              blurredBackgroundColor={Colors.lightestBlue}
            />
          </View>

          <View ref={pressaoBaixaRef} style={campoComErro === 'pressaoBaixa' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Pressão Diastólica (Baixa) - mmHg</Text>
            <CustomTextInput
              containerStyle={{ width: '100%' }}
              keyboardType="numeric"
              placeholder="Ex: 80"
              value={consulta.pressaoBaixa}
              onChangeText={v => {
                setConsulta({ ...consulta, pressaoBaixa: v });
                if (campoComErro === 'pressaoBaixa') setCampoComErro(null);
              }}
              backgroundColor={Colors.white}
              placeholderTextColor={Colors.gray}
              outlineColor={campoComErro === 'pressaoBaixa' ? Colors.red : Colors.gray}
              blurredBackgroundColor={Colors.lightestBlue}
            />
          </View>

          {/* Seção: Exames Laboratoriais */}
          <Text style={styles.secaoTitulo}>🔬 Exames Laboratoriais</Text>

          <View ref={colesterolRef} style={campoComErro === 'colesterol' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Colesterol</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.colesterol === 'Normal' && styles.optionButtonSelected,
                  campoComErro === 'colesterol' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, colesterol: 'Normal' });
                  if (campoComErro === 'colesterol') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.colesterol === 'Normal' && styles.optionButtonTextSelected]}>
                  Normal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.colesterol === 'Alto' && styles.optionButtonSelected,
                  campoComErro === 'colesterol' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, colesterol: 'Alto' });
                  if (campoComErro === 'colesterol') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.colesterol === 'Alto' && styles.optionButtonTextSelected]}>
                  Alto
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View ref={glicoseRef} style={campoComErro === 'glicose' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Glicose</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.glicose === 'Normal' && styles.optionButtonSelected,
                  campoComErro === 'glicose' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, glicose: 'Normal' });
                  if (campoComErro === 'glicose') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.glicose === 'Normal' && styles.optionButtonTextSelected]}>
                  Normal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.glicose === 'Alta' && styles.optionButtonSelected,
                  campoComErro === 'glicose' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, glicose: 'Alta' });
                  if (campoComErro === 'glicose') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.glicose === 'Alta' && styles.optionButtonTextSelected]}>
                  Alta
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Seção: Hábitos de Vida */}
          <Text style={styles.secaoTitulo}>🏃 Hábitos de Vida</Text>

          <View ref={fumanteRef} style={campoComErro === 'fumante' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Você fuma?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.fumante === 'Não' && styles.optionButtonSelected,
                  campoComErro === 'fumante' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, fumante: 'Não' });
                  if (campoComErro === 'fumante') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.fumante === 'Não' && styles.optionButtonTextSelected]}>
                  Não
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.fumante === 'Sim' && styles.optionButtonSelected,
                  campoComErro === 'fumante' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, fumante: 'Sim' });
                  if (campoComErro === 'fumante') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.fumante === 'Sim' && styles.optionButtonTextSelected]}>
                  Sim
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View ref={alcoolRef} style={campoComErro === 'alcool' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Consome álcool regularmente?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.alcool === 'Não' && styles.optionButtonSelected,
                  campoComErro === 'alcool' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, alcool: 'Não' });
                  if (campoComErro === 'alcool') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.alcool === 'Não' && styles.optionButtonTextSelected]}>
                  Não
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.alcool === 'Sim' && styles.optionButtonSelected,
                  campoComErro === 'alcool' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, alcool: 'Sim' });
                  if (campoComErro === 'alcool') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.alcool === 'Sim' && styles.optionButtonTextSelected]}>
                  Sim
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View ref={ativoRef} style={campoComErro === 'ativo' ? styles.campoComErro : undefined}>
            <Text style={styles.label}>Pratica atividade física regular?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.ativo === 'Não' && styles.optionButtonSelected,
                  campoComErro === 'ativo' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, ativo: 'Não' });
                  if (campoComErro === 'ativo') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.ativo === 'Não' && styles.optionButtonTextSelected]}>
                  Não
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  consulta.ativo === 'Sim' && styles.optionButtonSelected,
                  campoComErro === 'ativo' && styles.buttonComErro
                ]}
                onPress={() => {
                  setConsulta({ ...consulta, ativo: 'Sim' });
                  if (campoComErro === 'ativo') setCampoComErro(null);
                }}
              >
                <Text style={[styles.optionButtonText, consulta.ativo === 'Sim' && styles.optionButtonTextSelected]}>
                  Sim
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botões de Ação */}
          {editandoId && (
            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={() => {
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
                setEditandoId(null);
                toast.info("Cancelado", "Edição cancelada");
              }}
            >
              <Ionicons name="close-outline" size={20} color={Colors.red} />
              <Text style={styles.textoBotaoCancelar}>Cancelar Edição</Text>
            </TouchableOpacity>
          )}

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
        </Animated.View>

        {/* Lista de Consultas Salvas */}
        <Text style={styles.listaTitulo}>Consultas Salvas</Text>

        {/* Filtros por Data */}
        <View style={styles.filtroContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroScroll}>
            {[
              { key: 'todos' as FiltroData, label: 'Todos' },
              { key: 'hoje' as FiltroData, label: 'Hoje' },
              { key: 'semana' as FiltroData, label: 'Semana' },
              { key: 'mes' as FiltroData, label: 'Mês' },
              { key: 'trimestre' as FiltroData, label: 'Trimestre' },
            ].map(filtro => (
              <TouchableOpacity
                key={filtro.key}
                style={[
                  styles.filtroButton,
                  filtroData === filtro.key && styles.filtroButtonAtivo
                ]}
                onPress={() => setFiltroData(filtro.key)}
              >
                <Text style={[
                  styles.filtroButtonText,
                  filtroData === filtro.key && styles.filtroButtonTextAtivo
                ]}>
                  {filtro.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Botão para mostrar/ocultar gráfico */}
        {consultasComRisco.length >= 2 && (
          <TouchableOpacity
            style={[
              styles.graficoToggle,
              mostrarGrafico && { backgroundColor: Colors.blue }
            ]}
            onPress={() => setMostrarGrafico(!mostrarGrafico)}
          >
            <Ionicons
              name={mostrarGrafico ? "analytics" : "analytics-outline"}
              size={20}
              color={mostrarGrafico ? Colors.white : Colors.blue}
            />
            <Text style={[
              styles.graficoToggleText,
              mostrarGrafico && styles.graficoToggleTextAtivo
            ]}>
              {mostrarGrafico ? 'Ocultar Evolução' : 'Ver Evolução do Risco'}
            </Text>
            <Ionicons
              name={mostrarGrafico ? "chevron-up" : "chevron-down"}
              size={18}
              color={mostrarGrafico ? Colors.white : Colors.blue}
            />
          </TouchableOpacity>
        )}

        {/* Gráfico de Evolução */}
        {mostrarGrafico && dadosGrafico && (
          <View style={styles.graficoContainer}>
            <Text style={styles.graficoTitulo}>📈 Evolução do Risco Cardiovascular</Text>
            <Text style={styles.graficoSubtitulo}>
              Baseado em {consultasComRisco.length} análise{consultasComRisco.length > 1 ? 's' : ''}
            </Text>

            {/* Gráfico de Barras Customizado */}
            <View style={styles.barChartContainer}>
              {/* Linhas de referência */}
              <View style={styles.chartGridLines}>
                <View style={styles.gridLine}>
                  <Text style={styles.gridLabel}>100%</Text>
                  <View style={styles.gridDash} />
                </View>
                <View style={styles.gridLine}>
                  <Text style={[styles.gridLabel, { color: '#E74C3C' }]}>70%</Text>
                  <View style={[styles.gridDash, { borderColor: '#E74C3C' }]} />
                </View>
                <View style={styles.gridLine}>
                  <Text style={[styles.gridLabel, { color: '#F39C12' }]}>40%</Text>
                  <View style={[styles.gridDash, { borderColor: '#F39C12' }]} />
                </View>
                <View style={styles.gridLine}>
                  <Text style={styles.gridLabel}>0%</Text>
                  <View style={styles.gridDash} />
                </View>
              </View>

              {/* Barras */}
              <View style={styles.barsContainer}>
                {dadosGrafico.datasets[0].data.map((valor: number, index: number) => {
                  const altura = Math.max((valor / 100) * 150, 5);
                  const cor = valor >= 70 ? '#E74C3C' : valor >= 40 ? '#F39C12' : '#27AE60';
                  const consultaId = dadosGrafico.consultaIds[index];
                  return (
                    <TouchableOpacity
                      key={`bar-${index}-${consultaId || 'unknown'}`}
                      style={styles.barWrapper}
                      onPress={() => handleBarPress(consultaId)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.barColumn}>
                        <Text style={styles.barValue}>{valor.toFixed(0)}%</Text>
                        <View style={[styles.bar, { height: altura, backgroundColor: cor }]} />
                      </View>
                      <Text style={styles.barLabel}>{dadosGrafico.labels[index]}</Text>
                      <Ionicons name="open-outline" size={12} color={Colors.gray} style={{ marginTop: 2 }} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.graficoLegenda}>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaCor, { backgroundColor: '#27AE60' }]} />
                <Text style={styles.legendaTexto}>&lt;40% Baixo</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaCor, { backgroundColor: '#F39C12' }]} />
                <Text style={styles.legendaTexto}>40-70% Moderado</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaCor, { backgroundColor: '#E74C3C' }]} />
                <Text style={styles.legendaTexto}>&gt;70% Alto</Text>
              </View>
            </View>
          </View>
        )}

        {consultas.length > 0 && (
          <Text style={styles.listaHint}>
            💡 Arraste o card para a esquerda para editar ou marque as consultas para excluir
          </Text>
        )}

        {/* Contador de resultados */}
        {filtroData !== 'todos' && (
          <Text style={styles.contadorResultados}>
            Mostrando {consultasFiltradas.length} de {consultas.length} consulta{consultas.length !== 1 ? 's' : ''}
          </Text>
        )}

        {consultasFiltradas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>
              {filtroData === 'todos' ? 'Nenhuma consulta salva' : 'Nenhuma consulta neste período'}
            </Text>
          </View>
        ) : (
          consultasFiltradas.map((item, index) => {
            return <SwipeableCard key={item.id || `consulta-${index}`} item={item} />;
          })
        )}
      </ScrollView>

      {/* Botão Flutuante de Exclusão */}
      {consultasSelecionadas.length > 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={styles.floatingDeleteButton}
            onPress={handleDeleteSelected}
          >
            <Ionicons name="trash-outline" size={24} color="#FFF" />
            <Text style={styles.floatingDeleteText}>
              Excluir {consultasSelecionadas.length}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Snackbar de Undo */}
      {consultasParaExcluir.length > 0 && (
        <View style={styles.undoSnackbar}>
          <View style={styles.undoContent}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.undoText}>
              {consultasParaExcluir.length} consulta{consultasParaExcluir.length > 1 ? 's excluídas' : ' excluída'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
            <Text style={styles.undoButtonText}>DESFAZER</Text>
          </TouchableOpacity>
        </View>
      )}

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
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitulo}>Análise de Risco Cardiovascular</Text>
                  {consulta.riskAnalysis && (
                    <Text style={styles.modalSubtitle}>
                      Análise salva • {new Date(consulta.riskAnalysis.analyzedAt).toLocaleDateString('pt-BR')}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close-circle" size={32} color={Colors.gray} />
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
                              {
                                backgroundColor:
                                  factor.severity === 'CRÍTICO' ? Colors.red :
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
  formEditing: {
    borderWidth: 3,
    borderColor: Colors.blue,
    shadowColor: Colors.blue,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
    backgroundColor: "#F0F2FF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E8FF",
  },
  optionButtonSelected: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.gray,
  },
  optionButtonTextSelected: {
    color: "#FFF",
  },
  botaoSalvar: {
    backgroundColor: Colors.red,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  botaoRisco: {
    backgroundColor: Colors.blue,
    borderRadius: 8,
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
  listaHint: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 15,
    textAlign: "center",
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
    borderRadius: 8,
    padding: 15,
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
    backgroundColor: Colors.blue,
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  botaoExcluir: {
    backgroundColor: Colors.red,
    padding: 10,
    borderRadius: 8,
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
  modalTitleContainer: {
    flex: 1,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 4,
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
    color: Colors.darkGray,
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 15,
    color: Colors.darkGray2,
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
    color: Colors.darkGray,
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
    color: Colors.darkGray,
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
    color: Colors.darkGray2,
    marginBottom: 8,
  },
  factorRecommendation: {
    fontSize: 13,
    color: Colors.gray,
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
    backgroundColor: Colors.lightBlue2,
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
    color: Colors.darkGray,
    marginBottom: 5,
  },
  featuresSubtitle: {
    fontSize: 13,
    color: Colors.gray,
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
    color: Colors.blue,
  },
  featureName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.darkGray,
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
    color: Colors.darkGray2,
  },
  featureImportance: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.blue,
  },
  featureBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  featureBarFill: {
    height: "100%",
    backgroundColor: Colors.lightBlue2,
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
    backgroundColor: Colors.lightBlue2,
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
  // Estilos para interação do card
  cardPressed: {
    backgroundColor: "#F0F2F5",
    transform: [{ scale: 0.98 }],
  },
  cardSelected: {
    borderColor: Colors.red,
    borderWidth: 2,
    backgroundColor: "#FFF5F5",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  checkboxSelected: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  cardInfo: {
    flex: 1,
  },
  cardMainInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  riskBadgeContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginBottom: 4,
  },
  riskBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  riskBadgeLabel: {
    fontSize: 10,
    color: Colors.gray,
    textAlign: "center",
    fontWeight: "600",
  },
  cardHint: {
    fontSize: 11,
    color: Colors.gray,
    fontStyle: "italic",
    marginTop: 8,
  },
  // Botão flutuante de exclusão
  floatingButtonContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingDeleteButton: {
    backgroundColor: Colors.red,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
  },
  floatingDeleteText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Snackbar de Undo
  undoSnackbar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.red,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  undoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  undoText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "500",
  },
  undoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 8,
  },
  undoButtonText: {
    color: Colors.red,
    fontSize: 15,
    fontWeight: "bold",
  },
  // Modal de exclusão
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 30,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 15,
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 15,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
  },
  deleteModalButtonCancel: {
    flex: 1,
    backgroundColor: "#ECF0F1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteModalButtonTextCancel: {
    color: "#2C3E50",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteModalButtonConfirm: {
    flex: 1,
    backgroundColor: Colors.red,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteModalButtonTextConfirm: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Header do formulário
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  editingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  editingBadgeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  // Botão de cancelar edição
  botaoCancelar: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.red,
  },
  textoBotaoCancelar: {
    color: Colors.red,
    fontWeight: "bold",
    fontSize: 16,
  },
  // Estilos para campos com erro
  campoComErro: {
    borderWidth: 2,
    borderColor: Colors.red,
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
    backgroundColor: Colors.lightRed + '30',
  },
  buttonComErro: {
    borderColor: Colors.red,
    borderWidth: 2,
  },
  // Ações de swipe
  swipeContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  cardDestacado: {
    borderWidth: 3,
    borderColor: Colors.blue,
    borderRadius: 14,
    backgroundColor: '#E8F4FD',
  },
  swipeableCardWrapper: {
    backgroundColor: 'transparent',
  },
  swipeEditAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Colors.blue,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  swipeEditButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  // Estilos para Filtro por Data
  filtroContainer: {
    marginBottom: 15,
  },
  filtroScroll: {
    paddingHorizontal: 5,
    gap: 10,
  },
  filtroButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2FF',
    borderWidth: 1,
    borderColor: '#E5E8FF',
  },
  filtroButtonAtivo: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  filtroButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
  },
  filtroButtonTextAtivo: {
    color: Colors.white,
  },
  contadorResultados: {
    fontSize: 13,
    color: Colors.gray,
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
  },
  // Estilos para Gráfico de Evolução
  graficoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F0F2FF',
    borderWidth: 1,
    borderColor: Colors.blue,
    marginBottom: 15,
    gap: 8,
  },
  graficoToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.blue,
  },
  graficoToggleTextAtivo: {
    color: Colors.white,
  },
  graficoContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  graficoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 5,
  },
  graficoSubtitulo: {
    fontSize: 13,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 15,
  },
  graficoLegenda: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendaCor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendaTexto: {
    fontSize: 12,
    color: Colors.gray,
  },
  // Estilos para Gráfico de Barras Customizado
  barChartContainer: {
    marginVertical: 15,
    position: 'relative',
  },
  chartGridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 30,
    justifyContent: 'space-between',
    zIndex: 0,
  },
  gridLine: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  gridLabel: {
    fontSize: 11,
    color: Colors.gray,
    width: 35,
    textAlign: 'right',
    marginRight: 5,
  },
  gridDash: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: '#E5E8FF',
    borderStyle: 'dashed',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    marginLeft: 40,
    paddingTop: 10,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 50,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 150,
  },
  bar: {
    width: 28,
    borderRadius: 6,
    minHeight: 5,
  },
  barValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 6,
    textAlign: 'center',
  },
});
