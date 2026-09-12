import fs from 'fs';
import path from 'path';

export interface BankUser {
  id: string;
  name: string;
  email: string;
  creditScore: number;
  monthlyIncome: number;
  checkingBalance: number;
}

export interface CreditCard {
  id: string;
  userId: string;
  cardName: string;
  last4: string;
  creditLimit: number;
  currentBalance: number;
  minimumPayment: number;
  interestRateAnnual: number;
  catAnnual: number;
  cutoffDate: string;
  paymentDueDate: string;
  status: string;
}

export interface Transaction {
  id: string;
  userId: string;
  concept: string;
  category: string;
  amount: number;
  date: string;
  type: 'EXPENSE' | 'INCOME';
}

export interface Contact {
  id: string;
  name: string;
  bank: string;
  clabe: string;
  alias: string;
}

export interface RestructureOperation {
  operationId: string;
  userId: string;
  cardId: string;
  planId: string;
  months: number;
  monthlyQuota: number;
  appliedAt: string;
  status: string;
}

export interface BankData {
  users: BankUser[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  contacts: Contact[];
  operations: any[];
}

const dataFilePath = path.resolve(__dirname, '../data/mock_bank.json');

export function loadBankData(): BankData {
  const content = fs.readFileSync(dataFilePath, 'utf-8');
  return JSON.parse(content);
}

export function saveBankData(data: BankData): void {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Tool 1: get_client_financial_status
 */
export function getClientFinancialStatus(userId: string) {
  const data = loadBankData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error(`Usuario ${userId} no encontrado en el core bancario.`);
  }

  const cards = data.creditCards.filter((c) => c.userId === userId);
  const totalDebt = cards.reduce((acc, c) => acc + c.currentBalance, 0);

  return {
    user: {
      id: user.id,
      name: user.name,
      creditScore: user.creditScore,
      monthlyIncome: user.monthlyIncome,
      checkingBalance: user.checkingBalance ?? 0
    },
    cards: cards.map((c) => ({
      id: c.id,
      cardName: c.cardName,
      last4: c.last4,
      creditLimit: c.creditLimit,
      currentBalance: c.currentBalance,
      minimumPayment: c.minimumPayment,
      interestRateAnnual: `${c.interestRateAnnual}%`,
      catAnnual: `${c.catAnnual}%`,
      status: c.status
    })),
    totalDebt
  };
}

/**
 * Tool 2: simulate_debt_restructure
 */
export function simulateDebtRestructure(debtAmount: number) {
  const ratio = debtAmount / 18400;

  const options = [
    {
      planId: 'plan_12m',
      months: 12,
      cat: 32.4,
      monthlyPayment: Math.round(1690 * ratio),
      totalToPay: Math.round(1690 * ratio * 12),
      estimatedSavings: Math.round(3800 * ratio),
      recommended: false
    },
    {
      planId: 'plan_18m',
      months: 18,
      cat: 34.1,
      monthlyPayment: Math.round(1215 * ratio),
      totalToPay: Math.round(1215 * ratio * 18),
      estimatedSavings: Math.round(4900 * ratio),
      recommended: true
    },
    {
      planId: 'plan_24m',
      months: 24,
      cat: 36.0,
      monthlyPayment: Math.round(980 * ratio),
      totalToPay: Math.round(980 * ratio * 24),
      estimatedSavings: Math.round(5600 * ratio),
      recommended: false
    }
  ];

  return {
    debtAmount,
    currentCat: 54.2,
    options
  };
}

/**
 * Tool 3: apply_debt_restructuring
 */
export function applyDebtRestructuring(
  userId: string,
  cardId: string,
  planId: string,
  months: number,
  monthlyQuota: number
) {
  const data = loadBankData();
  const cardIndex = data.creditCards.findIndex(
    (c) => c.userId === userId && c.id === cardId
  );

  if (cardIndex === -1) {
    throw new Error(`Tarjeta ${cardId} no encontrada para el cliente ${userId}`);
  }

  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const operationId = `BNTE-RST-${randomSuffix}`;

  const operation: RestructureOperation = {
    operationId,
    userId,
    cardId,
    planId,
    months,
    monthlyQuota,
    appliedAt: new Date().toISOString(),
    status: 'APPLIED'
  };

  data.operations.push(operation);
  data.creditCards[cardIndex].minimumPayment = monthlyQuota;
  data.creditCards[cardIndex].catAnnual = months === 12 ? 32.4 : months === 18 ? 34.1 : 36.0;

  saveBankData(data);

  return {
    success: true,
    operationId,
    cardName: data.creditCards[cardIndex].cardName,
    last4: data.creditCards[cardIndex].last4,
    months,
    monthlyQuota,
    message: 'Tu plan de reestructuración de deuda ha sido activado con éxito.'
  };
}

/**
 * Tool 4: simulate_investment_portfolio
 * Simula rendimientos de inversión en pagaré Banorte o fondos
 */
export function simulateInvestmentPortfolio(amount: number = 25000, days: number = 91) {
  const pagarteAnnualRate = 11.25; // 11.25% anual
  const cetesAnnualRate = 11.00;   // 11.00% anual

  const calculateReturn = (principal: number, annualRate: number, termDays: number) => {
    const grossEarnings = (principal * (annualRate / 100) * termDays) / 360;
    const isr = grossEarnings * 0.005; // ISR estimado retenible
    const netEarnings = grossEarnings - isr;
    return {
      grossEarnings: Math.round(grossEarnings),
      netEarnings: Math.round(netEarnings),
      totalFinal: Math.round(principal + netEarnings),
      rate: annualRate
    };
  };

  const pagarte = calculateReturn(amount, pagarteAnnualRate, days);
  const cetes = calculateReturn(amount, cetesAnnualRate, days);

  return {
    amount,
    days,
    options: [
      {
        id: 'inv_pagare_banorte',
        name: 'Pagaré Banorte Tradicional',
        tag: 'Garantizado por IPAB',
        annualRate: pagarte.rate,
        termDays: days,
        profitNet: pagarte.netEarnings,
        totalFinal: pagarte.totalFinal,
        recommended: true
      },
      {
        id: 'inv_cetes_gubernamental',
        name: 'Fondo de Deuda Gubernamental (CETES)',
        tag: 'Riesgo Mínimo',
        annualRate: cetes.rate,
        termDays: days,
        profitNet: cetes.netEarnings,
        totalFinal: cetes.totalFinal,
        recommended: false
      }
    ]
  };
}

/**
 * Tool 5: get_transaction_history
 * Consulta el historial de movimientos y desglose de gastos
 */
export function getTransactionHistory(userId: string) {
  const data = loadBankData();
  const txs = data.transactions.filter((t) => t.userId === userId);
  const expenses = txs.filter((t) => t.type === 'EXPENSE');
  const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);

