const mongoose = require('mongoose');
const Role = require('../models/Role');
const Student = require('../models/Student');
const Analysis = require('../models/Analysis');
const Roadmap = require('../models/Roadmap');
const rolesDatabase = require('../data/rolesDatabase');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_FALLBACK_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing. Add it in backend/.env for local runs and in your deployment environment variables.');
  }

  try {
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected (Atlas)');
  } catch (error) {
    if (!fallbackUri) {
      const atlasHint =
        'Atlas connection failed. Check DB user credentials, cluster status, and Network Access allowlist. If local machine fails but deployment works, your local network may be blocking outbound port 27017.';
      throw new Error(`${atlasHint} Original error: ${error.message}`);
    }

    console.warn('Atlas connection failed. Falling back to local MongoDB for development.');
    await mongoose.connect(fallbackUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected (Fallback Local)');
  }

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