"""
🚀 API REST para Predição de Doença Cardiovascular

API FastAPI que carrega o modelo Random Forest e expõe endpoints
para predição de risco cardiovascular.

Uso:
    python api_server.py
    
    # Servidor rodará em: http://localhost:8000
    # Documentação automática: http://localhost:8000/docs

Instalação:
    pip install fastapi uvicorn pydantic joblib scikit-learn pandas
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== CONFIGURAÇÃO DA API ====================

app = FastAPI(
    title="API de Predição Cardiovascular",
    description="API para predição de risco de doença cardiovascular usando Random Forest",
    version="1.0.0"
)

# Configurar CORS para permitir requisições do React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== CARREGAR MODELO ====================

# Cache do modelo
MODEL_CACHE = None
FEATURE_NAMES = [
    'gender', 'ap_hi', 'ap_lo', 'smoke', 'alco', 
    'active', 'age_years', 'bmi', 'cholesterol_high', 'gluc_high'
]

def load_model():
    """Carrega o modelo uma vez e mantém em cache."""
    global MODEL_CACHE
    
    if MODEL_CACHE is not None:
        return MODEL_CACHE
    
    # Caminho do modelo
    model_path = Path(__file__).parent.parent / 'classification' / 'models' / 'random_forest_pipeline.joblib'
    
    if not model_path.exists():
        raise FileNotFoundError(f"Modelo não encontrado: {model_path}")
    
    logger.info(f"📦 Carregando modelo de: {model_path}")
    MODEL_CACHE = joblib.load(model_path)
    logger.info("✅ Modelo carregado com sucesso!")
    
    return MODEL_CACHE

# Carregar modelo na inicialização
@app.on_event("startup")
async def startup_event():
    """Carrega modelo quando o servidor inicia."""
    try:
        load_model()
        logger.info("🚀 Servidor pronto para predições!")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelo: {e}")
        raise

# ==================== MODELOS DE DADOS (PYDANTIC) ====================

class PatientData(BaseModel):
    """
    Dados do paciente para predição.
    
    Todos os campos são validados automaticamente.
    """
    gender: int = Field(..., ge=0, le=1, description="Gênero: 0=feminino, 1=masculino")
    ap_hi: int = Field(..., ge=80, le=250, description="Pressão sistólica (mmHg)")
    ap_lo: int = Field(..., ge=40, le=180, description="Pressão diastólica (mmHg)")
    smoke: int = Field(..., ge=0, le=1, description="Fumante: 0=não, 1=sim")
    alco: int = Field(..., ge=0, le=1, description="Consome álcool: 0=não, 1=sim")
    active: int = Field(..., ge=0, le=1, description="Ativo fisicamente: 0=não, 1=sim")
    age_years: int = Field(..., ge=18, le=120, description="Idade em anos")
    bmi: float = Field(..., ge=10.0, le=60.0, description="IMC (peso/altura²)")
    cholesterol_high: int = Field(..., ge=0, le=1, description="Colesterol alto: 0=não, 1=sim")
    gluc_high: int = Field(..., ge=0, le=1, description="Glicose alta: 0=não, 1=sim")
    
    @validator('ap_lo')
    def validate_blood_pressure(cls, ap_lo, values):
        """Valida que pressão sistólica > diastólica."""
        if 'ap_hi' in values and ap_lo >= values['ap_hi']:
            raise ValueError('Pressão diastólica deve ser menor que sistólica')
        return ap_lo
    
    class Config:
        schema_extra = {
            "example": {
                "gender": 1,
                "ap_hi": 140,
                "ap_lo": 90,
                "smoke": 0,
                "alco": 0,
                "active": 1,
                "age_years": 52,
                "bmi": 27.5,
                "cholesterol_high": 1,
                "gluc_high": 0
            }
        }


class SimplifiedPatientData(BaseModel):
    """
    Versão simplificada - calcula IMC automaticamente e assume valores padrão.
    Ideal para apps que coletam apenas dados básicos.
    """
    gender: int = Field(..., ge=0, le=1, description="Gênero: 0=feminino, 1=masculino")
    age_years: int = Field(..., ge=18, le=120, description="Idade em anos")
    height_cm: float = Field(..., ge=100, le=250, description="Altura em cm")
    weight_kg: float = Field(..., ge=30, le=300, description="Peso em kg")
    ap_hi: int = Field(..., ge=80, le=250, description="Pressão sistólica (mmHg)")
    ap_lo: int = Field(..., ge=40, le=180, description="Pressão diastólica (mmHg)")
    
    # Opcionais (padrão = 0)
    smoke: int = Field(0, ge=0, le=1, description="Fumante: 0=não, 1=sim")
    alco: int = Field(0, ge=0, le=1, description="Consome álcool: 0=não, 1=sim")
    active: int = Field(1, ge=0, le=1, description="Ativo fisicamente: 0=não, 1=sim")
    cholesterol_high: int = Field(0, ge=0, le=1, description="Colesterol alto: 0=não, 1=sim")
    gluc_high: int = Field(0, ge=0, le=1, description="Glicose alta: 0=não, 1=sim")
    
    class Config:
        schema_extra = {
            "example": {
                "gender": 1,
                "age_years": 52,
                "height_cm": 175,
                "weight_kg": 85,
                "ap_hi": 140,
                "ap_lo": 90,
                "smoke": 0,
                "alco": 0,
                "active": 1,
                "cholesterol_high": 1,
                "gluc_high": 0
            }
        }


class PredictionResponse(BaseModel):
    """Resposta da predição."""
    success: bool
    probability: float = Field(..., description="Probabilidade de doença cardiovascular (%)")
    risk_level: str = Field(..., description="Nível de risco: baixo, médio, alto")
    risk_category: str = Field(..., description="Categoria: sem_risco, risco_moderado, alto_risco")
    confidence: float = Field(..., description="Confiança da predição (0-100%)")
    recommendation: str = Field(..., description="Recomendação clínica")
    top_risk_factors: list = Field(..., description="Principais fatores de risco")


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Endpoint raiz - informações da API."""
    return {
        "api": "Predição Cardiovascular",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "docs": "/docs",
            "predict": "/predict",
            "predict_simple": "/predict/simple",
            "health": "/health",
            "model_info": "/model/info"
        }
    }


