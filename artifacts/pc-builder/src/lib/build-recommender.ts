import {
  allParts,
  type AppearancePreference,
  type CasePart,
  type CoolerPart,
  type CpuPart,
  type FormFactor,
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
  type GamePerformanceProfile,
  type PerformanceTier,
} from '@/data/game-performance';

export type BuildPreferences = {
  size: SizePreference;
  noise: NoisePreference;
  appearance: AppearancePreference;
  upgradeability: 'Keep it simple' | 'Plan ahead';
};

export type BuildRequest = {
  budget: number;
  resolution: Resolution;
  games: string[];
  fps: number;
  preferences: BuildPreferences;
};

export type SelectedBuild = {
  parts: Part[];
  totalPrice: number;
  estimatedPower: number;
  budgetRemaining: number;
  performanceTier: number;
  notes: string[];
};

const byPrice = <T extends Part>(parts: T[]) => [...parts].sort((a, b) => a.price - b.price);

const chooseClosest = <T extends Part>(
  parts: T[],
  score: (part: T) => number,
) => [...parts].sort((a, b) => score(b) - score(a))[0];

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

const appearanceRank: Record<AppearancePreference, number> = {
  Understated: 0,
  'A little drama': 1,
  Showpiece: 2,
};

type PerformanceContext = {
  knownGames: Array<{ input: string; profile: GamePerformanceProfile }>;
  unsupportedGames: string[];
};

function partIs<T extends Part['category']>(
  part: Part,
  category: T,
): part is Extract<Part, { category: T }> {
  return part.category === category;
}

function fpsToPerformanceTier(fps: number): PerformanceTier {
  if (fps >= 165) return 5;
  if (fps >= 120) return 4;
  if (fps >= 90) return 3;
  if (fps >= 60) return 2;
  return 1;
}

function getPerformanceContext(games: string[]): PerformanceContext {
  const knownGames: PerformanceContext['knownGames'] = [];
  const unsupportedGames: string[] = [];

  for (const input of games) {
    const profile = findGamePerformance(input);
    if (profile) {
      knownGames.push({ input, profile });
    } else {
      unsupportedGames.push(input);
    }
  }

  return { knownGames, unsupportedGames };
}

function scorePerformanceFit(availableTier: PerformanceTier, targetTier: PerformanceTier) {
  const difference = availableTier - targetTier;
  return difference >= 0 ? 8 + Math.min(difference, 2) : difference * 6;
}

function chooseMotherboard(
  cpu: CpuPart,
  preferences: BuildPreferences,
): MotherboardPart {
  const candidates = allParts.filter(
    (part): part is MotherboardPart =>
      partIs(part, 'motherboard') && part.socket === cpu.socket,
  );

  return chooseClosest(candidates, (part) => {
    const sizeBonus = preferences.size === 'Compact' && part.formFactor === 'Micro-ATX' ? 3 : 0;
    const upgradeBonus = preferences.upgradeability === 'Plan ahead' && part.formFactor === 'ATX' ? 2 : 0;
    return sizeBonus + upgradeBonus + part.m2Slots;
  });
}

function chooseCase(
  gpu: GpuPart,
  motherboard: MotherboardPart,
  preferences: BuildPreferences,
): CasePart {
  const candidates = allParts.filter(
    (part): part is CasePart =>
      partIs(part, 'case') &&
      part.supportedFormFactors.includes(motherboard.formFactor) &&
      part.maxGpuLengthMm >= gpu.lengthMm,
  );

  return chooseClosest(candidates, (part) => {
    const sizeDistance = Math.abs(sizeRank[part.size] - sizeRank[preferences.size]);
    const appearanceDistance = Math.abs(appearanceRank[part.appearance] - appearanceRank[preferences.appearance]);
    return 10 - sizeDistance * 3 - appearanceDistance * 2;
  });
}

