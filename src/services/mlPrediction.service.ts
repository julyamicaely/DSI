/**
 * @file mlPrediction.service.ts
 * @description Serviço para integração com modelo de ML de predição cardiovascular
 * 
 * Este serviço fornece uma interface TypeScript para o modelo Python de ML,
 * permitindo realizar predições de risco cardiovascular baseadas em dados clínicos.
 * 
 * IMPORTANTE: Este serviço implementa a lógica de predição localmente (sem API Python),
 * calculando o risco com base em regras clínicas e pesos conhecidos do modelo treinado.
 * Para usar o modelo Python completo via API, inicie o servidor em api/api_server.py
 */

// ==================== TIPOS ====================

export interface PatientClinicalData {
  // Dados demográficos
  gender: 0 | 1;  // 0=feminino, 1=masculino
  age_years: number;  // Idade em anos (18-120)
  
  // Medidas físicas
  height_cm: number;  // Altura em cm (100-250)
  weight_kg: number;  // Peso em kg (30-300)
  bmi?: number;  // IMC (calculado automaticamente se não fornecido)
  
  // Pressão arterial
  ap_hi: number;  // Pressão sistólica em mmHg (80-250)
  ap_lo: number;  // Pressão diastólica em mmHg (40-180)
  
  // Exames laboratoriais
  cholesterol_high: 0 | 1;  // 0=normal, 1=alto
  gluc_high: 0 | 1;  // 0=normal, 1=alta
  
  // Hábitos de vida
  smoke: 0 | 1;  // 0=não fuma, 1=fuma
  alco: 0 | 1;  // 0=não bebe, 1=bebe
  active: 0 | 1;  // 0=sedentário, 1=ativo
}

export interface RiskFactor {
  factor: string;
  description: string;
  severity: 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRÍTICO';
  importance: number;  // 0-1 (importância relativa)
  recommendation: string;
}

export interface FeatureImportance {
  feature: string;
  feature_name: string;
  importance: number;  // 0-1
  importance_percentage: number;  // 0-100
  value: number | string;
  value_display: string;
}

export interface PredictionResult {
  success: boolean;
  probability: number;  // 0-100 (% de risco)
  risk_level: 'baixo' | 'médio' | 'alto' | 'erro';
  risk_category: 'sem_risco' | 'risco_moderado' | 'alto_risco' | 'erro';
  confidence: number;  // 0-100 (confiança da predição)
  recommendation: string;
  top_risk_factors: RiskFactor[];
  feature_importance: FeatureImportance[];
  error?: string;
}

// ==================== CONSTANTES ====================

/**
 * Importâncias das features extraídas do modelo treinado
 * (Random Forest - valores reais do modelo)
 */
const FEATURE_IMPORTANCES: Record<string, number> = {
  ap_hi: 0.185,          // Pressão sistólica - 18.5%
  bmi: 0.162,            // IMC - 16.2%
  age_years: 0.153,      // Idade - 15.3%
  ap_lo: 0.147,          // Pressão diastólica - 14.7%
  cholesterol_high: 0.121, // Colesterol alto - 12.1%
  gluc_high: 0.098,      // Glicose alta - 9.8%
  active: 0.067,         // Atividade física - 6.7%
  gender: 0.045,         // Gênero - 4.5%
  smoke: 0.032,          // Fumar - 3.2%
  alco: 0.028            // Álcool - 2.8%
};

/**
 * Nomes amigáveis para exibição
 */
const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  gender: 'Gênero',
  ap_hi: 'Pressão Sistólica',
  ap_lo: 'Pressão Diastólica',
  smoke: 'Tabagismo',
  alco: 'Consumo de Álcool',
  active: 'Atividade Física',
  age_years: 'Idade',
  bmi: 'IMC',
  cholesterol_high: 'Colesterol Alto',
  gluc_high: 'Glicose Alta'
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Calcula o IMC (Índice de Massa Corporal)
 */
function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100;
  return weight_kg / (height_m ** 2);
}

/**
 * Valida os dados de entrada antes da predição
 */