@app.get("/health")
async def health_check():
    """Verifica saúde da API."""
    try:
        model = load_model()
        return {
            "status": "healthy",
            "model_loaded": model is not None,
            "features": len(FEATURE_NAMES)
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Serviço indisponível: {str(e)}")


@app.get("/model/info")
async def model_info():
    """Retorna informações sobre o modelo."""
    try:
        model = load_model()
        classifier = model.named_steps['classifier']
        
        # Feature importances
        importances = classifier.feature_importances_
        feature_importance = [
            {"feature": name, "importance": float(imp), "percentage": float(imp * 100)}
            for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
        ]
        
        return {
            "model_type": "RandomForestClassifier",
            "n_estimators": classifier.n_estimators,
            "max_depth": classifier.max_depth,
            "n_features": classifier.n_features_in_,
            "feature_names": FEATURE_NAMES,
            "feature_importance": feature_importance,
            "preprocessing": ["RobustScaler"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter info: {str(e)}")


@app.post("/predict", response_model=PredictionResponse)
async def predict(patient: PatientData):
    """
    Predição de risco cardiovascular - versão completa.
    
    Requer todos os 10 campos.
    """
    try:
        # Carregar modelo
        model = load_model()
        
        # Preparar dados na ordem correta
        data = pd.DataFrame([{
            'gender': patient.gender,
            'ap_hi': patient.ap_hi,
            'ap_lo': patient.ap_lo,
            'smoke': patient.smoke,
            'alco': patient.alco,
            'active': patient.active,
            'age_years': patient.age_years,
            'bmi': patient.bmi,
            'cholesterol_high': patient.cholesterol_high,
            'gluc_high': patient.gluc_high
        }])
        
        # Fazer predição
        proba = model.predict_proba(data)[0]
        probability = float(proba[1] * 100)  # Probabilidade de doença (classe 1)
        confidence = float(max(proba) * 100)  # Confiança na predição
        
        # Classificar risco
        if probability < 30:
            risk_level = "baixo"
            risk_category = "sem_risco"
            recommendation = "Mantenha hábitos saudáveis e faça check-ups regulares."
        elif probability < 60:
            risk_level = "médio"
            risk_category = "risco_moderado"
            recommendation = "Consulte um médico para avaliação. Considere mudanças no estilo de vida."
        else:
            risk_level = "alto"
            risk_category = "alto_risco"
            recommendation = "Procure um cardiologista urgentemente para avaliação detalhada."
        
        # Identificar principais fatores de risco
        risk_factors = []
        if patient.ap_hi > 140:
            risk_factors.append("Pressão sistólica elevada")
        if patient.bmi > 30:
            risk_factors.append("Obesidade (IMC alto)")
        if patient.age_years > 55:
            risk_factors.append("Idade avançada")
        if patient.cholesterol_high == 1:
            risk_factors.append("Colesterol alto")
        if patient.smoke == 1:
            risk_factors.append("Tabagismo")
        if patient.active == 0:
            risk_factors.append("Sedentarismo")
        
        return PredictionResponse(
            success=True,
            probability=round(probability, 2),
            risk_level=risk_level,
            risk_category=risk_category,
            confidence=round(confidence, 2),
            recommendation=recommendation,
            top_risk_factors=risk_factors if risk_factors else ["Nenhum fator de risco identificado"]
        )
        
    except Exception as e:
        logger.error(f"Erro na predição: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na predição: {str(e)}")


@app.post("/predict/simple", response_model=PredictionResponse)
async def predict_simple(patient: SimplifiedPatientData):
    """
    Predição de risco cardiovascular - versão simplificada.
    
    Calcula IMC automaticamente a partir de altura e peso.
    Assume valores padrão para campos opcionais.
    """
    try:
        # Calcular IMC
        height_m = patient.height_cm / 100
        bmi = patient.weight_kg / (height_m ** 2)
        
        # Converter para formato completo
        full_data = PatientData(
            gender=patient.gender,
            ap_hi=patient.ap_hi,
            ap_lo=patient.ap_lo,
            smoke=patient.smoke,
            alco=patient.alco,
            active=patient.active,
            age_years=patient.age_years,
            bmi=bmi,
            cholesterol_high=patient.cholesterol_high,
            gluc_high=patient.gluc_high
        )
        
        # Usar endpoint principal
        return await predict(full_data)
        
    except Exception as e:
        logger.error(f"Erro na predição simplificada: {e}")
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")


# ==================== EXECUTAR SERVIDOR ====================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 70)
    print("🚀 INICIANDO API DE PREDIÇÃO CARDIOVASCULAR")
    print("=" * 70)
    print("\n📍 Servidor: http://localhost:8000")
    print("📚 Documentação interativa: http://localhost:8000/docs")
    print("🔬 Testar API: http://localhost:8000/docs#/default/predict_predict_post")
    print("\n⏳ Carregando modelo...")
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload em desenvolvimento
        log_level="info"
    )
