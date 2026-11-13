@echo off
title GameTrevo - Atualizar Projeto
chcp 65001 >nul
echo ======================================================
echo               ATUALIZAR GAMETREVO
echo ======================================================
echo.

cd /d "%~dp0"

echo [1/3] Puxando ultimas atualizacoes do GitHub...
git pull origin main

echo.
echo [2/3] Atualizando dependencias...
call npm install

echo.
echo [3/3] Atualizacao concluida com sucesso!
pause
