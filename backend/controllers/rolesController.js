/**
 * Roles Controller
 * Handles industry role operations
 */

const rolesDatabase = require('../data/rolesDatabase');
const Role = require('../models/Role');

const demandRank = { Critical: 3, 'Very High': 2, High: 1, Medium: 0.7, Low: 0.4 };

const parseSalary = (value) => {
  const numbers = String(value || '').replace(/[$,]/g, '').match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return 0;
  }

  const parsed = numbers.map((item) => Number(item)).filter((num) => Number.isFinite(num));
  if (!parsed.length) {
    return 0;
  }

  return Math.round(parsed.reduce((sum, num) => sum + num, 0) / parsed.length);
};

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

class RolesController {
  static async getAllRoles(req, res) {
    try {
      const dbRoles = await Role.find({}).lean();
      const source = dbRoles.length > 0 ? dbRoles : rolesDatabase;

      const roles = source.map(role => ({
        roleId: role.roleId,
        roleName: role.roleName,
        description: role.description,
        requiredSkills: role.requiredSkills,
        relatedRoles: role.relatedRoles,
        skillWeights: role.skillWeights,
        industryDemand: role.industryDemand,
        averageSalary: role.averageSalary,
        jobMarketGrowth: role.jobMarketGrowth,
        seniority: role.seniority
      }));

      res.json({
        success: true,
        count: roles.length,
        data: roles
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getRoleById(req, res) {
    try {
      const { roleId } = req.params;
      const role = (await Role.findOne({ roleId }).lean()) || rolesDatabase.find(r => r.roleId === roleId);

      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async searchRoles(req, res) {
    try {
      const { keyword } = req.query;

      if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
      }

      const dbRoles = await Role.find({}).lean();
      const source = dbRoles.length > 0 ? dbRoles : rolesDatabase;

      const filtered = source.filter(role =>
        role.roleName.toLowerCase().includes(keyword.toLowerCase()) ||
        role.description.toLowerCase().includes(keyword.toLowerCase()) ||
        role.requiredSkills.some(skill => skill.toLowerCase().includes(keyword.toLowerCase()))
      );

      res.json({
        success: true,
        count: filtered.length,
        data: filtered
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTopRoles(req, res) {
    try {
      const dbRoles = await Role.find({}).lean();
      const source = dbRoles.length > 0 ? dbRoles : rolesDatabase;

      const topRoles = source
        .sort((a, b) => {
          const demandScore = { 'Critical': 3, 'Very High': 2, 'High': 1 };
          return (demandScore[b.industryDemand] || 0) - (demandScore[a.industryDemand] || 0);
        })
        .slice(0, 5);

      res.json({
        success: true,
        data: topRoles
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createCustomRole(req, res) {
    try {
      const { roleName } = req.body;

      if (!roleName || !String(roleName).trim()) {
        return res.status(400).json({ error: 'roleName is required' });
      }

      const normalizedRoleName = String(roleName).trim();
      const roleNameRegex = new RegExp(`^${normalizedRoleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const existingRole = await Role.findOne({ roleName: roleNameRegex }).lean();
      if (existingRole) {
        return res.json({ success: true, data: existingRole, message: 'Existing role returned' });
      }

      const dbRoles = await Role.find({}).lean();
      const source = [...rolesDatabase, ...dbRoles];

      const queryWords = normalizedRoleName.toLowerCase().split(/\s+/).filter(Boolean);
      const scoredRoles = source
        .map((role) => {
          const haystack = `${role.roleName} ${role.description} ${(role.requiredSkills || []).join(' ')}`.toLowerCase();
          const matchCount = queryWords.reduce((count, word) => (haystack.includes(word) ? count + 1 : count), 0);
          return {
            role,
            score: matchCount + (demandRank[role.industryDemand] || 0),
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .filter((item) => item.score > 0);

      const seedRoles = scoredRoles.length ? scoredRoles.map((item) => item.role) : source.slice(0, 5);

      const skillStats = {};
      seedRoles.forEach((role) => {
        const weights = role.skillWeights || {};
        (role.requiredSkills || []).forEach((skill) => {
          const key = String(skill).trim();
          if (!key) {
            return;
          }
          const base = Number(weights[skill] || 1);
          skillStats[key] = (skillStats[key] || 0) + base;
        });
      });

      const requiredSkills = Object.entries(skillStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill]) => skill);

      if (!requiredSkills.length) {
        requiredSkills.push('Problem Solving', 'Communication', 'System Design', 'SQL', 'JavaScript');
      }

      const skillWeights = {};
      requiredSkills.forEach((skill, index) => {
        skillWeights[skill] = Math.max(1, 5 - Math.floor(index / 2));
      });

      const avgGrowth = Math.round(seedRoles.reduce((sum, role) => sum + Number(role.jobMarketGrowth || 18), 0) / Math.max(1, seedRoles.length));
      const avgSalary = Math.round(seedRoles.reduce((sum, role) => sum + parseSalary(role.averageSalary), 0) / Math.max(1, seedRoles.length));
      const dominantDemand = seedRoles
        .map((role) => role.industryDemand)
        .sort((a, b) => (demandRank[b] || 0) - (demandRank[a] || 0))[0] || 'High';

      const roleId = `custom_role_${slugify(normalizedRoleName)}_${Date.now()}`;
      const customRole = await Role.create({
        roleId,
        roleName: normalizedRoleName,
        description: `Custom role generated from your search: ${normalizedRoleName}. Update your skill profile and run analysis for personalized roadmap output.`,
        requiredSkills,
        skillWeights,
        relatedRoles: seedRoles.map((role) => role.roleName).slice(0, 5),
        industryDemand: dominantDemand,
        averageSalary: avgSalary > 0 ? `$${avgSalary.toLocaleString()}` : '$120,000',
        jobMarketGrowth: Math.max(8, avgGrowth || 18),
        seniority: 'Mid-Level',
      });

      res.status(201).json({
        success: true,
        message: 'Custom role created successfully',
        data: customRole,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = RolesController;
