"""
🧠 Serviço de Machine Learning - Predição de Risco Cardiovascular

Este módulo carrega o modelo Random Forest treinado e fornece funções
para predição de risco de doença cardiovascular.

Modelo: Random Forest Pipeline com RobustScaler
Entrada: 10 features (gender, ap_hi, ap_lo, smoke, alco, active, age_years, bmi, cholesterol_high, gluc_high)
Saída: Probabilidade (0-100%) e classificação de risco
"""

import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Any
import warnings

warnings.filterwarnings('ignore')

# ==================== CONFIGURAÇÃO ====================

# Nomes das features esperadas pelo modelo (ordem EXATA)
FEATURE_NAMES = [
    'gender',           # 0=feminino, 1=masculino
    'ap_hi',            # Pressão sistólica (mmHg)
    'ap_lo',            # Pressão diastólica (mmHg)
    'smoke',            # 0=não fuma, 1=fuma
    'alco',             # 0=não bebe, 1=bebe
    'active',           # 0=sedentário, 1=ativo
    'age_years',        # Idade em anos
    'bmi',              # IMC (kg/m²)
    'cholesterol_high', # 0=normal, 1=alto
    'gluc_high'         # 0=normal, 1=alta
]

# Importâncias das features (do modelo treinado - ordem decrescente)
FEATURE_IMPORTANCES = {
    'ap_hi': 0.185,          # Pressão sistólica - 18.5%
    'bmi': 0.162,            # IMC - 16.2%
    'age_years': 0.153,      # Idade - 15.3%
    'ap_lo': 0.147,          # Pressão diastólica - 14.7%
    'cholesterol_high': 0.121, # Colesterol alto - 12.1%
    'gluc_high': 0.098,      # Glicose alta - 9.8%
    'active': 0.067,         # Atividade física - 6.7%
    'gender': 0.045,         # Gênero - 4.5%
    'smoke': 0.032,          # Fumar - 3.2%
    'alco': 0.028            # Álcool - 2.8%
}

# Cache do modelo
_MODEL_CACHE = None


# ==================== FUNÇÕES PRINCIPAIS ====================

def load_model():
    """
    Carrega o modelo Random Forest do disco.
    Mantém em cache para evitar recarregamento.
    
    Returns:
        Pipeline treinado (RobustScaler + RandomForestClassifier)
    """
    global _MODEL_CACHE
    
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE
    
    # Caminho do modelo
    model_path = Path(__file__).parent / 'random_forest_pipeline.joblib'
    
    if not model_path.exists():
        raise FileNotFoundError(
            f"❌ Modelo não encontrado em: {model_path}\n"
            f"Certifique-se de que o arquivo 'random_forest_pipeline.joblib' "
            f"está na pasta 'ml/'"
        )
    
    print(f"📦 Carregando modelo de: {model_path}")
    _MODEL_CACHE = joblib.load(model_path)
    print("✅ Modelo carregado com sucesso!")
    
    return _MODEL_CACHE


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """
    Calcula o IMC (Índice de Massa Corporal).
    
    Args:
        weight_kg: Peso em quilogramas
        height_cm: Altura em centímetros
        
    Returns:
        IMC calculado (kg/m²)
    """
    height_m = height_cm / 100
    return weight_kg / (height_m ** 2)


