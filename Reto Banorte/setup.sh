#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🏦 BANORTE A2UI · INSTALACIÓN AUTOMÁTICA EN NUEVA PC"
echo "=========================================================="

echo "📦 1/3 Instalando dependencias del Orquestador Raíz..."
npm install

echo "⚙️ 2/3 Instalando dependencias del Backend & Servidor MCP..."
cd backend
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Se creó backend/.env. Puedes colocar tu GEMINI_API_KEY ahí si deseas usar la IA en vivo."
fi
cd ..

echo "🎨 3/3 Instalando dependencias del Frontend React & Vite..."
cd frontend
npm install
cd ..

echo ""
echo "=========================================================="
echo "🎉 ¡TODO INSTALADO CON ÉXITO!"
echo "Para arrancar todo el sistema ejecuta:"
echo "👉 npm run dev"
echo "=========================================================="
