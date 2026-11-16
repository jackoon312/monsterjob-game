// Static tier progression table for the Office Upgrade system.
// capacity/slots scale linearly from tier 1 -> 20, upgradeCost grows exponentially.
// upgradeCost is what it costs to upgrade INTO that tier (tier 1 is the free starting tier).
const OFFICE_TIERS = [
  { tier: 1, creatureCapacity: 1, jobSlots: 1, equipmentSlots: 3, upgradeCost: 0, timeRequiredHours: 1, unlockedFeatures: [] },
  { tier: 2, creatureCapacity: 4, jobSlots: 2, equipmentSlots: 3, upgradeCost: 100, timeRequiredHours: 2, unlockedFeatures: [] },
  { tier: 3, creatureCapacity: 6, jobSlots: 3, equipmentSlots: 3, upgradeCost: 140, timeRequiredHours: 3, unlockedFeatures: [] },
  { tier: 4, creatureCapacity: 9, jobSlots: 4, equipmentSlots: 3, upgradeCost: 196, timeRequiredHours: 5, unlockedFeatures: [] },
  { tier: 5, creatureCapacity: 11, jobSlots: 5, equipmentSlots: 3, upgradeCost: 274, timeRequiredHours: 6, unlockedFeatures: ['Equipment System'] },
  { tier: 6, creatureCapacity: 14, jobSlots: 6, equipmentSlots: 3, upgradeCost: 384, timeRequiredHours: 7, unlockedFeatures: [] },
  { tier: 7, creatureCapacity: 16, jobSlots: 7, equipmentSlots: 3, upgradeCost: 538, timeRequiredHours: 8, unlockedFeatures: [] },
  { tier: 8, creatureCapacity: 19, jobSlots: 8, equipmentSlots: 3, upgradeCost: 753, timeRequiredHours: 9, unlockedFeatures: [] },
  { tier: 9, creatureCapacity: 22, jobSlots: 9, equipmentSlots: 3, upgradeCost: 1054, timeRequiredHours: 11, unlockedFeatures: [] },
  { tier: 10, creatureCapacity: 24, jobSlots: 10, equipmentSlots: 3, upgradeCost: 1476, timeRequiredHours: 12, unlockedFeatures: ['Crafting System'] },
  { tier: 11, creatureCapacity: 27, jobSlots: 11, equipmentSlots: 3, upgradeCost: 2066, timeRequiredHours: 13, unlockedFeatures: [] },
  { tier: 12, creatureCapacity: 29, jobSlots: 12, equipmentSlots: 3, upgradeCost: 2893, timeRequiredHours: 14, unlockedFeatures: [] },
  { tier: 13, creatureCapacity: 32, jobSlots: 13, equipmentSlots: 3, upgradeCost: 4050, timeRequiredHours: 16, unlockedFeatures: [] },
  { tier: 14, creatureCapacity: 35, jobSlots: 14, equipmentSlots: 3, upgradeCost: 5669, timeRequiredHours: 17, unlockedFeatures: [] },
  { tier: 15, creatureCapacity: 37, jobSlots: 15, equipmentSlots: 3, upgradeCost: 7937, timeRequiredHours: 18, unlockedFeatures: ['Boss Battles'] },
  { tier: 16, creatureCapacity: 40, jobSlots: 16, equipmentSlots: 3, upgradeCost: 11112, timeRequiredHours: 19, unlockedFeatures: [] },
  { tier: 17, creatureCapacity: 42, jobSlots: 17, equipmentSlots: 3, upgradeCost: 15557, timeRequiredHours: 20, unlockedFeatures: [] },
  { tier: 18, creatureCapacity: 45, jobSlots: 18, equipmentSlots: 3, upgradeCost: 21780, timeRequiredHours: 22, unlockedFeatures: [] },
  { tier: 19, creatureCapacity: 47, jobSlots: 19, equipmentSlots: 3, upgradeCost: 30491, timeRequiredHours: 23, unlockedFeatures: [] },
  { tier: 20, creatureCapacity: 50, jobSlots: 20, equipmentSlots: 3, upgradeCost: 42688, timeRequiredHours: 24, unlockedFeatures: ['Prestige System'] }
];

const getTierConfig = (tier) => OFFICE_TIERS.find((t) => t.tier === tier);

module.exports = { OFFICE_TIERS, getTierConfig };
