/*
 * ============================================================
 * PC PARTS CATALOG
 * ============================================================
 *
 * This file is the source of truth for the PC builder catalog.
 *
 * IMPORTANT:
 * - allParts MUST remain exported.
 * - Motherboard memory type must match RAM memory type.
 * - Intel LGA1700 boards can be DDR4 OR DDR5.
 * - Stock coolers are only assigned to CPUs that actually
 *   include an appropriate stock cooler in this catalog.
 *
 * GAMING BUILD GUIDELINES:
 * - 16GB RAM = budget gaming baseline.
 * - 32GB RAM = preferred gaming target.
 * - 64GB RAM = specialized / workstation use and should NOT
 *   be selected casually by the recommender.
 * - 1TB NVMe = normal gaming storage target.
 * - 2TB NVMe = reasonable upgrade.
 * - 4TB NVMe = enthusiast / specialized storage.
 * - PSU selection must provide AT LEAST 30% headroom over
 *   estimated system power.
 * ============================================================
 */

export type Resolution = '1080p' | '1440p' | '4K';

export type SizePreference =
  | 'Compact'
  | 'Balanced'
  | 'Roomy';

export type NoisePreference =
  | 'Silent'
  | 'Quiet'
  | 'I don’t mind';

export type AppearancePreference =
  | 'Understated'
  | 'A little drama'
  | 'Showpiece';

export type MemoryType = 'DDR4' | 'DDR5';

export type MotherboardChipset =
  | 'A520'
  | 'B450'
  | 'B550'
  | 'X570'
  | 'A620'
  | 'B650'
  | 'B840'
  | 'B850'
  | 'X670'
  | 'X870'
  | 'H610'
  | 'B660'
  | 'B760'
  | 'Z690'
  | 'Z790';

export type PartCategory =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler';

export type BasePart = {
  id: string;
  name: string;
  category: PartCategory;
  price: number;
  brand: string;
};

export type CpuPart = BasePart & {
  category: 'cpu';
  socket: 'AM4' | 'AM5' | 'LGA1700';
  performanceTier: 1 | 2 | 3 | 4 | 5;
  powerDraw: number;
  includesStockCooler: boolean;
  stockCoolerId?: string;
};

export type GpuPart = BasePart & {
  category: 'gpu';
  performanceTier: 1 | 2 | 3 | 4 | 5;
  powerDraw: number;
  lengthMm: number;
};

export type MotherboardPart = BasePart & {
  category: 'motherboard';
  socket: 'AM4' | 'AM5' | 'LGA1700';
  chipset: MotherboardChipset;
  memoryType: MemoryType;
  formFactor: 'Mini-ITX' | 'Micro-ATX' | 'ATX';
  maxMemoryGb: number;
  m2Slots: number;
};

export type RamPart = BasePart & {
  category: 'ram';
  memoryType: MemoryType;
  capacityGb: number;
  speedMhz: number;
};

export type StoragePart = BasePart & {
  category: 'storage';
  capacityGb: number;
  interface: 'SATA' | 'NVMe Gen3' | 'NVMe Gen4' | 'NVMe Gen5';
};

export type PsuPart = BasePart & {
  category: 'psu';
  wattage: number;
  efficiency: 'Bronze' | 'Gold' | 'Platinum';
  modular: boolean;
};

export type CasePart = BasePart & {
  category: 'case';
  size: SizePreference;
  appearance: AppearancePreference;
  supportedFormFactors: Array<
    'Mini-ITX' | 'Micro-ATX' | 'ATX'
  >;
  maxGpuLengthMm: number;
  maxCoolerHeightMm: number;
};

