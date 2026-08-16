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

function partIs<T extends Part['category']>(
  part: Part,
  category: T,
): part is Extract<Part, { category: T }> {
  return part.category === category;
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
  preferences: BuildPreferences,
  budget: number,
): CpuPart {
  const cpuParts = allParts.filter((part): part is CpuPart => partIs(part, 'cpu'));
  const targetTier = Math.max(resolutionTier[preferencesTargetResolution(gpu)], gpu.performanceTier - 1);

  return chooseClosest(cpuParts, (part) => {
    const balance = 6 - Math.abs(part.performanceTier - targetTier) * 2;
    const upgradeBonus = preferences.upgradeability === 'Plan ahead' && part.performanceTier >= 3 ? 2 : 0;
    const budgetPenalty = part.price > budget * 0.25 ? 3 : 0;
    return balance + upgradeBonus - budgetPenalty;
  });
}

function preferencesTargetResolution(gpu: GpuPart): Resolution {
  return gpu.targetResolutions.includes('4K')
    ? '4K'
    : gpu.targetResolutions.includes('1440p')
      ? '1440p'
      : '1080p';
}

export function selectBasicBuild(request: BuildRequest): SelectedBuild {
  const gpuParts = allParts.filter((part): part is GpuPart => partIs(part, 'gpu'));
  const targetTier = resolutionTier[request.resolution] + (request.fps >= 165 ? 1 : 0);

  const rankedGpus = [...gpuParts].sort((a, b) => {
    const aFit = a.targetResolutions.includes(request.resolution) ? 3 : 0;
    const bFit = b.targetResolutions.includes(request.resolution) ? 3 : 0;
    const aBudget = a.price <= request.budget * 0.55 ? 2 : -2;
    const bBudget = b.price <= request.budget * 0.55 ? 2 : -2;
    const aDistance = Math.abs(a.performanceTier - targetTier);
    const bDistance = Math.abs(b.performanceTier - targetTier);
    return bFit + bBudget - bDistance - (aFit + aBudget - aDistance);
  });

  const gpu = rankedGpus[0];
  const cpu = chooseCpu(gpu, request.preferences, request.budget);
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