/**
 * Insights Controller
 * Handles career insights and market analysis
 */

const Role = require('../models/Role');
const Analysis = require('../models/Analysis');
const Student = require('../models/Student');
const rolesDatabase = require('../data/rolesDatabase');

class InsightsController {
  static async getCareerInsights(req, res) {
    try {
      const { studentId } = req.params;
      const dbRoles = await Role.find({}).lean();
      const source = dbRoles.length > 0 ? dbRoles : rolesDatabase;
      const latestAnalysis = await Analysis.findOne({ studentId }).sort({ createdAt: -1 }).lean();
      const student = await Student.findOne({ studentId }).lean();

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const selectedRoleId = student.selectedRoleId || latestAnalysis?.roleId;
      const selectedRole = selectedRoleId
        ? source.find((role) => role.roleId === selectedRoleId)
        : null;

      const normalize = (value) => String(value || '').trim().toLowerCase();
      const demandWeight = { Critical: 1, 'Very High': 0.9, High: 0.8, Medium: 0.65, Low: 0.5 };

      const studentSkills = Array.isArray(student.skills)
        ? student.skills.map((item) => {
            if (typeof item === 'string') {
              return { name: item, percentage: 60 };
            }
            return {
              name: item?.name || item?.skill || '',
              percentage: Number(item?.percentage || 0),
            };
          }).filter((item) => item.name)
        : [];

      const studentSkillMap = new Map(
        studentSkills.map((item) => [normalize(item.name), Math.max(0, Math.min(100, Number(item.percentage) || 0))])
      );

      const getSkillPct = (skillName) => {
        const key = normalize(skillName);
        if (!key) {
          return 0;
        }

        if (studentSkillMap.has(key)) {
          return studentSkillMap.get(key);
        }

        for (const [name, pct] of studentSkillMap.entries()) {
          if (name.includes(key) || key.includes(name)) {
            return pct;
          }
        }

        return 0;
      };

      const roleScores = source.map((role) => {
        const requiredSkills = role.requiredSkills || [];
        const roleWeightMap = role.skillWeights || {};

        const totalWeight = requiredSkills.reduce((sum, skill) => sum + Number(roleWeightMap[skill] || 1), 0) || 1;
        const weightedReadiness = requiredSkills.reduce((sum, skill) => {
          const weight = Number(roleWeightMap[skill] || 1);
          const userPct = getSkillPct(skill);
          return sum + (weight * userPct);
        }, 0) / totalWeight;

        const growthNormalized = Math.max(0, Math.min(100, Number(role.jobMarketGrowth || 0) * 2));
        const demandNormalized = (demandWeight[role.industryDemand] || 0.65) * 100;
        const fitScore = Math.round(weightedReadiness * 0.55 + growthNormalized * 0.25 + demandNormalized * 0.2);

        return {
          role,
          fitScore,
          weightedReadiness: Math.round(weightedReadiness),
        };
      });

      const topDemandingRoles = roleScores
        .slice()
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 5)
        .map((entry) => ({
          roleName: entry.role.roleName,
          growth: `+${entry.role.jobMarketGrowth}%`,
          demand: entry.role.industryDemand,
          fitScore: entry.fitScore,
          readiness: entry.weightedReadiness,
        }));

      const topRoleIds = new Set(topDemandingRoles.map((item) => {
        const found = source.find((role) => role.roleName === item.roleName);
        return found?.roleId;
      }).filter(Boolean));

      const relevantRoles = source.filter((role) => topRoleIds.has(role.roleId) || (selectedRole && role.roleId === selectedRole.roleId));

      const skillStats = new Map();
      relevantRoles.forEach((role) => {
        const reqSkills = role.requiredSkills || [];
        const skillWeights = role.skillWeights || {};
        const demandFactor = demandWeight[role.industryDemand] || 0.65;

        reqSkills.forEach((skill) => {
          const key = normalize(skill);
          const existing = skillStats.get(key) || {
            skill,
            appearances: 0,
            weightedDemand: 0,
            maxWeight: 1,
          };

          const roleSkillWeight = Number(skillWeights[skill] || 1);
          existing.appearances += 1;
          existing.weightedDemand += roleSkillWeight * demandFactor;
          existing.maxWeight = Math.max(existing.maxWeight, roleSkillWeight);
          skillStats.set(key, existing);
        });
      });

      const topSkills = [...skillStats.values()]
        .map((item) => {
          const userPct = getSkillPct(item.skill);
          const demandPct = Math.min(100, Math.round((item.weightedDemand / Math.max(1, relevantRoles.length)) * 45));
          const gapPct = Math.max(0, 100 - userPct);
          const priorityPct = Math.round(demandPct * 0.55 + gapPct * 0.45);

          return {
            skill: item.skill,
            inDemand: item.appearances,
            percentage: Math.max(5, Math.min(100, priorityPct)),
            userPercentage: userPct,
            gap: gapPct,
          };
        })
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10);

