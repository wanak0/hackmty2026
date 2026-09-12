# 💻 Guía Rápida para Correr el Proyecto en Otra Computadora

Has descomprimido el proyecto **Banorte A2UI (Hackathon Tec 2026)**. Sigue estos 3 sencillos pasos para tener todo corriendo en menos de 2 minutos.

---

## 📋 Requisitos Previos
* Tener instalado **Node.js** (versión 18 o superior). Puedes verificarlo abriendo una terminal y escribiendo `node -v`.

---

## ⚡ Paso 1: Instalación Automática (Elige tu Sistema Operativo)

### En Mac / Linux:
Abre una terminal en la carpeta descomprimida y ejecuta:
```bash
./setup.sh
```
*(O alternativamente: `npm run setup`)*

### En Windows:
Haz doble clic en el archivo:
```
setup.bat
```
*(O en PowerShell / CMD: `npm run setup`)*

---

## 🔑 Paso 2: Variable de Entorno (Ollama Cloud / API)
El script de instalación creará automáticamente el archivo `backend/.env`.
Si deseas utilizar la inteligencia artificial generativa con **Ollama Cloud** (según [docs.ollama.com](https://docs.ollama.com/cloud)), abre `backend/.env` y coloca tu configuración:
```env
# Ollama Cloud (https://ollama.com/settings/keys) o instancia local/remota
OLLAMA_HOST=https://ollama.com
OLLAMA_API_KEY=tu_clave_de_ollama_aqui
OLLAMA_MODEL=gemma4:3.1b

# Google Gemini (opcional / fallback secundario)
GEMINI_API_KEY=tu_clave_de_gemini_aqui

PORT=3001
```
> **Nota de Resiliencia:** Si no tienes clave o no hay conexión a internet durante la presentación, **el sistema cuenta con un motor NLP determinístico integrado con todas las herramientas bancarias MCP**, por lo que podrás hacer toda la demo ante los jueces sin riesgo de que falle.

---

## 🚀 Paso 3: Arrancar el Sistema Completo
En tu terminal, ejecuta un solo comando:
```bash
npm run dev
```

Este comando levantará en paralelo:
* 📡 **Backend + Servidor MCP:** `http://localhost:3001`
* 🌐 **Frontend (Landing Page + A2UI):** `http://localhost:5173`

Abre tu navegador en:
👉 **`http://localhost:5173`**