  // Agrupar por categoría
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  return {
    transactions: txs,
    totalExpenses,
    topCategory: Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0] || ['Despensa', 0],
    categoryBreakdown: categoryMap
  };
}

/**
 * Tool: resolve_recipient
 * Busca en la agenda de contactos o crea el registro dinámico para cualquier persona
 */
export function resolveRecipient(query: string) {
  const data = loadBankData();
  const q = query.toLowerCase().trim();

  const found = data.contacts.find(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.alias.toLowerCase().includes(q) ||
      q.includes(c.alias.toLowerCase())
  );

  if (found) {
    return {
      isNew: false,
      recipientName: found.name,
      bank: found.bank,
      clabe: found.clabe,
      alias: found.alias
    };
  }

  // Destinatario libre detectado por NLP
  return {
    isNew: true,
    recipientName: query,
    bank: 'Cualquier Banco Nacional (SPEI)',
    clabe: '',
    alias: query
  };
}

/**
 * Tool 6: execute_transfer
 * Ejecuta una transferencia rápida SPEI
 */
export function executeTransfer(userId: string, recipientName: string, amount: number, concept: string) {
  const data = loadBankData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) throw new Error('Usuario no encontrado');

  if (user.checkingBalance < amount) {
    throw new Error(`Saldo insuficiente en cuenta de cheques ($${user.checkingBalance} MXN disponible).`);
  }

  user.checkingBalance -= amount;
  const trackingNumber = `SPEI-BNTE-${Math.floor(100000 + Math.random() * 900000)}`;

  data.operations.push({
    operationId: trackingNumber,
    type: 'TRANSFER',
    userId,
    recipient: recipientName,
    amount,
    concept,
    timestamp: new Date().toISOString()
  });

  data.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId,
    concept: `Transf. a ${recipientName}: ${concept}`,
    category: 'Transferencias',
    amount,
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE'
  });

  saveBankData(data);

  return {
    success: true,
    trackingNumber,
    amount,
    recipientName,
    remainingBalance: user.checkingBalance,
    date: new Date().toLocaleString('es-MX')
  };
}

