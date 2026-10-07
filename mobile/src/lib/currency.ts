// Format an amount in Ghana cedis, e.g. "GH₵ 1,250.00" (decimals = 0 for quick-amount chips).
export const formatCedis = (amount: number | string | null | undefined, decimals = 2): string => {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  return `GH₵ ${safe.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};
