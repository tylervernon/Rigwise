import type { Resolution } from '@/data/parts';

export type PerformanceTier = 1 | 2 | 3 | 4 | 5;

export type GraphicsPreset =
  | 'Low / Competitive'
  | 'Medium'
  | 'High'
  | 'Ultra / Epic';

export type PerformanceRequirement = {
  gpuTier: PerformanceTier;
  cpuTier: PerformanceTier;
};

export type GamePerformanceProfile = {
  key: string;
  name: string;
  aliases: string[];

  /*
   * Base GPU requirement by resolution.
   *
   * These are relative tiers, NOT literal FPS values.
   *
   * The build selector combines these values with:
   * - graphics preset
   * - requested FPS
   * - CPU requirements
   * - complete-build budget
   */
  performanceByResolution: Record<
    Resolution,
    Record<string, PerformanceTier>
  >;

  /*
   * Base CPU requirement by resolution.
   *
   * CPU requirements are intentionally separate from GPU
   * requirements because high-FPS competitive games can
   * become CPU limited even when the GPU requirement is low.
   */
  cpuPerformanceByResolution: Record<
    Resolution,
    PerformanceTier
  >;
};

const GPU_IDS = {
  // AMD RX 6000
  rx6600: 'gpu-radeon-rx-6600',
  rx6650xt: 'gpu-radeon-rx-6650-xt',
  rx6700xt: 'gpu-radeon-rx-6700-xt',
  rx6750xt: 'gpu-radeon-rx-6750-xt',
  rx6800: 'gpu-radeon-rx-6800',
  rx6800xt: 'gpu-radeon-rx-6800-xt',
  rx6900xt: 'gpu-radeon-rx-6900-xt',
  rx6950xt: 'gpu-radeon-rx-6950-xt',

  // AMD RX 7000
  rx7600: 'gpu-radeon-rx-7600',
  rx7600xt: 'gpu-radeon-rx-7600-xt',
  rx7700xt: 'gpu-radeon-rx-7700-xt',
  rx7800xt: 'gpu-radeon-rx-7800-xt',
  rx7900gre: 'gpu-radeon-rx-7900-gre',
  rx7900xt: 'gpu-radeon-rx-7900-xt',
  rx7900xtx: 'gpu-radeon-rx-7900-xtx',

  // NVIDIA RTX 30
  rtx3050: 'gpu-geforce-rtx-3050',
  rtx3060: 'gpu-geforce-rtx-3060',
  rtx3060ti: 'gpu-geforce-rtx-3060-ti',
  rtx3070: 'gpu-geforce-rtx-3070',
  rtx3070ti: 'gpu-geforce-rtx-3070-ti',
  rtx3080: 'gpu-geforce-rtx-3080',

  // NVIDIA RTX 40
  rtx4060: 'gpu-geforce-rtx-4060',
  rtx4060ti: 'gpu-geforce-rtx-4060-ti',
  rtx4060ti16: 'gpu-geforce-rtx-4060-ti-16gb',
  rtx4070: 'gpu-geforce-rtx-4070',
  rtx4070super: 'gpu-geforce-rtx-4070-super',
  rtx4070tisuper: 'gpu-geforce-rtx-4070-ti-super',
  rtx4080super: 'gpu-geforce-rtx-4080-super',
  rtx4090: 'gpu-geforce-rtx-4090',

  // NVIDIA RTX 50
  rtx5050: 'gpu-geforce-rtx-5050',
  rtx5060: 'gpu-geforce-rtx-5060',
  rtx5060ti8: 'gpu-geforce-rtx-5060-ti-8gb',
  rtx5060ti16: 'gpu-geforce-rtx-5060-ti-16gb',
  rtx5070: 'gpu-geforce-rtx-5070',
  rtx5070ti: 'gpu-geforce-rtx-5070-ti',
  rtx5080: 'gpu-geforce-rtx-5080',
  rtx5090: 'gpu-geforce-rtx-5090',
} as const;

/*
 * Relative GPU capability tiers.
 *
 * Tier 1 = entry level
 * Tier 2 = lower-midrange
 * Tier 3 = mid/high
 * Tier 4 = high-end
 * Tier 5 = enthusiast
 */