export type CoolerPart = BasePart & {
  category: 'cooler';
  type: 'Air' | 'Liquid';
  supportedSockets: Array<
    'AM4' | 'AM5' | 'LGA1700'
  >;
  heightMm: number;
  thermalCapacityW: number;
  noise: NoisePreference;
  includedWithCpuId?: string;
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


/* ============================================================
 * CPUs
 * ============================================================
 */

export const cpus: CpuPart[] = [

  // ---------------- AM4 ----------------

  {
    id: 'cpu-ryzen-5-5500',
    name: 'Ryzen 5 5500',
    category: 'cpu',
    brand: 'AMD',
    price: 85,
    socket: 'AM4',
    performanceTier: 2,
    powerDraw: 65,
    includesStockCooler: true,
    stockCoolerId: 'cooler-amd-wraith-stealth',
  },

  {
    id: 'cpu-ryzen-5-5600',
    name: 'Ryzen 5 5600',
    category: 'cpu',
    brand: 'AMD',
    price: 115,
    socket: 'AM4',
    performanceTier: 3,
    powerDraw: 65,
    includesStockCooler: true,
    stockCoolerId: 'cooler-amd-wraith-stealth',
  },

  {
    id: 'cpu-ryzen-5-5600x',
    name: 'Ryzen 5 5600X',
    category: 'cpu',
    brand: 'AMD',
    price: 125,
    socket: 'AM4',
    performanceTier: 3,
    powerDraw: 65,
    includesStockCooler: true,
    stockCoolerId: 'cooler-amd-wraith-stealth',
  },

  {
    id: 'cpu-ryzen-7-5700x',
    name: 'Ryzen 7 5700X',
    category: 'cpu',
    brand: 'AMD',
    price: 150,
    socket: 'AM4',
    performanceTier: 4,
    powerDraw: 65,
    includesStockCooler: false,
  },

  {
    id: 'cpu-ryzen-7-5700x3d',
    name: 'Ryzen 7 5700X3D',
    category: 'cpu',
    brand: 'AMD',
    price: 210,
    socket: 'AM4',
    performanceTier: 4,
    powerDraw: 105,
    includesStockCooler: false,
  },

  {
    id: 'cpu-ryzen-7-5800x',
    name: 'Ryzen 7 5800X',
    category: 'cpu',
    brand: 'AMD',
    price: 175,
    socket: 'AM4',
    performanceTier: 4,
    powerDraw: 105,
    includesStockCooler: false,
  },

  {
    id: 'cpu-ryzen-9-5900x',
    name: 'Ryzen 9 5900X',
    category: 'cpu',
    brand: 'AMD',
    price: 250,
    socket: 'AM4',
    performanceTier: 5,
    powerDraw: 105,
    includesStockCooler: false,
  },


  // ---------------- AM5 ----------------

  {
    id: 'cpu-ryzen-5-7500f',
    name: 'Ryzen 5 7500F',
    category: 'cpu',
    brand: 'AMD',
    price: 130,
    socket: 'AM5',
    performanceTier: 3,
    powerDraw: 65,
    includesStockCooler: false,
  },

  {
    id: 'cpu-ryzen-5-7600',
    name: 'Ryzen 5 7600',
    category: 'cpu',
    brand: 'AMD',
    price: 175,
    socket: 'AM5',
    performanceTier: 3,
    powerDraw: 65,
    includesStockCooler: false,
  },

  {
    id: 'cpu-ryzen-7-7700',
    name: 'Ryzen 7 7700',
    category: 'cpu',
    brand: 'AMD',
    price: 250,
    socket: 'AM5',
    performanceTier: 4,
    powerDraw: 65,
    includesStockCooler: false,
  },

  {
    id: 'cpu-ryzen-7-7800x3d',
    name: 'Ryzen 7 7800X3D',
    category: 'cpu',
    brand: 'AMD',
    price: 330,
    socket: 'AM5',
    performanceTier: 5,
    powerDraw: 120,
    includesStockCooler: false,
  },

  {
    id: 'cpu-ryzen-7-9800x3d',
    name: 'Ryzen 7 9800X3D',
    category: 'cpu',
    brand: 'AMD',
    price: 380,
    socket: 'AM5',
    performanceTier: 5,
    powerDraw: 120,
    includesStockCooler: false,
  },


  // ---------------- Intel LGA1700 ----------------

  {
    id: 'cpu-core-i3-12100f',
    name: 'Core i3-12100F',
    category: 'cpu',
    brand: 'Intel',
    price: 80,
    socket: 'LGA1700',
    performanceTier: 2,
    powerDraw: 89,
    includesStockCooler: false,
  },

  {
    id: 'cpu-core-i5-12400f',
    name: 'Core i5-12400F',
    category: 'cpu',
    brand: 'Intel',
    price: 110,
    socket: 'LGA1700',
    performanceTier: 3,
    powerDraw: 117,
    includesStockCooler: false,
  },

  {
    id: 'cpu-core-i5-12600kf',
    name: 'Core i5-12600KF',
    category: 'cpu',
    brand: 'Intel',
    price: 150,
    socket: 'LGA1700',
    performanceTier: 4,
    powerDraw: 150,
    includesStockCooler: false,
  },

  {
    id: 'cpu-core-i5-13400f',
    name: 'Core i5-13400F',
    category: 'cpu',
    brand: 'Intel',
    price: 145,
    socket: 'LGA1700',
    performanceTier: 3,
    powerDraw: 148,
    includesStockCooler: false,
  },

  {
    id: 'cpu-core-i5-13600kf',
    name: 'Core i5-13600KF',
    category: 'cpu',
    brand: 'Intel',
    price: 200,
    socket: 'LGA1700',
    performanceTier: 4,
    powerDraw: 181,
    includesStockCooler: false,
  },

  {
    id: 'cpu-core-i5-14600kf',
    name: 'Core i5-14600KF',
    category: 'cpu',
    brand: 'Intel',
    price: 220,
    socket: 'LGA1700',
    performanceTier: 4,
    powerDraw: 181,
    includesStockCooler: false,
  },

  {
    id: 'cpu-core-i7-12700kf',
    name: 'Core i7-12700KF',
    category: 'cpu',
    brand: 'Intel',
    price: 220,
    socket: 'LGA1700',
    performanceTier: 4,
    powerDraw: 190,
    includesStockCooler: false,
  },

  {
    id: 'cpu-core-i7-13700kf',
    name: 'Core i7-13700KF',
    category: 'cpu',
    brand: 'Intel',
    price: 280,
    socket: 'LGA1700',
    performanceTier: 5,
    powerDraw: 253,
    includesStockCooler: false,
  },

  {
    id: 'cpu-core-i7-14700kf',
    name: 'Core i7-14700KF',
    category: 'cpu',
    brand: 'Intel',
    price: 320,
    socket: 'LGA1700',
    performanceTier: 5,
    powerDraw: 253,
    includesStockCooler: false,
  },
];


/* ============================================================
 * GPUs
 * ============================================================
 */

export const gpus: GpuPart[] = [

  {
    id: 'gpu-radeon-rx-6600',
    name: 'Radeon RX 6600',
    category: 'gpu',
    brand: 'AMD',
    price: 190,
    performanceTier: 1,
    powerDraw: 132,
    lengthMm: 250,
  },

  {
    id: 'gpu-radeon-rx-6650-xt',
    name: 'Radeon RX 6650 XT',
    category: 'gpu',
    brand: 'AMD',
    price: 230,
    performanceTier: 2,
    powerDraw: 176,
    lengthMm: 280,
  },

  {
    id: 'gpu-radeon-rx-6700-xt',
    name: 'Radeon RX 6700 XT',
    category: 'gpu',
    brand: 'AMD',
    price: 260,
    performanceTier: 2,
    powerDraw: 230,
    lengthMm: 280,
  },

  {
    id: 'gpu-radeon-rx-6750-xt',
    name: 'Radeon RX 6750 XT',
    category: 'gpu',
    brand: 'AMD',
    price: 300,
    performanceTier: 3,
    powerDraw: 250,
    lengthMm: 320,
  },

  {
    id: 'gpu-radeon-rx-6800',
    name: 'Radeon RX 6800',
    category: 'gpu',
    brand: 'AMD',
    price: 330,
    performanceTier: 3,
    powerDraw: 250,
    lengthMm: 340,
  },

  {
    id: 'gpu-radeon-rx-7700-xt',
    name: 'Radeon RX 7700 XT',
    category: 'gpu',
    brand: 'AMD',
    price: 350,
    performanceTier: 3,
    powerDraw: 245,
    lengthMm: 320,
  },

  {
    id: 'gpu-radeon-rx-7800-xt',
    name: 'Radeon RX 7800 XT',
    category: 'gpu',
    brand: 'AMD',
    price: 450,
    performanceTier: 3,
    powerDraw: 263,
    lengthMm: 330,
  },

  {
    id: 'gpu-radeon-rx-7900-gre',
    name: 'Radeon RX 7900 GRE',
    category: 'gpu',
    brand: 'AMD',
    price: 520,
    performanceTier: 4,
    powerDraw: 260,
    lengthMm: 320,
  },

  {
    id: 'gpu-radeon-rx-7900-xt',
    name: 'Radeon RX 7900 XT',
    category: 'gpu',
    brand: 'AMD',
    price: 650,
    performanceTier: 4,
    powerDraw: 315,
    lengthMm: 350,
  },

  {
    id: 'gpu-radeon-rx-7900-xtx',
    name: 'Radeon RX 7900 XTX',
    category: 'gpu',
    brand: 'AMD',
    price: 850,
    performanceTier: 5,
    powerDraw: 355,
    lengthMm: 355,
  },

  {
    id: 'gpu-geforce-rtx-3050',
    name: 'GeForce RTX 3050',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 180,
    performanceTier: 1,
    powerDraw: 130,
    lengthMm: 250,
  },

  {
    id: 'gpu-geforce-rtx-3060',
    name: 'GeForce RTX 3060',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 220,
    performanceTier: 2,
    powerDraw: 170,
    lengthMm: 245,
  },

  {
    id: 'gpu-geforce-rtx-3060-ti',
    name: 'GeForce RTX 3060 Ti',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 270,
    performanceTier: 2,
    powerDraw: 200,
    lengthMm: 285,
  },

  {
    id: 'gpu-geforce-rtx-3070',
    name: 'GeForce RTX 3070',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 300,
    performanceTier: 3,
    powerDraw: 220,
    lengthMm: 300,
  },

  {
    id: 'gpu-geforce-rtx-3070-ti',
    name: 'GeForce RTX 3070 Ti',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 340,
    performanceTier: 3,
    powerDraw: 290,
    lengthMm: 310,
  },

  {
    id: 'gpu-geforce-rtx-3080',
    name: 'GeForce RTX 3080',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 400,
    performanceTier: 4,
    powerDraw: 320,
    lengthMm: 320,
  },

  {
    id: 'gpu-geforce-rtx-4060',
    name: 'GeForce RTX 4060',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 300,
    performanceTier: 1,
    powerDraw: 115,
    lengthMm: 250,
  },

  {
    id: 'gpu-geforce-rtx-4060-ti',
    name: 'GeForce RTX 4060 Ti',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 390,
    performanceTier: 2,
    powerDraw: 160,
    lengthMm: 270,
  },

  {
    id: 'gpu-geforce-rtx-4060-ti-16gb',
    name: 'GeForce RTX 4060 Ti 16GB',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 440,
    performanceTier: 2,
    powerDraw: 165,
    lengthMm: 280,
  },

  {
    id: 'gpu-geforce-rtx-4070',
    name: 'GeForce RTX 4070',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 500,
    performanceTier: 3,
    powerDraw: 200,
    lengthMm: 300,
  },

  {
    id: 'gpu-geforce-rtx-4070-super',
    name: 'GeForce RTX 4070 Super',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 580,
    performanceTier: 3,
    powerDraw: 220,
    lengthMm: 310,
  },

  {
    id: 'gpu-geforce-rtx-4070-ti-super',
    name: 'GeForce RTX 4070 Ti Super',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 750,
    performanceTier: 4,
    powerDraw: 285,
    lengthMm: 335,
  },

  {
    id: 'gpu-geforce-rtx-4080-super',
    name: 'GeForce RTX 4080 Super',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 1000,
    performanceTier: 5,
    powerDraw: 320,
    lengthMm: 340,
  },

  {
    id: 'gpu-geforce-rtx-4090',
    name: 'GeForce RTX 4090',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 1500,
    performanceTier: 5,
    powerDraw: 450,
    lengthMm: 360,
  },

  {
    id: 'gpu-geforce-rtx-5050',
    name: 'GeForce RTX 5050',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 250,
    performanceTier: 1,
    powerDraw: 130,
    lengthMm: 250,
  },

  {
    id: 'gpu-geforce-rtx-5060',
    name: 'GeForce RTX 5060',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 300,
    performanceTier: 2,
    powerDraw: 145,
    lengthMm: 260,
  },

  {
    id: 'gpu-geforce-rtx-5060-ti-8gb',
    name: 'GeForce RTX 5060 Ti 8GB',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 350,
    performanceTier: 2,
    powerDraw: 180,
    lengthMm: 280,
  },

  {
    id: 'gpu-geforce-rtx-5060-ti-16gb',
    name: 'GeForce RTX 5060 Ti 16GB',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 400,
    performanceTier: 2,
    powerDraw: 180,
    lengthMm: 280,
  },

  {
    id: 'gpu-geforce-rtx-5070',
    name: 'GeForce RTX 5070',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 550,
    performanceTier: 3,
    powerDraw: 250,
    lengthMm: 320,
  },

  {
    id: 'gpu-geforce-rtx-5070-ti',
    name: 'GeForce RTX 5070 Ti',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 750,
    performanceTier: 4,
    powerDraw: 300,
    lengthMm: 330,
  },

  {
    id: 'gpu-geforce-rtx-5080',
    name: 'GeForce RTX 5080',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 1000,
    performanceTier: 5,
    powerDraw: 360,
    lengthMm: 340,
  },

  {
    id: 'gpu-geforce-rtx-5090',
    name: 'GeForce RTX 5090',
    category: 'gpu',
    brand: 'NVIDIA',
    price: 2000,
    performanceTier: 5,
    powerDraw: 575,
    lengthMm: 360,
  },
];


/* ============================================================
 * MOTHERBOARDS
 * ============================================================
 */

export const motherboards: MotherboardPart[] = [

  // ---------------- AM4 ----------------

  {
    id: 'mb-a520m',
    name: 'A520M Motherboard',
    category: 'motherboard',
    brand: 'ASUS',
    price: 65,
    socket: 'AM4',
    chipset: 'A520',
    memoryType: 'DDR4',
    formFactor: 'Micro-ATX',
    maxMemoryGb: 64,
    m2Slots: 1,
  },

  {
    id: 'mb-b450m',
    name: 'B450M Motherboard',
    category: 'motherboard',
    brand: 'MSI',
    price: 75,
    socket: 'AM4',
    chipset: 'B450',
    memoryType: 'DDR4',
    formFactor: 'Micro-ATX',
    maxMemoryGb: 128,
    m2Slots: 1,
  },

  {
    id: 'mb-b550m',
    name: 'B550M Motherboard',
    category: 'motherboard',
    brand: 'MSI',
    price: 90,
    socket: 'AM4',
    chipset: 'B550',
    memoryType: 'DDR4',
    formFactor: 'Micro-ATX',
    maxMemoryGb: 128,
    m2Slots: 2,
  },

  {
    id: 'mb-b550',
    name: 'B550 Motherboard',
    category: 'motherboard',
    brand: 'Gigabyte',
    price: 110,
    socket: 'AM4',
    chipset: 'B550',
    memoryType: 'DDR4',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 2,
  },

  {
    id: 'mb-b550-aorus-elite-ax-v2',
    name: 'B550 AORUS Elite AX V2',
    category: 'motherboard',
    brand: 'Gigabyte',
    price: 140,
    socket: 'AM4',
    chipset: 'B550',
    memoryType: 'DDR4',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 2,
  },

  {
    id: 'mb-x570',
    name: 'X570 Motherboard',
    category: 'motherboard',
    brand: 'MSI',
    price: 150,
    socket: 'AM4',
    chipset: 'X570',
    memoryType: 'DDR4',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 2,
  },


  // ---------------- AM5 ----------------

  {
    id: 'mb-a620m',
    name: 'A620M Motherboard',
    category: 'motherboard',
    brand: 'ASRock',
    price: 80,
    socket: 'AM5',
    chipset: 'A620',
    memoryType: 'DDR5',
    formFactor: 'Micro-ATX',
    maxMemoryGb: 96,
    m2Slots: 1,
  },

  {
    id: 'mb-b650m',
    name: 'B650M Motherboard',
    category: 'motherboard',
    brand: 'MSI',
    price: 110,
    socket: 'AM5',
    chipset: 'B650',
    memoryType: 'DDR5',
    formFactor: 'Micro-ATX',
    maxMemoryGb: 128,
    m2Slots: 2,
  },

  {
    id: 'mb-b650',
    name: 'B650 Motherboard',
    category: 'motherboard',
    brand: 'Gigabyte',
    price: 140,
    socket: 'AM5',
    chipset: 'B650',
    memoryType: 'DDR5',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 3,
  },

  {
    id: 'mb-b840m',
    name: 'B840M Motherboard',
    category: 'motherboard',
    brand: 'ASRock',
    price: 120,
    socket: 'AM5',
    chipset: 'B840',
    memoryType: 'DDR5',
    formFactor: 'Micro-ATX',
    maxMemoryGb: 128,
    m2Slots: 2,
  },

  {
    id: 'mb-b850',
    name: 'B850 Motherboard',
    category: 'motherboard',
    brand: 'MSI',
    price: 160,
    socket: 'AM5',
    chipset: 'B850',
    memoryType: 'DDR5',
    formFactor: 'ATX',
    maxMemoryGb: 256,
    m2Slots: 3,
  },

  {
    id: 'mb-x670',
    name: 'X670 Motherboard',
    category: 'motherboard',
    brand: 'ASUS',
    price: 190,
    socket: 'AM5',
    chipset: 'X670',
    memoryType: 'DDR5',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 4,
  },

  {
    id: 'mb-x870',
    name: 'X870 Motherboard',
    category: 'motherboard',
    brand: 'Gigabyte',
    price: 220,
    socket: 'AM5',
    chipset: 'X870',
    memoryType: 'DDR5',
    formFactor: 'ATX',
    maxMemoryGb: 256,
    m2Slots: 4,
  },


  // ---------------- LGA1700 DDR4 ----------------

  {
    id: 'mb-h610-ddr4',
    name: 'H610 DDR4 Motherboard',
    category: 'motherboard',
    brand: 'ASUS',
    price: 65,
    socket: 'LGA1700',
    chipset: 'H610',
    memoryType: 'DDR4',
    formFactor: 'Micro-ATX',
    maxMemoryGb: 64,
    m2Slots: 1,
  },

  {
    id: 'mb-b660-ddr4',
    name: 'B660 DDR4 Motherboard',
    category: 'motherboard',
    brand: 'MSI',
    price: 90,
    socket: 'LGA1700',
    chipset: 'B660',
    memoryType: 'DDR4',
    formFactor: 'Micro-ATX',
    maxMemoryGb: 128,
    m2Slots: 2,
  },

  {
    id: 'mb-b760-ddr4',
    name: 'B760 DDR4 Motherboard',
    category: 'motherboard',
    brand: 'Gigabyte',
    price: 105,
    socket: 'LGA1700',
    chipset: 'B760',
    memoryType: 'DDR4',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 2,
  },

  {
    id: 'mb-z690-ddr4',
    name: 'Z690 DDR4 Motherboard',
    category: 'motherboard',
    brand: 'MSI',
    price: 140,
    socket: 'LGA1700',
    chipset: 'Z690',
    memoryType: 'DDR4',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 3,
  },

  {
    id: 'mb-z790-ddr4',
    name: 'Z790 DDR4 Motherboard',
    category: 'motherboard',
    brand: 'ASUS',
    price: 175,
    socket: 'LGA1700',
    chipset: 'Z790',
    memoryType: 'DDR4',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 4,
  },


  // ---------------- LGA1700 DDR5 ----------------

  {
    id: 'mb-h610-ddr5',
    name: 'H610 DDR5 Motherboard',
    category: 'motherboard',
    brand: 'ASRock',
    price: 75,
    socket: 'LGA1700',
    chipset: 'H610',
    memoryType: 'DDR5',
    formFactor: 'Micro-ATX',
    maxMemoryGb: 96,
    m2Slots: 1,
  },

  {
    id: 'mb-b660-ddr5',
    name: 'B660 DDR5 Motherboard',
    category: 'motherboard',
    brand: 'ASUS',
    price: 105,
    socket: 'LGA1700',
    chipset: 'B660',
    memoryType: 'DDR5',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 2,
  },

  {
    id: 'mb-b760-ddr5',
    name: 'B760 DDR5 Motherboard',
    category: 'motherboard',
    brand: 'MSI',
    price: 120,
    socket: 'LGA1700',
    chipset: 'B760',
    memoryType: 'DDR5',
    formFactor: 'ATX',
    maxMemoryGb: 192,
    m2Slots: 3,
  },

  {
    id: 'mb-z690-ddr5',
    name: 'Z690 DDR5 Motherboard',
    category: 'motherboard',
    brand: 'Gigabyte',
    price: 150,
    socket: 'LGA1700',
    chipset: 'Z690',
    memoryType: 'DDR5',
    formFactor: 'ATX',
    maxMemoryGb: 128,
    m2Slots: 4,
  },

  {
    id: 'mb-z790-ddr5',
    name: 'Z790 DDR5 Motherboard',
    category: 'motherboard',
    brand: 'MSI',
    price: 180,
    socket: 'LGA1700',
    chipset: 'Z790',
    memoryType: 'DDR5',
    formFactor: 'ATX',
    maxMemoryGb: 192,
    m2Slots: 4,
  },
];


/* ============================================================
 * RAM
 * ============================================================
 *
 * Gaming targets:
 *
 * 16GB = budget
 * 32GB = preferred
 *
 * 64GB is intentionally omitted from the normal catalog so
 * the recommender cannot casually waste budget on it.
 */

export const rams: RamPart[] = [

  // ---------------- DDR4 ----------------

  {
    id: 'ram-ddr4-16-3000',
    name: '16GB DDR4-3000 Kit',
    category: 'ram',
    brand: 'TEAMGROUP',
    price: 28,
    memoryType: 'DDR4',
    capacityGb: 16,
    speedMhz: 3000,
  },

  {
    id: 'ram-ddr4-16-3200',
    name: '16GB DDR4-3200 Kit',
    category: 'ram',
    brand: 'TEAMGROUP',
    price: 30,
    memoryType: 'DDR4',
    capacityGb: 16,
    speedMhz: 3200,
  },

  {
    id: 'ram-ddr4-16-3600',
    name: '16GB DDR4-3600 Kit',
    category: 'ram',
    brand: 'TEAMGROUP',
    price: 35,
    memoryType: 'DDR4',
    capacityGb: 16,
    speedMhz: 3600,
  },

  {
    id: 'ram-ddr4-32-3000',
    name: '32GB DDR4-3000 Kit',
    category: 'ram',
    brand: 'TEAMGROUP',
    price: 50,
    memoryType: 'DDR4',
    capacityGb: 32,
    speedMhz: 3000,
  },

  {
    id: 'ram-ddr4-32-3200',
    name: '32GB DDR4-3200 Kit',
    category: 'ram',
    brand: 'TEAMGROUP',
    price: 55,
    memoryType: 'DDR4',
    capacityGb: 32,
    speedMhz: 3200,
  },

  {
    id: 'ram-ddr4-32-3600',
    name: '32GB DDR4-3600 Kit',
    category: 'ram',
    brand: 'G.SKILL',
    price: 65,
    memoryType: 'DDR4',
    capacityGb: 32,
    speedMhz: 3600,
  },


  // ---------------- DDR5 ----------------

  {
    id: 'ram-ddr5-16-5600',
    name: '16GB DDR5-5600 Kit',
    category: 'ram',
    brand: 'TEAMGROUP',
    price: 45,
    memoryType: 'DDR5',
    capacityGb: 16,
    speedMhz: 5600,
  },

  {
    id: 'ram-ddr5-16-6000',
    name: '16GB DDR5-6000 Kit',
    category: 'ram',
    brand: 'TEAMGROUP',
    price: 50,
    memoryType: 'DDR5',
    capacityGb: 16,
    speedMhz: 6000,
  },

  {
    id: 'ram-ddr5-32-5600',
    name: '32GB DDR5-5600 Kit',
    category: 'ram',
    brand: 'TEAMGROUP',
    price: 75,
    memoryType: 'DDR5',
    capacityGb: 32,
    speedMhz: 5600,
  },

  {
    id: 'ram-ddr5-32-6000',
    name: '32GB DDR5-6000 Kit',
    category: 'ram',
    brand: 'G.SKILL',
    price: 85,
    memoryType: 'DDR5',
    capacityGb: 32,
    speedMhz: 6000,
  },

  {
    id: 'ram-ddr5-32-6000-rgb',
    name: '32GB DDR5-6000 RGB Kit',
    category: 'ram',
    brand: 'G.SKILL',
    price: 95,
    memoryType: 'DDR5',
    capacityGb: 32,
    speedMhz: 6000,
  },
];


/* ============================================================
 * STORAGE
 * ============================================================
 *
 * Gaming targets:
 *
 * 512GB = minimum / low-budget
 * 1TB   = normal target
 * 2TB   = preferred upgrade
 * 4TB   = enthusiast / specialized
 */

export const storage: StoragePart[] = [

  {
    id: 'storage-500gb-sata',
    name: '500GB SATA SSD',
    category: 'storage',
    brand: 'Crucial',
    price: 30,
    capacityGb: 500,
    interface: 'SATA',
  },

  {
    id: 'storage-512gb-gen3',
    name: '512GB Gen3 NVMe SSD',
    category: 'storage',
    brand: 'TEAMGROUP',
    price: 35,
    capacityGb: 512,
    interface: 'NVMe Gen3',
  },

  {
    id: 'storage-1tb-gen3',
    name: '1TB Gen3 NVMe SSD',
    category: 'storage',
    brand: 'TEAMGROUP',
    price: 45,
    capacityGb: 1000,
    interface: 'NVMe Gen3',
  },

  {
    id: 'storage-1tb-gen4',
    name: '1TB Gen4 NVMe SSD',
    category: 'storage',
    brand: 'WD',
    price: 60,
    capacityGb: 1000,
    interface: 'NVMe Gen4',
  },

  {
    id: 'storage-1tb-gen4-budget',
    name: '1TB Gen4 Budget NVMe SSD',
    category: 'storage',
    brand: 'Inland',
    price: 55,
    capacityGb: 1000,
    interface: 'NVMe Gen4',
  },

  {
    id: 'storage-2tb-gen4',
    name: '2TB Gen4 NVMe SSD',
    category: 'storage',
    brand: 'TEAMGROUP',
    price: 100,
    capacityGb: 2000,
    interface: 'NVMe Gen4',
  },

  {
    id: 'storage-2tb-gen4-performance',
    name: '2TB Gen4 Performance NVMe SSD',
    category: 'storage',
    brand: 'WD',
    price: 130,
    capacityGb: 2000,
    interface: 'NVMe Gen4',
  },

  {
    id: 'storage-4tb-gen4',
    name: '4TB Gen4 NVMe SSD',
    category: 'storage',
    brand: 'Crucial',
    price: 220,
    capacityGb: 4000,
    interface: 'NVMe Gen4',
  },

  {
    id: 'storage-2tb-gen5',
    name: '2TB Gen5 NVMe SSD',
    category: 'storage',
    brand: 'Crucial',
    price: 180,
    capacityGb: 2000,
    interface: 'NVMe Gen5',
  },
];


/* ============================================================
 * PSUs
 * ============================================================
 *
 * Available wattage range:
 *
 * 550W
 * 650W
 * 750W
 * 850W
 * 1000W
 * 1200W
 * 1300W
 *
 * IMPORTANT:
 * The recommender MUST select a PSU with at least 30%
 * headroom above estimated system power.
 *
 * Example:
 *
 * Estimated system power = 500W
 * Required minimum = 500 x 1.30 = 650W
 *
 * Therefore 650W is the minimum acceptable PSU.
 * ============================================================
 */

export const psus: PsuPart[] = [

  {
    id: 'psu-550w-bronze',
    name: '550W Bronze PSU',
    category: 'psu',
    brand: 'Thermaltake',
    price: 50,
    wattage: 550,
    efficiency: 'Bronze',
    modular: false,
  },

  {
    id: 'psu-650w-bronze',
    name: '650W Bronze PSU',
    category: 'psu',
    brand: 'MSI',
    price: 60,
    wattage: 650,
    efficiency: 'Bronze',
    modular: false,
  },

  {
    id: 'psu-650w-gold',
    name: '650W Gold Modular',
    category: 'psu',
    brand: 'MSI',
    price: 80,
    wattage: 650,
    efficiency: 'Gold',
    modular: true,
  },

  {
    id: 'psu-750w-gold',
    name: '750W Gold Modular',
    category: 'psu',
    brand: 'MSI',
    price: 90,
    wattage: 750,
    efficiency: 'Gold',
    modular: true,
  },

  {
    id: 'psu-850w-gold',
    name: '850W Gold Modular',
    category: 'psu',
    brand: 'Corsair',
    price: 110,
    wattage: 850,
    efficiency: 'Gold',
    modular: true,
  },

  {
    id: 'psu-1000w-gold',
    name: '1000W Gold Modular',
    category: 'psu',
    brand: 'MSI',
    price: 140,
    wattage: 1000,
    efficiency: 'Gold',
    modular: true,
  },

  {
    id: 'psu-1200w-gold',
    name: '1200W Gold Modular',
    category: 'psu',
    brand: 'Corsair',
    price: 180,
    wattage: 1200,
    efficiency: 'Gold',
    modular: true,
  },

  {
    id: 'psu-1300w-gold',
    name: '1300W Gold Modular',
    category: 'psu',
    brand: 'Corsair',
    price: 210,
    wattage: 1300,
    efficiency: 'Gold',
    modular: true,
  },
];


/* ============================================================
 * CASES
 * ============================================================
 */

export const cases: CasePart[] = [

  {
    id: 'case-okinos-budget',
    name: 'Okinos Budget Airflow',
    category: 'case',
    brand: 'Okinos',
    price: 40,
    size: 'Balanced',
    appearance: 'A little drama',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 320,
    maxCoolerHeightMm: 160,
  },

  {
    id: 'case-okinos-argb',
    name: 'Okinos ARGB Airflow',
    category: 'case',
    brand: 'Okinos',
    price: 50,
    size: 'Balanced',
    appearance: 'Showpiece',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 340,
    maxCoolerHeightMm: 165,
  },

  {
    id: 'case-sama-budget',
    name: 'SAMA Budget Airflow',
    category: 'case',
    brand: 'SAMA',
    price: 40,
    size: 'Balanced',
    appearance: 'A little drama',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 330,
    maxCoolerHeightMm: 165,
  },

  {
    id: 'case-sama-argb',
    name: 'SAMA ARGB Tempered Glass',
    category: 'case',
    brand: 'SAMA',
    price: 55,
    size: 'Balanced',
    appearance: 'Showpiece',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 350,
    maxCoolerHeightMm: 170,
  },

  {
    id: 'case-diypc-budget',
    name: 'DIYPC Budget Airflow',
    category: 'case',
    brand: 'DIYPC',
    price: 35,
    size: 'Compact',
    appearance: 'A little drama',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 300,
    maxCoolerHeightMm: 158,
  },

  {
    id: 'case-diypc-argb',
    name: 'DIYPC ARGB Gaming Case',
    category: 'case',
    brand: 'DIYPC',
    price: 50,
    size: 'Balanced',
    appearance: 'Showpiece',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 330,
    maxCoolerHeightMm: 165,
  },

  {
    id: 'case-montech-air-100',
    name: 'Montech AIR 100',
    category: 'case',
    brand: 'Montech',
    price: 50,
    size: 'Compact',
    appearance: 'A little drama',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
    ],
    maxGpuLengthMm: 330,
    maxCoolerHeightMm: 161,
  },

  {
    id: 'case-montech-air-903',
    name: 'Montech AIR 903',
    category: 'case',
    brand: 'Montech',
    price: 70,
    size: 'Roomy',
    appearance: 'A little drama',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 400,
    maxCoolerHeightMm: 180,
  },

  {
    id: 'case-montech-x3-mesh',
    name: 'Montech X3 Mesh',
    category: 'case',
    brand: 'Montech',
    price: 60,
    size: 'Balanced',
    appearance: 'Showpiece',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 305,
    maxCoolerHeightMm: 160,
  },

  {
    id: 'case-4000d-airflow',
    name: '4000D Airflow',
    category: 'case',
    brand: 'Corsair',
    price: 90,
    size: 'Balanced',
    appearance: 'Understated',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 360,
    maxCoolerHeightMm: 170,
  },

  {
    id: 'case-nzxt-h5-flow',
    name: 'H5 Flow',
    category: 'case',
    brand: 'NZXT',
    price: 90,
    size: 'Balanced',
    appearance: 'Understated',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 365,
    maxCoolerHeightMm: 165,
  },

  {
    id: 'case-fractal-pop-air',
    name: 'Pop Air',
    category: 'case',
    brand: 'Fractal',
    price: 80,
    size: 'Balanced',
    appearance: 'Understated',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 405,
    maxCoolerHeightMm: 170,
  },

  {
    id: 'case-montech-king-95',
    name: 'Montech KING 95',
    category: 'case',
    brand: 'Montech',
    price: 130,
    size: 'Roomy',
    appearance: 'Showpiece',
    supportedFormFactors: [
      'Mini-ITX',
      'Micro-ATX',
      'ATX',
    ],
    maxGpuLengthMm: 420,
    maxCoolerHeightMm: 175,
  },
];


