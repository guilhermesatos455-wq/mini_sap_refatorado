# Script PowerShell para iniciar o Mini-SAP Auditor Localmente com Node.js

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   Mini-SAP Auditor - Inicializador Local (Node)   " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Verificar se o Node.js está instalado
if (!(Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Node.js não foi encontrado no PATH do PowerShell." -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js v18 ou superior em: https://nodejs.org/" -ForegroundColor Yellow
    Exit
}

$nodeVersion = node -v
Write-Host "[OK] Node.js detectado: $nodeVersion" -ForegroundColor Green

# 2. Verificar se o arquivo .env existe, caso contrário criar a partir de .env.example
if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[INFO] Arquivo .env criado a partir de .env.example. Configure suas chaves se necessário." -ForegroundColor Yellow
    }
}

# 3. Instalar dependências se node_modules não existir
if (!(Test-Path "node_modules")) {
    Write-Host "[INFO] Instalando dependências (npm install)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar dependências." -ForegroundColor Red
        Exit
    }
} else {
    Write-Host "[OK] Dependências já instaladas em node_modules." -ForegroundColor Green
}

# 4. Iniciar o servidor de desenvolvimento
Write-Host "[INFO] Iniciando o servidor de desenvolvimento (npm run dev)..." -ForegroundColor Green
Write-Host "O aplicativo estará disponível em: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Pressione CTRL+C para encerrar o servidor a qualquer momento." -ForegroundColor DarkGray
Write-Host "-------------------------------------------------" -ForegroundColor Cyan

npm run dev