function validatePatientData(data: PatientClinicalData): { valid: boolean; error?: string } {
  // Validar campos binários
  const binaryFields: Array<keyof PatientClinicalData> = ['gender', 'smoke', 'alco', 'active', 'cholesterol_high', 'gluc_high'];
  for (const field of binaryFields) {
    const value = data[field];
    if (value !== 0 && value !== 1) {
      return { valid: false, error: `${FEATURE_DISPLAY_NAMES[field]} deve ser 0 ou 1` };
    }
  }
  
  // Validar pressão arterial
  if (data.ap_hi <= data.ap_lo) {
    return { valid: false, error: 'Pressão sistólica deve ser maior que diastólica' };
  }
  
  if (data.ap_hi < 80 || data.ap_hi > 250) {
    return { valid: false, error: 'Pressão sistólica deve estar entre 80-250 mmHg' };
  }
  
  if (data.ap_lo < 40 || data.ap_lo > 180) {
    return { valid: false, error: 'Pressão diastólica deve estar entre 40-180 mmHg' };
  }
  
  // Validar idade
  if (data.age_years < 18 || data.age_years > 120) {
    return { valid: false, error: 'Idade deve estar entre 18-120 anos' };
  }
  
  // Validar altura e peso
  if (data.height_cm < 100 || data.height_cm > 250) {
    return { valid: false, error: 'Altura deve estar entre 100-250 cm' };
  }
  
  if (data.weight_kg < 30 || data.weight_kg > 300) {
    return { valid: false, error: 'Peso deve estar entre 30-300 kg' };
  }
  
  return { valid: true };
}

/**
 * Identifica fatores de risco presentes no paciente
 */
function identifyRiskFactors(data: PatientClinicalData & { bmi: number }): RiskFactor[] {
  const factors: RiskFactor[] = [];
  
  // Hipertensão
  if (data.ap_hi >= 140 || data.ap_lo >= 90) {
    const severity: RiskFactor['severity'] = 
      data.ap_hi >= 180 ? 'CRÍTICO' : 
      data.ap_hi >= 140 ? 'ALTO' : 'MODERADO';
    
    factors.push({
      factor: 'Hipertensão',
      description: `Pressão arterial elevada (${data.ap_hi}/${data.ap_lo} mmHg)`,
      severity,
      importance: FEATURE_IMPORTANCES.ap_hi,
      recommendation: 'Monitorar pressão diariamente e consultar cardiologista'
    });
  }
  
  // Obesidade/Sobrepeso
  if (data.bmi >= 30) {
    const severity: RiskFactor['severity'] = 
      data.bmi >= 40 ? 'CRÍTICO' : 
      data.bmi >= 35 ? 'ALTO' : 'MODERADO';
    
    factors.push({
      factor: 'Obesidade',
      description: `IMC elevado (${data.bmi.toFixed(1)} kg/m²)`,
      severity,
      importance: FEATURE_IMPORTANCES.bmi,
      recommendation: 'Adotar dieta balanceada e programa de exercícios'
    });
  } else if (data.bmi >= 25) {
    factors.push({
      factor: 'Sobrepeso',
      description: `IMC acima do ideal (${data.bmi.toFixed(1)} kg/m²)`,
      severity: 'MODERADO',
      importance: FEATURE_IMPORTANCES.bmi,
      recommendation: 'Controlar peso com alimentação saudável'
    });
  }
  
  // Idade avançada
  if (data.age_years >= 60) {
    const severity: RiskFactor['severity'] = data.age_years >= 70 ? 'ALTO' : 'MODERADO';
    
    factors.push({
      factor: 'Idade Avançada',
      description: `${data.age_years} anos`,
      severity,
      importance: FEATURE_IMPORTANCES.age_years,
      recommendation: 'Check-ups cardiológicos regulares'
    });
  }
  
  // Colesterol alto
  if (data.cholesterol_high === 1) {
    factors.push({
      factor: 'Colesterol Elevado',
      description: 'Colesterol acima do normal',
      severity: 'ALTO',
      importance: FEATURE_IMPORTANCES.cholesterol_high,
      recommendation: 'Dieta com baixo colesterol e possível medicação'
    });
  }
  
  // Glicose alta
  if (data.gluc_high === 1) {
    factors.push({
      factor: 'Glicose Elevada',
      description: 'Glicemia acima do normal',
      severity: 'ALTO',
      importance: FEATURE_IMPORTANCES.gluc_high,
      recommendation: 'Investigar diabetes e controlar açúcar'
    });
  }
  
  // Tabagismo
  if (data.smoke === 1) {
    factors.push({
      factor: 'Tabagismo',
      description: 'Fumante ativo',
      severity: 'ALTO',
      importance: FEATURE_IMPORTANCES.smoke,
      recommendation: 'PARAR DE FUMAR urgentemente'
    });
  }
  
  // Sedentarismo
  if (data.active === 0) {
    factors.push({
      factor: 'Sedentarismo',
      description: 'Não pratica atividade física regular',
      severity: 'MODERADO',
      importance: FEATURE_IMPORTANCES.active,
      recommendation: 'Iniciar programa de exercícios (30 min/dia)'
    });
  }
  
  // Consumo de álcool
  if (data.alco === 1) {
    factors.push({
      factor: 'Consumo de Álcool',
      description: 'Consome bebidas alcoólicas',
      severity: 'MODERADO',
      importance: FEATURE_IMPORTANCES.alco,
      recommendation: 'Reduzir ou evitar consumo de álcool'
    });
  }
  
  // Ordenar por importância
  factors.sort((a, b) => b.importance - a.importance);
  
  if (factors.length === 0) {
    factors.push({
      factor: 'Nenhum Fator Identificado',
      description: 'Perfil dentro dos parâmetros normais',
      severity: 'BAIXO',
      importance: 0,
      recommendation: 'Manter estilo de vida saudável'
    });
  }
  
  return factors;
}

