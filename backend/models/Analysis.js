const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    studentId: { type: String, required: true, index: true },
    roleId: { type: String, required: true, index: true },
    roleName: { type: String, required: true },
    matchScore: { type: Number, required: true },
    matchPercentage: { type: Number, required: true },
    matchedSkills: { type: Array, default: [] },
    missingSkills: { type: Array, default: [] },
    weakSkills: { type: Array, default: [] },
    readinessScore: { type: Number, required: true },
    readinessLevel: { type: String, default: '' },
    estimatedMonthsToReady: { type: Number, default: 0 },
    roadmap: { type: Object, default: {} },
    industryDemand: { type: String, default: '' },
    averageSalary: { type: String, default: '' },
    jobMarketGrowth: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Analysis', analysisSchema);