/**
 * Tool 7: get_financial_health_diagnostic
 * Diagnóstico financiero completo (Semáforo, Score, DTI)
 */
export function getFinancialHealthDiagnostic(userId: string) {
  const data = loadBankData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) throw new Error('Usuario no encontrado');

  const card = data.creditCards.find((c) => c.userId === userId);
  const totalDebt = card?.currentBalance || 0;
  const monthlyIncome = user.monthlyIncome;

  // Debt-to-Income (DTI)
  const dti = Math.round((totalDebt / (monthlyIncome * 12)) * 100);

  return {
    clientName: user.name,
    creditScore: user.creditScore,
    scoreRange: 'Bueno (685 / 850)',
    dtiPercentage: dti,
    status: dti > 30 ? 'ATENCIÓN_REQUERIDA' : 'SALUDABLE',
    recommendations: [
      'Tu nivel de endeudamiento en tarjetas está al 65% de tu ingreso mensual.',
      'Reestructurar tu tarjeta Banorte Por Ti Oro liberará $1,300 MXN mensuales de flujo.',
      'Comienza un fondo de emergencia con el Pagaré Banorte al 11.25% anual.'
    ]
  };
}

/**
 * Resetea los datos a su estado original para la demo
 */
export function resetBankData(): void {
  const initialData: BankData = {
    users: [
      {
        id: "usr_carlos_01",
        name: "Carlos Mendoza",
        email: "carlos.mendoza@ejemplo.com",
        creditScore: 685,
        monthlyIncome: 28000,
        checkingBalance: 14500
      },
      {
        id: "usr_sofia_02",
        name: "Sofía Ramírez",
        email: "sofia.ramirez@ejemplo.com",
        creditScore: 760,
        monthlyIncome: 45000,
        checkingBalance: 52000
      },
      {
        id: "usr_roberto_03",
        name: "Roberto Treviño",
        email: "roberto.trevino@ejemplo.com",
        creditScore: 810,
        monthlyIncome: 65000,
        checkingBalance: 85000
      }
    ],
    creditCards: [
      {
        id: "crd_carlos_oro",
        userId: "usr_carlos_01",
        cardName: "Banorte Por Ti Oro",
        last4: "4821",
        creditLimit: 35000,
        currentBalance: 18400,
        minimumPayment: 1472,
        interestRateAnnual: 46.5,
        catAnnual: 54.2,
        cutoffDate: "2026-09-18",
        paymentDueDate: "2026-10-08",
        status: "ACTIVE"
      }
    ],
    transactions: [
      {
        id: "tx_01",
        userId: "usr_carlos_01",
        concept: "Supermercado HEB San Pedro",
        category: "Despensa",
        amount: 2340.5,
        date: "2026-09-10",
        type: "EXPENSE"
      },
      {
        id: "tx_02",
        userId: "usr_carlos_01",
        concept: "Amazon México",
        category: "Compras",
        amount: 1890.0,
        date: "2026-09-08",
        type: "EXPENSE"
      },
      {
        id: "tx_03",
        userId: "usr_carlos_01",
        concept: "CFE Suministrador",
        category: "Servicios",
        amount: 845.0,
        date: "2026-09-05",
        type: "EXPENSE"
      },
      {
        id: "tx_04",
        userId: "usr_carlos_01",
        concept: "Uber Trips",
        category: "Transporte",
        amount: 420.0,
        date: "2026-09-04",
        type: "EXPENSE"
      },
      {
        id: "tx_05",
        userId: "usr_carlos_01",
        concept: "Nómina Quincenal Banorte",
        category: "Ingreso",
        amount: 14000.0,
        date: "2026-08-31",
        type: "INCOME"
      }
    ],
    contacts: [
      { "id": "cnt_01", "name": "Mamá (Rosa Mendoza)", "bank": "Banorte", "clabe": "072580012345678901", "alias": "Mamá" },
      { "id": "cnt_02", "name": "Arrendadora Valle (Renta)", "bank": "BBVA", "clabe": "012180004567891234", "alias": "Renta" },
      { "id": "cnt_03", "name": "Juan Pérez", "bank": "Santander", "clabe": "014580009876543210", "alias": "Juan Amigo" }
    ],
    operations: []
  };

  saveBankData(initialData);
}
