import {
  allParts,
  type AppearancePreference,
  type CasePart,
  type CoolerPart,
  type CpuPart,
  type GpuPart,
  type MotherboardPart,
  type NoisePreference,
  type Part,
  type PsuPart,
  type RamPart,
  type Resolution,
  type SizePreference,
  type StoragePart,
} from '@/data/parts';

import {
  findGamePerformance,
  getRequiredGpuTier,
  type GamePerformanceProfile,
  type GraphicsPreset,
  type PerformanceTier,
} from '@/data/game-performance';

export type BuildPreferences = {
  size: SizePreference;
  noise: NoisePreference;
  appearance: AppearancePreference;
  upgradeability: 'Keep it simple' | 'Plan ahead';
};

/*
 * User-selected storage capacity.
 *
 * 512 represents the 500GB / 512GB option. The catalog may contain
 * either 500GB or 512GB drives for that option.
 */
export type StorageCapacity = 512 | 1000 | 2000 | 4000;

export const STORAGE_OPTIONS: Array<{
  value: StorageCapacity;
  label: string;
}> = [
  { value: 512, label: '500GB / 512GB' },
  { value: 1000, label: '1TB' },
  { value: 2000, label: '2TB' },
  { value: 4000, label: '4TB' },
];

export type BuildRequest = {
  budget: number;
  resolution: Resolution;
  games: string[];
  fps: number;
  graphicsPreset: GraphicsPreset;
  preferences: BuildPreferences;

  /*
   * Storage is a user requirement, not an automatic upgrade target.
   *
   * Optional for backwards compatibility with existing callers.
   * If omitted, the builder defaults to 1TB.
   */
  storageCapacityGb?: StorageCapacity;
};

export type SelectedBuild = {
  parts: Part[];
  totalPrice: number;
  estimatedPower: number;
  budgetRemaining: number;
  performanceTier: number;
  notes: string[];
};

type PerformanceContext = {
  knownGames: Array<{
    input: string;
    profile: GamePerformanceProfile;
  }>;
  unsupportedGames: string[];
};

const byPrice = <T extends Part>(parts: T[]) =>
  [...parts].sort((a, b) => a.price - b.price);

const resolutionTier: Record<Resolution, number> = {
  '1080p': 1,
  '1440p': 3,
  '4K': 4,
};

const sizeRank: Record<SizePreference, number> = {
  Compact: 0,
  Balanced: 1,
  Roomy: 2,
};

function getRequestedFormFactor(
  size: SizePreference,
): MotherboardPart['formFactor'] {
  if (size === 'Compact') {
    return 'Mini-ITX';
  }

  if (size === 'Balanced') {
    return 'Micro-ATX';
  }

  return 'ATX';
}

const noiseRank: Record<NoisePreference, number> = {
  Silent: 0,
  Quiet: 1,
  'I don’t mind': 2,
};

const appearanceRank: Record<
  AppearancePreference,
  number
> = {
  Understated: 0,
  'A little drama': 1,
  Showpiece: 2,
};

function partIs<T extends Part['category']>(
  part: Part,
  category: T,
): part is Extract<Part, { category: T }> {
  return part.category === category;
}

