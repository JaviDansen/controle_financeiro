import { Goal, Summary } from '../../types/finance';

export const SUMMARY: Summary = {
  month: 'Maio 2026',
  income: 7000.00,
  expense: 2693.97,
  daily: [40, 0, 120, 65, 0, 220, 80, 38, 24, 87, 64, 0, 312, 180],
};

export const GOALS: Goal[] = [
  { id: 'g1', title: 'Viagem para Jericoacoara', target: 4500,  current: 2890,  deadline: '15 dez 2026', daysLeft: 214,  color: '#C07830', emoji: 'J', active: true  },
  { id: 'g2', title: 'Reserva de emergência',    target: 18000, current: 11250, deadline: 'sem prazo',   daysLeft: null, color: '#3D8B4E', emoji: 'R', active: true  },
  { id: 'g3', title: 'MacBook novo',             target: 12500, current: 4100,  deadline: '30 set 2026', daysLeft: 138,  color: '#4B5EA0', emoji: 'M', active: true  },
  { id: 'g4', title: 'Curso de inglês',          target: 2400,  current: 2400,  deadline: '01 mar 2026', daysLeft: 0,    color: '#2E7A8A', emoji: 'C', active: false },
];
