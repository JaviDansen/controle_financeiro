export const fmtBRL = (n: number): string => {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + 'R$ ' + abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtBRLShort = (n: number): string => {
  const abs = Math.abs(n);
  return abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
