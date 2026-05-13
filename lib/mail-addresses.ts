const LOOSE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function splitAddressList(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isLooseEmail(addr: string): boolean {
  return LOOSE_EMAIL.test(addr);
}