def validate_input(data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Valida os dados de entrada antes da predição.
    
    Args:
        data: Dicionário com os dados do paciente
        
    Returns:
        Tupla (válido: bool, mensagem: str)
    """
    # Verificar campos obrigatórios
    required_fields = FEATURE_NAMES
    missing = [f for f in required_fields if f not in data]
    
    if missing:
        return False, f"Campos obrigatórios faltando: {', '.join(missing)}"
    
    # Validar valores binários (0 ou 1)
    binary_fields = ['gender', 'smoke', 'alco', 'active', 'cholesterol_high', 'gluc_high']
    for field in binary_fields:
        if data[field] not in [0, 1]:
            return False, f"{field} deve ser 0 ou 1"
    
    # Validar pressão arterial
    if data['ap_hi'] <= data['ap_lo']:
        return False, "Pressão sistólica deve ser maior que diastólica"
    
    if not (80 <= data['ap_hi'] <= 250):
        return False, "Pressão sistólica deve estar entre 80-250 mmHg"
    
    if not (40 <= data['ap_lo'] <= 180):
        return False, "Pressão diastólica deve estar entre 40-180 mmHg"
    
    # Validar idade
    if not (18 <= data['age_years'] <= 120):
        return False, "Idade deve estar entre 18-120 anos"
    
    # Validar IMC
    if not (10 <= data['bmi'] <= 60):
        return False, "IMC deve estar entre 10-60 kg/m²"
    
    return True, "OK"


def predict_cardiovascular_risk(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Realiza a predição de risco cardiovascular.
    
    Args:
        patient_data: Dicionário com as 10 features necessárias:
            - gender: int (0=feminino, 1=masculino)
            - ap_hi: int (pressão sistólica em mmHg)
            - ap_lo: int (pressão diastólica em mmHg)
            - smoke: int (0=não, 1=sim)
            - alco: int (0=não, 1=sim)
            - active: int (0=não, 1=sim)
            - age_years: int (idade em anos)
            - bmi: float (IMC em kg/m²)
            - cholesterol_high: int (0=normal, 1=alto)
            - gluc_high: int (0=normal, 1=alta)
    
    Returns:
        Dicionário com:
            - success: bool
            - probability: float (0-100, % de risco)
            - risk_level: str ("baixo", "médio", "alto")
            - risk_category: str ("sem_risco", "risco_moderado", "alto_risco")
            - confidence: float (0-100, confiança da predição)
            - recommendation: str (recomendação clínica)
            - top_risk_factors: List[Dict] (principais fatores de risco)
            - feature_importance: List[Dict] (importância de cada variável)
    """
    try:
        # Validar entrada
        valid, msg = validate_input(patient_data)
        if not valid:
            return {
                "success": False,
                "error": msg,
                "probability": 0,
                "risk_level": "erro",
                "risk_category": "erro",
                "confidence": 0,
                "recommendation": "Corrija os dados e tente novamente",
                "top_risk_factors": [],
                "feature_importance": []
            }
        
        # Carregar modelo
        model = load_model()
        
        # Preparar dados na ordem EXATA esperada pelo modelo
        data_array = pd.DataFrame([{
            'gender': int(patient_data['gender']),
            'ap_hi': int(patient_data['ap_hi']),
            'ap_lo': int(patient_data['ap_lo']),
            'smoke': int(patient_data['smoke']),
            'alco': int(patient_data['alco']),
            'active': int(patient_data['active']),
            'age_years': int(patient_data['age_years']),
            'bmi': float(patient_data['bmi']),
            'cholesterol_high': int(patient_data['cholesterol_high']),
            'gluc_high': int(patient_data['gluc_high'])
        }])
        
        # Fazer predição
        probabilities = model.predict_proba(data_array)[0]
        risk_probability = float(probabilities[1] * 100)  # Probabilidade de doença (classe 1)
        confidence = float(max(probabilities) * 100)       # Confiança na predição
        
        # Classificar nível de risco
        if risk_probability < 30:
            risk_level = "baixo"
            risk_category = "sem_risco"
            recommendation = "✅ Seu risco cardiovascular é baixo. Mantenha hábitos saudáveis e faça check-ups regulares anuais."
        elif risk_probability < 60:
            risk_level = "médio"
            risk_category = "risco_moderado"
            recommendation = "⚠️ Seu risco cardiovascular é moderado. Consulte um médico para avaliação detalhada e considere mudanças no estilo de vida."
        else:
            risk_level = "alto"
            risk_category = "alto_risco"
            recommendation = "🚨 Seu risco cardiovascular é ALTO. Procure um cardiologista URGENTEMENTE para avaliação e acompanhamento médico."
        
        # Identificar fatores de risco presentes
        risk_factors = identify_risk_factors(patient_data)
        
        # Montar lista de importância das features com valores do paciente
        feature_importance_list = []
        for feature, importance in sorted(FEATURE_IMPORTANCES.items(), key=lambda x: x[1], reverse=True):
            value = patient_data[feature]
            
            # Formatar valor para exibição
            if feature == 'gender':
                value_display = "Masculino" if value == 1 else "Feminino"
            elif feature in ['smoke', 'alco', 'active', 'cholesterol_high', 'gluc_high']:
                value_display = "Sim" if value == 1 else "Não"
            elif feature == 'bmi':
                value_display = f"{value:.1f} kg/m²"
            elif feature in ['ap_hi', 'ap_lo']:
                value_display = f"{value} mmHg"
            elif feature == 'age_years':
                value_display = f"{value} anos"
            else:
                value_display = str(value)
            
            feature_importance_list.append({
                "feature": feature,
                "feature_name": get_feature_display_name(feature),
                "importance": float(importance),
                "importance_percentage": float(importance * 100),
                "value": value,
                "value_display": value_display
            })
        
        return {
            "success": True,
            "probability": round(risk_probability, 2),
            "risk_level": risk_level,
            "risk_category": risk_category,
            "confidence": round(confidence, 2),
            "recommendation": recommendation,
            "top_risk_factors": risk_factors,
            "feature_importance": feature_importance_list
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "probability": 0,
            "risk_level": "erro",
            "risk_category": "erro",
            "confidence": 0,
            "recommendation": "Erro ao processar dados",
            "top_risk_factors": [],
            "feature_importance": []
        }


def identify_risk_factors(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Identifica os principais fatores de risco presentes no paciente.
    
    Args:
        data: Dicionário com os dados do paciente
        
    Returns:
        Lista de fatores de risco identificados, ordenados por importância
    """
    factors = []
    
    # Pressão arterial
    if data['ap_hi'] >= 140 or data['ap_lo'] >= 90:
        severity = "CRÍTICO" if data['ap_hi'] >= 180 else "ALTO" if data['ap_hi'] >= 140 else "MODERADO"
        factors.append({
            "factor": "Hipertensão",
            "description": f"Pressão arterial elevada ({data['ap_hi']}/{data['ap_lo']} mmHg)",
            "severity": severity,
            "importance": FEATURE_IMPORTANCES['ap_hi'],
            "recommendation": "Monitorar pressão diariamente e consultar cardiologista"
        })
    
    # IMC
    if data['bmi'] >= 30:
        severity = "CRÍTICO" if data['bmi'] >= 40 else "ALTO" if data['bmi'] >= 35 else "MODERADO"
        factors.append({
            "factor": "Obesidade",
            "description": f"IMC elevado ({data['bmi']:.1f} kg/m²)",
            "severity": severity,
            "importance": FEATURE_IMPORTANCES['bmi'],
            "recommendation": "Adotar dieta balanceada e programa de exercícios"
        })
    elif data['bmi'] >= 25:
        factors.append({
            "factor": "Sobrepeso",
            "description": f"IMC acima do ideal ({data['bmi']:.1f} kg/m²)",
            "severity": "MODERADO",
            "importance": FEATURE_IMPORTANCES['bmi'],
            "recommendation": "Controlar peso com alimentação saudável"
        })
    
    # Idade
    if data['age_years'] >= 60:
        severity = "ALTO" if data['age_years'] >= 70 else "MODERADO"
        factors.append({
            "factor": "Idade Avançada",
            "description": f"{data['age_years']} anos",
            "severity": severity,
            "importance": FEATURE_IMPORTANCES['age_years'],
            "recommendation": "Check-ups cardiológicos regulares"
        })
    
    # Colesterol alto
    if data['cholesterol_high'] == 1:
        factors.append({
            "factor": "Colesterol Elevado",
            "description": "Colesterol acima do normal",
            "severity": "ALTO",
            "importance": FEATURE_IMPORTANCES['cholesterol_high'],
            "recommendation": "Dieta com baixo colesterol e possível medicação"
        })
    
    # Glicose alta
    if data['gluc_high'] == 1:
        factors.append({
            "factor": "Glicose Elevada",
            "description": "Glicemia acima do normal",
            "severity": "ALTO",
            "importance": FEATURE_IMPORTANCES['gluc_high'],
            "recommendation": "Investigar diabetes e controlar açúcar"
        })
    
    # Tabagismo
    if data['smoke'] == 1:
        factors.append({
            "factor": "Tabagismo",
            "description": "Fumante ativo",
            "severity": "ALTO",
            "importance": FEATURE_IMPORTANCES['smoke'],
            "recommendation": "PARAR DE FUMAR urgentemente"
        })
    
    # Sedentarismo
    if data['active'] == 0:
        factors.append({
            "factor": "Sedentarismo",
            "description": "Não pratica atividade física regular",
            "severity": "MODERADO",
            "importance": FEATURE_IMPORTANCES['active'],
            "recommendation": "Iniciar programa de exercícios (30 min/dia)"
        })
    
    # Consumo de álcool
    if data['alco'] == 1:
        factors.append({
            "factor": "Consumo de Álcool",
            "description": "Consome bebidas alcoólicas",
            "severity": "MODERADO",
            "importance": FEATURE_IMPORTANCES['alco'],
            "recommendation": "Reduzir ou evitar consumo de álcool"
        })
    
    # Ordenar por importância (features mais importantes primeiro)
    factors.sort(key=lambda x: x['importance'], reverse=True)
    
    if not factors:
        factors.append({
            "factor": "Nenhum Fator Identificado",
            "description": "Perfil dentro dos parâmetros normais",
            "severity": "BAIXO",
            "importance": 0,
            "recommendation": "Manter estilo de vida saudável"
        })
    
    return factors


def get_feature_display_name(feature: str) -> str:
    """Retorna nome amigável para cada feature."""
    names = {
        'gender': 'Gênero',
        'ap_hi': 'Pressão Sistólica',
        'ap_lo': 'Pressão Diastólica',
        'smoke': 'Tabagismo',
        'alco': 'Consumo de Álcool',
        'active': 'Atividade Física',
        'age_years': 'Idade',
        'bmi': 'IMC',
        'cholesterol_high': 'Colesterol Alto',
        'gluc_high': 'Glicose Alta'
    }
    return names.get(feature, feature)


# ==================== FUNÇÕES AUXILIARES ====================

def get_model_info() -> Dict[str, Any]:
    """
    Retorna informações sobre o modelo carregado.
    
    Returns:
        Dicionário com informações do modelo
    """
    try:
        model = load_model()
        classifier = model.named_steps['classifier']
        
        return {
            "model_type": "RandomForestClassifier",
            "n_estimators": classifier.n_estimators,
            "max_depth": classifier.max_depth,
            "n_features": len(FEATURE_NAMES),
            "feature_names": FEATURE_NAMES,
            "preprocessing": ["RobustScaler"],
            "feature_importances": FEATURE_IMPORTANCES
        }
    except Exception as e:
        return {"error": str(e)}


# ==================== EXEMPLO DE USO ====================

if __name__ == "__main__":
    print("=" * 70)
    print("🧠 TESTE DO SERVIÇO DE PREDIÇÃO CARDIOVASCULAR")
    print("=" * 70)
    
    # Exemplo de dados de um paciente
    exemplo_paciente = {
        'gender': 1,              # Masculino
        'ap_hi': 145,             # Pressão alta
        'ap_lo': 92,              # Pressão baixa
        'smoke': 1,               # Fuma
        'alco': 0,                # Não bebe
        'active': 0,              # Sedentário
        'age_years': 58,          # 58 anos
        'bmi': 31.2,              # Obesidade
        'cholesterol_high': 1,    # Colesterol alto
        'gluc_high': 0            # Glicose normal
    }
    
    print("\n📋 Dados do Paciente:")
    for key, value in exemplo_paciente.items():
        print(f"  • {get_feature_display_name(key)}: {value}")
    
    print("\n🔬 Realizando predição...")
    resultado = predict_cardiovascular_risk(exemplo_paciente)
    
    if resultado['success']:
        print(f"\n✅ PREDIÇÃO CONCLUÍDA:")
        print(f"  • Probabilidade de Risco: {resultado['probability']:.2f}%")
        print(f"  • Nível de Risco: {resultado['risk_level'].upper()}")
        print(f"  • Confiança: {resultado['confidence']:.2f}%")
        print(f"  • Recomendação: {resultado['recommendation']}")
        
        print(f"\n⚠️ PRINCIPAIS FATORES DE RISCO ({len(resultado['top_risk_factors'])}):")
        for i, factor in enumerate(resultado['top_risk_factors'][:5], 1):
            print(f"  {i}. {factor['factor']} - {factor['description']}")
            print(f"     Gravidade: {factor['severity']} | Importância: {factor['importance']*100:.1f}%")
        
        print(f"\n📊 IMPORTÂNCIA DAS VARIÁVEIS (Top 5):")
        for i, feat in enumerate(resultado['feature_importance'][:5], 1):
            print(f"  {i}. {feat['feature_name']}: {feat['importance_percentage']:.1f}% (valor: {feat['value_display']})")
    else:
        print(f"\n❌ ERRO: {resultado['error']}")
    
    print("\n" + "=" * 70)
