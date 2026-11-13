@echo off
title GameTrevo - Parar Servidor
chcp 65001 >nul
echo ======================================================
echo              PARAR SERVIDOR GAMETREVO
echo ======================================================
echo.

:: Definir porta (padrao 3030)
if "%PORT%"=="" set PORT=3030

echo Procurando processos escutando na porta %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
    echo Encerrando processo PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [INFO] Servidor parado (se estava em execucao na porta %PORT%).
timeout /t 3 >nul
