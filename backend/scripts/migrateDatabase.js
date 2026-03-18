const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const oldDbName = 'skill_gap_detector';
const newDbName = 'skill_analyzer_db';

async function migrateDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    console.log(`📊 Starting database migration...`);
    console.log(`📦 Source DB: ${oldDbName}`);
    console.log(`📦 Target DB: ${newDbName}`);

    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      dbName: oldDbName,
    });

    const sourceDb = mongoose.connection.db;
    console.log(`✅ Connected to source database: ${oldDbName}`);

    // Get all collections from source database
    const collections = await sourceDb.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections to copy`);

    // Create target database connection
    const targetUri = mongoUri.replace(
      `/skill_gap_detector?`,
      `/skill_analyzer_db?`
    );

    const targetConnection = mongoose.createConnection(targetUri, {
      dbName: newDbName,
    });

    const targetDb = targetConnection.getClient().db(newDbName);
    console.log(`✅ Connected to target database: ${newDbName}`);

    // Copy each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📋 Copying collection: ${collectionName}`);

      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      // Get all documents
      const documents = await sourceCollection.find({}).toArray();
      console.log(`  - Found ${documents.length} documents`);

      if (documents.length > 0) {
        // Insert into target
        await targetCollection.insertMany(documents);
        console.log(`  ✅ Inserted ${documents.length} documents`);
      }
    }

    console.log(`\n✅ Database migration completed successfully!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Update MONGODB_URI in backend/.env to use the new database name`);
    console.log(`   2. Restart your backend server`);
    console.log(`   3. Verify all data is present`);

    // Update .env file
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const updatedEnv = envContent.replace(
      `/skill_gap_detector?`,
      `/skill_analyzer_db?`
    );

    fs.writeFileSync(envPath, updatedEnv);
    console.log(`\n✅ Updated backend/.env with new database name`);

    await mongoose.connection.close();
    await targetConnection.close();

    console.log(`\n🎉 Migration complete! Your app will now use: ${newDbName}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateDatabase();
