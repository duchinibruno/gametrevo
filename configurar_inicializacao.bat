@echo off
title GameTrevo - Configurar Inicializacao Automatica
chcp 65001 >nul
echo ======================================================
echo    CONFIGURAR INICIALIZACAO AUTOMATICA DO GAMETREVO
echo ======================================================
echo.

cd /d "%~dp0"

set "TARGET_SCRIPT=%~dp0iniciar_segundo_plano.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\GameTrevo.lnk"

echo Criando atalho na pasta de inicializacao do Windows...
echo Destino: %SHORTCUT%
echo.

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET_SCRIPT%\"'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Inicializacao Automatica GameTrevo'; $s.Save()"

if %errorlevel% equ 0 (
    echo ======================================================
    echo [SUCESSO] Inicializacao configurada com sucesso!
    echo O GameTrevo iniciara automaticamente ao ligar o PC.
    echo ======================================================
) else (
    echo [ERRO] Nao foi possivel criar o atalho de inicializacao.
)

echo.
pause
