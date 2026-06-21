import { exec } from 'child_process';
import os from 'os';
import { promisify } from 'util';
import { NetworkDevice } from '../core/network/device';

const execAsync = promisify(exec);
const MAX_PING_CONCURRENCY = 32;
const PING_TIMEOUT_MS = 250;

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

function getSubnetPrefixes(): string[] {
  const all = os.networkInterfaces();
  const prefixes = new Set<string>();

  Object.keys(all).forEach(ifName => {
    const entries = all[ifName] as os.NetworkInterfaceInfo[] | undefined;
    (entries || []).forEach((entry: os.NetworkInterfaceInfo) => {
      const family = entry.family;
      if (family !== 'IPv4' || entry.internal) return;

      const parts = entry.address.split('.').map(n => Number(n));
      if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return;

      const [a, b, c] = parts;
      prefixes.add(`${a}.${b}.${c}`);
    });
  });

  return [...prefixes];
}

function pingCommand(ip: string): string {
  if (process.platform === 'win32') {
    return `ping -n 1 -w ${PING_TIMEOUT_MS} ${ip}`;
  }
  return `ping -c 1 -W 1 ${ip}`;
}

async function pingIp(ip: string): Promise<void> {
  try {
    await execAsync(pingCommand(ip));
  } catch (_e) {
    // Intentionally ignored: ping failures are expected for offline hosts.
  }
}

async function runWithConcurrency(items: string[], worker: (item: string) => Promise<void>, concurrency: number): Promise<void> {
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const cur = nextIndex;
      nextIndex += 1;
      await worker(items[cur]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(workers);
}

async function activeSubnetSweep(): Promise<void> {
  const prefixes = getSubnetPrefixes();
  if (prefixes.length === 0) return;

  const targets: string[] = [];
  prefixes.forEach((prefix: string) => {
    for (let host = 0; host <= 254; host += 1) {
      targets.push(`${prefix}.${host}`);
    }
  });

  await runWithConcurrency(targets, pingIp, MAX_PING_CONCURRENCY);
}

export async function scanNetworkDevices(): Promise<NetworkDevice[]> {
  await activeSubnetSweep();

  const command = process.platform === 'win32' ? 'arp -a' : 'arp -an';
  const { stdout } = await execAsync(command);
  return parseArpOutput(stdout || '');
}