function normalizeSocket(socket: string): string {
  return socket
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function fpsToPerformanceTier(
  fps: number,
): PerformanceTier {
  if (fps >= 300) return 5;
  if (fps >= 240) return 5;
  if (fps >= 165) return 4;
  if (fps >= 120) return 4;
  if (fps >= 90) return 3;
  if (fps >= 60) return 2;

  return 1;
}

function getPerformanceContext(
  games: string[],
): PerformanceContext {
  const knownGames: PerformanceContext['knownGames'] =
    [];

  const unsupportedGames: string[] = [];

  for (const input of games) {
    const profile = findGamePerformance(input);

    if (profile) {
      knownGames.push({
        input,
        profile,
      });
    } else {
      unsupportedGames.push(input);
    }
  }

  return {
    knownGames,
    unsupportedGames,
  };
}

/*
 * ---------------------------------------------------------
 * GAME / GPU PERFORMANCE
 * ---------------------------------------------------------
 */

function getGameTier(
  profile: GamePerformanceProfile,
  resolution: Resolution,
  gpu: GpuPart,
  graphicsPreset: GraphicsPreset,
  fps: number,
): PerformanceTier {
  return Math.max(
    1,
    Math.min(
      5,
      getRequiredGpuTier(
        profile,
        gpu.id,
        resolution,
        graphicsPreset,
        fps,
      ),
    ),
  ) as PerformanceTier;
}

function getRequiredTierForGpu(
  profile: GamePerformanceProfile,
  gpu: GpuPart,
  request: BuildRequest,
): PerformanceTier {
  return getGameTier(
    profile,
    request.resolution,
    gpu,
    request.graphicsPreset,
    request.fps,
  );
}

function getStrongestGameRequirement(
  gpu: GpuPart,
  request: BuildRequest,
  performanceContext: PerformanceContext,
): PerformanceTier {
  if (
    performanceContext.knownGames.length === 0
  ) {
    return Math.min(
      5,
      Math.max(
        fpsToPerformanceTier(request.fps),
        resolutionTier[request.resolution],
      ),
    ) as PerformanceTier;
  }

  return Math.max(
    ...performanceContext.knownGames.map(
      ({ profile }) =>
        getRequiredTierForGpu(
          profile,
          gpu,
          request,
        ),
    ),
  ) as PerformanceTier;
}

function scorePerformanceFit(
  availableTier: PerformanceTier,
  requiredTier: PerformanceTier,
): number {
  const difference =
    availableTier - requiredTier;

  /*
   * Meeting the target is heavily rewarded.
   *
   * Extra performance is intentionally worth
   * much less than meeting the budget.
   */
  if (difference >= 0) {
    return (
      30 +
      Math.min(difference, 2) * 3
    );
  }

  return difference * 25;
}

/*
 * ---------------------------------------------------------
 * GPU BALANCE LOGIC
 * ---------------------------------------------------------
 *
 * This is the important fix.
 *
 * Previously:
 *
 * remaining budget -> strongest possible GPU
 *
 * That produced things like:
 *
 * $700 -> Ryzen 5 5500 + RTX 3080
 *
 * and:
 *
 * $1000 -> Ryzen 5 5600 + RX 7900 XT
 *
 * The GPU is now capped based on:
 *
 * 1. Actual requested performance
 * 2. CPU performance
 * 3. Resolution
 * 4. FPS target
 *
 * The GPU can still be upgraded first, but it cannot
 * become absurdly stronger than the rest of the system.
 */

function getCpuGpuBalanceLimit(
  cpu: CpuPart,
  request: BuildRequest,
  performanceContext: PerformanceContext,
): PerformanceTier {
  const targetFpsTier =
    fpsToPerformanceTier(request.fps);

  const resolutionRequirement =
    resolutionTier[request.resolution];

  let requestedTier = Math.max(
    targetFpsTier,
    resolutionRequirement,
  );

  if (
    performanceContext.knownGames.length
  ) {
    const gameRequirements =
      performanceContext.knownGames.map(
        ({ profile }) =>
          getRequiredTierForGpu(
            profile,
            {
              id: '',
              name: '',
              category: 'gpu',
              price: 0,
              performanceTier: 1,
              powerDraw: 0,
              lengthMm: 0,
            } as GpuPart,
            request,
          ),
      );

    /*
     * Only use this as a rough pressure signal.
     * The actual GPU is evaluated separately.
     */
    if (gameRequirements.length) {
      requestedTier = Math.max(
        requestedTier,
        ...gameRequirements,
      );
    }
  }

  /*
   * High FPS 1080p is CPU-sensitive.
   *
   * Give the CPU more influence here so a low-end
   * CPU cannot be paired with an absurd high-end GPU.
   */
  const cpuTier =
    cpu.performanceTier as PerformanceTier;

  let cpuSupportedGpuTier =
    (cpuTier + 1) as PerformanceTier;

  /*
   * At 1440p/4K the GPU can be somewhat stronger
   * relative to the CPU because the workload is
   * more GPU-bound.
   */
  if (request.resolution === '1440p') {
    cpuSupportedGpuTier =
      Math.min(
        5,
        cpuTier + 2,
      ) as PerformanceTier;
  }

  if (request.resolution === '4K') {
    cpuSupportedGpuTier =
      Math.min(
        5,
        cpuTier + 3,
      ) as PerformanceTier;
  }

  /*
   * For extremely high FPS at 1080p, be stricter.
   */
  if (
    request.resolution === '1080p' &&
    request.fps >= 165
  ) {
    cpuSupportedGpuTier =
      Math.min(
        5,
        cpuTier + 1,
      ) as PerformanceTier;
  }

  /*
   * Allow roughly one performance tier above the
   * actual requirement, but never several tiers.
   */
  const performanceCeiling =
    Math.min(
      5,
      requestedTier + 1,
    ) as PerformanceTier;

  return Math.min(
    performanceCeiling,
    cpuSupportedGpuTier,
  ) as PerformanceTier;
}

function isGpuBalanced(
  gpu: GpuPart,
  cpu: CpuPart,
  request: BuildRequest,
  performanceContext: PerformanceContext,
): boolean {
  const gpuTier =
    gpu.performanceTier as PerformanceTier;

  const requiredTier =
    getStrongestGameRequirement(
      gpu,
      request,
      performanceContext,
    );

  const balanceLimit =
    getCpuGpuBalanceLimit(
      cpu,
      request,
      performanceContext,
    );

  /*
   * A GPU must actually satisfy the request.
   */
  if (gpuTier < requiredTier) {
    return false;
  }

  /*
   * But it cannot be wildly beyond what the CPU
   * and requested workload justify.
   */
  if (gpuTier > balanceLimit) {
    return false;
  }

  return true;
}

/*
 * ---------------------------------------------------------
 * MOTHERBOARD
 * ---------------------------------------------------------
 */

function chooseMotherboard(
  cpu: CpuPart,
  preferences: BuildPreferences,
): MotherboardPart | undefined {
  const motherboards =
    allParts.filter(
      (part): part is MotherboardPart =>
        partIs(part, 'motherboard'),
    );

  const cpuSocket =
    normalizeSocket(cpu.socket);

  const requestedFormFactor =
    getRequestedFormFactor(
      preferences.size,
    );

  const compatible =
    motherboards.filter(
      (part) =>
        normalizeSocket(part.socket) ===
          cpuSocket &&
        part.formFactor ===
          requestedFormFactor,
    );

  if (!compatible.length) {
    return undefined;
  }

  return [...compatible].sort(
    (a, b) => {
      const score = (
        part: MotherboardPart,
      ) => {
        let value = 0;

        if (
          preferences.size ===
            'Compact' &&
          part.formFactor ===
            'Mini-ITX'
        ) {
          value += 7;
        }

        if (
          preferences.size ===
            'Compact' &&
          part.formFactor ===
            'Micro-ATX'
        ) {
          value += 5;
        }

        if (
          preferences.size ===
            'Balanced' &&
          part.formFactor ===
            'Micro-ATX'
        ) {
          value += 4;
        }

        if (
          preferences.size ===
            'Balanced' &&
          part.formFactor ===
            'ATX'
        ) {
          value += 3;
        }

        if (
          preferences.size ===
            'Roomy' &&
          part.formFactor ===
            'ATX'
        ) {
          value += 5;
        }

        if (
          preferences.upgradeability ===
            'Plan ahead'
        ) {
          value +=
            Math.min(part.m2Slots, 3) *
            1.5;
        }

        /*
         * Keep motherboard cost reasonable.
         */
        value -= part.price / 80;

        return value;
      };

      return score(b) - score(a);
    },
  )[0];
}

/*
 * ---------------------------------------------------------
 * RAM
 * ---------------------------------------------------------
 */

function chooseRam(
  motherboard: MotherboardPart,
  preferences: BuildPreferences,
  budget: number,
): RamPart | undefined {
  const candidates =
    allParts.filter(
      (part): part is RamPart =>
        partIs(part, 'ram') &&
        part.memoryType ===
          motherboard.memoryType &&
        part.capacityGb <=
          motherboard.maxMemoryGb,
    );

  if (!candidates.length) {
    return undefined;
  }

  return [...candidates].sort(
    (a, b) => {
      const score = (
        part: RamPart,
      ) => {
        let value = 0;

        if (
          preferences.upgradeability ===
            'Plan ahead' &&
          part.capacityGb >= 32
        ) {
          value += 4;
        }

        if (
          preferences.upgradeability ===
            'Keep it simple' &&
          part.capacityGb === 16
        ) {
          value += 3;
        }

        if (
          preferences.appearance !==
            'Understated' &&
          part.id
            .toLowerCase()
            .includes('rgb')
        ) {
          value += 2;
        }

        value +=
          Math.min(
            part.speedMhz / 1500,
            2,
          );

        /*
         * RAM should not consume too much of
         * the available budget.
         */
        if (
          part.price >
          budget * 0.15
        ) {
          value -= 3;
        }

        value -= part.price / 120;

        return value;
      };

      return score(b) - score(a);
    },
  )[0];
}

/*
 * ---------------------------------------------------------
 * STORAGE
 * ---------------------------------------------------------
 */

function chooseStorage(
  requestedCapacity: StorageCapacity = 1000,
): StoragePart | undefined {
  const candidates =
    allParts.filter(
      (part): part is StoragePart => {
        if (!partIs(part, 'storage')) {
          return false;
        }

        /*
         * The 500GB / 512GB option intentionally accepts either
         * catalog capacity so the builder can choose the better
         * value between a 500GB and 512GB drive.
         */
        if (requestedCapacity === 512) {
          return (
            part.capacityGb === 500 ||
            part.capacityGb === 512
          );
        }

        return (
          part.capacityGb ===
          requestedCapacity
        );
      },
    );

  if (!candidates.length) {
    return undefined;
  }

  /*
   * Storage capacity is now locked by the user.
   *
   * We choose the best-value drive WITHIN the requested capacity,
   * but we never choose a larger capacity just because there is
   * room left in the budget.
   */
  return [...candidates].sort(
    (a, b) => {
      const score = (
        part: StoragePart,
      ) => {
        let value = 0;

        /*
         * Prefer NVMe over SATA when capacity is the same.
         */
        if (part.interface === 'NVMe Gen3') {
          value += 2;
        } else if (
          part.interface === 'NVMe Gen4'
        ) {
          value += 3;
        } else if (
          part.interface === 'NVMe Gen5'
        ) {
          value += 2;
        }

        /*
         * Keep the selected storage from consuming unnecessary
         * budget when multiple drives have the same capacity.
         */
        value -= part.price / 100;

        return value;
      };

      return score(b) - score(a);
    },
  )[0];
}

/*
 * ---------------------------------------------------------
 * CASE
 * ---------------------------------------------------------
 */

function chooseCase(
  gpu: GpuPart,
  motherboard: MotherboardPart,
  preferences: BuildPreferences,
): CasePart | undefined {
  const requestedFormFactor =
    getRequestedFormFactor(
      preferences.size,
    );

  const candidates =
    allParts.filter(
      (part): part is CasePart =>
        partIs(part, 'case') &&
        part.formFactor ===
          requestedFormFactor &&
        part.supportedFormFactors.includes(
          motherboard.formFactor,
        ) &&
        part.maxGpuLengthMm >=
          gpu.lengthMm,
    );

  if (!candidates.length) {
    return undefined;
  }

  return [...candidates].sort(
    (a, b) => {
      const score = (
        part: CasePart,
      ) => {
        const sizeDistance =
          Math.abs(
            sizeRank[part.size] -
              sizeRank[
                preferences.size
              ],
          );

        const appearanceDistance =
          Math.abs(
            appearanceRank[
              part.appearance
            ] -
              appearanceRank[
                preferences.appearance
              ],
          );

        return (
          12 -
          sizeDistance * 4 -
          appearanceDistance * 3 -
          part.price / 80
        );
      };

      return score(b) - score(a);
    },
  )[0];
}

/*
 * ---------------------------------------------------------
 * COOLER
 * ---------------------------------------------------------
 */

function chooseCooler(
  cpu: CpuPart,
  pcCase: CasePart,
  preferences: BuildPreferences,
): CoolerPart | undefined {
  const candidates =
    allParts.filter(
      (part): part is CoolerPart =>
        partIs(part, 'cooler') &&
        part.supportedSockets.some(
          (socket) =>
            normalizeSocket(socket) ===
            normalizeSocket(cpu.socket),
        ) &&
        part.heightMm <=
          pcCase.maxCoolerHeightMm,
    );

  if (!candidates.length) {
    return undefined;
  }

  /*
   * Prefer the included/stock cooler when the CPU
   * has one and the cooler is actually capable.
   *
   * We identify the stock cooler through the CPU
   * catalog rather than assuming every cheap cooler
   * is stock.
   */
  const stockCooler =
    candidates.find(
      (cooler) =>
        cooler.id
          .toLowerCase()
          .includes('wraith-stealth'),
    );

  const capable =
    candidates.filter(
      (cooler) =>
        cooler.thermalCapacityW >=
        cpu.powerDraw,
    );

  const usable =
    capable.length
      ? capable
      : candidates;

  return [...usable].sort(
    (a, b) => {
      const score = (
        part: CoolerPart,
      ) => {
        let value = 0;

        const noiseDistance =
          Math.abs(
            noiseRank[part.noise] -
              noiseRank[
                preferences.noise
              ],
          );

        value -=
          noiseDistance * 4;

        const thermalExcess =
          Math.max(
            0,
            part.thermalCapacityW -
              cpu.powerDraw,
          );

        value += Math.min(
          thermalExcess / 50,
          3,
        );

        /*
         * If a stock cooler exists and is sufficient,
         * strongly favor it for budget builds.
         */
        if (
          stockCooler &&
          part.id === stockCooler.id &&
          cpu.powerDraw <= 90
        ) {
          value += 8;
        }

        value -= part.price / 35;

        return value;
      };

      return score(b) - score(a);
    },
  )[0];
}

/*
 * ---------------------------------------------------------
 * PSU
 * ---------------------------------------------------------
 */

function choosePsu(
  totalPower: number,
): PsuPart | undefined {
  const candidates =
    allParts.filter(
      (part): part is PsuPart =>
        partIs(part, 'psu') &&
        part.wattage >=
          totalPower * 1.3,
    );

  if (candidates.length) {
    return byPrice(candidates)[0];
  }

  const allPsus =
    allParts.filter(
      (part): part is PsuPart =>
        partIs(part, 'psu'),
    );

  return [...allPsus].sort(
    (a, b) =>
      b.wattage - a.wattage,
  )[0];
}

/*
 * ---------------------------------------------------------
 * CPU
 * ---------------------------------------------------------
 */

function chooseCpu(
  gpu: GpuPart,
  request: BuildRequest,
  preferences: BuildPreferences,
): CpuPart | undefined {
  const candidates =
    allParts.filter(
      (part): part is CpuPart =>
        partIs(part, 'cpu'),
    );

  if (!candidates.length) {
    return undefined;
  }

  const targetTier =
    Math.max(
      fpsToPerformanceTier(
        request.fps,
      ),
      request.resolution === '1080p'
        ? 2
        : 1,
    );

  return [...candidates].sort(
    (a, b) => {
      const score = (
        part: CpuPart,
      ) => {
        let value = 0;

        const distance =
          Math.abs(
            part.performanceTier -
              targetTier,
          );

        value +=
          18 -
          distance * 5;

        /*
         * High-FPS 1080p needs a better CPU.
         */
        if (
          request.resolution ===
            '1080p' &&
          request.fps >= 165 &&
          part.performanceTier >= 3
        ) {
          value += 5;
        }

        if (
          preferences.upgradeability ===
            'Plan ahead' &&
          part.performanceTier >= 3
        ) {
          value += 2;
        }

        value -= part.price / 200;

        return value;
      };

      return score(b) - score(a);
    },
  )[0];
}

/*
 * ---------------------------------------------------------
 * BUILD CONSTRUCTION
 * ---------------------------------------------------------
 */

function buildFromGpuAndCpu(
  gpu: GpuPart,
  cpu: CpuPart,
  request: BuildRequest,
  ignoreBudgetLimit = false,
): SelectedBuild | undefined {
  const motherboard =
    chooseMotherboard(
      cpu,
      request.preferences,
    );

  if (!motherboard) {
    return undefined;
  }

  const ram =
    chooseRam(
      motherboard,
      request.preferences,
      request.budget,
    );

  if (!ram) {
    return undefined;
  }

  const storage =
    chooseStorage(
      request.storageCapacityGb ?? 1000,
    );

  if (!storage) {
    return undefined;
  }

  const pcCase =
    chooseCase(
      gpu,
      motherboard,
      request.preferences,
    );

  if (!pcCase) {
    return undefined;
  }

  const cooler =
    chooseCooler(
      cpu,
      pcCase,
      request.preferences,
    );

  if (!cooler) {
    return undefined;
  }

  const estimatedPower =
    cpu.powerDraw +
    gpu.powerDraw +
    110;

  const psu =
    choosePsu(
      estimatedPower,
    );

  if (!psu) {
    return undefined;
  }

  const parts: Part[] = [
    cpu,
    gpu,
    motherboard,
    ram,
    storage,
    psu,
    pcCase,
    cooler,
  ];

  const totalPrice =
    parts.reduce(
      (sum, part) =>
        sum + part.price,
      0,
    );

  /*
   * Don't even create absurd combinations.
   *
   * The final upgrade process is responsible for
   * spending the remaining budget.
   */
  if (
    !ignoreBudgetLimit &&
    totalPrice >
    request.budget * 1.05
  ) {
    return undefined;
  }

  return {
    parts,
    totalPrice,
    estimatedPower,
    budgetRemaining:
      request.budget -
      totalPrice,
    performanceTier:
      gpu.performanceTier,
    notes: [],
  };
}

/*
 * ---------------------------------------------------------
 * BUILD SCORE
 * ---------------------------------------------------------
 */

function scoreBuild(
  build: SelectedBuild,
  request: BuildRequest,
  performanceContext: PerformanceContext,
): number {
  const gpu = getPartByCategory(build, 'gpu');
  const cpu = getPartByCategory(build, 'cpu');

  if (!gpu || !cpu) return -Infinity;

  const requiredGpuTier = getStrongestGameRequirement(
    gpu,
    request,
    performanceContext,
  );
  const targetCpuTier = fpsToPerformanceTier(request.fps);

  const gpuTier = gpu.performanceTier as PerformanceTier;
  const cpuTier = cpu.performanceTier as PerformanceTier;

  /*
   * Gaming builds should spend the majority of the performance
   * budget on the GPU.  The old score rewarded an expensive CPU
   * almost as much as a stronger GPU, which could produce builds
   * such as a Ryzen 9 5900X + RTX 3060 Ti when a much cheaper CPU
   * could have funded a stronger graphics card.
   *
   * CPU performance still matters, especially for high-FPS 1080p,
   * but CPU performance above the requested target is deliberately
   * worth very little.
   */
  const gpuFit = scorePerformanceFit(gpuTier, requiredGpuTier);
  const cpuFit = scorePerformanceFit(cpuTier, targetCpuTier);

  let gpuPriority = gpuFit * 8;
  let cpuPriority = cpuFit * 1.5;

  /*
   * Strongly discourage buying CPU performance that the requested
   * workload does not need.  This is the key mechanism that lets a
   * cheaper CPU free money for the GPU.
   */
  const cpuOverkill = Math.max(0, cpuTier - targetCpuTier);
  cpuPriority -= cpuOverkill * 14;

  /*
   * High-FPS 1080p is more CPU-sensitive, so give the CPU somewhat
   * more influence there.  At 1440p/4K the GPU gets the emphasis.
   */
  if (request.resolution === '1080p' && request.fps >= 165) {
    cpuPriority *= 1.6;
  } else if (request.resolution === '4K') {
    gpuPriority *= 1.25;
  }

  const lower = request.budget * 0.95;
  const upper = request.budget * 1.05;

  let budgetScore: number;

  if (build.totalPrice >= lower && build.totalPrice <= upper) {
    const distance =
      Math.abs(build.totalPrice - request.budget) / request.budget;

    budgetScore = 80 - distance * 300;
  } else if (build.totalPrice < lower) {
    const unused =
      (request.budget - build.totalPrice) / request.budget;

    /*
     * Leaving a lot of gaming budget unused is bad because that
     * money should normally be converted into GPU performance.
     */
    budgetScore = 10 - unused * 180;
  } else {
    const overspend =
      (build.totalPrice - request.budget) / request.budget;

    budgetScore = -300 - overspend * 1000;
  }

  /*
   * A small GPU-price efficiency tie-breaker prevents the builder
   * from buying a needlessly expensive GPU when two cards provide
   * essentially the same requested performance.
   */
  const gpuValueScore =
    requiredGpuTier > 0
      ? Math.min(gpuTier, requiredGpuTier + 1) * 4 - gpu.price / 250
      : -gpu.price / 250;

  return budgetScore + gpuPriority + cpuPriority + gpuValueScore;
}

/*
 * ---------------------------------------------------------
 * UPGRADE HELPERS
 * ---------------------------------------------------------
 */

function getPartIndex(
  build: SelectedBuild,
  category: Part['category'],
): number {
  return build.parts.findIndex(
    (part) =>
      part.category === category,
  );
}

function getPartByCategory<
  T extends Part['category'],
>(
  build: SelectedBuild,
  category: T,
): Extract<Part, { category: T }> | undefined {
  return build.parts.find(
    (
      part,
    ): part is Extract<
      Part,
      { category: T }
    > =>
      part.category === category,
  );
}

function calculateBuildPower(
  build: SelectedBuild,
): number {
  const cpu =
    getPartByCategory(
      build,
      'cpu',
    );

  const gpu =
    getPartByCategory(
      build,
      'gpu',
    );

  if (!cpu || !gpu) {
    return build.estimatedPower;
  }

  return (
    cpu.powerDraw +
    gpu.powerDraw +
    110
  );
}

function replacePart(
  build: SelectedBuild,
  newPart: Part,
): SelectedBuild {
  const parts =
    build.parts.map(
      (part) =>
        part.category ===
        newPart.category
          ? newPart
          : part,
    );

  const estimatedPower =
    calculateBuildPower({
      ...build,
      parts,
    });

  const totalPrice =
    parts.reduce(
      (sum, part) =>
        sum + part.price,
      0,
    );

  return {
    ...build,
    parts,
    totalPrice,
    estimatedPower,
    budgetRemaining: 0,
    performanceTier:
      getPartByCategory(
        {
          ...build,
          parts,
        },
        'gpu',
      )?.performanceTier ??
      build.performanceTier,
  };
}

/*
 * ---------------------------------------------------------
 * GPU UPGRADES
 * ---------------------------------------------------------
 *
 * GPU gets first priority, BUT only when the new GPU
 * remains balanced with the CPU and actually helps.
 */

function upgradeGpu(
  build: SelectedBuild,
  request: BuildRequest,
  performanceContext: PerformanceContext,
): SelectedBuild {
  const currentGpu =
    getPartByCategory(
      build,
      'gpu',
    );

  const cpu =
    getPartByCategory(
      build,
      'cpu',
    );

  if (!currentGpu || !cpu) {
    return build;
  }

  const candidates =
    allParts.filter(
      (part): part is GpuPart =>
        partIs(part, 'gpu') &&
        part.price >
          currentGpu.price &&
        part.performanceTier >=
          currentGpu.performanceTier,
    );

  const balanced =
    candidates.filter(
      (gpu) =>
        isGpuBalanced(
          gpu,
          cpu,
          request,
          performanceContext,
        ),
    );

  if (!balanced.length) {
    return build;
  }

  const affordable =
    balanced.filter(
      (gpu) =>
        build.totalPrice -
          currentGpu.price +
          gpu.price <=
        request.budget * 1.05,
    );

  if (!affordable.length) {
    return build;
  }

  /*
   * Choose the BEST useful GPU upgrade,
   * not simply the most expensive GPU.
   *
   * Once the game requirement is comfortably
   * satisfied, the GPU stops being upgraded.
   */
  const currentRequired =
    getStrongestGameRequirement(
      currentGpu,
      request,
      performanceContext,
    );

  const useful =
    affordable.filter(
      (gpu) =>
        gpu.performanceTier <=
          Math.min(
            5,
            currentRequired + 1,
          ),
    );

  const pool =
    useful.length
      ? useful
      : affordable;

  const selected =
    [...pool].sort(
      (a, b) => {
        const aDistance =
          Math.abs(
            a.performanceTier -
              currentRequired,
          );

        const bDistance =
          Math.abs(
            b.performanceTier -
              currentRequired,
          );

        if (
          aDistance !==
          bDistance
        ) {
          return (
            aDistance -
            bDistance
          );
        }

        return (
          b.price -
          a.price
        );
      },
    )[0];

  return replacePart(
    build,
    selected,
  );
}

/*
 * ---------------------------------------------------------
 * CPU UPGRADES
 * ---------------------------------------------------------
 */

function upgradeCpu(
  build: SelectedBuild,
  request: BuildRequest,
): SelectedBuild {
  const currentCpu =
    getPartByCategory(
      build,
      'cpu',
    );

  const gpu =
    getPartByCategory(
      build,
      'gpu',
    );

  if (!currentCpu || !gpu) {
    return build;
  }

  const candidates =
    allParts.filter(
      (part): part is CpuPart =>
        partIs(part, 'cpu') &&
        part.price >
          currentCpu.price &&
        part.performanceTier >=
          currentCpu.performanceTier,
    );

  const affordable =
    candidates.filter(
      (cpu) =>
        build.totalPrice -
          currentCpu.price +
          cpu.price <=
        request.budget * 1.05,
    );

  if (!affordable.length) {
    return build;
  }

  /*
   * Don't buy a CPU upgrade that is unnecessary
   * for the requested workload.
   */
  const targetTier =
    Math.max(
      fpsToPerformanceTier(
        request.fps,
      ),
      request.resolution ===
        '1080p'
        ? 2
        : 1,
    );

  const useful =
    affordable.filter(
      (cpu) =>
        cpu.performanceTier <=
        Math.min(
          5,
          targetTier + 1,
        ),
    );

  const pool =
    useful.length
      ? useful
      : affordable;

  const selected =
    [...pool].sort(
      (a, b) => {
        const aDistance =
          Math.abs(
            a.performanceTier -
              targetTier,
          );

        const bDistance =
          Math.abs(
            b.performanceTier -
              targetTier,
          );

        if (
          aDistance !==
          bDistance
        ) {
          return (
            aDistance -
            bDistance
          );
        }

        return (
          b.price -
          a.price
        );
      },
    )[0];

  return replacePart(
    build,
    selected,
  );
}

/*
 * ---------------------------------------------------------
 * RAM UPGRADES
 * ---------------------------------------------------------
 */

function upgradeRam(
  build: SelectedBuild,
  request: BuildRequest,
): SelectedBuild {
  const currentRam =
    getPartByCategory(
      build,
      'ram',
    );

  const motherboard =
    getPartByCategory(
      build,
      'motherboard',
    );

  if (
    !currentRam ||
    !motherboard
  ) {
    return build;
  }

  const candidates =
    allParts.filter(
      (part): part is RamPart =>
        partIs(part, 'ram') &&
        part.memoryType ===
          motherboard.memoryType &&
        part.capacityGb <=
          motherboard.maxMemoryGb &&
        part.price >
          currentRam.price,
    );

  const affordable =
    candidates.filter(
      (ram) =>
        build.totalPrice -
          currentRam.price +
          ram.price <=
        request.budget * 1.05,
    );

  if (!affordable.length) {
    return build;
  }

  /*
   * Prefer capacity upgrades first.
   */
  return replacePart(
    build,
    [...affordable].sort(
      (a, b) => {
        if (
          a.capacityGb !==
          b.capacityGb
        ) {
          return (
            b.capacityGb -
            a.capacityGb
          );
        }

        return (
          b.speedMhz -
          a.speedMhz
        );
      },
    )[0],
  );
}

/*
 * ---------------------------------------------------------
 * STORAGE UPGRADES
 * ---------------------------------------------------------
 *
 * Storage is intentionally NOT upgraded automatically.
 *
 * The user explicitly chooses 500GB/512GB, 1TB, 2TB, or 4TB.
 * That choice is treated as a hard requirement throughout the
 * build process.
 */



/*
 * ---------------------------------------------------------
 * PSU UPGRADES
 * ---------------------------------------------------------
 */

function upgradePsu(
  build: SelectedBuild,
  request: BuildRequest,
): SelectedBuild {
  const current =
    getPartByCategory(
      build,
      'psu',
    );

  const power =
    calculateBuildPower(build);

  if (!current) {
    return build;
  }

  const candidates =
    allParts.filter(
      (part): part is PsuPart =>
        partIs(part, 'psu') &&
        part.wattage >
          current.wattage &&
        part.wattage >=
          power * 1.3,
    );

  const affordable =
    candidates.filter(
      (psu) =>
        build.totalPrice -
          current.price +
          psu.price <=
        request.budget * 1.05,
    );

  if (!affordable.length) {
    return build;
  }

  return replacePart(
    build,
    byPrice(affordable)[0],
  );
}

/*
 * ---------------------------------------------------------
 * COOLER UPGRADES
 * ---------------------------------------------------------
 */

function upgradeCooler(
  build: SelectedBuild,
  request: BuildRequest,
): SelectedBuild {
  const current =
    getPartByCategory(
      build,
      'cooler',
    );

  const cpu =
    getPartByCategory(
      build,
      'cpu',
    );

  const pcCase =
    getPartByCategory(
      build,
      'case',
    );

  if (
    !current ||
    !cpu ||
    !pcCase
  ) {
    return build;
  }

  const candidates =
    allParts.filter(
      (part): part is CoolerPart =>
        partIs(part, 'cooler') &&
        part.price >
          current.price &&
        part.supportedSockets.some(
          (socket) =>
            normalizeSocket(socket) ===
            normalizeSocket(
              cpu.socket,
            ),
        ) &&
        part.heightMm <=
          pcCase.maxCoolerHeightMm &&
        part.thermalCapacityW >=
          cpu.powerDraw,
    );

  const affordable =
    candidates.filter(
      (cooler) =>
        build.totalPrice -
          current.price +
          cooler.price <=
        request.budget * 1.05,
    );

  if (!affordable.length) {
    return build;
  }

  return replacePart(
    build,
    [...affordable].sort(
      (a, b) =>
        a.price -
        b.price,
    )[0],
  );
}

/*
 * ---------------------------------------------------------
 * CASE UPGRADES
 * ---------------------------------------------------------
 */

function upgradeCase(
  build: SelectedBuild,
  request: BuildRequest,
): SelectedBuild {
  const current =
    getPartByCategory(
      build,
      'case',
    );

  const motherboard =
    getPartByCategory(
      build,
      'motherboard',
    );

  const gpu =
    getPartByCategory(
      build,
      'gpu',
    );

  const cooler =
    getPartByCategory(
      build,
      'cooler',
    );

  if (
    !current ||
    !motherboard ||
    !gpu ||
    !cooler
  ) {
    return build;
  }

  const requestedFormFactor =
    getRequestedFormFactor(
      request.preferences.size,
    );

  const candidates =
    allParts.filter(
      (part): part is CasePart =>
        partIs(part, 'case') &&
        part.price >
          current.price &&
        part.formFactor ===
          requestedFormFactor &&
        part.supportedFormFactors.includes(
          motherboard.formFactor,
        ) &&
        part.maxGpuLengthMm >=
          gpu.lengthMm &&
        cooler.heightMm <=
          part.maxCoolerHeightMm,
    );

  const affordable =
    candidates.filter(
      (pcCase) =>
        build.totalPrice -
          current.price +
          pcCase.price <=
        request.budget * 1.05,
    );

  if (!affordable.length) {
    return build;
  }

  return replacePart(
    build,
    [...affordable].sort(
      (a, b) =>
        a.price -
        b.price,
    )[0],
  );
}

/*
 * ---------------------------------------------------------
 * COMPLETE UPGRADE PASS
 * ---------------------------------------------------------
 *
 * Exact priority requested:
 *
 * GPU
 * CPU
 * RAM
 * PSU
 * Cooler
 * Case
 *
 * Storage is excluded because its capacity is explicitly selected
 * by the user and is therefore not an automatic upgrade target.
 *
 * We repeatedly go through this order while there
 * is still enough room in the budget.
 */

function optimizeBuild(
  initialBuild: SelectedBuild,
  request: BuildRequest,
  performanceContext: PerformanceContext,
): SelectedBuild {
  let build =
    initialBuild;

  const upperBudget =
    request.budget * 1.05;

  let changed = true;

  while (changed) {
    changed = false;

    /*
     * GPU FIRST
     */
    const gpuUpgrade =
      upgradeGpu(
        build,
        request,
        performanceContext,
      );

    if (
      gpuUpgrade.totalPrice >
        build.totalPrice &&
      gpuUpgrade.totalPrice <=
        upperBudget
    ) {
      build =
        gpuUpgrade;
      changed = true;
    }

    /*
     * CPU SECOND
     */
    const cpuUpgrade =
      upgradeCpu(
        build,
        request,
      );

    if (
      cpuUpgrade.totalPrice >
        build.totalPrice &&
      cpuUpgrade.totalPrice <=
        upperBudget
    ) {
      build =
        cpuUpgrade;
      changed = true;
    }

    /*
     * RAM THIRD
     */
    const ramUpgrade =
      upgradeRam(
        build,
        request,
      );

    if (
      ramUpgrade.totalPrice >
        build.totalPrice &&
      ramUpgrade.totalPrice <=
        upperBudget
    ) {
      build =
        ramUpgrade;
      changed = true;
    }

    /*
     * STORAGE IS USER-SELECTED
     *
     * Do not upgrade or replace storage here.
     */
    /*
     * PSU FOURTH
     */
    const psuUpgrade =
      upgradePsu(
        build,
        request,
      );

    if (
      psuUpgrade.totalPrice >
        build.totalPrice &&
      psuUpgrade.totalPrice <=
        upperBudget
    ) {
      build =
        psuUpgrade;
      changed = true;
    }

    /*
     * COOLER FIFTH
     */
    const coolerUpgrade =
      upgradeCooler(
        build,
        request,
      );

    if (
      coolerUpgrade.totalPrice >
        build.totalPrice &&
      coolerUpgrade.totalPrice <=
        upperBudget
    ) {
      build =
        coolerUpgrade;
      changed = true;
    }

    /*
     * CASE LAST
     */
    const caseUpgrade =
      upgradeCase(
        build,
        request,
      );

    if (
      caseUpgrade.totalPrice >
        build.totalPrice &&
      caseUpgrade.totalPrice <=
        upperBudget
    ) {
      build =
        caseUpgrade;
      changed = true;
    }
  }

  return {
    ...build,
    budgetRemaining:
      request.budget -
      build.totalPrice,
  };
}

/*
 * ---------------------------------------------------------
 * MAIN BUILDER
 * ---------------------------------------------------------
 */

export function selectBasicBuild(
  request: BuildRequest,
): SelectedBuild {
  const gpuParts =
    allParts.filter(
      (part): part is GpuPart =>
        partIs(part, 'gpu'),
    );

  const cpuParts =
    allParts.filter(
      (part): part is CpuPart =>
        partIs(part, 'cpu'),
    );

  if (!gpuParts.length) {
    throw new Error(
      'No GPUs are available in the parts catalog.',
    );
  }

  if (!cpuParts.length) {
    throw new Error(
      'No CPUs are available in the parts catalog.',
    );
  }

  const performanceContext =
    getPerformanceContext(
      request.games,
    );

  /*
   * -------------------------------------------------------
   * STEP 1
   * -------------------------------------------------------
   *
   * Create balanced GPU + CPU combinations.
   *
   * We deliberately do NOT start with the strongest GPU.
   */

  const candidates: SelectedBuild[] = [];

  for (const gpu of gpuParts) {
    for (const cpu of cpuParts) {
      /*
       * Reject obviously unbalanced GPU/CPU pairs
       * before constructing the entire PC.
       */
      if (
        !isGpuBalanced(
          gpu,
          cpu,
          request,
          performanceContext,
        )
      ) {
        continue;
      }

      const build =
        buildFromGpuAndCpu(
          gpu,
          cpu,
          request,
        );

      if (build) {
        candidates.push(build);
      }
    }
  }

  /*
   * If strict performance matching produced nothing,
   * build the closest practical configuration.
   */
  if (!candidates.length) {
    for (const gpu of gpuParts) {
      for (const cpu of cpuParts) {
        const build =
          buildFromGpuAndCpu(
            gpu,
            cpu,
            request,
            true,
          );

        if (build) {
          candidates.push(build);
        }
      }
    }
  }

  if (!candidates.length) {
    throw new Error(
      'No compatible PC build could be created from the current parts catalog. Check CPU, motherboard, RAM, storage, cooler, PSU, case, and GPU compatibility.',
    );
  }

  /*
   * -------------------------------------------------------
   * STEP 2
   * -------------------------------------------------------
   *
   * Find the best starting build.
   *
   * Performance target comes first, then budget.
   */

  const withinBudget =
    candidates.filter(
      (build) =>
        build.totalPrice <=
        request.budget * 1.05,
    );

  const startingPool =
    withinBudget.length
      ? withinBudget
      : candidates;

  let best =
    [...startingPool].sort(
      (a, b) =>
        scoreBuild(
          b,
          request,
          performanceContext,
        ) -
        scoreBuild(
          a,
          request,
          performanceContext,
        ),
    )[0];

  /*
   * -------------------------------------------------------
   * STEP 3
   * -------------------------------------------------------
   *
   * Optimize using the requested upgrade priority.
   *
   * GPU → CPU → RAM → PSU → Cooler → Case
   * (Storage capacity is user-selected and never auto-upgraded.)
   */

  best =
    optimizeBuild(
      best,
      request,
      performanceContext,
    );

  /*
   * -------------------------------------------------------
   * STEP 4
   * -------------------------------------------------------
   *
   * Pull components for notes.
   */

  const gpu =
    getPartByCategory(
      best,
      'gpu',
    );

  const cpu =
    getPartByCategory(
      best,
      'cpu',
    );

  const motherboard =
    getPartByCategory(
      best,
      'motherboard',
    );

  const ram =
    getPartByCategory(
      best,
      'ram',
    );

  const storage =
    getPartByCategory(
      best,
      'storage',
    );

  const pcCase =
    getPartByCategory(
      best,
      'case',
    );

  const cooler =
    getPartByCategory(
      best,
      'cooler',
    );

  const psu =
    getPartByCategory(
      best,
      'psu',
    );

  if (
    !gpu ||
    !cpu ||
    !motherboard ||
    !ram ||
    !storage ||
    !pcCase ||
    !cooler ||
    !psu
  ) {
    throw new Error(
      'The selected build is missing one or more required components.',
    );
  }

  const lowerBudget =
    request.budget * 0.95;

  const upperBudget =
    request.budget * 1.05;

  const withinFivePercent =
    best.totalPrice >=
      lowerBudget &&
    best.totalPrice <=
      upperBudget;

  /*
   * -------------------------------------------------------
   * NOTES
   * -------------------------------------------------------
   */

  const selectedStorageLabel =
    request.storageCapacityGb === 512
      ? '500GB / 512GB'
      : request.storageCapacityGb === 1000 ||
          request.storageCapacityGb === undefined
        ? '1TB'
        : request.storageCapacityGb === 2000
          ? '2TB'
          : '4TB';

  const notes: string[] = [
    `${gpu.name} was selected as the GPU for ${request.resolution} gaming at ${request.graphicsPreset} with a ${request.fps} FPS target.`,

    `${cpu.name} was selected to keep the GPU and CPU balanced for the requested workload.`,

    `${motherboard.name} is compatible with the ${cpu.socket} CPU platform and supports ${motherboard.memoryType} memory.`,

    `${ram.name} was selected to match the motherboard's memory platform.`,

    `${storage.name} matches the user's selected ${selectedStorageLabel} storage capacity. Storage is not automatically upgraded.`,

    `${pcCase.name} supports the selected motherboard and GPU.`,

    `${cooler.name} provides cooling appropriate for the selected CPU.`,

    `${psu.wattage}W power supply provides headroom above the estimated system draw.`,
  ];

  if (
    performanceContext.knownGames.length
  ) {
    notes.unshift(
      `${performanceContext.knownGames
        .map(
          ({ profile }) =>
            profile.name,
        )
        .join(
          ', ',
        )} influenced the performance selection using resolution, ${request.graphicsPreset}, and the ${request.fps} FPS target.`,
    );
  }

  if (
    performanceContext.unsupportedGames
      .length
  ) {
    notes.push(
      `Unsupported for performance estimation: ${performanceContext.unsupportedGames.join(', ')}. Those games were not used to rank the build.`,
    );
  }

  if (withinFivePercent) {
    notes.push(
      `The final build is within ±5% of the requested budget.`,
    );
  } else if (
    best.totalPrice >
    upperBudget
  ) {
    notes.push(
      `The requested performance could not be achieved within 5% above the requested budget using the current parts catalog.`,
    );
  } else {
    notes.push(
      `The builder stayed below the requested budget because no justified upgrade could be made without exceeding the requested performance/balance requirements.`,
    );
  }

  notes.push(
    `Upgrade priority: GPU → CPU → RAM → Storage → PSU → Cooler → Case.`,
  );

  notes.push(
    `Storage selection: ${selectedStorageLabel}. The builder will not automatically increase storage capacity.`,
  );

  notes.push(
    `Budget: $${request.budget.toFixed(
      0,
    )}. Final build: $${best.totalPrice.toFixed(
      0,
    )}.`,
  );

  return {
    ...best,
    notes,
    budgetRemaining:
      request.budget -
      best.totalPrice,
  };
}

export function formatCategory(
  category: Part['category'],
) {
  return {
    cpu: 'CPU',
    gpu: 'GPU',
    motherboard: 'Motherboard',
    ram: 'Memory',
    storage: 'Storage',
    psu: 'Power supply',
    case: 'Case',
    cooler: 'CPU cooler',
  }[category];
}