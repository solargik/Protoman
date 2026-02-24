import { exec } from 'child_process';
import { promisify } from 'util';
import { NetworkDevice } from '../core/network/device';

const execAsync = promisify(exec);

function normalizeMac(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/-/g, ':');
  const octets = cleaned.split(':').filter(Boolean);

  if (octets.length !== 6) return null;
  if (!octets.every(o => /^[0-9A-F]{1,2}$/.test(o))) return null;

  const normalized = octets.map(o => (o.length === 1 ? `0${o}` : o)).join(':');
  if (normalized === '00:00:00:00:00:00') return null;

  return normalized;
}

function parseArpOutput(text: string): NetworkDevice[] {
  const results: NetworkDevice[] = [];
  const seen = new Set<string>();

  text.split(/\r?\n/).forEach(line => {
    const winMatch = line.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b\s+([0-9a-fA-F:-]{11,})\s+\w+/);
    const unixParenMatch = line.match(/\((\d{1,3}(?:\.\d{1,3}){3})\)\s+at\s+([0-9a-fA-F:]{11,}|<incomplete>)/i);
    const unixPlainMatch = line.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b\s+ether\s+([0-9a-fA-F:]{11,})/i);

    const ip = winMatch?.[1] || unixParenMatch?.[1] || unixPlainMatch?.[1];
    const rawMac = winMatch?.[2] || unixParenMatch?.[2] || unixPlainMatch?.[2];

    if (!ip || !rawMac || rawMac.toLowerCase() === '<incomplete>') return;

    const mac = normalizeMac(rawMac);
    if (!mac) return;

    const key = `${ip}-${mac}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ ip, mac });
    }
  });

  return results.sort((a, b) => {
    const aa = a.ip.split('.').map(n => Number(n));
    const bb = b.ip.split('.').map(n => Number(n));
    for (let i = 0; i < 4; i++) {
      if (aa[i] !== bb[i]) return aa[i] - bb[i];
    }
    return a.mac.localeCompare(b.mac);
  });
}

export async function scanNetworkDevices(): Promise<NetworkDevice[]> {
  const command = process.platform === 'win32' ? 'arp -a' : 'arp -an';
  const { stdout } = await execAsync(command);
  return parseArpOutput(stdout || '');
}