      const recommendedSkills = latestAnalysis
        ? [
            ...(latestAnalysis.missingSkills || []).map((item) => item.skill || item),
            ...(latestAnalysis.weakSkills || []).map((item) => item.skill || item),
          ].filter(Boolean).slice(0, 6)
        : (selectedRole?.requiredSkills || topSkills.slice(0, 6).map((item) => item.skill));

      const profileSkills = studentSkills.map((skill) => skill.name);
      const emergingTech = source
        .flatMap((role) => role.requiredSkills || [])
        .filter((skill, index, arr) => arr.indexOf(skill) === index)
        .filter((skill) => !profileSkills.some((s) => String(s).toLowerCase() === String(skill).toLowerCase()))
        .slice(0, 4);

      const certifications = (recommendedSkills || []).slice(0, 4).map((skill) => `${skill} Professional Certificate`);

      const technicalReadiness = latestAnalysis?.matchPercentage || 0;
      const experienceYears = Number(student.experience || 0);
      const experienceScore = Math.min(100, Math.round((experienceYears / 5) * 100));
      const projectScore = Math.min(100, Math.max(20, (student.projects || []).length * 20));
      const overallReadiness = latestAnalysis?.readinessScore || Math.round((technicalReadiness + experienceScore + projectScore) / 3);

      const averageSalary = selectedRole?.averageSalary || latestAnalysis?.averageSalary || '$0';
      const growthRole = selectedRole || source.slice().sort((a, b) => b.jobMarketGrowth - a.jobMarketGrowth)[0];

      const insights = {
        studentId,
        timestamp: new Date(),
        careerReadiness: {
          overall: overallReadiness,
          technical: technicalReadiness,
          experience: experienceScore,
          projects: projectScore,
        },
        marketAnalysis: {
          topDemandingRoles,
          topInDemandSkills: topSkills,
          averageSalary,
          careerGrowthTrend: growthRole ? `${growthRole.jobMarketGrowth >= 0 ? '+' : ''}${growthRole.jobMarketGrowth}%` : '0%',
          industryOutlook: latestAnalysis
            ? `Strong demand for ${latestAnalysis.roleName} and adjacent roles`
            : (selectedRole ? `Demand outlook for ${selectedRole.roleName} remains ${selectedRole.industryDemand}` : 'Limited data available for industry outlook'),
        },
        recommendations: {
          focusAreas: recommendedSkills,
          emergingTech,
          certifications,
        },
      };

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMarketTrends(req, res) {
    try {
      const dbRoles = await Role.find({}).lean();
      const source = dbRoles.length > 0 ? dbRoles : rolesDatabase;

      const trends = {
        topGrowingRoles: source.slice().sort((a, b) => b.jobMarketGrowth - a.jobMarketGrowth).slice(0, 5),
        topSalaries: source.slice().sort((a, b) => {
          const maxA = parseInt(String(a.averageSalary).replace(/[$,]/g, '').split('-').pop()?.trim() || '0', 10);
          const maxB = parseInt(String(b.averageSalary).replace(/[$,]/g, '').split('-').pop()?.trim() || '0', 10);
          return maxB - maxA;
        }).slice(0, 5),
        highestDemand: source.filter((role) => role.industryDemand === 'Critical'),
      };

      res.json({ success: true, data: trends });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getRecommendations(req, res) {
    try {
      const { skills, interests } = req.query;
      const dbRoles = await Role.find({}).lean();
      const source = dbRoles.length > 0 ? dbRoles : rolesDatabase;

      const recommendations = {
        recommendedRoles: source.filter((role) => {
          if (interests && role.description.toLowerCase().includes(String(interests).toLowerCase())) {
            return true;
          }
          if (skills) {
            const skillList = String(skills).split(',').map((skill) => skill.trim().toLowerCase());
            return (role.requiredSkills || []).some((requiredSkill) => skillList.some((skill) => requiredSkill.toLowerCase().includes(skill)));
          }
          return false;
        }).slice(0, 5),
        suggestedSkillsToLearn: ['Machine Learning', 'Cloud Architecture', 'System Design'],
        resources: [
          { title: 'DeepLearning.AI Machine Learning Specialization', type: 'Course', duration: '4 months' },
          { title: 'AWS Skill Builder', type: 'Certification', duration: '3 months' },
          { title: 'Portfolio Project Sprint', type: 'Project', duration: '6 weeks' },
        ],
      };

      res.json({ success: true, data: recommendations });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = InsightsController;
