import type { Resolution } from '@/data/parts';

export type PerformanceTier = 1 | 2 | 3 | 4 | 5;

export type GamePerformanceProfile = {
  key: string;
  name: string;
  aliases: string[];
  performanceByResolution: Record<Resolution, Record<string, PerformanceTier>>;
};

const gpuIds = {
  rx7600: 'gpu-radeon-rx-7600',
  rtx4060Ti: 'gpu-geforce-rtx-4060-ti',
  rtx4070Super: 'gpu-geforce-rtx-4070-super',
  rx7900Xt: 'gpu-radeon-rx-7900-xt',
} as const;

export const gamePerformanceCatalog: GamePerformanceProfile[] = [
  {
    key: 'baldurs-gate-3',
    name: 'Baldur’s Gate 3',
    aliases: ['bg3'],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 3, [gpuIds.rtx4060Ti]: 4, [gpuIds.rtx4070Super]: 5, [gpuIds.rx7900Xt]: 5 },
      '1440p': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 3, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
      '4K': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 3, [gpuIds.rx7900Xt]: 4 },
    },
  },
  {
    key: 'cyberpunk-2077',
    name: 'Cyberpunk 2077',
    aliases: ['cyberpunk'],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 3, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
      '1440p': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
      '4K': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 1, [gpuIds.rtx4070Super]: 3, [gpuIds.rx7900Xt]: 4 },
    },
  },
  {
    key: 'counter-strike-2',
    name: 'Counter-Strike 2',
    aliases: ['cs2', 'counter strike 2'],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 4, [gpuIds.rtx4060Ti]: 5, [gpuIds.rtx4070Super]: 5, [gpuIds.rx7900Xt]: 5 },
      '1440p': { [gpuIds.rx7600]: 3, [gpuIds.rtx4060Ti]: 4, [gpuIds.rtx4070Super]: 5, [gpuIds.rx7900Xt]: 5 },
      '4K': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 3, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
    },
  },
  {
    key: 'fortnite',
    name: 'Fortnite',
    aliases: [],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 4, [gpuIds.rtx4060Ti]: 5, [gpuIds.rtx4070Super]: 5, [gpuIds.rx7900Xt]: 5 },
      '1440p': { [gpuIds.rx7600]: 3, [gpuIds.rtx4060Ti]: 4, [gpuIds.rtx4070Super]: 5, [gpuIds.rx7900Xt]: 5 },
      '4K': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 3, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
    },
  },
  {
    key: 'minecraft',
    name: 'Minecraft',
    aliases: ['minecraft java', 'minecraft bedrock'],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 3, [gpuIds.rtx4060Ti]: 4, [gpuIds.rtx4070Super]: 5, [gpuIds.rx7900Xt]: 5 },
      '1440p': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 3, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
      '4K': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 3, [gpuIds.rx7900Xt]: 4 },
    },
  },
  {
    key: 'grand-theft-auto-v',
    name: 'Grand Theft Auto V',
    aliases: ['gta v', 'gta 5', 'gtav'],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 4, [gpuIds.rtx4060Ti]: 4, [gpuIds.rtx4070Super]: 5, [gpuIds.rx7900Xt]: 5 },
      '1440p': { [gpuIds.rx7600]: 3, [gpuIds.rtx4060Ti]: 4, [gpuIds.rtx4070Super]: 5, [gpuIds.rx7900Xt]: 5 },
      '4K': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 3, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
    },
  },
  {
    key: 'hogwarts-legacy',
    name: 'Hogwarts Legacy',
    aliases: [],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 3, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
      '1440p': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 3, [gpuIds.rx7900Xt]: 4 },
      '4K': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 3, [gpuIds.rx7900Xt]: 4 },
    },
  },
  {
    key: 'red-dead-redemption-2',
    name: 'Red Dead Redemption 2',
    aliases: ['rdr2', 'red dead 2'],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 3, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
      '1440p': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
      '4K': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 3, [gpuIds.rx7900Xt]: 4 },
    },
  },
  {
    key: 'call-of-duty-warzone',
    name: 'Call of Duty: Warzone',
    aliases: ['warzone', 'cod warzone'],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 3, [gpuIds.rtx4060Ti]: 4, [gpuIds.rtx4070Super]: 5, [gpuIds.rx7900Xt]: 5 },
      '1440p': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 3, [gpuIds.rtx4070Super]: 4, [gpuIds.rx7900Xt]: 5 },
      '4K': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 3, [gpuIds.rx7900Xt]: 4 },
    },
  },
  {
    key: 'elden-ring',
    name: 'Elden Ring',
    aliases: [],
    performanceByResolution: {
      '1080p': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 2, [gpuIds.rx7900Xt]: 2 },
      '1440p': { [gpuIds.rx7600]: 2, [gpuIds.rtx4060Ti]: 2, [gpuIds.rtx4070Super]: 2, [gpuIds.rx7900Xt]: 2 },
      '4K': { [gpuIds.rx7600]: 1, [gpuIds.rtx4060Ti]: 1, [gpuIds.rtx4070Super]: 2, [gpuIds.rx7900Xt]: 2 },
    },
  },
];

export function normalizeGameName(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function findGamePerformance(game: string) {
  const normalizedGame = normalizeGameName(game);
  return gamePerformanceCatalog.find(
    (profile) => profile.key === normalizedGame || profile.aliases.some((alias) => normalizeGameName(alias) === normalizedGame),
  );
}