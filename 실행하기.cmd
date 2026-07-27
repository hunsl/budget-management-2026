@echo off
chcp 65001 > nul
cd /d "%~dp0"

if not exist "node_modules" (
  echo 필요한 패키지를 설치합니다...
  call npm install
  if errorlevel 1 goto :error
)

echo 예산관리 프로그램을 시작합니다.
echo 브라우저가 열리지 않으면 http://127.0.0.1:5173 을 여세요.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:5173'"
call npm run start -- --host 127.0.0.1
exit /b 0

:error
echo 실행 준비 중 오류가 발생했습니다.
pause
exit /b 1
