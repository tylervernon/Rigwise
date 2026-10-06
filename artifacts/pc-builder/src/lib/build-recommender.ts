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
 * This prevents the recommender from spending too much
 * of the budget on the GPU while pairing it with an
 * unnecessarily weak CPU.
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

    if (gameRequirements.length) {
      requestedTier = Math.max(
        requestedTier,
        ...gameRequirements,
      );
    }
  }

  const cpuTier =
    cpu.performanceTier as PerformanceTier;

  let cpuSupportedGpuTier =
    (cpuTier + 1) as PerformanceTier;

  if (
    request.resolution === '1440p'
  ) {
    cpuSupportedGpuTier =
      Math.min(
        5,
        cpuTier + 2,
      ) as PerformanceTier;
  }

  if (
    request.resolution === '4K'
  ) {
    cpuSupportedGpuTier =
      Math.min(
        5,
        cpuTier + 3,
      ) as PerformanceTier;
  }

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

  if (gpuTier < requiredTier) {
    return false;
  }

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

  const compatible =
    motherboards.filter(
      (part) =>
        normalizeSocket(part.socket) ===
        cpuSocket,
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
          value += 6;
        }

        if (
          preferences.size ===
            'Balanced' &&
          part.formFactor ===
            'ATX'
        ) {
          value += 4;
        }

        if (
          preferences.size ===
            'Roomy' &&
          part.formFactor ===
            'ATX'
        ) {
          value += 7;
        }

        if (
          preferences.size ===
            'Roomy' &&
          part.formFactor ===
            'Micro-ATX'
        ) {
          value += 3;
        }

        value += Math.min(
          part.maxMemoryGb / 32,
          6,
        );

        value += Math.min(
          part.m2Slots * 1.5,
          4,
        );

        return value;
      };

      const aScore = score(a);
      const bScore = score(b);

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      return a.price - b.price;
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
      const aCapacityScore =
        a.capacityGb === 32
          ? 10
          : a.capacityGb === 16
            ? 5
            : 1;

      const bCapacityScore =
        b.capacityGb === 32
          ? 10
          : b.capacityGb === 16
            ? 5
            : 1;

      if (
        aCapacityScore !==
        bCapacityScore
      ) {
        return (
          bCapacityScore -
          aCapacityScore
        );
      }

      if (
        a.speedMhz !==
        b.speedMhz
      ) {
        return (
          b.speedMhz -
          a.speedMhz
        );
      }

      return a.price - b.price;
    },
  )[0];
}

/*
 * ---------------------------------------------------------
 * STORAGE
 * ---------------------------------------------------------
 */

