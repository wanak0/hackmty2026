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
      checkingBalance: user.checkingBalance ?? 14500
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
 * Tool 4b: apply_investment
 * Debita la cuenta de cheques y registra la inversión en el core.
 */
export function applyInvestment(
  userId: string,
  amount: number,
  days: number,
  productId: string = 'inv_pagare_banorte'
) {
  const data = loadBankData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) throw new Error('Usuario no encontrado');

  if (user.checkingBalance < amount) {
    throw new Error(
      `Saldo insuficiente para invertir ($${user.checkingBalance} MXN disponible, se requieren $${amount}).`
    );
  }

  const simulation = simulateInvestmentPortfolio(amount, days);
  const product =
    simulation.options.find((o) => o.id === productId) || simulation.options[0];

  user.checkingBalance -= amount;
  const operationId = `INV-BNTE-${Math.floor(100000 + Math.random() * 900000)}`;

  data.operations.push({
    operationId,
    type: 'INVESTMENT',
    userId,
    productId: product.id,
    productName: product.name,
    amount,
    days,
    annualRate: product.annualRate,
    profitNet: product.profitNet,
    totalFinal: product.totalFinal,
    timestamp: new Date().toISOString(),
    status: 'APPLIED'
  });

  data.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId,
    concept: `Inversión ${product.name} (${days} días)`,
    category: 'Inversiones',
    amount,
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE'
  });

  saveBankData(data);

  return {
    success: true,
    operationId,
    productName: product.name,
    amount,
    days,
    annualRate: product.annualRate,
    profitNet: product.profitNet,
    totalFinal: product.totalFinal,
    remainingBalance: user.checkingBalance
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
 * Tool: pay_credit_card
 * Paga la TDC con saldo de cheques: baja checkingBalance y currentBalance.
 */
export function payCreditCard(
  userId: string,
  amount: number,
  cardId?: string
) {
  const data = loadBankData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) throw new Error('Usuario no encontrado');

  const card = cardId
    ? data.creditCards.find((c) => c.userId === userId && c.id === cardId)
    : data.creditCards.find((c) => c.userId === userId);

  if (!card) {
    throw new Error(`Tarjeta no encontrada para el cliente ${userId}`);
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('El monto del pago debe ser mayor a 0.');
  }

  const payment = Math.min(amount, card.currentBalance);
  if (payment <= 0) {
    throw new Error('La tarjeta no tiene saldo pendiente.');
  }

  if (user.checkingBalance < payment) {
    throw new Error(
      `Saldo insuficiente en cheques ($${user.checkingBalance} MXN disponible, se requieren $${payment}).`
    );
  }

  user.checkingBalance -= payment;
  card.currentBalance = Math.round((card.currentBalance - payment) * 100) / 100;

  const operationId = `PAY-TDC-${Math.floor(100000 + Math.random() * 900000)}`;
  data.operations.push({
    operationId,
    type: 'CARD_PAYMENT',
    userId,
    cardId: card.id,
    amount: payment,
    remainingCardBalance: card.currentBalance,
    remainingCheckingBalance: user.checkingBalance,
    timestamp: new Date().toISOString(),
    status: 'APPLIED'
  });

  data.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId,
    concept: `Pago TDC ${card.cardName} •••• ${card.last4}`,
    category: 'Pago tarjeta',
    amount: payment,
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE'
  });

  saveBankData(data);

  return {
    success: true,
    operationId,
    cardName: card.cardName,
    last4: card.last4,
    amountPaid: payment,
    remainingCardBalance: card.currentBalance,
    remainingCheckingBalance: user.checkingBalance,
    message: `Pago de $${payment.toLocaleString('es-MX')} aplicado a tu ${card.cardName}.`
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

const UI_ICON_CATALOG = [
  'wallet',
  'credit-card',
  'piggy-bank',
  'trending-up',
  'trending-down',
  'shield',
  'sparkles',
  'banknote',
  'arrow-right-left',
  'receipt',
  'chart-pie',
  'chart-bar',
  'heart-pulse',
  'target',
  'zap',
  'shopping-bag',
  'car',
  'home',
  'check-circle',
  'alert-triangle',
  'coins',
  'percent',
  'calendar'
] as const;

/**
 * Tool: get_ui_kit
 * Devuelve catálogo de íconos, series listas para gráficas y bloques A2UI default
 * con datos reales del usuario (para que el diseñador A2UI no invente UI pobre).
 */
export function getUiKit(userId: string, focus: string = 'auto') {
  const status = getClientFinancialStatus(userId) as any;
  const txs = getTransactionHistory(userId) as any;
  const card = status.cards?.[0];
  const checking = Number(status.user?.checkingBalance ?? 0);
  const debt = Number(status.totalDebt ?? 0);
  const limit = Number(card?.creditLimit || 35000);
  const usagePct = limit > 0 ? Math.round((debt / limit) * 100) : 0;
  const minPay = Number(card?.minimumPayment || 980);

  const categoryEntries = Object.entries(txs.categoryBreakdown || {}).map(
    ([label, value]) => ({
      label,
      value: Number(value),
      color: undefined as string | undefined
    })
  );
  const palette = ['#EB0029', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#64748B'];
  categoryEntries.forEach((e, i) => {
    e.color = palette[i % palette.length];
  });

  let debtSim: any = null;
  try {
    debtSim = simulateDebtRestructure(debt || 18400);
  } catch {
    debtSim = null;
  }

  const charts = {
    spendingDonut: {
      type: 'DonutChart',
      props: {
        title: 'Gastos por categoría',
        centerLabel: 'Total',
        centerValue: `$${Number(txs.totalExpenses || 0).toLocaleString('es-MX')}`,
        segments: categoryEntries.map((e) => ({
          label: e.label,
          value: e.value,
          color: e.color
        }))
      }
    },
    balancesBar: {
      type: 'BarChart',
      props: {
        title: 'Saldos vs deuda',
        unit: 'MXN',
        orientation: 'horizontal',
        bars: [
          { label: 'Cheques', value: checking, color: '#10B981', icon: 'wallet' },
          { label: 'Deuda TDC', value: debt, color: '#EB0029', icon: 'credit-card' },
          {
            label: 'Disponible TDC',
            value: Math.max(0, limit - debt),
            color: '#3B82F6',
            icon: 'banknote'
          }
        ]
      }
    },
    creditUsage: {
      type: 'ProgressBar',
      props: {
        label: 'Uso de línea de crédito',
        value: usagePct,
        max: 100,
        unit: '%',
        tone: usagePct > 70 ? 'danger' : usagePct > 40 ? 'warning' : 'success',
        icon: 'credit-card',
        subtext: `$${debt.toLocaleString('es-MX')} de $${limit.toLocaleString('es-MX')}`
      }
    },
    planBars: debtSim
      ? {
          type: 'BarChart',
          props: {
            title: 'Pago mensual por plazo',
            unit: 'MXN/mes',
            orientation: 'vertical',
            bars: debtSim.options.map((o: any) => ({
              label: `${o.months}m`,
              value: o.monthlyPayment,
              color: o.recommended ? '#EB0029' : '#94A3B8',
              highlight: !!o.recommended
            }))
          }
        }
      : null
  };

  const defaultBlocks = [
    {
      id: 'kit_header',
      type: 'SectionHeader',
      props: {
        icon: 'sparkles',
        title: `Hola ${status.user?.name?.split(' ')[0] || ''}`,
        subtitle: 'Vista con datos frescos del core Banorte'
      }
    },
    {
      id: 'kit_stats',
      type: 'Grid',
      props: { columns: 2 },
      children: [
        {
          id: 'kit_stat_check',
          type: 'StatTile',
          props: {
            icon: 'wallet',
            label: 'Saldo débito',
            value: `$${checking.toLocaleString('es-MX')}`,
            tone: 'success'
          }
        },
        {
          id: 'kit_stat_debt',
          type: 'StatTile',
          props: {
            icon: 'credit-card',
            label: 'Deuda TDC',
            value: `$${debt.toLocaleString('es-MX')}`,
            tone: 'danger',
            trend: 'negative'
          }
        }
      ]
    },
    {
      id: 'kit_usage',
      type: 'ProgressBar',
      props: charts.creditUsage.props
    },
    {
      id: 'kit_donut',
      type: 'DonutChart',
      props: charts.spendingDonut.props
    },
    {
      id: 'kit_bars',
      type: 'BarChart',
      props: charts.balancesBar.props
    }
  ];

  const focusHints: Record<string, string[]> = {
    spending: ['DonutChart', 'StatTile', 'TransactionTable', 'SectionHeader'],
    debt: ['ProgressBar', 'BarChart', 'StatTile', 'OptionPills', 'SectionHeader'],
    balances: ['BarChart', 'StatTile', 'ProgressBar', 'SectionHeader'],
    health: ['ProgressBar', 'StatTile', 'FinancialHealthScore', 'SectionHeader'],
    investment: ['StatTile', 'BarChart', 'InvestmentSimulator', 'SectionHeader'],
    card_payment: ['StatTile', 'ProgressBar', 'OptionPills', 'SectionHeader'],
    auto: ['SectionHeader', 'StatTile', 'DonutChart', 'BarChart', 'ProgressBar']
  };

  return {
    focus: focus || 'auto',
    icons: UI_ICON_CATALOG,
    palette: {
      primary: '#EB0029',
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      muted: '#64748B',
      surface: '#F8F9FB'
    },
    charts,
    defaultBlocks,
    recommendedTypes: focusHints[focus] || focusHints.auto,
    paymentHints: {
      minimumPayment: minPay,
      checking,
      debt,
      cardId: card?.id
    },
    usageNote:
      'Copia props de charts.* o defaultBlocks a tu pantalla A2UI. Usa Icon name solo del catálogo icons[]. Incluye al menos 1 gráfica (DonutChart|BarChart|ProgressBar) y StatTile con icon.'
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