const tierTable = {
  [GPU_IDS.rtx3050]: 1,
  [GPU_IDS.rx6600]: 1,
  [GPU_IDS.rx7600]: 1,
  [GPU_IDS.rtx4060]: 1,
  [GPU_IDS.rtx5050]: 1,

  [GPU_IDS.rtx3060]: 2,
  [GPU_IDS.rtx3060ti]: 2,
  [GPU_IDS.rx6650xt]: 2,
  [GPU_IDS.rx6700xt]: 2,
  [GPU_IDS.rx7600xt]: 2,
  [GPU_IDS.rtx4060ti]: 2,
  [GPU_IDS.rtx4060ti16]: 2,
  [GPU_IDS.rtx5060]: 2,
  [GPU_IDS.rtx5060ti8]: 2,
  [GPU_IDS.rtx5060ti16]: 2,

  [GPU_IDS.rtx3070]: 3,
  [GPU_IDS.rtx3070ti]: 3,
  [GPU_IDS.rx6750xt]: 3,
  [GPU_IDS.rx6800]: 3,
  [GPU_IDS.rx6800xt]: 3,
  [GPU_IDS.rx7700xt]: 3,
  [GPU_IDS.rx7800xt]: 3,
  [GPU_IDS.rtx4070]: 3,
  [GPU_IDS.rtx4070super]: 3,
  [GPU_IDS.rtx5070]: 3,

  [GPU_IDS.rtx3080]: 4,
  [GPU_IDS.rx6900xt]: 4,
  [GPU_IDS.rx6950xt]: 4,
  [GPU_IDS.rx7900gre]: 4,
  [GPU_IDS.rx7900xt]: 4,
  [GPU_IDS.rtx4070tisuper]: 4,
  [GPU_IDS.rtx5070ti]: 4,

  [GPU_IDS.rx7900xtx]: 5,
  [GPU_IDS.rtx4080super]: 5,
  [GPU_IDS.rtx4090]: 5,
  [GPU_IDS.rtx5080]: 5,
  [GPU_IDS.rtx5090]: 5,
} satisfies Record<string, PerformanceTier>;

/*
 * Creates a resolution table from the base GPU tier.
 *
 * A larger scale means the game is more demanding at that
 * resolution.
 */
function makeResolutionTable(
  scale: number,
  minimum: PerformanceTier = 1,
): Record<string, PerformanceTier> {
  return Object.fromEntries(
    Object.entries(tierTable).map(([gpuId, tier]) => [
      gpuId,
      Math.max(
        minimum,
        Math.min(5, tier - scale),
      ) as PerformanceTier,
    ]),
  );
}

/*
 * Graphics preset modifiers.
 *
 * These modify GPU demand only.
 *
 * Low / Competitive:
 * - lower GPU demand
 * - intended for high-refresh competitive play
 *
 * Medium:
 * - neutral baseline
 *
 * High:
 * - increased GPU demand
 *
 * Ultra / Epic:
 * - substantially increased GPU demand
 */
export const graphicsPresetModifiers: Record<
  GraphicsPreset,
  number
> = {
  'Low / Competitive': -1,
  Medium: 0,
  High: 1,
  'Ultra / Epic': 2,
};

/*
 * CPU impact of graphics presets.
 *
 * Graphics settings generally affect the GPU much more than
 * the CPU, so these modifiers are intentionally small.
 */
export const graphicsPresetCpuModifiers: Record<
  GraphicsPreset,
  number
> = {
  'Low / Competitive': 1,
  Medium: 0,
  High: 0,
  'Ultra / Epic': 0,
};

/*
 * FPS requirements are separated from graphics settings.
 *
 * This is important:
 *
 * 200 FPS Low/Competitive is NOT equivalent to
 * 200 FPS Ultra/Epic.
 *
 * Low-settings high-FPS gaming tends to place much more
 * pressure on the CPU.
 */
