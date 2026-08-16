export type Resolution = '1080p' | '1440p' | '4K';
export type FormFactor = 'Mini-ITX' | 'Micro-ATX' | 'ATX';
export type MemoryType = 'DDR5';
export type NoisePreference = 'Silent' | 'Quiet' | 'I don’t mind';
export type AppearancePreference = 'Understated' | 'A little drama' | 'Showpiece';
export type SizePreference = 'Compact' | 'Balanced' | 'Roomy';

type BasePart = {
  id: string;
  name: string;
  brand: string;
  price: number;
};

export type CpuPart = BasePart & {
  category: 'cpu';
  socket: 'AM5' | 'LGA1700';
  cores: number;
  performanceTier: number;
  powerDraw: number;
};

export type GpuPart = BasePart & {
  category: 'gpu';
  vramGb: number;
  performanceTier: number;
  powerDraw: number;
  lengthMm: number;
  targetResolutions: Resolution[];
};

export type MotherboardPart = BasePart & {
  category: 'motherboard';
  socket: CpuPart['socket'];
  memoryType: MemoryType;
  formFactor: FormFactor;
  maxMemoryGb: number;
  m2Slots: number;
};

export type RamPart = BasePart & {
  category: 'ram';
  memoryType: MemoryType;
  capacityGb: number;
  speedMhz: number;
  sticks: number;
};

export type StoragePart = BasePart & {
  category: 'storage';
  storageType: 'NVMe SSD';
  capacityGb: number;
  interface: 'PCIe 4.0';
};

export type PsuPart = BasePart & {
  category: 'psu';
  wattage: number;
  efficiency: '80+ Gold';
  modular: boolean;
  pcieConnectors: number;
};

export type CasePart = BasePart & {
  category: 'case';
  supportedFormFactors: FormFactor[];
  maxGpuLengthMm: number;
  maxCoolerHeightMm: number;
  size: SizePreference;
  appearance: AppearancePreference;
};

export type CoolerPart = BasePart & {
  category: 'cooler';
  supportedSockets: CpuPart['socket'][];
  heightMm: number;
  thermalCapacityW: number;
  noise: NoisePreference;
};

export type Part =
  | CpuPart
  | GpuPart
  | MotherboardPart
  | RamPart
  | StoragePart
  | PsuPart
  | CasePart
  | CoolerPart;

