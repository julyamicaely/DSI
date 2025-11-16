/**
 * 📱 EXEMPLO DE INTEGRAÇÃO REACT NATIVE
 * 
 * Serviço para fazer predições de risco cardiovascular
 * consumindo a API Python FastAPI
 */

// ==================== CONFIGURAÇÃO ====================

const API_BASE_URL = 'http://localhost:8000'; // Altere para seu servidor em produção
// Para testar no celular físico, use o IP da sua máquina: http://192.168.1.X:8000

// ==================== TIPOS TYPESCRIPT ====================

export interface PatientData {
  gender: number;           // 0=feminino, 1=masculino
  ap_hi: number;            // Pressão sistólica (mmHg)
  ap_lo: number;            // Pressão diastólica (mmHg)
  smoke: number;            // 0=não fuma, 1=fuma
  alco: number;             // 0=não bebe, 1=bebe
  active: number;           // 0=sedentário, 1=ativo
  age_years: number;        // Idade em anos
  bmi: number;              // IMC
  cholesterol_high: number; // 0=normal, 1=alto
  gluc_high: number;        // 0=normal, 1=alto
}

export interface SimplifiedPatientData {
  gender: number;
  age_years: number;
  height_cm: number;
  weight_kg: number;
  ap_hi: number;
  ap_lo: number;
  smoke?: number;
  alco?: number;
  active?: number;
  cholesterol_high?: number;
  gluc_high?: number;
}

export interface PredictionResponse {
  success: boolean;
  probability: number;      // 0-100%
  risk_level: string;       // "baixo", "médio", "alto"
  risk_category: string;    // "sem_risco", "risco_moderado", "alto_risco"
  confidence: number;       // 0-100%
  recommendation: string;
  top_risk_factors: string[];
}

// ==================== SERVIÇO DE API ====================

class CardioAPIService {
  
  /**
   * Verifica se a API está online
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('❌ API não está acessível:', error);
      return false;
    }
  }
  
  /**
   * Obtém informações sobre o modelo
   */
  static async getModelInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/model/info`);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao obter info do modelo:', error);
      throw error;
    }
  }
  
  /**
   * Predição completa (todos os 10 campos)
   */
  static async predict(patientData: PatientData): Promise<PredictionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Erro na predição:', error);
      throw error;
    }
  }
  
  /**
   * Predição simplificada (calcula IMC automaticamente)
   */
  static async predictSimple(patientData: SimplifiedPatientData): Promise<PredictionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/predict/simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Erro na predição simplificada:', error);
      throw error;
    }
  }
}

export default CardioAPIService;

// ==================== EXEMPLO DE USO NO COMPONENTE REACT NATIVE ====================

/**
 * Exemplo de componente React Native que usa o serviço
 */

/*
import React, { useState } from 'react';
import { View, Text, Button, Alert, ActivityIndicator } from 'react-native';
import CardioAPIService from './CardioAPIService';

export default function CardioScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const handlePredict = async () => {
    setLoading(true);
    
    try {
      // Verificar se API está online
      const isHealthy = await CardioAPIService.healthCheck();
      if (!isHealthy) {
        Alert.alert('Erro', 'API não está acessível. Verifique se o servidor está rodando.');
        return;
      }
      
      // Dados de exemplo
      const patientData = {
        gender: 1,              // Masculino
        age_years: 52,
        height_cm: 175,
        weight_kg: 85,
        ap_hi: 140,             // Pressão alta
        ap_lo: 90,
        smoke: 0,
        alco: 0,
        active: 1,
        cholesterol_high: 1,
        gluc_high: 0
      };
      
      // Fazer predição (versão simplificada)
      const prediction = await CardioAPIService.predictSimple(patientData);
      
      setResult(prediction);
      
      // Mostrar resultado
      Alert.alert(
        `Risco: ${prediction.risk_level.toUpperCase()}`,
        `Probabilidade: ${prediction.probability}%\n\n${prediction.recommendation}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Avaliação Cardiovascular
      </Text>
      
      <Button 
        title="Fazer Predição" 
        onPress={handlePredict}
        disabled={loading}
      />
      
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      
      {result && (
        <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            Resultado: {result.risk_level}
          </Text>
          <Text style={{ marginTop: 10 }}>
            Probabilidade: {result.probability}%
          </Text>
          <Text style={{ marginTop: 10 }}>
            {result.recommendation}
          </Text>
          
          {result.top_risk_factors.length > 0 && (
            <View style={{ marginTop: 15 }}>
              <Text style={{ fontWeight: 'bold' }}>Fatores de risco:</Text>
              {result.top_risk_factors.map((factor, index) => (
                <Text key={index}>• {factor}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
*/

// ==================== HELPER: CALCULAR IMC ====================

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

// ==================== VALIDAÇÕES ====================

export function validatePatientData(data: PatientData): string[] {
  const errors: string[] = [];
  
  if (data.ap_lo >= data.ap_hi) {
    errors.push('Pressão diastólica deve ser menor que sistólica');
  }
  
  if (data.ap_hi < 80 || data.ap_hi > 250) {
    errors.push('Pressão sistólica fora do range válido (80-250)');
  }
  
  if (data.ap_lo < 40 || data.ap_lo > 180) {
    errors.push('Pressão diastólica fora do range válido (40-180)');
  }
  
  if (data.age_years < 18 || data.age_years > 120) {
    errors.push('Idade inválida');
  }
  
  if (data.bmi < 10 || data.bmi > 60) {
    errors.push('IMC fora do range válido');
  }
  
  return errors;
}
