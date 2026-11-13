@echo off
title GameTrevo - Servidor
chcp 65001 >nul
echo ======================================================
echo           INICIANDO GAMETREVO (NEXT.JS)
echo ======================================================
echo.

cd /d "%~dp0"

:: Definir porta (padrao 3030 para evitar conflitos com porta 3000)
if "%PORT%"=="" set PORT=3030

:: Verificar se Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no sistema!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

:: Verificar se node_modules existe, se nao, instalar dependencias
if not exist "node_modules\" (
    echo [INFO] Dependencias nao encontradas. Instalando npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias do npm!
        pause
        exit /b 1
    )
)

:: Verificar se .env.local existe
if not exist ".env.local" (
    if exist ".env.example" (
        echo [AVISO] .env.local nao encontrado. Criando a partir de .env.example...
        copy ".env.example" ".env.local" >nul
        echo [IMPORTANTE] Configure suas variaveis em .env.local se necessario.
    )
)

echo [INFO] Iniciando servidor Next.js em http://localhost:%PORT% ...
echo Pressione Ctrl+C para encerrar o servidor.
echo.

call npm run dev -- -p %PORT%
