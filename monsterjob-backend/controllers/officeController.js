const User = require('../models/User');
const { getTierConfig, OFFICE_TIERS } = require('../config/officeTiers');
const { getOrCreateOffice, finalizeIfReady } = require('../utils/officeHelpers');

const MAX_TIER = OFFICE_TIERS.length;

// @route GET /api/office
const getOffice = async (req, res) => {
  try {
    let office = await getOrCreateOffice(req.user._id);
    office = await finalizeIfReady(office);
    res.status(200).json({ office });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching office', error: error.message });
  }
};

// @route GET /api/office/status
// Read-only progress check - does NOT finalize, just reports where things stand
const getOfficeStatus = async (req, res) => {
  try {
    const office = await getOrCreateOffice(req.user._id);

    if (!office.upgradeInProgress) {
      return res.status(200).json({
        upgradeInProgress: false,
        tier: office.tier,
        message: 'No upgrade currently in progress'
      });
    }

    const now = new Date();
    const totalMs = office.upgradeEndTime - office.upgradeStartTime;
    const elapsedMs = Math.min(now - office.upgradeStartTime, totalMs);
    const progressPercent = Math.round((elapsedMs / totalMs) * 100);
    const secondsRemaining = Math.max(Math.ceil((office.upgradeEndTime - now) / 1000), 0);

    res.status(200).json({
      upgradeInProgress: true,
      currentTier: office.tier,
      targetTier: office.upgradeTargetTier,
      progressPercent,
      secondsRemaining,
      readyToFinalize: secondsRemaining === 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching office status', error: error.message });
  }
};

// @route PUT /api/office/upgrade
// Dual-purpose, matching the single endpoint in the spec:
// - If an upgrade is in progress and its time has elapsed, this finalizes it.
// - If an upgrade is in progress but not finished, returns time remaining.
// - If no upgrade is in progress, this starts one to the next tier (charges money).
const upgradeOffice = async (req, res) => {
  try {
    let office = await getOrCreateOffice(req.user._id);

    if (office.upgradeInProgress) {
      const now = new Date();
      if (now >= office.upgradeEndTime) {
        office = await finalizeIfReady(office);
        return res.status(200).json({ message: 'Upgrade finalized', office });
      }
      return res.status(400).json({
        message: 'Upgrade already in progress',
        secondsRemaining: Math.ceil((office.upgradeEndTime - now) / 1000)
      });
    }

    if (office.tier >= MAX_TIER) {
      return res.status(400).json({ message: 'Office is already at the maximum tier' });
    }

    const nextTier = office.tier + 1;
    const nextTierConfig = getTierConfig(nextTier);

    const user = await User.findById(req.user._id);
    if (user.totalMoney < nextTierConfig.upgradeCost) {
      return res.status(400).json({
        message: 'Not enough money for this upgrade',
        required: nextTierConfig.upgradeCost,
        current: user.totalMoney
      });
    }

    user.totalMoney -= nextTierConfig.upgradeCost;
    await user.save();

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + nextTierConfig.timeRequiredHours * 60 * 60 * 1000);

    office.upgradeInProgress = true;
    office.upgradeStartTime = startTime;
    office.upgradeEndTime = endTime;
    office.upgradeTargetTier = nextTier;
    office.money = nextTierConfig.upgradeCost;
    office.timeRequiredHours = nextTierConfig.timeRequiredHours;
    office.upgradeProgress = 0;
    await office.save();

    res.status(200).json({ message: 'Upgrade started', office });
  } catch (error) {
    res.status(500).json({ message: 'Error upgrading office', error: error.message });
  }
};

// @route DELETE /api/office/upgrade
// Cancels an in-progress upgrade. Money already spent is NOT refunded
// (matches the "real commitment" pattern used for job assignments).
const cancelUpgrade = async (req, res) => {
  try {
    const office = await getOrCreateOffice(req.user._id);

    if (!office.upgradeInProgress) {
      return res.status(400).json({ message: 'No upgrade is currently in progress' });
    }

    office.upgradeInProgress = false;
    office.upgradeStartTime = null;
    office.upgradeEndTime = null;
    office.upgradeTargetTier = null;
    office.upgradeProgress = 0;
    await office.save();

    res.status(200).json({ message: 'Upgrade cancelled, tier unchanged', office });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling upgrade', error: error.message });
  }
};

module.exports = { getOffice, getOfficeStatus, upgradeOffice, cancelUpgrade };