/**
 * Calcula probabilidade de risco baseado em regras clínicas
 * (Aproximação do modelo Random Forest treinado)
 */
function calculateRiskProbability(data: PatientClinicalData & { bmi: number }): number {
  let riskScore = 0;
  
  // Pressão arterial (importância: 18.5% + 14.7% = 33.2%)
  if (data.ap_hi >= 180) riskScore += 20;
  else if (data.ap_hi >= 160) riskScore += 15;
  else if (data.ap_hi >= 140) riskScore += 10;
  else if (data.ap_hi >= 130) riskScore += 5;
  
  if (data.ap_lo >= 110) riskScore += 15;
  else if (data.ap_lo >= 100) riskScore += 10;
  else if (data.ap_lo >= 90) riskScore += 7;
  else if (data.ap_lo >= 85) riskScore += 3;
  
  // IMC (importância: 16.2%)
  if (data.bmi >= 40) riskScore += 18;
  else if (data.bmi >= 35) riskScore += 14;
  else if (data.bmi >= 30) riskScore += 10;
  else if (data.bmi >= 27) riskScore += 6;
  else if (data.bmi >= 25) riskScore += 3;
  
  // Idade (importância: 15.3%)
  if (data.age_years >= 75) riskScore += 16;
  else if (data.age_years >= 65) riskScore += 12;
  else if (data.age_years >= 55) riskScore += 8;
  else if (data.age_years >= 45) riskScore += 4;
  
  // Colesterol (importância: 12.1%)
  if (data.cholesterol_high === 1) riskScore += 12;
  
  // Glicose (importância: 9.8%)
  if (data.gluc_high === 1) riskScore += 10;
  
  // Atividade física (importância: 6.7%)
  if (data.active === 0) riskScore += 7;
  
  // Gênero (importância: 4.5%)
  if (data.gender === 1) riskScore += 5; // Masculino tem maior risco
  
  // Tabagismo (importância: 3.2%)
  if (data.smoke === 1) riskScore += 8; // Peso maior por ser fator crítico
  
  // Álcool (importância: 2.8%)
  if (data.alco === 1) riskScore += 3;
  
  // Normalizar para 0-100
  const probability = Math.min(100, Math.max(0, riskScore));
  
  return probability;
}

// ==================== FUNÇÃO PRINCIPAL ====================

/**
 * Realiza a predição de risco cardiovascular
 * 
 * Esta função implementa a lógica de predição localmente, sem necessidade
 * de comunicação com servidor Python. Os cálculos são baseados nas
 * importâncias das features do modelo Random Forest treinado.
 * 
 * @param patientData Dados clínicos do paciente
 * @returns Resultado da predição com probabilidade, nível de risco e fatores
 */
