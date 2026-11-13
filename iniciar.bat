@echo off
title GameTrevo - Servidor
chcp 65001 >nul
echo ======================================================
echo           INICIANDO GAMETREVO (NEXT.JS)
echo ======================================================
echo.

cd /d "%~dp0"

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

echo [INFO] Iniciando servidor Next.js em http://localhost:3000 ...
echo Pressione Ctrl+C para encerrar o servidor.
echo.

npm run dev
