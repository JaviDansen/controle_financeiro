// Mock data for the FinApp prototype.
// All values in BRL (R$).

const fmtBRL = (n) => {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + 'R$ ' + abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtBRLShort = (n) => {
  const abs = Math.abs(n);
  return abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CATEGORIES = {
  food:      { label: 'Alimentação', color: 'oklch(0.70 0.14 50)',  letter: 'A' },
  transport: { label: 'Transporte',  color: 'oklch(0.55 0.13 250)', letter: 'T' },
  health:    { label: 'Saúde',       color: 'oklch(0.60 0.13 10)',  letter: 'S' },
  home:      { label: 'Moradia',     color: 'oklch(0.55 0.13 150)', letter: 'M' },
  subs:      { label: 'Assinaturas', color: 'oklch(0.55 0.10 290)', letter: 'A' },
  leisure:   { label: 'Lazer',       color: 'oklch(0.65 0.13 80)',  letter: 'L' },
  income:    { label: 'Receita',     color: 'oklch(0.55 0.13 150)', letter: '+' },
  freelance: { label: 'Freelance',   color: 'oklch(0.55 0.13 200)', letter: 'F' },
  shop:      { label: 'Compras',     color: 'oklch(0.60 0.12 320)', letter: 'C' },
};

const TRANSACTIONS = [
  { id: 't1',  title: 'Salário — Brisanet',   amount: 5800.00, type: 'income',  cat: 'income',    card: null,  date: '14 mai',  notes: 'Mensal' },
  { id: 't2',  title: 'Aluguel apartamento',  amount: 1850.00, type: 'expense', cat: 'home',      card: null,  date: '13 mai',  notes: '' },
  { id: 't3',  title: 'Mercado Pão de Açúcar', amount: 312.47, type: 'expense', cat: 'food',      card: 'c1',  date: '12 mai',  notes: '' },
  { id: 't4',  title: 'iFood — Almoço',       amount: 38.90,   type: 'expense', cat: 'food',      card: 'c2',  date: '12 mai',  notes: '' },
  { id: 't5',  title: 'Uber para Cohama',     amount: 24.50,   type: 'expense', cat: 'transport', card: 'c2',  date: '11 mai',  notes: '' },
  { id: 't6',  title: 'Freela — Logotipo Padaria', amount: 1200.00, type: 'income', cat: 'freelance', card: null, date: '10 mai', notes: '' },
  { id: 't7',  title: 'Netflix',              amount: 55.90,   type: 'expense', cat: 'subs',      card: 'c1',  date: '09 mai',  notes: 'Recorrente' },
  { id: 't8',  title: 'Farmácia Pague Menos', amount: 87.30,   type: 'expense', cat: 'health',    card: 'c1',  date: '08 mai',  notes: '' },
  { id: 't9',  title: 'Cinema São Luís Shopping', amount: 64.00, type: 'expense', cat: 'leisure', card: 'c2',  date: '06 mai',  notes: '' },
  { id: 't10', title: 'Posto Ipiranga',       amount: 180.00,  type: 'expense', cat: 'transport', card: 'c1',  date: '04 mai',  notes: '' },
  { id: 't11', title: 'Amazon — Livro',       amount: 79.90,   type: 'expense', cat: 'shop',      card: 'c1',  date: '02 mai',  notes: 'Parcelado 3x' },
];

// Cards
const CARDS = [
  {
    id: 'c1',
    name: 'Roxinho',
    bank: 'Nubank',
    type: 'credit',
    last4: '4218',
    holder: 'WALBER VIDIGAL',
    expiry: '08/29',
    limit: 8500.00,
    used: 3247.50,
    closing_day: 16,
    best_purchase_day: 19,
    due_day: 23,
    open_installments_count: 4,
    open_installments_total: 1280.00,
    current_month_total: 1240.00,
    gradient: 'linear-gradient(135deg, #6B2D8C 0%, #3B0F66 100%)',
    accent: '#C77BF0',
  },
  {
    id: 'c2',
    name: 'Black',
    bank: 'Inter',
    type: 'credit',
    last4: '0921',
    holder: 'WALBER VIDIGAL',
    expiry: '02/30',
    limit: 12000.00,
    used: 1820.30,
    closing_day: 28,
    best_purchase_day: 30,
    due_day: 5,
    open_installments_count: 2,
    open_installments_total: 640.00,
    current_month_total: 820.30,
    gradient: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
    accent: '#FF7A00',
  },
  {
    id: 'c3',
    name: 'Conta',
    bank: 'Itaú',
    type: 'debit',
    last4: '7740',
    holder: 'WALBER VIDIGAL',
    expiry: '11/28',
    limit: null,
    used: null,
    closing_day: null,
    best_purchase_day: null,
    due_day: null,
    open_installments_count: 0,
    open_installments_total: 0,
    current_month_total: 0,
    gradient: 'linear-gradient(135deg, #F7610B 0%, #C44400 100%)',
    accent: '#FFF',
  },
];

// Dashboard summary for current month
const SUMMARY = {
  month: 'Maio 2026',
  income: 7000.00,
  expense: 2693.97,
  get balance() { return this.income - this.expense; },
  // Daily expense series for tiny chart (last 14 days)
  daily: [40, 0, 120, 65, 0, 220, 80, 38, 24, 87, 64, 0, 312, 180],
};

// Goals (metas)
const GOALS = [
  {
    id: 'g1', title: 'Viagem para Jericoacoara', target: 4500, current: 2890,
    deadline: '15 dez 2026', daysLeft: 214, color: 'oklch(0.65 0.14 50)', emoji: 'J', active: true,
  },
  {
    id: 'g2', title: 'Reserva de emergência', target: 18000, current: 11250,
    deadline: 'sem prazo', daysLeft: null, color: 'oklch(0.55 0.13 150)', emoji: 'R', active: true,
  },
  {
    id: 'g3', title: 'MacBook novo', target: 12500, current: 4100,
    deadline: '30 set 2026', daysLeft: 138, color: 'oklch(0.50 0.18 270)', emoji: 'M', active: true,
  },
  {
    id: 'g4', title: 'Curso de inglês', target: 2400, current: 2400,
    deadline: '01 mar 2026', daysLeft: 0, color: 'oklch(0.55 0.13 200)', emoji: 'C', active: false,
  },
];

// User profile
const USER = {
  name: 'Walber Vidigal',
  email: 'walber@brisanet.com',
  initials: 'WV',
  phone: '+55 98 9 8765-4321',
  joined: 'Maio 2026',
  city: 'São Luís, MA',
};

window.GOALS = GOALS;
window.USER = USER;
window.fmtBRL = fmtBRL;
window.fmtBRLShort = fmtBRLShort;
window.CATEGORIES = CATEGORIES;
window.TRANSACTIONS = TRANSACTIONS;
window.CARDS = CARDS;
window.SUMMARY = SUMMARY;