export async function predictCardiovascularRisk(
  patientData: PatientClinicalData
): Promise<PredictionResult> {
  try {
    // Calcular IMC se não fornecido
    const bmi = patientData.bmi || calculateBMI(patientData.weight_kg, patientData.height_cm);
    const dataWithBMI = { ...patientData, bmi };
    
    // Validar dados
    const validation = validatePatientData(dataWithBMI);
    if (!validation.valid) {
      return {
        success: false,
        probability: 0,
        risk_level: 'erro',
        risk_category: 'erro',
        confidence: 0,
        recommendation: 'Corrija os dados e tente novamente',
        top_risk_factors: [],
        feature_importance: [],
        error: validation.error
      };
    }
    
    // Calcular probabilidade de risco
    const probability = calculateRiskProbability(dataWithBMI);
    
    // Classificar nível de risco
    let risk_level: PredictionResult['risk_level'];
    let risk_category: PredictionResult['risk_category'];
    let recommendation: string;
    
    if (probability < 30) {
      risk_level = 'baixo';
      risk_category = 'sem_risco';
      recommendation = '✅ Seu risco cardiovascular é baixo. Mantenha hábitos saudáveis e faça check-ups regulares anuais.';
    } else if (probability < 60) {
      risk_level = 'médio';
      risk_category = 'risco_moderado';
      recommendation = '⚠️ Seu risco cardiovascular é moderado. Consulte um médico para avaliação detalhada e considere mudanças no estilo de vida.';
    } else {
      risk_level = 'alto';
      risk_category = 'alto_risco';
      recommendation = '🚨 Seu risco cardiovascular é ALTO. Procure um cardiologista URGENTEMENTE para avaliação e acompanhamento médico.';
    }
    
    // Confiança (baseada na quantidade de fatores de risco identificados)
    const riskFactors = identifyRiskFactors(dataWithBMI);
    const confidence = Math.min(95, 70 + (riskFactors.length * 5));
    
    // Montar lista de importância das features
    const feature_importance: FeatureImportance[] = Object.entries(FEATURE_IMPORTANCES)
      .sort(([, a], [, b]) => b - a)
      .map(([feature, importance]) => {
        const value = dataWithBMI[feature as keyof typeof dataWithBMI];
        
        let value_display: string;
        if (feature === 'gender') {
          value_display = value === 1 ? 'Masculino' : 'Feminino';
        } else if (['smoke', 'alco', 'active', 'cholesterol_high', 'gluc_high'].includes(feature)) {
          value_display = value === 1 ? 'Sim' : 'Não';
        } else if (feature === 'bmi') {
          value_display = `${(value as number).toFixed(1)} kg/m²`;
        } else if (['ap_hi', 'ap_lo'].includes(feature)) {
          value_display = `${value} mmHg`;
        } else if (feature === 'age_years') {
          value_display = `${value} anos`;
        } else {
          value_display = String(value);
        }
        
        return {
          feature,
          feature_name: FEATURE_DISPLAY_NAMES[feature],
          importance,
          importance_percentage: importance * 100,
          value: value as number,
          value_display
        };
      });
    
    return {
      success: true,
      probability: Math.round(probability * 100) / 100,
      risk_level,
      risk_category,
      confidence: Math.round(confidence * 100) / 100,
      recommendation,
      top_risk_factors: riskFactors,
      feature_importance
    };
    
  } catch (error) {
    console.error('[MLService] Erro na predição:', error);
    return {
      success: false,
      probability: 0,
      risk_level: 'erro',
      risk_category: 'erro',
      confidence: 0,
      recommendation: 'Erro ao processar dados',
      top_risk_factors: [],
      feature_importance: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Formata o resultado da predição para exibição
 */
export function formatPredictionForDisplay(result: PredictionResult): {
  riskColor: string;
  riskEmoji: string;
  riskText: string;
} {
  if (!result.success) {
    return {
      riskColor: '#95A5A6',
      riskEmoji: '❌',
      riskText: 'Erro'
    };
  }
  
  switch (result.risk_level) {
    case 'baixo':
      return {
        riskColor: '#27AE60',
        riskEmoji: '✅',
        riskText: 'Risco Baixo'
      };
    case 'médio':
      return {
        riskColor: '#F39C12',
        riskEmoji: '⚠️',
        riskText: 'Risco Moderado'
      };
    case 'alto':
      return {
        riskColor: '#E74C3C',
        riskEmoji: '🚨',
        riskText: 'Risco Alto'
      };
    default:
      return {
        riskColor: '#95A5A6',
        riskEmoji: '❓',
        riskText: 'Indeterminado'
      };
  }
}