export function getFpsPerformanceModifier(
  fps: number,
): number {
  if (fps <= 60) return 0;

  if (fps <= 100) return 0;

  if (fps <= 144) return 1;

  if (fps <= 180) return 1;

  if (fps <= 240) return 2;

  if (fps <= 300) return 3;

  return 4;
}

/*
 * CPU-specific FPS modifier.
 *
 * High-refresh gaming is substantially more CPU-sensitive
 * than normal 60 FPS gaming.
 */
export function getCpuFpsPerformanceModifier(
  fps: number,
): number {
  if (fps <= 60) return 0;

  if (fps <= 100) return 0;

  if (fps <= 144) return 1;

  if (fps <= 180) return 1;

  if (fps <= 240) return 2;

  if (fps <= 300) return 3;

  return 4;
}

/*
 * Converts a game's resolution requirement into the GPU
 * capability required for the selected graphics preset
 * and FPS target.
 *
 * IMPORTANT:
 *
 * FPS is intentionally weighted less aggressively here
 * because high FPS is often CPU-limited.
 */
export function getRequiredGpuTier(
  profile: GamePerformanceProfile,
  gpuId: string,
  resolution: Resolution,
  graphicsPreset: GraphicsPreset,
  fps: number,
): PerformanceTier {
  const baseTier =
    profile.performanceByResolution[resolution][gpuId] ??
    1;

  const presetModifier =
    graphicsPresetModifiers[graphicsPreset];

  /*
   * Only part of the FPS modifier is applied to the GPU.
   *
   * The CPU receives the stronger FPS requirement.
   */
  const fpsModifier =
    getFpsPerformanceModifier(fps);

  const gpuFpsModifier =
    fpsModifier >= 3
      ? 1
      : fpsModifier >= 2
        ? 1
        : 0;

  return Math.max(
    1,
    Math.min(
      5,
      baseTier +
        presetModifier +
        gpuFpsModifier,
    ),
  ) as PerformanceTier;
}

/*
 * Calculates the CPU requirement for a game.
 *
 * This is especially important for:
 *
 * - Fortnite
 * - VALORANT
 * - Counter-Strike 2
 * - Minecraft
 *
 * where very high FPS can become CPU limited.
 */
export function getRequiredCpuTier(
  profile: GamePerformanceProfile,
  resolution: Resolution,
  graphicsPreset: GraphicsPreset,
  fps: number,
): PerformanceTier {
  const baseTier =
    profile.cpuPerformanceByResolution[
      resolution
    ];

  const presetModifier =
    graphicsPresetCpuModifiers[
      graphicsPreset
    ];

  const fpsModifier =
    getCpuFpsPerformanceModifier(fps);

  return Math.max(
    1,
    Math.min(
      5,
      baseTier +
        presetModifier +
        fpsModifier,
    ),
  ) as PerformanceTier;
}

/*
 * Calculates the complete CPU/GPU requirement.
 *
 * This is useful for the build selector because it can
 * evaluate the complete gaming workload rather than
 * treating everything as GPU demand.
 */
export function getPerformanceRequirement(
  profile: GamePerformanceProfile,
  gpuId: string,
  resolution: Resolution,
  graphicsPreset: GraphicsPreset,
  fps: number,
): PerformanceRequirement {
  return {
    gpuTier: getRequiredGpuTier(
      profile,
      gpuId,
      resolution,
      graphicsPreset,
      fps,
    ),

    cpuTier: getRequiredCpuTier(
      profile,
      resolution,
      graphicsPreset,
      fps,
    ),
  };
}

/*
 * Game profiles
 */
