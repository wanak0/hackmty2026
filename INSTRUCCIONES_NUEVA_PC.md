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

## 🔑 Paso 2: Variable de Entorno (Opcional)
El script de instalación creará automáticamente el archivo `backend/.env`.
Si deseas utilizar la inteligencia artificial en vivo con Google Gemini, abre `backend/.env` y pega tu clave:
```env
GEMINI_API_KEY=tu_clave_aqui
PORT=3001
```
> **Nota:** Si no tienes clave o no tienes internet en ese momento, **el sistema cuenta con un motor de simulación local integrado**, por lo que podrás hacer toda la demo sin problemas.

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
