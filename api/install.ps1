# Script de instalação da API

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  INSTALAÇÃO DA API CARDIOVASCULAR" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`n📦 Instalando dependências..." -ForegroundColor Yellow

pip install fastapi uvicorn pydantic joblib scikit-learn pandas python-multipart

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Dependências instaladas com sucesso!" -ForegroundColor Green
    Write-Host "`n🚀 Para iniciar o servidor, execute:" -ForegroundColor Cyan
    Write-Host "   python api_server.py" -ForegroundColor White
    Write-Host "`n📚 Documentação da API estará em:" -ForegroundColor Cyan
    Write-Host "   http://localhost:8000/docs" -ForegroundColor White
} else {
    Write-Host "`n❌ Erro na instalação. Verifique sua conexão e tente novamente." -ForegroundColor Red
}
