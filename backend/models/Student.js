const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    currentRole: { type: String, default: '' },
    skills: [
      {
        name: { type: String, required: true, trim: true },
        percentage: { type: Number, min: 0, max: 100, default: 0 },
      },
    ],
    courses: [{ type: String }],
    projects: [{ type: String }],
    interests: [{ type: String }],
    experience: { type: String, default: '' },
    selectedRoleId: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Student', studentSchema);