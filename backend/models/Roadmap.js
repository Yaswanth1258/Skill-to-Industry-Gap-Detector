const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    roadmapId: { type: String, required: true, unique: true, index: true },
    studentId: { type: String, required: true, index: true },
    roleId: { type: String, required: true, index: true },
    roleName: { type: String, default: '' },
    missingSkills: [{ type: String }],
    weakSkills: [{ type: String }],
    topics: { type: Array, default: [] },
    learningOrder: { type: Array, default: [] },
    suggestedProjects: { type: Array, default: [] },
    milestones: { type: Array, default: [] },
    courseRecommendations: { type: Array, default: [] },
    youtubeResources: { type: Array, default: [] },
    codingPlatforms: { type: Array, default: [] },
    deepDiveResources: { type: Array, default: [] },
    topicProgress: {
      type: [
        {
          topic: { type: String, required: true },
          sequence: { type: Number, default: 0 },
          completed: { type: Boolean, default: false },
          note: { type: String, default: '' },
          completedAt: { type: Date, default: null },
          lastUpdated: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    estimatedDuration: { type: String, default: '' },
    resources: { type: Array, default: [] },
    generationSource: { type: String, default: 'rule-based' },
    generationModel: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Roadmap', roadmapSchema);