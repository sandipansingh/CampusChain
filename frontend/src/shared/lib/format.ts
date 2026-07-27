export function shortAddr(addr: string): string {
  if (!addr) return "";
  return addr.length > 10 ? `${addr.slice(0, 8)}...${addr.slice(-8)}` : addr;
}

export function relativeTime(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatTokenAmount(amountStroops: bigint | number | string, decimals = 7): string {
  const num = Number(amountStroops) / Math.pow(10, decimals);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function toStroops(amount: number, decimals = 7): bigint {
  return BigInt(Math.round(amount * Math.pow(10, decimals)));
}
