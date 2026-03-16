const mongoose = require('mongoose');
const Role = require('../models/Role');
const Student = require('../models/Student');
const Analysis = require('../models/Analysis');
const Roadmap = require('../models/Roadmap');
const rolesDatabase = require('../data/rolesDatabase');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Yash:Mallimohan@cluster0.rhuvfdx.mongodb.net/skill_gap_detector?retryWrites=true&w=majority&appName=Cluster0';

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  console.log('MongoDB connected');
  await initializeCollections();
  await seedRoles();
};

const initializeCollections = async () => {
  const models = [Student, Role, Analysis, Roadmap];

  for (const model of models) {
    await model.createCollection();
    await model.syncIndexes();
  }

  console.log('Initialized collections and indexes');
};

const seedRoles = async () => {
  const count = await Role.countDocuments();
  if (count > 0) {
    return;
  }

  const operations = rolesDatabase.map((role) => ({
    updateOne: {
      filter: { roleId: role.roleId },
      update: { $set: role },
      upsert: true,
    },
  }));

  await Role.bulkWrite(operations);
  console.log(`Seeded ${rolesDatabase.length} roles into MongoDB`);
};

module.exports = connectDB;