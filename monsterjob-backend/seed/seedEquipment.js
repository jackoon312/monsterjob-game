// Run with: node seed/seedEquipment.js
// Populates 15 equipment items - one per (slot x rarity) combination, giving
// full Head/Body/Accessory coverage at every rarity tier from Common through
// Legendary. Level requirements (1/3/7/12/18) mirror the same progression
// curve used in seedJobs.js. Upserts by name, safe to re-run any time.

require('dotenv').config();
const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');

const allEquipment = [
  {
    name: "Iron Helmet",
    type: "Head",
    rarity: "Common",
    statBonus: { strength: 5, intelligence: 0, stamina: 0, charisma: 0, speed: 0, health: 5 },
    cost: 50,
    obtainMethod: "Shop",
    level: 1,
    description: "A sturdy helmet offering basic protection."
  },
  {
    name: "Leather Cap of Focus",
    type: "Head",
    rarity: "Uncommon",
    statBonus: { strength: 0, intelligence: 8, stamina: 3, charisma: 0, speed: 0, health: 0 },
    cost: 150,
    obtainMethod: "Shop",
    level: 3,
    description: "A worn cap that sharpens the wearer's attention."
  },
  {
    name: "Silver Circlet",
    type: "Head",
    rarity: "Rare",
    statBonus: { strength: 0, intelligence: 6, stamina: 0, charisma: 10, speed: 0, health: 0 },
    cost: 400,
    obtainMethod: "Shop",
    level: 7,
    description: "A cool, gleaming band that steadies the nerves."
  },
  {
    name: "Dragonscale Helm",
    type: "Head",
    rarity: "Epic",
    statBonus: { strength: 15, intelligence: 0, stamina: 0, charisma: 0, speed: 0, health: 10 },
    cost: 1000,
    obtainMethod: "Achievement",
    level: 12,
    description: "Forged from scales said to be shed by a fire creature."
  },
  {
    name: "Crown of the Vanguard",
    type: "Head",
    rarity: "Legendary",
    statBonus: { strength: 12, intelligence: 12, stamina: 0, charisma: 12, speed: 0, health: 0 },
    cost: 2500,
    obtainMethod: "Rare Find",
    level: 18,
    description: "A crown that seems to hum faintly with old power."
  },
  {
    name: "Silk Shirt",
    type: "Body",
    rarity: "Common",
    statBonus: { strength: 0, intelligence: 0, stamina: 0, charisma: 8, speed: 2, health: 0 },
    cost: 50,
    obtainMethod: "Shop",
    level: 1,
    description: "A comfortable shirt that boosts charisma."
  },
  {
    name: "Padded Vest",
    type: "Body",
    rarity: "Uncommon",
    statBonus: { strength: 3, intelligence: 0, stamina: 8, charisma: 0, speed: 0, health: 0 },
    cost: 150,
    obtainMethod: "Shop",
    level: 3,
    description: "Light armor that doesn't slow you down."
  },
  {
    name: "Chainmail Tunic",
    type: "Body",
    rarity: "Rare",
    statBonus: { strength: 8, intelligence: 0, stamina: 0, charisma: 0, speed: 0, health: 15 },
    cost: 400,
    obtainMethod: "Shop",
    level: 7,
    description: "Interlocking rings offering real protection without much weight."
  },
  {
    name: "Phoenix-threaded Robe",
    type: "Body",
    rarity: "Epic",
    statBonus: { strength: 0, intelligence: 0, stamina: 0, charisma: 10, speed: 0, health: 18 },
    cost: 1000,
    obtainMethod: "Achievement",
    level: 12,
    description: "Warm to the touch, faintly smells of ash."
  },
  {
    name: "Mantle of the Cosmos",
    type: "Body",
    rarity: "Legendary",
    statBonus: { strength: 0, intelligence: 15, stamina: 0, charisma: 0, speed: 10, health: 15 },
    cost: 2500,
    obtainMethod: "Rare Find",
    level: 18,
    description: "A cloak that seems to hold points of starlight."
  },
  {
    name: "Gold Ring",
    type: "Accessory",
    rarity: "Common",
    statBonus: { strength: 0, intelligence: 5, stamina: 0, charisma: 5, speed: 0, health: 0 },
    cost: 50,
    obtainMethod: "Shop",
    level: 1,
    description: "A shiny ring that sharpens the mind and charms others."
  },
  {
    name: "Swift Anklet",
    type: "Accessory",
    rarity: "Uncommon",
    statBonus: { strength: 0, intelligence: 0, stamina: 0, charisma: 0, speed: 10, health: 0 },
    cost: 150,
    obtainMethod: "Shop",
    level: 3,
    description: "A light band that seems to lighten every step."
  },
  {
    name: "Amulet of Clarity",
    type: "Accessory",
    rarity: "Rare",
    statBonus: { strength: 0, intelligence: 12, stamina: 5, charisma: 0, speed: 0, health: 0 },
    cost: 400,
    obtainMethod: "Shop",
    level: 7,
    description: "A pendant that clears distracting thoughts."
  },
  {
    name: "Ember Pendant",
    type: "Accessory",
    rarity: "Epic",
    statBonus: { strength: 10, intelligence: 0, stamina: 0, charisma: 0, speed: 8, health: 0 },
    cost: 1000,
    obtainMethod: "Achievement",
    level: 12,
    description: "Warm always, said to steady the wearer's courage."
  },
  {
    name: "Void-touched Bracelet",
    type: "Accessory",
    rarity: "Legendary",
    statBonus: { strength: 0, intelligence: 10, stamina: 0, charisma: 8, speed: 15, health: 0 },
    cost: 2500,
    obtainMethod: "Rare Find",
    level: 18,
    description: "A bracelet that seems to absorb light around it."
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    for (const item of allEquipment) {
      await Equipment.findOneAndUpdate({ name: item.name }, item, { upsert: true, new: true });
      console.log(`Upserted equipment: ${item.name} (${item.type}, ${item.rarity}, lvl ${item.level}+)`);
    }

    console.log(`Seeding complete. ${allEquipment.length} equipment items upserted.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