function chooseStorage(
  requestedCapacity: StorageCapacity,
): StoragePart | undefined {
  const storageParts =
    allParts.filter(
      (part): part is StoragePart =>
        partIs(part, 'storage'),
    );

  if (!storageParts.length) {
    return undefined;
  }

  /*
   * 512 means either 500GB or 512GB.
   */
  if (
    requestedCapacity === 512
  ) {
    const matching =
      storageParts.filter(
        (part) =>
          part.capacityGb === 500 ||
          part.capacityGb === 512,
      );

    return byPrice(matching)[0];
  }

  const matching =
    storageParts.filter(
      (part) =>
        part.capacityGb ===
        requestedCapacity,
    );

  return byPrice(matching)[0];
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
  const cases =
    allParts.filter(
      (part): part is CasePart =>
        partIs(part, 'case'),
    );

  const compatible =
    cases.filter(
      (part) =>
        part.supportedFormFactors.includes(
          motherboard.formFactor,
        ) &&
        part.maxGpuLengthMm >=
          gpu.lengthMm,
    );

  if (!compatible.length) {
    return undefined;
  }

  return [...compatible].sort(
    (a, b) => {
      const score = (
        part: CasePart,
      ) => {
        let value = 0;

        const requestedSize =
          sizeRank[preferences.size];

        const caseSize =
          sizeRank[part.size];

        value -=
          Math.abs(
            requestedSize -
              caseSize,
          ) * 5;

        const requestedAppearance =
          appearanceRank[
            preferences.appearance
          ];

        const caseAppearance =
          appearanceRank[
            part.appearance
          ];

        value -=
          Math.abs(
            requestedAppearance -
              caseAppearance,
          ) * 4;

        if (
          part.maxGpuLengthMm >=
          gpu.lengthMm
        ) {
          value += 2;
        }

        return value;
      };

      const aScore = score(a);
      const bScore = score(b);

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      return a.price - b.price;
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
  const socket =
    normalizeSocket(cpu.socket);

  const candidates =
    allParts.filter(
      (part): part is CoolerPart =>
        partIs(part, 'cooler') &&
        part.supportedSockets.some(
          (supportedSocket) =>
            normalizeSocket(
              supportedSocket,
            ) === socket,
        ) &&
        part.thermalCapacityW >=
          cpu.powerDraw &&
        part.heightMm <=
          pcCase.maxCoolerHeightMm,
    );

  if (!candidates.length) {
    return undefined;
  }

  return [...candidates].sort(
    (a, b) => {
      let aScore = 0;
      let bScore = 0;

      if (
        a.includedWithCpuId ===
        cpu.id
      ) {
        aScore += 8;
      }

      if (
        b.includedWithCpuId ===
        cpu.id
      ) {
        bScore += 8;
      }

      const requestedNoise =
        noiseRank[preferences.noise];

      const aNoise =
        noiseRank[a.noise];

      const bNoise =
        noiseRank[b.noise];

      aScore -=
        Math.abs(
          requestedNoise -
            aNoise,
        ) * 2;

      bScore -=
        Math.abs(
          requestedNoise -
            bNoise,
        ) * 2;

      aScore -=
        Math.max(
          0,
          a.thermalCapacityW -
            cpu.powerDraw -
            80,
        ) / 100;

      bScore -=
        Math.max(
          0,
          b.thermalCapacityW -
            cpu.powerDraw -
            80,
        ) / 100;

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      return a.price - b.price;
    },
  )[0];
}

/*
 * ---------------------------------------------------------
 * PSU
 * ---------------------------------------------------------
 */

function choosePsu(
  estimatedPower: number,
): PsuPart | undefined {
  const psus =
    allParts.filter(
      (part): part is PsuPart =>
        partIs(part, 'psu'),
    );

  const requiredWattage =
    estimatedPower * 1.3;

  const compatible =
    psus.filter(
      (part) =>
        part.wattage >=
        requiredWattage,
    );

  if (!compatible.length) {
    return undefined;
  }

  return [...compatible].sort(
    (a, b) => {
      if (
        a.wattage !==
        b.wattage
      ) {
        return (
          a.wattage -
          b.wattage
        );
      }

      return a.price - b.price;
    },
  )[0];
}

/*
 * ---------------------------------------------------------
 * BUILD COMPATIBILITY
 * ---------------------------------------------------------
 *
 * BIOS is intentionally NOT a hard compatibility check.
 *
 * Hard checks:
 * CPU ↔ motherboard socket
 * Motherboard ↔ RAM generation
 * RAM capacity ↔ motherboard maximum
 * CPU ↔ cooler socket
 * CPU ↔ cooler thermal capacity
 * Motherboard ↔ case form factor
 * GPU ↔ case GPU length
 * Cooler ↔ case cooler height
 * PSU ↔ 30% headroom
 * Storage ↔ user's selected capacity
 */

function getPartByCategory<
  T extends Part['category'],
>(
  build: SelectedBuild,
  category: T,
): Extract<
  Part,
  { category: T }
> | undefined {
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

function isBuildCompatible(
  build: SelectedBuild,
  request: BuildRequest,
): boolean {
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

  const motherboard =
    getPartByCategory(
      build,
      'motherboard',
    );

  const ram =
    getPartByCategory(
      build,
      'ram',
    );

  const storage =
    getPartByCategory(
      build,
      'storage',
    );

  const psu =
    getPartByCategory(
      build,
      'psu',
    );

  const pcCase =
    getPartByCategory(
      build,
      'case',
    );

  const cooler =
    getPartByCategory(
      build,
      'cooler',
    );

  if (
    !cpu ||
    !gpu ||
    !motherboard ||
    !ram ||
    !storage ||
    !psu ||
    !pcCase ||
    !cooler
  ) {
    return false;
  }

  /*
   * CPU ↔ motherboard socket
   */
  if (
    normalizeSocket(cpu.socket) !==
    normalizeSocket(motherboard.socket)
  ) {
    return false;
  }

  /*
   * Motherboard ↔ RAM generation
   */
  if (
    motherboard.memoryType !==
    ram.memoryType
  ) {
    return false;
  }

  /*
   * RAM capacity ↔ motherboard maximum
   */
  if (
    ram.capacityGb >
    motherboard.maxMemoryGb
  ) {
    return false;
  }

  /*
   * CPU ↔ cooler socket
   */
  if (
    !cooler.supportedSockets.some(
      (socket) =>
        normalizeSocket(socket) ===
        normalizeSocket(cpu.socket),
    )
  ) {
    return false;
  }

  /*
   * CPU ↔ cooler thermal capacity
   */
  if (
    cooler.thermalCapacityW <
    cpu.powerDraw
  ) {
    return false;
  }

  /*
   * Motherboard ↔ case form factor
   */
  if (
    !pcCase.supportedFormFactors.includes(
      motherboard.formFactor,
    )
  ) {
    return false;
  }

  /*
   * GPU ↔ case GPU length
   */
  if (
    gpu.lengthMm >
    pcCase.maxGpuLengthMm
  ) {
    return false;
  }

  /*
   * Cooler ↔ case cooler height
   */
  if (
    cooler.heightMm >
    pcCase.maxCoolerHeightMm
  ) {
    return false;
  }

  /*
   * PSU ↔ 30% headroom
   */
  const estimatedPower =
    cpu.powerDraw +
    gpu.powerDraw +
    110;

  if (
    psu.wattage <
    estimatedPower * 1.3
  ) {
    return false;
  }

  /*
   * STORAGE ↔ USER SELECTION
   *
   * This is a hard requirement.
   *
   * 512 = either 500GB or 512GB.
   * Everything else must match exactly.
   */
  const requestedStorage =
    request.storageCapacityGb ??
    1000;

  if (
    requestedStorage ===
    512
  ) {
    if (
      storage.capacityGb !== 500 &&
      storage.capacityGb !== 512
    ) {
      return false;
    }
  } else if (
    storage.capacityGb !==
    requestedStorage
  ) {
    return false;
  }

  return true;
}

/*
 * ---------------------------------------------------------
 * BUILD CREATION
 * ---------------------------------------------------------
 */

function buildFromGpuAndCpu(
  gpu: GpuPart,
  cpu: CpuPart,
  request: BuildRequest,
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

  /*
   * Storage is selected ONCE here from the user's
   * requested capacity.
   *
   * It will remain locked for the rest of the
   * recommendation process.
   */
  const storage =
    chooseStorage(
      request.storageCapacityGb ??
        1000,
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

  if (
    totalPrice >
    request.budget * 1.05
  ) {
    return undefined;
  }

  const build: SelectedBuild = {
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

  /*
   * Every initial build must pass compatibility.
   */
  if (
    !isBuildCompatible(
      build,
      request,
    )
  ) {
    return undefined;
  }

  return build;
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
  const gpu =
    build.parts.find(
      (part): part is GpuPart =>
        partIs(part, 'gpu'),
    );

  const cpu =
    build.parts.find(
      (part): part is CpuPart =>
        partIs(part, 'cpu'),
    );

  if (!gpu || !cpu) {
    return -Infinity;
  }

  const requiredTier =
    getStrongestGameRequirement(
      gpu,
      request,
      performanceContext,
    );

  const gpuFit =
    scorePerformanceFit(
      gpu.performanceTier as PerformanceTier,
      requiredTier,
    );

  const cpuFit =
    scorePerformanceFit(
      cpu.performanceTier as PerformanceTier,
      fpsToPerformanceTier(
        request.fps,
      ),
    );

  const lower =
    request.budget * 0.95;

  const upper =
    request.budget * 1.05;

  let budgetScore = 0;

  if (
    build.totalPrice >= lower &&
    build.totalPrice <= upper
  ) {
    const distance =
      Math.abs(
        build.totalPrice -
          request.budget,
      ) /
      request.budget;

    budgetScore =
      100 -
      distance * 500;
  } else if (
    build.totalPrice < lower
  ) {
    const unused =
      (request.budget -
        build.totalPrice) /
      request.budget;

    budgetScore =
      45 -
      unused * 100;
  } else {
    const overspend =
      (build.totalPrice -
        request.budget) /
      request.budget;

    budgetScore =
      -100 -
      overspend * 500;
  }

  /*
   * Budget is more important than unnecessary
   * performance.
   */
  return (
    budgetScore +
    gpuFit * 2 +
    cpuFit
  );
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

/*
 * Replace one component only if the resulting
 * complete build remains compatible.
 *
 * STORAGE IS NEVER REPLACED.
 */
function replacePart(
  build: SelectedBuild,
  newPart: Part,
  request: BuildRequest,
): SelectedBuild {
  /*
   * Absolute storage lock.
   *
   * Even if another function accidentally tries to
   * replace storage, reject the operation.
   */
  if (
    newPart.category ===
    'storage'
  ) {
    return build;
  }

  const currentStorage =
    getPartByCategory(
      build,
      'storage',
    );

  const parts =
    build.parts.map(
      (part) =>
        part.category ===
        newPart.category
          ? newPart
          : part,
    );

  /*
   * Verify that the existing storage drive
   * survived the replacement unchanged.
   */
  const resultingStorage =
    parts.find(
      (part): part is StoragePart =>
        part.category ===
        'storage',
    );

  if (
    currentStorage &&
    resultingStorage?.id !==
      currentStorage.id
  ) {
    return build;
  }

  const candidateBase: SelectedBuild = {
    ...build,
    parts,
  };

  const estimatedPower =
    calculateBuildPower(
      candidateBase,
    );

  const totalPrice =
    parts.reduce(
      (sum, part) =>
        sum + part.price,
      0,
    );

  const candidate: SelectedBuild = {
    ...build,
    parts,
    totalPrice,
    estimatedPower,
    budgetRemaining: 0,
    performanceTier:
      getPartByCategory(
        candidateBase,
        'gpu',
      )?.performanceTier ??
      build.performanceTier,
  };

  return isBuildCompatible(
    candidate,
    request,
  )
    ? candidate
    : build;
}

/*
 * ---------------------------------------------------------
 * GPU UPGRADE
 * ---------------------------------------------------------
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
    request,
  );
}

/*
 * ---------------------------------------------------------
 * CPU UPGRADE
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

  /*
   * CPU upgrades must remain compatible with
   * the existing motherboard.
   *
   * We do not automatically replace the motherboard
   * when upgrading the CPU.
   */
  const motherboard =
    getPartByCategory(
      build,
      'motherboard',
    );

  const compatible =
    motherboard
      ? candidates.filter(
          (cpu) =>
            normalizeSocket(
              cpu.socket,
            ) ===
            normalizeSocket(
              motherboard.socket,
            ),
        )
      : [];

  const affordable =
    compatible.filter(
      (cpu) =>
        build.totalPrice -
          currentCpu.price +
          cpu.price <=
        request.budget * 1.05,
    );

  if (!affordable.length) {
    return build;
  }

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
    request,
  );
}

/*
 * ---------------------------------------------------------
 * RAM UPGRADE
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

  const selected =
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
    )[0];

  return replacePart(
    build,
    selected,
    request,
  );
}

/*
 * ---------------------------------------------------------
 * STORAGE UPGRADE
 * ---------------------------------------------------------
 *
 * THERE IS NO STORAGE UPGRADE FUNCTION.
 *
 * Storage is completely controlled by the user's
 * questionnaire selection.
 *
 * If the user chooses:
 *
 * 500GB / 512GB → stays 500GB / 512GB
 * 1TB            → stays 1TB
 * 2TB            → stays 2TB
 * 4TB            → stays 4TB
 *
 * Leftover budget does NOT change this.
 */

/*
 * ---------------------------------------------------------
 * PSU UPGRADE
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
    calculateBuildPower(
      build,
    );

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
    request,
  );
}

/*
 * ---------------------------------------------------------
 * COOLER UPGRADE
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
            normalizeSocket(
              socket,
            ) ===
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
    request,
  );
}

/*
 * ---------------------------------------------------------
 * CASE UPGRADE
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
    !gpu
  ) {
    return build;
  }

  const candidates =
    allParts.filter(
      (part): part is CasePart =>
        partIs(part, 'case') &&
        part.price >
          current.price &&
        part.supportedFormFactors.includes(
          motherboard.formFactor,
        ) &&
        part.maxGpuLengthMm >=
          gpu.lengthMm &&
        (!cooler ||
          cooler.heightMm <=
            part.maxCoolerHeightMm),
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
    request,
  );
}

/*
 * ---------------------------------------------------------
 * COMPLETE UPGRADE PASS
 * ---------------------------------------------------------
 *
 * EXACT PRIORITY:
 *
 * GPU
 * CPU
 * RAM
 * PSU
 * Cooler
 * Case
 *
 * STORAGE IS NOT INCLUDED.
 *
 * Storage remains locked to the exact drive selected
 * during initial build creation.
 */

function optimizeBuild(
  initialBuild: SelectedBuild,
  request: BuildRequest,
  performanceContext: PerformanceContext,
): SelectedBuild {
  /*
   * Lock the exact storage drive selected during
   * initial build creation.
   */
  const lockedStorage =
    getPartByCategory(
      initialBuild,
      'storage',
    );

  let build =
    initialBuild;

  const upperBudget =
    request.budget * 1.05;

  let changed = true;

  /*
   * Helper that guarantees an optimization did not
   * alter the user's selected storage drive.
   */
  const storageUnchanged = (
    candidate: SelectedBuild,
  ): boolean => {
    const candidateStorage =
      getPartByCategory(
        candidate,
        'storage',
      );

    return (
      candidateStorage?.id ===
      lockedStorage?.id
    );
  };

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
        upperBudget &&
      storageUnchanged(
        gpuUpgrade,
      ) &&
      isBuildCompatible(
        gpuUpgrade,
        request,
      )
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
        upperBudget &&
      storageUnchanged(
        cpuUpgrade,
      ) &&
      isBuildCompatible(
        cpuUpgrade,
        request,
      )
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
        upperBudget &&
      storageUnchanged(
        ramUpgrade,
      ) &&
      isBuildCompatible(
        ramUpgrade,
        request,
      )
    ) {
      build =
        ramUpgrade;

      changed = true;
    }

    /*
     * -----------------------------------------------------
     * STORAGE
     * -----------------------------------------------------
     *
     * NOTHING HAPPENS HERE.
     *
     * Storage is intentionally skipped.
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
        upperBudget &&
      storageUnchanged(
        psuUpgrade,
      ) &&
      isBuildCompatible(
        psuUpgrade,
        request,
      )
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
        upperBudget &&
      storageUnchanged(
        coolerUpgrade,
      ) &&
      isBuildCompatible(
        coolerUpgrade,
        request,
      )
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
        upperBudget &&
      storageUnchanged(
        caseUpgrade,
      ) &&
      isBuildCompatible(
        caseUpgrade,
        request,
      )
    ) {
      build =
        caseUpgrade;

      changed = true;
    }
  }

  /*
   * FINAL STORAGE SAFETY CHECK
   *
   * If anything somehow changed storage, return
   * the original known-good build instead.
   */
  if (
    !storageUnchanged(build)
  ) {
    return initialBuild;
  }

  /*
   * FINAL COMPATIBILITY SAFETY CHECK
   */
  if (
    !isBuildCompatible(
      build,
      request,
    )
  ) {
    return initialBuild;
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
   */

  const candidates: SelectedBuild[] = [];

  for (const gpu of gpuParts) {
    for (const cpu of cpuParts) {
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
   *
   * Compatibility is still enforced.
   */
  if (!candidates.length) {
    for (const gpu of gpuParts) {
      for (const cpu of cpuParts) {
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
   * Upgrade priority:
   *
   * GPU → CPU → RAM → PSU → Cooler → Case
   *
   * Storage is intentionally excluded.
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
   * Final compatibility safety check.
   */

  if (
    !isBuildCompatible(
      best,
      request,
    )
  ) {
    throw new Error(
      'The recommender produced an incompatible build after optimization. Please check the current parts catalog.',
    );
  }

  /*
   * -------------------------------------------------------
   * STEP 5
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
    request.storageCapacityGb ===
    512
      ? '500GB / 512GB'
      : request.storageCapacityGb ===
            1000 ||
          request.storageCapacityGb ===
            undefined
        ? '1TB'
        : request.storageCapacityGb ===
            2000
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
    `Upgrade priority: GPU → CPU → RAM → PSU → Cooler → Case. Storage is user-selected and is not automatically upgraded.`,
  );

  notes.push(
    `Storage selection: ${selectedStorageLabel}. The builder will not automatically increase storage capacity.`,
  );

  notes.push(
    `BIOS note: A BIOS update may be required for CPU support depending on the motherboard's current BIOS version. Check the motherboard manufacturer's CPU support list/manual before purchasing.`,
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