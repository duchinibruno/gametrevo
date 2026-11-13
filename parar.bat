@echo off
title GameTrevo - Parar Servidor
chcp 65001 >nul
echo ======================================================
echo              PARAR SERVIDOR GAMETREVO
echo ======================================================
echo.

echo Procurando processos escutando na porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Encerrando processo PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [INFO] Servidor finalizado (se estava em execucao).
timeout /t 3 >nul
