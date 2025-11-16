# 📱 Guia de Integração: Modelo Random Forest → App Mobile React Native

## 🎯 Visão Geral

Este guia explica como usar o modelo de predição cardiovascular treinado em Python/scikit-learn em um **app mobile React Native**.

### Arquitetura

```
┌─────────────────────┐
│  App React Native   │  (Frontend Mobile)
│   - iOS / Android   │
└──────────┬──────────┘
           │ HTTP REST
           ↓
┌─────────────────────┐
│   FastAPI Server    │  (Backend Python)
│  - Carrega modelo   │
│  - Faz predições    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  random_forest_     │  (Modelo Treinado)
│  pipeline.joblib    │
└─────────────────────┘
```

**Por quê essa arquitetura?**
- Modelos scikit-learn não rodam em JavaScript
- Backend Python é necessário para carregar o `.joblib`
- API REST permite qualquer frontend (React Native, Flutter, Web)

---

## 🚀 Passo a Passo

### 1️⃣ Configurar Backend Python (API)

#### Instalar dependências

```bash
cd api
pip install -r requirements.txt
```

Ou instalar manualmente:
```bash
pip install fastapi uvicorn pydantic joblib scikit-learn pandas
```

#### Iniciar servidor

```bash
python api_server.py
```

O servidor rodará em:
- **URL:** http://localhost:8000
- **Documentação interativa:** http://localhost:8000/docs

#### Testar API manualmente

Abra http://localhost:8000/docs no navegador e teste o endpoint `/predict`:

```json
{
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
```

---

### 2️⃣ Configurar App React Native

#### Instalar no seu projeto React Native

Copie o arquivo `react_native_example.tsx` para seu projeto:

```bash
# No seu projeto React Native
cp api/react_native_example.tsx src/services/CardioAPIService.tsx
```

#### Configurar URL da API

Se testar em **emulador**, use `http://localhost:8000`

Se testar em **dispositivo físico**, use o IP da sua máquina:
```typescript
const API_BASE_URL = 'http://192.168.1.10:8000'; // Seu IP local
```

Para descobrir seu IP:
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

---

### 3️⃣ Exemplo de Uso no React Native

#### Componente simples

```typescript
import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import CardioAPIService from './services/CardioAPIService';

export default function CardioScreen() {
  const [loading, setLoading] = useState(false);
  
  const handlePredict = async () => {
    setLoading(true);
    
    try {
      // Dados do paciente
      const patientData = {
        gender: 1,              // Masculino
        age_years: 52,
        height_cm: 175,         // API calcula IMC automaticamente
        weight_kg: 85,
        ap_hi: 140,
        ap_lo: 90,
        smoke: 0,
        alco: 0,
        active: 1,
        cholesterol_high: 1,
        gluc_high: 0
      };
      
      // Fazer predição
      const result = await CardioAPIService.predictSimple(patientData);
      
      // Mostrar resultado
      Alert.alert(
        `Risco: ${result.risk_level.toUpperCase()}`,
        `${result.probability}%\n\n${result.recommendation}`
      );
      
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Avaliação Cardiovascular
      </Text>
      <Button 
        title={loading ? 'Processando...' : 'Fazer Predição'} 
        onPress={handlePredict}
        disabled={loading}
      />
    </View>
  );
}
```

---

## 📡 Endpoints Disponíveis

### `GET /health`
Verifica se API está online
```bash
curl http://localhost:8000/health
```

### `GET /model/info`
Informações do modelo (features, importâncias)
```bash
curl http://localhost:8000/model/info
```

### `POST /predict`
Predição completa (10 campos obrigatórios)
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### `POST /predict/simple`
Predição simplificada (calcula IMC automaticamente)
```bash
curl -X POST http://localhost:8000/predict/simple \
  -H "Content-Type: application/json" \
  -d '{
    "gender": 1,
    "age_years": 52,
    "height_cm": 175,
    "weight_kg": 85,
    "ap_hi": 140,
    "ap_lo": 90
  }'
```

---

## 🔐 Segurança & Produção

### Para deploy em produção:

1. **Configure CORS corretamente:**
```python
# api_server.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seu-app.com"],  # Domínios específicos
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

2. **Use HTTPS:**
- Configure SSL/TLS no servidor
- Use serviços como Heroku, Railway, ou AWS

3. **Adicione autenticação:**
```python
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.post("/predict")
async def predict(patient: PatientData, credentials: HTTPBearer = Depends(security)):
    # Validar token
    ...
```

4. **Rate limiting:**
```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/predict")
@limiter.limit("10/minute")
async def predict(...):
    ...
```

---

## 🐳 Docker (Opcional)

Criar `Dockerfile` para facilitar deploy:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api_server.py .
COPY ../classification/models/random_forest_pipeline.joblib ./models/

CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

Executar:
```bash
docker build -t cardio-api .
docker run -p 8000:8000 cardio-api
```

---

## 🧪 Testes

### Testar API localmente

```bash
# Health check
curl http://localhost:8000/health

# Predição de teste
curl -X POST http://localhost:8000/predict/simple \
  -H "Content-Type: application/json" \
  -d '{
    "gender": 1,
    "age_years": 52,
    "height_cm": 175,
    "weight_kg": 85,
    "ap_hi": 140,
    "ap_lo": 90
  }'
```

### Testar do React Native

```typescript
// Verificar conexão
const isHealthy = await CardioAPIService.healthCheck();
console.log('API online:', isHealthy);

// Obter info do modelo
const info = await CardioAPIService.getModelInfo();
console.log('Features:', info.feature_names);
```

---

## ❓ Troubleshooting

### Erro: "API não está acessível"
- Verifique se o servidor Python está rodando
- Teste manualmente: http://localhost:8000/health
- Se no celular físico, use IP da máquina, não localhost

### Erro: "CORS policy blocked"
- Configure CORS no `api_server.py` (já configurado por padrão)
- Adicione o domínio/IP do app mobile

### Erro: "Modelo não encontrado"
- Verifique se `random_forest_pipeline.joblib` existe em `classification/models/`
- Ajuste o caminho no `api_server.py` se necessário

### Predições estranhas
- Valide os dados de entrada (ver `validatePatientData()`)
- Pressão diastólica deve ser < sistólica
- IMC deve estar entre 10-60
- Idade entre 18-120

---

## 📊 Exemplo de Resposta da API

```json
{
  "success": true,
  "probability": 67.23,
  "risk_level": "alto",
  "risk_category": "alto_risco",
  "confidence": 67.23,
  "recommendation": "Procure um cardiologista urgentemente para avaliação detalhada.",
  "top_risk_factors": [
    "Pressão sistólica elevada",
    "Obesidade (IMC alto)",
    "Idade avançada",
    "Colesterol alto"
  ]
}
```

---

## 🎨 UI/UX Sugerida no App

```typescript
// Cores baseadas no risco
const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'baixo': return '#4CAF50'; // Verde
    case 'médio': return '#FF9800'; // Laranja
    case 'alto': return '#F44336';  // Vermelho
    default: return '#9E9E9E';
  }
};

// Ícones sugeridos
const getRiskIcon = (riskLevel: string) => {
  switch (riskLevel) {
    case 'baixo': return '💚';
    case 'médio': return '💛';
    case 'alto': return '❤️';
    default: return '❔';
  }
};
```

---

## 📚 Recursos Adicionais

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Native Networking:** https://reactnative.dev/docs/network
- **Axios (alternativa ao fetch):** https://axios-http.com/

---

## ✅ Checklist de Implementação

- [ ] Backend Python configurado e rodando
- [ ] API testada no navegador (/docs)
- [ ] Serviço React Native integrado
- [ ] Testes em emulador funcionando
- [ ] Testes em dispositivo físico (com IP correto)
- [ ] Validação de dados implementada
- [ ] Tratamento de erros implementado
- [ ] UI/UX para exibir resultados
- [ ] (Opcional) Deploy em produção
- [ ] (Opcional) Autenticação/segurança

---

**💡 Dica Final:** Comece testando a API manualmente no navegador (http://localhost:8000/docs) antes de integrar no React Native. Isso facilita o debug!