function chooseCooler(
  cpu: CpuPart,
  pcCase: CasePart,
  preferences: BuildPreferences,
): CoolerPart {
  const candidates = allParts.filter(
    (part): part is CoolerPart =>
      partIs(part, 'cooler') &&
      part.supportedSockets.includes(cpu.socket) &&
      part.heightMm <= pcCase.maxCoolerHeightMm &&
      part.thermalCapacityW >= cpu.powerDraw,
  );

  return chooseClosest(candidates, (part) => {
    const noiseDistance = Math.abs(noiseRank[part.noise] - noiseRank[preferences.noise]);
    return 10 - noiseDistance * 3 - part.price / 100;
  });
}

function choosePsu(totalPower: number): PsuPart {
  const candidates = allParts.filter(
    (part): part is PsuPart => partIs(part, 'psu') && part.wattage >= totalPower * 1.3,
  );

  return byPrice(candidates)[0] ?? (allParts.find((part) => part.id === 'psu-850w-gold') as PsuPart);
}

function chooseRam(
  motherboard: MotherboardPart,
  preferences: BuildPreferences,
  budget: number,
): RamPart {
  const candidates = allParts.filter(
    (part): part is RamPart =>
      partIs(part, 'ram') && part.memoryType === motherboard.memoryType && part.capacityGb <= motherboard.maxMemoryGb,
  );

  return chooseClosest(candidates, (part) => {
    const capacityBonus = preferences.upgradeability === 'Plan ahead' && part.capacityGb === 64 && budget >= 1650 ? 4 : 0;
    const rgbBonus = preferences.appearance === 'A little drama' && part.id.endsWith('-rgb') ? 2 : 0;
    const budgetPenalty = part.price > budget * 0.14 ? 2 : 0;
    return capacityBonus + rgbBonus + part.speedMhz / 1000 - budgetPenalty;
  });
}

function chooseStorage(preferences: BuildPreferences, budget: number): StoragePart {
  const storage = allParts.filter((part): part is StoragePart => partIs(part, 'storage'));

  return chooseClosest(storage, (part) => {
    const capacityBonus = preferences.upgradeability === 'Plan ahead' && part.capacityGb === 2000 ? 4 : 0;
    const budgetBonus = budget >= 1300 && part.capacityGb === 2000 ? 2 : 0;
    return capacityBonus + budgetBonus + part.capacityGb / 1000;
  });
}

function chooseCpu(
  gpu: GpuPart,
  request: BuildRequest,
  preferences: BuildPreferences,
  budget: number,
  performanceContext: PerformanceContext,
): CpuPart {
  const cpuParts = allParts.filter((part): part is CpuPart => partIs(part, 'cpu'));
  const targetFpsTier = fpsToPerformanceTier(request.fps);
  const gameCpuPressure = performanceContext.knownGames.length
    ? Math.max(
      ...performanceContext.knownGames.map(({ profile }) => profile.performanceByResolution[request.resolution][gpu.id] ?? gpu.performanceTier),
    )
    : 0;
  const resolutionPressure = request.resolution === '4K' ? resolutionTier[request.resolution] - 1 : resolutionTier[request.resolution];
  const targetTier = Math.min(
    4,
    Math.max(
      resolutionPressure,
      targetFpsTier,
      gameCpuPressure - (request.resolution === '1080p' ? 0 : 1),
      gpu.performanceTier - 1,
    ),
  );

  return chooseClosest(cpuParts, (part) => {
    const balance = 6 - Math.abs(part.performanceTier - targetTier) * 2;
    const upgradeBonus = preferences.upgradeability === 'Plan ahead' && part.performanceTier >= 3 ? 2 : 0;
    const budgetPenalty = part.price > budget * 0.25 ? 3 : 0;
    return balance + upgradeBonus - budgetPenalty;
  });
}

