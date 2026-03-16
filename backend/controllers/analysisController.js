/**
 * Analysis Controller
 * Handles skill gap analysis operations
 */

const SkillGapService = require('../services/SkillGapService');
const Student = require('../models/Student');
const Analysis = require('../models/Analysis');
const Role = require('../models/Role');
const rolesDatabase = require('../data/rolesDatabase');

class AnalysisController {
  static async analyzeSkillGap(req, res) {
    try {
      const { studentId, roleId } = req.body;

      // Validate inputs
      if (!studentId || !roleId) {
        return res.status(400).json({ error: 'studentId and roleId are required' });
      }

      // Find the role
      const role = (await Role.findOne({ roleId }).lean()) || rolesDatabase.find(r => r.roleId === roleId);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const studentProfile = await Student.findOne({ studentId }).lean();
      if (!studentProfile) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Perform skill gap analysis
      const gapAnalysis = SkillGapService.analyzeSkillGap(
        studentProfile.skills || [],
        role.requiredSkills,
        role.skillWeights
      );

      // Generate learning roadmap
      const roadmap = SkillGapService.generateRoadmap(
        gapAnalysis.missingSkills,
        gapAnalysis.weakSkills,
        gapAnalysis.matchedSkills
      );

      // Store analysis
      const analysisId = `analysis_${Date.now()}`;
      const analysis = await Analysis.create({
        analysisId,
        studentId,
        roleId,
        roleName: role.roleName,
        matchScore: gapAnalysis.matchPercentage,
        matchPercentage: gapAnalysis.matchPercentage,
        matchedSkills: gapAnalysis.matchedSkills,
        missingSkills: gapAnalysis.missingSkills,
        weakSkills: gapAnalysis.weakSkills,
        readinessScore: gapAnalysis.readinessScore,
        readinessLevel: gapAnalysis.careerReadinessLevel,
        estimatedMonthsToReady: gapAnalysis.estimatedMonthsToReady,
        roadmap,
        industryDemand: role.industryDemand,
        averageSalary: role.averageSalary,
        jobMarketGrowth: role.jobMarketGrowth,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Skill gap analysis completed',
        data: analysis
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAnalysis(req, res) {
    try {
      const { analysisId } = req.params;
      const analysis = await Analysis.findOne({ analysisId }).lean();

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStudentAnalyses(req, res) {
    try {
      const { studentId } = req.params;
      const analyses = await Analysis.find({ studentId }).sort({ createdAt: -1 }).lean();

      res.json({
        success: true,
        count: analyses.length,
        data: analyses
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

}

module.exports = AnalysisController;
