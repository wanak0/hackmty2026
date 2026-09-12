import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processUserMessage } from './agent/gemini.js';
import { getClientFinancialStatus, resetBankData, loadBankData } from './mcp/tools.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint de Salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Banorte A2UI Orchestrator & MCP Backend',
    version: '1.0.0'
  });
});

// Endpoint principal: Chat y A2UI Loop
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const screen = await processUserMessage(message || '', context);
    res.json(screen);
  } catch (error: any) {
    console.error('Error procesando mensaje en /api/chat:', error);
    res.status(500).json({
      error: 'Error interno procesando la interfaz A2UI',
      details: error.message
    });
  }
});

// Endpoint para consultar estado bancario en tiempo real
app.get('/api/user/:id/status', (req, res) => {
  try {
    const status = getClientFinancialStatus(req.params.id);
    res.json(status);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Endpoint para ver la base de datos completa (inspección de jueces)
app.get('/api/debug/database', (req, res) => {
  res.json(loadBankData());
});

// Endpoint para reiniciar la demo a su estado inicial
app.post('/api/reset', (req, res) => {
  try {
    resetBankData();
    res.json({ success: true, message: 'Base de datos bancaria reiniciada a valores de fábrica para la demo.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🏦 BANORTE A2UI BACKEND & MCP ACTIVO`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
