// Run with: node seed/seedSpecies.js
// Populates all 24 creature species from the original design doc's archetype
// list (Tier 1 Common through Tier 5 Legendary). Upserts by name, so it's
// safe to re-run any time you tweak stats/descriptions/sprite paths.

require('dotenv').config();
const mongoose = require('mongoose');
const CreatureSpecies = require('../models/CreatureSpecies');

const allSpecies = [
  {
    name: "Flamicore",
    description: "A small fox-like creature wreathed in gentle flame, found near volcanic vents.",
    type: "Fire",
    rarity: "Common",
    baseStats: { health: 38, strength: 12, intelligence: 9, stamina: 12, charisma: 9, speed: 11 },
    statGrowthPerLevel: { health: 4, strength: 1.5, intelligence: 1.0, stamina: 1.3, charisma: 1.0, speed: 1.2 },
    spriteAssetPath: "/assets/creatures/flamicore.png",
    animationFrames: 6,
    personality: "Playful and mischievous",
    obtainMethod: "Catch"
  },
  {
    name: "Aquorb",
    description: "A translucent jellyfish-like creature that drifts through tide pools.",
    type: "Water",
    rarity: "Common",
    baseStats: { health: 38, strength: 10, intelligence: 11, stamina: 12, charisma: 9, speed: 11 },
    statGrowthPerLevel: { health: 4, strength: 1.2, intelligence: 1.25, stamina: 1.3, charisma: 1.0, speed: 1.2 },
    spriteAssetPath: "/assets/creatures/aquorb.png",
    animationFrames: 6,
    personality: "Calm and observant",
    obtainMethod: "Catch"
  },
  {
    name: "Terramole",
    description: "A burrowing mole-like creature with a stone-plated back.",
    type: "Rock",
    rarity: "Common",
    baseStats: { health: 38, strength: 12, intelligence: 9, stamina: 12, charisma: 9, speed: 11 },
    statGrowthPerLevel: { health: 4, strength: 1.5, intelligence: 1.0, stamina: 1.3, charisma: 1.0, speed: 1.2 },
    spriteAssetPath: "/assets/creatures/terramole.png",
    animationFrames: 6,
    personality: "Stubborn but loyal",
    obtainMethod: "Catch"
  },
  {
    name: "Voltix",
    description: "An energetic rabbit-like creature crackling with static electricity.",
    type: "Electric",
    rarity: "Common",
    baseStats: { health: 38, strength: 10, intelligence: 9, stamina: 12, charisma: 9, speed: 14 },
    statGrowthPerLevel: { health: 4, strength: 1.2, intelligence: 1.0, stamina: 1.3, charisma: 1.0, speed: 1.5 },
    spriteAssetPath: "/assets/creatures/voltix.png",
    animationFrames: 6,
    personality: "Energetic and impatient",
    obtainMethod: "Catch"
  },
  {
    name: "Sylphant",
    description: "A gentle creature with leafy fronds growing along its back.",
    type: "Nature",
    rarity: "Common",
    baseStats: { health: 38, strength: 10, intelligence: 9, stamina: 15, charisma: 9, speed: 11 },
    statGrowthPerLevel: { health: 4, strength: 1.2, intelligence: 1.0, stamina: 1.62, charisma: 1.0, speed: 1.2 },
    spriteAssetPath: "/assets/creatures/sylphant.png",
    animationFrames: 6,
    personality: "Nurturing and patient",
    obtainMethod: "Catch"
  },
  {
    name: "Stonehide",
    description: "A slow-moving turtle-like creature with a cracked granite shell.",
    type: "Rock",
    rarity: "Common",
    baseStats: { health: 48, strength: 10, intelligence: 9, stamina: 12, charisma: 9, speed: 11 },
    statGrowthPerLevel: { health: 5.0, strength: 1.2, intelligence: 1.0, stamina: 1.3, charisma: 1.0, speed: 1.2 },
    spriteAssetPath: "/assets/creatures/stonehide.png",
    animationFrames: 6,
    personality: "Steady and unshakeable",
    obtainMethod: "Catch"
  },
  {
    name: "Infernodrake",
    description: "A small dragon-like creature with smoldering scales.",
    type: "Fire",
    rarity: "Uncommon",
    baseStats: { health: 52, strength: 18, intelligence: 12, stamina: 16, charisma: 12, speed: 15 },
    statGrowthPerLevel: { health: 5.5, strength: 2.0, intelligence: 1.4, stamina: 1.7, charisma: 1.3, speed: 1.6 },
    spriteAssetPath: "/assets/creatures/infernodrake.png",
    animationFrames: 6,
    personality: "Proud and territorial",
    obtainMethod: "Catch"
  },
  {
    name: "Tidecoral",
    description: "A coral-encrusted creature that pulses with bioluminescent light.",
    type: "Water",
    rarity: "Uncommon",
    baseStats: { health: 52, strength: 14, intelligence: 15, stamina: 16, charisma: 12, speed: 15 },
    statGrowthPerLevel: { health: 5.5, strength: 1.6, intelligence: 1.75, stamina: 1.7, charisma: 1.3, speed: 1.6 },
    spriteAssetPath: "/assets/creatures/tidecoral.png",
    animationFrames: 6,
    personality: "Serene and communal",
    obtainMethod: "Catch"
  },
  {
    name: "Barkbeast",
    description: "A wolf-like creature with a coat of living bark and moss.",
    type: "Nature",
    rarity: "Uncommon",
    baseStats: { health: 52, strength: 14, intelligence: 12, stamina: 20, charisma: 12, speed: 15 },
    statGrowthPerLevel: { health: 5.5, strength: 1.6, intelligence: 1.4, stamina: 2.12, charisma: 1.3, speed: 1.6 },
    spriteAssetPath: "/assets/creatures/barkbeast.png",
    animationFrames: 6,
    personality: "Fiercely protective",
    obtainMethod: "Catch"
  },
  {
    name: "Thunderwing",
    description: "A bird-like creature whose feathers spark with each wingbeat.",
    type: "Electric",
    rarity: "Uncommon",
    baseStats: { health: 52, strength: 14, intelligence: 12, stamina: 16, charisma: 12, speed: 19 },
    statGrowthPerLevel: { health: 5.5, strength: 1.6, intelligence: 1.4, stamina: 1.7, charisma: 1.3, speed: 2.0 },
    spriteAssetPath: "/assets/creatures/thunderwing.png",
    animationFrames: 6,
    personality: "Restless and quick-tempered",
    obtainMethod: "Catch"
  },
  {
    name: "Irongolem",
    description: "A humanoid creature built from fused scrap and river stone.",
    type: "Metal",
    rarity: "Uncommon",
    baseStats: { health: 52, strength: 18, intelligence: 12, stamina: 16, charisma: 12, speed: 15 },
    statGrowthPerLevel: { health: 5.5, strength: 2.0, intelligence: 1.4, stamina: 1.7, charisma: 1.3, speed: 1.6 },
    spriteAssetPath: "/assets/creatures/irongolem.png",
    animationFrames: 6,
    personality: "Silent and dutiful",
    obtainMethod: "Catch"
  },
  {
    name: "Blazewarden",
    description: "A guardian-like creature wreathed in a steady, controlled flame.",
    type: "Fire",
    rarity: "Rare",
    baseStats: { health: 70, strength: 24, intelligence: 17, stamina: 21, charisma: 16, speed: 20 },
    statGrowthPerLevel: { health: 7.5, strength: 2.62, intelligence: 1.9, stamina: 2.2, charisma: 1.7, speed: 2.1 },
    spriteAssetPath: "/assets/creatures/blazewarden.png",
    animationFrames: 6,
    personality: "Disciplined and vigilant",
    obtainMethod: "Catch"
  },
  {
    name: "Abysswhale",
    description: "A small whale-like creature that seems to carry the deep ocean's pressure with it.",
    type: "Water",
    rarity: "Rare",
    baseStats: { health: 88, strength: 19, intelligence: 17, stamina: 21, charisma: 16, speed: 20 },
    statGrowthPerLevel: { health: 9.38, strength: 2.1, intelligence: 1.9, stamina: 2.2, charisma: 1.7, speed: 2.1 },
    spriteAssetPath: "/assets/creatures/abysswhale.png",
    animationFrames: 6,
    personality: "Ancient and unhurried",
    obtainMethod: "Catch"
  },
  {
    name: "Rootbringer",
    description: "A tree-limbed creature that leaves flowers blooming in its footsteps.",
    type: "Nature",
    rarity: "Rare",
    baseStats: { health: 70, strength: 19, intelligence: 21, stamina: 21, charisma: 16, speed: 20 },
    statGrowthPerLevel: { health: 7.5, strength: 2.1, intelligence: 2.38, stamina: 2.2, charisma: 1.7, speed: 2.1 },
    spriteAssetPath: "/assets/creatures/rootbringer.png",
    animationFrames: 6,
    personality: "Wise and deliberate",
    obtainMethod: "Catch"
  },
  {
    name: "Stormchaser",
    description: "A creature perpetually trailed by a small crackling storm cloud.",
    type: "Electric",
    rarity: "Rare",
    baseStats: { health: 70, strength: 19, intelligence: 17, stamina: 21, charisma: 16, speed: 25 },
    statGrowthPerLevel: { health: 7.5, strength: 2.1, intelligence: 1.9, stamina: 2.2, charisma: 1.7, speed: 2.62 },
    spriteAssetPath: "/assets/creatures/stormchaser.png",
    animationFrames: 6,
    personality: "Reckless and thrill-seeking",
    obtainMethod: "Catch"
  },
  {
    name: "Crystalsprite",
    description: "A small floating creature made of faceted, glowing crystal.",
    type: "Psychic",
    rarity: "Rare",
    baseStats: { health: 70, strength: 19, intelligence: 21, stamina: 21, charisma: 16, speed: 20 },
    statGrowthPerLevel: { health: 7.5, strength: 2.1, intelligence: 2.38, stamina: 2.2, charisma: 1.7, speed: 2.1 },
    spriteAssetPath: "/assets/creatures/crystalsprite.png",
    animationFrames: 6,
    personality: "Curious and detached",
    obtainMethod: "Catch"
  },
  {
    name: "Infernosovereign",
    description: "A regal, fire-maned creature that commands respect wherever it walks.",
    type: "Fire",
    rarity: "Epic",
    baseStats: { health: 92, strength: 31, intelligence: 23, stamina: 27, charisma: 21, speed: 26 },
    statGrowthPerLevel: { health: 10, strength: 3.38, intelligence: 2.5, stamina: 2.9, charisma: 2.2, speed: 2.7 },
    spriteAssetPath: "/assets/creatures/infernosovereign.png",
    animationFrames: 6,
    personality: "Commanding and confident",
    obtainMethod: "Achievement"
  },
  {
    name: "Deepdreamer",
    description: "A creature that seems to drift between waking and sleep, trailing faint visions.",
    type: "Water",
    rarity: "Epic",
    baseStats: { health: 92, strength: 25, intelligence: 29, stamina: 27, charisma: 21, speed: 26 },
    statGrowthPerLevel: { health: 10, strength: 2.7, intelligence: 3.12, stamina: 2.9, charisma: 2.2, speed: 2.7 },
    spriteAssetPath: "/assets/creatures/deepdreamer.png",
    animationFrames: 6,
    personality: "Dreamy and cryptic",
    obtainMethod: "Achievement"
  },
  {
    name: "Wildspiritwalker",
    description: "A spectral, antlered creature bound to the wild places it protects.",
    type: "Nature",
    rarity: "Epic",
    baseStats: { health: 92, strength: 25, intelligence: 23, stamina: 34, charisma: 21, speed: 26 },
    statGrowthPerLevel: { health: 10, strength: 2.7, intelligence: 2.5, stamina: 3.62, charisma: 2.2, speed: 2.7 },
    spriteAssetPath: "/assets/creatures/wildspiritwalker.png",
    animationFrames: 6,
    personality: "Solemn and watchful",
    obtainMethod: "Achievement"
  },
  {
    name: "Voltarth",
    description: "A creature fusing crackling electricity with churned earth and stone.",
    type: "Electric",
    rarity: "Epic",
    baseStats: { health: 92, strength: 25, intelligence: 23, stamina: 27, charisma: 21, speed: 32 },
    statGrowthPerLevel: { health: 10, strength: 2.7, intelligence: 2.5, stamina: 2.9, charisma: 2.2, speed: 3.38 },
    spriteAssetPath: "/assets/creatures/voltarth.png",
    animationFrames: 6,
    personality: "Volatile and grounded, somehow both",
    obtainMethod: "Achievement"
  },
  {
    name: "Phoenixreborn",
    description: "A legendary creature said to be reborn from its own ashes.",
    type: "Fire",
    rarity: "Legendary",
    baseStats: { health: 120, strength: 41, intelligence: 30, stamina: 35, charisma: 28, speed: 34 },
    statGrowthPerLevel: { health: 13, strength: 4.38, intelligence: 3.2, stamina: 3.7, charisma: 2.9, speed: 3.5 },
    spriteAssetPath: "/assets/creatures/phoenixreborn.png",
    animationFrames: 6,
    personality: "Serene despite its power",
    obtainMethod: "Achievement"
  },
  {
    name: "Chronodepths",
    description: "A legendary creature rumored to perceive time the way others perceive water.",
    type: "Psychic",
    rarity: "Legendary",
    baseStats: { health: 120, strength: 33, intelligence: 38, stamina: 35, charisma: 28, speed: 34 },
    statGrowthPerLevel: { health: 13, strength: 3.5, intelligence: 4.0, stamina: 3.7, charisma: 2.9, speed: 3.5 },
    spriteAssetPath: "/assets/creatures/chronodepths.png",
    animationFrames: 6,
    personality: "Distant and inscrutable",
    obtainMethod: "Achievement"
  },
  {
    name: "Voidwhisper",
    description: "A legendary creature that speaks in half-heard whispers from the space between shadows.",
    type: "Dark",
    rarity: "Legendary",
    baseStats: { health: 120, strength: 33, intelligence: 30, stamina: 35, charisma: 28, speed: 42 },
    statGrowthPerLevel: { health: 13, strength: 3.5, intelligence: 3.2, stamina: 3.7, charisma: 2.9, speed: 4.38 },
    spriteAssetPath: "/assets/creatures/voidwhisper.png",
    animationFrames: 6,
    personality: "Quiet and unsettling",
    obtainMethod: "Achievement"
  },
  {
    name: "Cosmicvanguard",
    description: "A legendary creature whose form seems to hold fragments of the night sky.",
    type: "Psychic",
    rarity: "Legendary",
    baseStats: { health: 120, strength: 33, intelligence: 30, stamina: 35, charisma: 35, speed: 34 },
    statGrowthPerLevel: { health: 13, strength: 3.5, intelligence: 3.2, stamina: 3.7, charisma: 3.62, speed: 3.5 },
    spriteAssetPath: "/assets/creatures/cosmicvanguard.png",
    animationFrames: 6,
    personality: "Detached, as if watching from far away",
    obtainMethod: "Achievement"
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    for (const species of allSpecies) {
      await CreatureSpecies.findOneAndUpdate({ name: species.name }, species, {
        upsert: true,
        new: true
      });
      console.log(`Upserted species: ${species.name} (${species.rarity})`);
    }

    console.log(`Seeding complete. ${allSpecies.length} species upserted.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