export function selectBasicBuild(request: BuildRequest): SelectedBuild {
  const gpuParts = allParts.filter((part): part is GpuPart => partIs(part, 'gpu'));
  const performanceContext = getPerformanceContext(request.games);
  const targetFpsTier = fpsToPerformanceTier(request.fps);
  const targetTier = Math.min(4, resolutionTier[request.resolution] + (request.fps >= 165 ? 1 : 0));

  const rankedGpus = [...gpuParts].sort((a, b) => {
    const aFit = a.targetResolutions.includes(request.resolution) ? 3 : 0;
    const bFit = b.targetResolutions.includes(request.resolution) ? 3 : 0;
    const aBudgetDistance = a.price - request.budget * 0.55;
    const bBudgetDistance = b.price - request.budget * 0.55;
    const aBudget = aBudgetDistance <= 0 ? 3 : -4 - Math.ceil(aBudgetDistance / 100);
    const bBudget = bBudgetDistance <= 0 ? 3 : -4 - Math.ceil(bBudgetDistance / 100);
    const aDistance = Math.abs(a.performanceTier - targetTier);
    const bDistance = Math.abs(b.performanceTier - targetTier);
    const aGameFit = performanceContext.knownGames.length
      ? Math.min(...performanceContext.knownGames.map(({ profile }) => scorePerformanceFit(profile.performanceByResolution[request.resolution][a.id] ?? a.performanceTier, targetFpsTier)))
      : 0;
    const bGameFit = performanceContext.knownGames.length
      ? Math.min(...performanceContext.knownGames.map(({ profile }) => scorePerformanceFit(profile.performanceByResolution[request.resolution][b.id] ?? b.performanceTier, targetFpsTier)))
      : 0;
    return (
      (bFit + bBudget + bGameFit - bDistance)
      - (aFit + aBudget + aGameFit - aDistance)
    );
  });

  const gpu = rankedGpus[0];
  const cpu = chooseCpu(gpu, request, request.preferences, request.budget, performanceContext);
  const motherboard = chooseMotherboard(cpu, request.preferences);
  const ram = chooseRam(motherboard, request.preferences, request.budget);
  const storage = chooseStorage(request.preferences, request.budget);
  const pcCase = chooseCase(gpu, motherboard, request.preferences);
  const cooler = chooseCooler(cpu, pcCase, request.preferences);
  const estimatedPower = cpu.powerDraw + gpu.powerDraw + 110;
  const psu = choosePsu(estimatedPower);
  const parts = [cpu, gpu, motherboard, ram, storage, psu, pcCase, cooler];
  const totalPrice = parts.reduce((sum, part) => sum + part.price, 0);
  const notes = [
    `${gpu.name} is the performance anchor for ${request.resolution} gaming.`,
    `${cpu.name} keeps the build balanced for a ${request.fps} FPS target.`,
    `${pcCase.name} matches your ${request.preferences.size.toLowerCase()} footprint preference.`,
    `${psu.wattage}W of Gold-rated power leaves headroom above the estimated draw.`,
  ];

  if (performanceContext.knownGames.length) {
    const gameNames = performanceContext.knownGames.map(({ profile }) => profile.name).join(', ');
    notes.unshift(`${gameNames} influenced the GPU and CPU choices using approximate ${request.resolution} performance tiers.`);
  }

  if (performanceContext.unsupportedGames.length) {
    notes.push(`Unsupported for performance estimation: ${performanceContext.unsupportedGames.join(', ')}. These titles were not used to estimate GPU or CPU performance.`);
  }

  if (totalPrice > request.budget) {
    notes.push('This sample catalog cannot meet the full brief under the entered budget yet, so the closest performance match is shown.');
  } else {
    notes.push(`The sample parts leave about $${request.budget - totalPrice} in the budget.`);
  }

  return {
    parts,
    totalPrice,
    estimatedPower,
    budgetRemaining: request.budget - totalPrice,
    performanceTier: gpu.performanceTier,
    notes,
  };
}

export function formatCategory(category: Part['category']) {
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