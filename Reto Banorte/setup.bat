@echo off
echo ==========================================================
echo 🏦 BANORTE A2UI · INSTALACION AUTOMATICA EN NUEVA PC
echo ==========================================================

echo 📦 1/3 Instalando dependencias del Orquestador Raiz...
call npm install

echo ⚙️ 2/3 Instalando dependencias del Backend & Servidor MCP...
cd backend
call npm install
if not exist .env (
  copy .env.example .env
  echo 📝 Se creo backend/.env. Puedes colocar tu GEMINI_API_KEY ahi.
)
cd ..

echo 🎨 3/3 Instalando dependencias del Frontend React & Vite...
cd frontend
call npm install
cd ..

echo.
echo ==========================================================
echo 🎉 ¡TODO INSTALADO CON EXITO!
echo Para arrancar todo el sistema ejecuta:
echo 👉 npm run dev
echo ==========================================================
pause
