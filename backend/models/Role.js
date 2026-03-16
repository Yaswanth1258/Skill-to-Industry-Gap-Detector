const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    roleId: { type: String, required: true, unique: true, index: true },
    roleName: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    requiredSkills: [{ type: String }],
    // Plain object allows keys like "Node.js" which are not valid in Mongoose Map keys.
    skillWeights: { type: Object, default: {} },
    industryDemand: { type: String, default: 'High' },
    averageSalary: { type: String, default: '' },
    jobMarketGrowth: { type: Number, default: 0 },
    seniority: { type: String, default: '' },
    relatedRoles: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Role', roleSchema);