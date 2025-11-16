# Modelo de Machine Learning

## 📊 Modelo de Predição de Risco Cardiovascular

Este diretório contém o modelo de Machine Learning para predição de risco cardiovascular.

### 🎯 Arquivo do Modelo

**Nome:** `random_forest_pipeline.joblib`  
**Tipo:** Random Forest Classifier com RobustScaler  
**Tamanho:** ~XXX MB (não versionado no Git)

### ⚠️ Importante: Modelo não está no Git

O arquivo `.joblib` **NÃO** está incluído no repositório Git devido ao seu tamanho.

### 📥 Como obter o modelo:

#### Opção 1: Download direto (produção)
Se você tem acesso ao modelo treinado:
1. Baixe o arquivo `random_forest_pipeline.joblib`
2. Coloque neste diretório (`ml/`)
3. Pronto para usar!

#### Opção 2: Treinar novo modelo
Se você precisa treinar um novo modelo:
```python
# Exemplo de treinamento (adapte conforme necessário)
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import RobustScaler
from sklearn.pipeline import Pipeline
import joblib

# 1. Carregar seus dados
# X_train, y_train = load_data()

# 2. Criar pipeline
pipeline = Pipeline([
    ('scaler', RobustScaler()),
    ('classifier', RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    ))
])

# 3. Treinar
# pipeline.fit(X_train, y_train)

# 4. Salvar
# joblib.dump(pipeline, 'ml/random_forest_pipeline.joblib')
```

### 🔧 Features do Modelo

O modelo espera 10 features de entrada:
1. `gender` - Gênero (0=Feminino, 1=Masculino)
2. `ap_hi` - Pressão sistólica (mmHg)
3. `ap_lo` - Pressão diastólica (mmHg)
4. `smoke` - Fumante (0=Não, 1=Sim)
5. `alco` - Consome álcool (0=Não, 1=Sim)
6. `active` - Fisicamente ativo (0=Não, 1=Sim)
7. `age_years` - Idade em anos
8. `bmi` - Índice de Massa Corporal
9. `cholesterol_high` - Colesterol alto (0=Normal, 1=Alto)
10. `gluc_high` - Glicose alta (0=Normal, 1=Alta)

### 📱 Uso no App

**Nota:** O app React Native **NÃO** usa o arquivo `.joblib` diretamente!

A predição é feita localmente em TypeScript puro no arquivo:
- `src/services/mlPrediction.service.ts`

Este serviço implementa a lógica do modelo usando os pesos e regras extraídos do modelo treinado.

### 🐍 API Python (Opcional)

Se você quiser usar o modelo via API Python:
```bash
cd api
pip install -r requirements.txt
python api_server.py
```

A API estará disponível em `http://localhost:8000`

### 📊 Performance do Modelo

- **Acurácia:** ~XX%
- **Precisão:** ~XX%
- **Recall:** ~XX%
- **F1-Score:** ~XX%

### 🔗 Links Úteis

- [Documentação do joblib](https://joblib.readthedocs.io/)
- [Scikit-learn Pipeline](https://scikit-learn.org/stable/modules/generated/sklearn.pipeline.Pipeline.html)
- [Random Forest Classifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html)

---

**Última atualização:** Novembro 2025