const profiles: GamePerformanceProfile[] = [
  {
    key: 'fortnite',
    name: 'Fortnite',
    aliases: [
      'fortnite',
      'fortnite battle royale',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(0),
      '1440p': makeResolutionTable(1),
      '4K': makeResolutionTable(2),
    },

    /*
     * Fortnite is relatively CPU-sensitive, particularly
     * at high FPS and competitive settings.
     */
    cpuPerformanceByResolution: {
      '1080p': 2,
      '1440p': 2,
      '4K': 2,
    },
  },

  {
    key: 'call-of-duty-warzone',
    name: 'Call of Duty: Warzone',
    aliases: [
      'warzone',
      'call of duty warzone',
      'cod warzone',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(0),
      '1440p': makeResolutionTable(1),
      '4K': makeResolutionTable(2),
    },

    cpuPerformanceByResolution: {
      '1080p': 3,
      '1440p': 3,
      '4K': 2,
    },
  },

  {
    key: 'valorant',
    name: 'VALORANT',
    aliases: [
      'valorant',
      'val',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(0, 2),
      '1440p': makeResolutionTable(0, 2),
      '4K': makeResolutionTable(0, 2),
    },

    /*
     * VALORANT is heavily CPU-sensitive at high FPS.
     */
    cpuPerformanceByResolution: {
      '1080p': 3,
      '1440p': 3,
      '4K': 2,
    },
  },

  {
    key: 'counter-strike-2',
    name: 'Counter-Strike 2',
    aliases: [
      'counter strike 2',
      'counter-strike 2',
      'cs2',
      'counter strike',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(0, 2),
      '1440p': makeResolutionTable(0, 2),
      '4K': makeResolutionTable(1, 2),
    },

    /*
     * CS2 is strongly CPU-sensitive at high refresh rates.
     */
    cpuPerformanceByResolution: {
      '1080p': 3,
      '1440p': 3,
      '4K': 2,
    },
  },

  {
    key: 'minecraft',
    name: 'Minecraft',
    aliases: [
      'minecraft',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(0, 2),
      '1440p': makeResolutionTable(0, 2),
      '4K': makeResolutionTable(1, 2),
    },

    cpuPerformanceByResolution: {
      '1080p': 3,
      '1440p': 3,
      '4K': 2,
    },
  },

  {
    key: 'baldurs-gate-3',
    name: "Baldur's Gate 3",
    aliases: [
      "baldur's gate 3",
      'baldurs gate 3',
      'bg3',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(0),
      '1440p': makeResolutionTable(1),
      '4K': makeResolutionTable(2),
    },

    cpuPerformanceByResolution: {
      '1080p': 2,
      '1440p': 2,
      '4K': 2,
    },
  },

  {
    key: 'cyberpunk-2077',
    name: 'Cyberpunk 2077',
    aliases: [
      'cyberpunk 2077',
      'cyberpunk',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(1),
      '1440p': makeResolutionTable(2),
      '4K': makeResolutionTable(3),
    },

    cpuPerformanceByResolution: {
      '1080p': 2,
      '1440p': 2,
      '4K': 2,
    },
  },

  {
    key: 'hogwarts-legacy',
    name: 'Hogwarts Legacy',
    aliases: [
      'hogwarts legacy',
      'hogwarts',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(0),
      '1440p': makeResolutionTable(1),
      '4K': makeResolutionTable(2),
    },

    cpuPerformanceByResolution: {
      '1080p': 2,
      '1440p': 2,
      '4K': 2,
    },
  },

  {
    key: 'red-dead-redemption-2',
    name: 'Red Dead Redemption 2',
    aliases: [
      'red dead redemption 2',
      'rdr2',
      'red dead 2',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(1),
      '1440p': makeResolutionTable(2),
      '4K': makeResolutionTable(3),
    },

    cpuPerformanceByResolution: {
      '1080p': 2,
      '1440p': 2,
      '4K': 2,
    },
  },

  {
    key: 'elden-ring',
    name: 'Elden Ring',
    aliases: [
      'elden ring',
    ],

    performanceByResolution: {
      '1080p': makeResolutionTable(0),
      '1440p': makeResolutionTable(1),
      '4K': makeResolutionTable(2),
    },

    cpuPerformanceByResolution: {
      '1080p': 2,
      '1440p': 2,
      '4K': 2,
    },
  },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function findGamePerformance(
  input: string,
): GamePerformanceProfile | undefined {
  const normalized = normalize(input);

  return profiles.find((profile) =>
    [profile.name, ...profile.aliases].some(
      (name) =>
        normalize(name) === normalized,
    ),
  );
}

export const gamePerformanceProfiles = profiles;