export const partCatalog = {
  cpus: [
    {
      id: 'cpu-ryzen-5-7600',
      category: 'cpu',
      name: 'Ryzen 5 7600',
      brand: 'AMD',
      price: 199,
      socket: 'AM5',
      cores: 6,
      performanceTier: 2,
      powerDraw: 88,
    },
    {
      id: 'cpu-core-i5-14600k',
      category: 'cpu',
      name: 'Core i5-14600K',
      brand: 'Intel',
      price: 299,
      socket: 'LGA1700',
      cores: 14,
      performanceTier: 3,
      powerDraw: 181,
    },
    {
      id: 'cpu-ryzen-7-7800x3d',
      category: 'cpu',
      name: 'Ryzen 7 7800X3D',
      brand: 'AMD',
      price: 379,
      socket: 'AM5',
      cores: 8,
      performanceTier: 4,
      powerDraw: 162,
    },
  ] satisfies CpuPart[],
  gpus: [
    {
      id: 'gpu-radeon-rx-7600',
      category: 'gpu',
      name: 'Radeon RX 7600',
      brand: 'AMD',
      price: 279,
      vramGb: 8,
      performanceTier: 1,
      powerDraw: 165,
      lengthMm: 204,
      targetResolutions: ['1080p'],
    },
    {
      id: 'gpu-geforce-rtx-4060-ti',
      category: 'gpu',
      name: 'GeForce RTX 4060 Ti',
      brand: 'NVIDIA',
      price: 399,
      vramGb: 8,
      performanceTier: 2,
      powerDraw: 160,
      lengthMm: 244,
      targetResolutions: ['1080p', '1440p'],
    },
    {
      id: 'gpu-geforce-rtx-4070-super',
      category: 'gpu',
      name: 'GeForce RTX 4070 SUPER',
      brand: 'NVIDIA',
      price: 599,
      vramGb: 12,
      performanceTier: 3,
      powerDraw: 220,
      lengthMm: 244,
      targetResolutions: ['1440p', '4K'],
    },
    {
      id: 'gpu-radeon-rx-7900-xt',
      category: 'gpu',
      name: 'Radeon RX 7900 XT',
      brand: 'AMD',
      price: 699,
      vramGb: 20,
      performanceTier: 4,
      powerDraw: 315,
      lengthMm: 276,
      targetResolutions: ['1440p', '4K'],
    },
  ] satisfies GpuPart[],
  motherboards: [
    {
      id: 'motherboard-b650m-pro',
      category: 'motherboard',
      name: 'B650M Pro RS',
      brand: 'ASRock',
      price: 149,
      socket: 'AM5',
      memoryType: 'DDR5',
      formFactor: 'Micro-ATX',
      maxMemoryGb: 96,
      m2Slots: 2,
    },
    {
      id: 'motherboard-b650e-tomahawk',
      category: 'motherboard',
      name: 'B650E Tomahawk WiFi',
      brand: 'MSI',
      price: 219,
      socket: 'AM5',
      memoryType: 'DDR5',
      formFactor: 'ATX',
      maxMemoryGb: 128,
      m2Slots: 3,
    },
    {
      id: 'motherboard-b760m-ds3h',
      category: 'motherboard',
      name: 'B760M DS3H AX',
      brand: 'Gigabyte',
      price: 159,
      socket: 'LGA1700',
      memoryType: 'DDR5',
      formFactor: 'Micro-ATX',
      maxMemoryGb: 96,
      m2Slots: 2,
    },
  ] satisfies MotherboardPart[],
  ram: [
    {
      id: 'ram-32gb-ddr5-6000',
      category: 'ram',
      name: '32GB DDR5-6000 Kit',
      brand: 'Corsair',
      price: 104,
      memoryType: 'DDR5',
      capacityGb: 32,
      speedMhz: 6000,
      sticks: 2,
    },
    {
      id: 'ram-32gb-ddr5-6000-rgb',
      category: 'ram',
      name: '32GB DDR5-6000 RGB Kit',
      brand: 'G.Skill',
      price: 119,
      memoryType: 'DDR5',
      capacityGb: 32,
      speedMhz: 6000,
      sticks: 2,
    },
    {
      id: 'ram-64gb-ddr5-6000',
      category: 'ram',
      name: '64GB DDR5-6000 Kit',
      brand: 'Kingston',
      price: 189,
      memoryType: 'DDR5',
      capacityGb: 64,
      speedMhz: 6000,
      sticks: 2,
    },
  ] satisfies RamPart[],
  storage: [
    {
      id: 'storage-1tb-nvme',
      category: 'storage',
      name: '1TB Gen4 NVMe SSD',
      brand: 'WD',
      price: 74,
      storageType: 'NVMe SSD',
      capacityGb: 1000,
      interface: 'PCIe 4.0',
    },
    {
      id: 'storage-2tb-nvme',
      category: 'storage',
      name: '2TB Gen4 NVMe SSD',
      brand: 'Crucial',
      price: 129,
      storageType: 'NVMe SSD',
      capacityGb: 2000,
      interface: 'PCIe 4.0',
    },
  ] satisfies StoragePart[],
  psus: [
    {
      id: 'psu-650w-gold',
      category: 'psu',
      name: '650W Gold Modular',
      brand: 'be quiet!',
      price: 99,
      wattage: 650,
      efficiency: '80+ Gold',
      modular: true,
      pcieConnectors: 2,
    },
    {
      id: 'psu-750w-gold',
      category: 'psu',
      name: '750W Gold Modular',
      brand: 'Corsair',
      price: 119,
      wattage: 750,
      efficiency: '80+ Gold',
      modular: true,
      pcieConnectors: 3,
    },
    {
      id: 'psu-850w-gold',
      category: 'psu',
      name: '850W Gold Modular',
      brand: 'Seasonic',
      price: 149,
      wattage: 850,
      efficiency: '80+ Gold',
      modular: true,
      pcieConnectors: 4,
    },
  ] satisfies PsuPart[],
  cases: [
    {
      id: 'case-pop-mini-air',
      category: 'case',
      name: 'Pop Mini Air',
      brand: 'Fractal Design',
      price: 89,
      supportedFormFactors: ['Mini-ITX', 'Micro-ATX'],
      maxGpuLengthMm: 365,
      maxCoolerHeightMm: 170,
      size: 'Compact',
      appearance: 'Understated',
    },
    {
      id: 'case-4000d-airflow',
      category: 'case',
      name: '4000D Airflow',
      brand: 'Corsair',
      price: 99,
      supportedFormFactors: ['Mini-ITX', 'Micro-ATX', 'ATX'],
      maxGpuLengthMm: 360,
      maxCoolerHeightMm: 170,
      size: 'Balanced',
      appearance: 'Understated',
    },
    {
      id: 'case-h9-flow',
      category: 'case',
      name: 'H9 Flow',
      brand: 'NZXT',
      price: 169,
      supportedFormFactors: ['Mini-ITX', 'Micro-ATX', 'ATX'],
      maxGpuLengthMm: 435,
      maxCoolerHeightMm: 165,
      size: 'Roomy',
      appearance: 'Showpiece',
    },
  ] satisfies CasePart[],
  coolers: [
    {
      id: 'cooler-peerless-assassin',
      category: 'cooler',
      name: 'Peerless Assassin 120 SE',
      brand: 'Thermalright',
      price: 39,
      supportedSockets: ['AM5', 'LGA1700'],
      heightMm: 155,
      thermalCapacityW: 200,
      noise: 'Quiet',
    },
    {
      id: 'cooler-nh-u12s-redux',
      category: 'cooler',
      name: 'NH-U12S redux',
      brand: 'Noctua',
      price: 55,
      supportedSockets: ['AM5', 'LGA1700'],
      heightMm: 158,
      thermalCapacityW: 180,
      noise: 'Silent',
    },
    {
      id: 'cooler-ak620',
      category: 'cooler',
      name: 'AK620',
      brand: 'DeepCool',
      price: 64,
      supportedSockets: ['AM5', 'LGA1700'],
      heightMm: 160,
      thermalCapacityW: 260,
      noise: 'I don’t mind',
    },
  ] satisfies CoolerPart[],
} as const;

export const allParts: Part[] = Object.values(partCatalog).flat() as Part[];