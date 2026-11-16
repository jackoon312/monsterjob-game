const OfficeUpgrade = require('../models/OfficeUpgrade');
const { getTierConfig } = require('../config/officeTiers');

// Finds the player's office, creating a default tier-1 one if it doesn't exist yet.
// Shared by officeController AND any other controller that needs to check
// office limits (creatureCapacity, jobSlots) - e.g. creatureController, assignmentController.
const getOrCreateOffice = async (userId) => {
  let office = await OfficeUpgrade.findOne({ userId });
  if (!office) {
    const tier1 = getTierConfig(1);
    office = await OfficeUpgrade.create({
      userId,
      tier: 1,
      creatureCapacity: tier1.creatureCapacity,
      jobSlots: tier1.jobSlots,
      equipmentSlots: tier1.equipmentSlots,
      unlockedFeatures: tier1.unlockedFeatures
    });
  }
  return office;
};

// If an upgrade is in progress and its end time has passed, apply it:
// bump the tier and its stats, clear the in-progress flags.
const finalizeIfReady = async (office) => {
  if (!office.upgradeInProgress) return office;
  if (new Date() < office.upgradeEndTime) return office;

  const newTierConfig = getTierConfig(office.upgradeTargetTier);
  office.tier = newTierConfig.tier;
  office.creatureCapacity = newTierConfig.creatureCapacity;
  office.jobSlots = newTierConfig.jobSlots;
  office.equipmentSlots = newTierConfig.equipmentSlots;
  office.unlockedFeatures = [
    ...new Set([...office.unlockedFeatures, ...newTierConfig.unlockedFeatures])
  ];
  office.upgradedAt = new Date();
  office.upgradeInProgress = false;
  office.upgradeStartTime = null;
  office.upgradeEndTime = null;
  office.upgradeTargetTier = null;
  office.upgradeProgress = 0;

  await office.save();
  return office;
};

module.exports = { getOrCreateOffice, finalizeIfReady };
