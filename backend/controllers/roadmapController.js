/**
 * Roadmap Controller
 * Handles learning roadmap operations
 */

const SkillGapService = require('../services/SkillGapService');
const MistralRoadmapService = require('../services/MistralRoadmapService');
const Roadmap = require('../models/Roadmap');
const Analysis = require('../models/Analysis');
const Student = require('../models/Student');
const Role = require('../models/Role');
const rolesDatabase = require('../data/rolesDatabase');

class RoadmapController {
  static async generateRoadmap(req, res) {
    try {
      const { studentId, roleId, missingSkills, weakSkills } = req.body;

      if (!studentId || !roleId) {
        return res.status(400).json({ error: 'studentId and roleId are required' });
      }

      const student = await Student.findOne({ studentId }).lean();
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const role = (await Role.findOne({ roleId }).lean()) || rolesDatabase.find(r => r.roleId === roleId);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      let resolvedMissing = Array.isArray(missingSkills) ? missingSkills : [];
      let resolvedWeak = Array.isArray(weakSkills) ? weakSkills : [];

      if (resolvedMissing.length === 0 && resolvedWeak.length === 0) {
        const latestAnalysis = await Analysis.findOne({ studentId, roleId }).sort({ createdAt: -1 }).lean();
        if (latestAnalysis) {
          resolvedMissing = (latestAnalysis.missingSkills || []).map(item => item.skill || item).filter(Boolean);
          resolvedWeak = (latestAnalysis.weakSkills || []).map(item => item.skill || item).filter(Boolean);
        }
      }

      if (resolvedMissing.length === 0 && resolvedWeak.length === 0) {
        const computedGap = SkillGapService.analyzeSkillGap(
          student.skills || [],
          role.requiredSkills || [],
          role.skillWeights || {}
        );
        resolvedMissing = computedGap.missingSkills.map(item => item.skill);
        resolvedWeak = computedGap.weakSkills.map(item => item.skill);
      }

      let roadmap;
      let generationSource = 'rule-based';
      let generationModel = '';

      try {
        roadmap = await MistralRoadmapService.generateCareerPlan({
          student,
          role,
          missingSkills: resolvedMissing,
          weakSkills: resolvedWeak,
        });
        generationSource = 'mistral-7b';
        generationModel = process.env.MISTRAL_MODEL || 'mistral:7b';
      } catch (llmError) {
        roadmap = SkillGapService.generateRoadmap(
          resolvedMissing.map(skill => ({ skill, importance: 'Critical' })),
          resolvedWeak.map(skill => ({ skill, relatedSkill: skill })),
          []
        );
      }

      const learningTopics = Array.isArray(roadmap.learningOrder) && roadmap.learningOrder.length
        ? roadmap.learningOrder
        : (roadmap.topics || []).map((item) => item.topic).filter(Boolean);

      roadmap.topics = (roadmap.topics || []).map((topic, index) => {
        const fallback = SkillGapService.createTopicModule(topic.topic, topic.sequence || index + 1, {
          difficulty: topic.difficulty || 'Intermediate',
          priority: topic.priority || 'Medium',
          estimatedHours: topic.estimatedHours || 20,
        });

        return {
          ...fallback,
          ...topic,
          learningObjectives: Array.isArray(topic.learningObjectives) && topic.learningObjectives.length
            ? topic.learningObjectives
            : fallback.learningObjectives,
          deliverables: Array.isArray(topic.deliverables) && topic.deliverables.length
            ? topic.deliverables
            : fallback.deliverables,
          prerequisites: Array.isArray(topic.prerequisites) && topic.prerequisites.length
            ? topic.prerequisites
            : fallback.prerequisites,
          practiceTasks: Array.isArray(topic.practiceTasks) && topic.practiceTasks.length
            ? topic.practiceTasks
            : fallback.practiceTasks,
          moduleResources: Array.isArray(topic.moduleResources) && topic.moduleResources.length
            ? topic.moduleResources
            : fallback.moduleResources,
          moduleYouTubeVideos: Array.isArray(topic.moduleYouTubeVideos) && topic.moduleYouTubeVideos.length
            ? topic.moduleYouTubeVideos
            : fallback.moduleYouTubeVideos,
          moduleCodingPlatforms: Array.isArray(topic.moduleCodingPlatforms) && topic.moduleCodingPlatforms.length
            ? topic.moduleCodingPlatforms
            : fallback.moduleCodingPlatforms,
          moduleNotesTemplate: Array.isArray(topic.moduleNotesTemplate) && topic.moduleNotesTemplate.length
            ? topic.moduleNotesTemplate
            : fallback.moduleNotesTemplate,
        };
      });

      roadmap.youtubeResources = Array.isArray(roadmap.youtubeResources) && roadmap.youtubeResources.length
        ? roadmap.youtubeResources
        : SkillGapService.suggestYouTubeVideos(learningTopics);
      roadmap.codingPlatforms = Array.isArray(roadmap.codingPlatforms) && roadmap.codingPlatforms.length
        ? roadmap.codingPlatforms
        : SkillGapService.suggestCodingPlatforms(learningTopics);
      roadmap.deepDiveResources = Array.isArray(roadmap.deepDiveResources) && roadmap.deepDiveResources.length
        ? roadmap.deepDiveResources
        : SkillGapService.suggestDeepDiveResources(learningTopics);

      const roadmapId = `roadmap_${Date.now()}`;
      const roadmapData = await Roadmap.create({
        roadmapId,
        studentId,
        roleId,
        roleName: role.roleName,
        missingSkills: resolvedMissing,
        weakSkills: resolvedWeak,
        ...roadmap,
        generationSource,
        generationModel,
        createdAt: new Date()
      });

      res.json({
        success: true,
        message: 'Learning roadmap generated',
        data: roadmapData
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getRoadmap(req, res) {
    try {
      const { roadmapId } = req.params;
      const roadmap = await Roadmap.findOne({ roadmapId }).lean();

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found' });
      }

      res.json({
        success: true,
        data: roadmap
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStudentRoadmaps(req, res) {
    try {
      const { studentId } = req.params;
      const roadmaps = await Roadmap.find({ studentId }).sort({ createdAt: -1 }).lean();

      res.json({
        success: true,
        count: roadmaps.length,
        data: roadmaps
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateTopicProgress(req, res) {
    try {
      const { roadmapId } = req.params;
      const { studentId, topic, sequence, completed, note } = req.body;

      if (!topic) {
        return res.status(400).json({ error: 'topic is required' });
      }

      const roadmap = await Roadmap.findOne({ roadmapId });
      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found' });
      }

      if (studentId && roadmap.studentId !== studentId) {
        return res.status(403).json({ error: 'Not allowed to update this roadmap' });
      }

      const topicKey = String(topic).trim().toLowerCase();
      const progressList = Array.isArray(roadmap.topicProgress) ? roadmap.topicProgress : [];
      const existingIndex = progressList.findIndex((item) => String(item.topic).trim().toLowerCase() === topicKey);
      const isCompleted = Boolean(completed);

      const progressEntry = {
        topic: String(topic).trim(),
        sequence: Number(sequence) || 0,
        completed: isCompleted,
        note: typeof note === 'string' ? note : (existingIndex >= 0 ? progressList[existingIndex].note : ''),
        completedAt: isCompleted ? new Date() : null,
        lastUpdated: new Date(),
      };

      if (existingIndex >= 0) {
        roadmap.topicProgress[existingIndex] = progressEntry;
      } else {
        roadmap.topicProgress.push(progressEntry);
      }

      await roadmap.save();

      res.json({
        success: true,
        message: 'Roadmap progress updated',
        data: roadmap,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = RoadmapController;