/* ============================================================
 * COOLERS
 * ============================================================
 *
 * AIR:
 * - Budget tower coolers
 *
 * LIQUID:
 * - 240mm
 * - 280mm
 * - 360mm
 *
 * 120mm AIOs are intentionally NOT included.
 * ============================================================
 */

export const coolers: CoolerPart[] = [

  // ---------------- STOCK ----------------

  {
    id: 'cooler-amd-wraith-stealth',
    name: 'AMD Wraith Stealth',
    category: 'cooler',
    brand: 'AMD',
    price: 0,
    type: 'Air',
    supportedSockets: ['AM4'],
    heightMm: 54,
    thermalCapacityW: 80,
    noise: 'Quiet',
  },


  // ---------------- AIR ----------------

  {
    id: 'cooler-thermalright-assassin-x',
    name: 'Thermalright Assassin X 120',
    category: 'cooler',
    brand: 'Thermalright',
    price: 20,
    type: 'Air',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 148,
    thermalCapacityW: 150,
    noise: 'Quiet',
  },

  {
    id: 'cooler-thermalright-peerless-assassin',
    name: 'Thermalright Peerless Assassin 120',
    category: 'cooler',
    brand: 'Thermalright',
    price: 35,
    type: 'Air',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 157,
    thermalCapacityW: 220,
    noise: 'Quiet',
  },

  {
    id: 'cooler-thermalright-phantom-spirit',
    name: 'Thermalright Phantom Spirit 120',
    category: 'cooler',
    brand: 'Thermalright',
    price: 40,
    type: 'Air',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 157,
    thermalCapacityW: 230,
    noise: 'Quiet',
  },

  {
    id: 'cooler-ocypus-iota',
    name: 'Ocypus Iota',
    category: 'cooler',
    brand: 'Ocypus',
    price: 25,
    type: 'Air',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 153,
    thermalCapacityW: 180,
    noise: 'Quiet',
  },

  {
    id: 'cooler-msi-bm120',
    name: 'MSI Budget Tower Cooler',
    category: 'cooler',
    brand: 'MSI',
    price: 25,
    type: 'Air',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 155,
    thermalCapacityW: 180,
    noise: 'Quiet',
  },

  {
    id: 'cooler-deepcool-ak400',
    name: 'DeepCool AK400',
    category: 'cooler',
    brand: 'DeepCool',
    price: 30,
    type: 'Air',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 155,
    thermalCapacityW: 180,
    noise: 'Quiet',
  },


  // ---------------- 240mm AIO ----------------

  {
    id: 'cooler-thermalright-aqua-elite-240',
    name: 'Thermalright Aqua Elite 240',
    category: 'cooler',
    brand: 'Thermalright',
    price: 55,
    type: 'Liquid',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 0,
    thermalCapacityW: 220,
    noise: 'Quiet',
  },

  {
    id: 'cooler-ocypus-aio-240',
    name: 'Ocypus 240 AIO',
    category: 'cooler',
    brand: 'Ocypus',
    price: 55,
    type: 'Liquid',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 0,
    thermalCapacityW: 230,
    noise: 'Quiet',
  },

  {
    id: 'cooler-msi-mag-240',
    name: 'MSI MAG 240 AIO',
    category: 'cooler',
    brand: 'MSI',
    price: 75,
    type: 'Liquid',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 0,
    thermalCapacityW: 250,
    noise: 'Quiet',
  },


  // ---------------- 280mm AIO ----------------

  {
    id: 'cooler-thermalright-aqua-elite-280',
    name: 'Thermalright Aqua Elite 280',
    category: 'cooler',
    brand: 'Thermalright',
    price: 65,
    type: 'Liquid',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 0,
    thermalCapacityW: 260,
    noise: 'Quiet',
  },


  // ---------------- 360mm AIO ----------------

  {
    id: 'cooler-msi-mag-360',
    name: 'MSI MAG 360 AIO',
    category: 'cooler',
    brand: 'MSI',
    price: 90,
    type: 'Liquid',
    supportedSockets: [
      'AM4',
      'AM5',
      'LGA1700',
    ],
    heightMm: 0,
    thermalCapacityW: 300,
    noise: 'Quiet',
  },
];


/* ============================================================
 * ALL PARTS
 * ============================================================
 *
 * THIS EXPORT IS CRITICAL.
 *
 * build-recommender.ts imports:
 *
 * import { allParts } from '@/data/parts';
 *
 * Do not rename or remove it.
 * ============================================================
 */

export const allParts: Part[] = [
  ...cpus,
  ...gpus,
  ...motherboards,
  ...rams,
  ...storage,
  ...psus,
  ...cases,
  ...coolers,
];