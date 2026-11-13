@echo off
title GameTrevo - Remover Inicializacao Automatica
chcp 65001 >nul
echo ======================================================
echo    REMOVER INICIALIZACAO AUTOMATICA DO GAMETREVO
echo ======================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\GameTrevo.lnk"

if exist "%SHORTCUT%" (
    del "%SHORTCUT%"
    echo [SUCESSO] Atalho de inicializacao removido com sucesso!
) else (
    echo [INFO] O GameTrevo nao estava configurado para iniciar automaticamente.
)

echo.
pause
