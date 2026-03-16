/**
 * Student Controller
 * Handles student profile operations
 */

const Student = require('../models/Student');

const normalizeSkills = (skills = []) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill) => {
      if (typeof skill === 'string') {
        return {
          name: skill.trim(),
          percentage: 60,
        };
      }

      const name = String(skill?.name || skill?.skill || '').trim();
      const percentage = Number(skill?.percentage);

      return {
        name,
        percentage: Number.isFinite(percentage)
          ? Math.max(0, Math.min(100, Math.round(percentage)))
          : 0,
      };
    })
    .filter((item) => item.name)
    .filter((item, index, arr) => arr.findIndex((entry) => entry.name.toLowerCase() === item.name.toLowerCase()) === index);
};

class StudentController {
  static async login(req, res) {
    try {
      const { email, name } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      let student = await Student.findOne({ email: normalizedEmail });

      if (!student) {
        const studentId = `student_${Date.now()}`;
        student = await Student.create({
          studentId,
          name: String(name || normalizedEmail.split('@')[0]).trim(),
          email: normalizedEmail,
          skills: [],
        });
      } else if (name && String(name).trim() && student.name !== String(name).trim()) {
        student.name = String(name).trim();
        await student.save();
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          studentId: student.studentId,
          name: student.name,
          email: student.email,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createProfile(req, res) {
    try {
      const { name, email, skills, courses, projects, interests, currentRole, experience, selectedRoleId } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedSkills = normalizeSkills(skills);
      const existingStudent = await Student.findOne({ email: normalizedEmail });

      if (existingStudent) {
        existingStudent.name = name;
        existingStudent.skills = normalizedSkills;
        existingStudent.courses = courses || [];
        existingStudent.projects = projects || [];
        existingStudent.interests = interests || [];
        existingStudent.currentRole = currentRole || '';
        existingStudent.experience = experience || '';
        existingStudent.selectedRoleId = selectedRoleId || existingStudent.selectedRoleId || '';
        await existingStudent.save();

        return res.json({
          success: true,
          message: 'Student profile updated',
          data: existingStudent
        });
      }

      const studentId = `student_${Date.now()}`;
      const studentProfile = await Student.create({
        studentId,
        name,
        email: normalizedEmail,
        skills: normalizedSkills,
        courses: courses || [],
        projects: projects || [],
        interests: interests || [],
        currentRole: currentRole || '',
        experience: experience || '',
        selectedRoleId: selectedRoleId || '',
      });

      res.status(201).json({
        success: true,
        message: 'Student profile created',
        data: studentProfile
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProfile(req, res) {
    try {
      const { studentId } = req.params;
      const studentProfile = await Student.findOne({ studentId }).lean();

      if (!studentProfile) {
        return res.status(404).json({ error: 'Student not found' });
      }

      res.json({
        success: true,
        data: studentProfile
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { studentId } = req.params;
      const updateData = req.body;

      if (updateData.email) {
        updateData.email = String(updateData.email).trim().toLowerCase();
      }

      if (updateData.skills) {
        updateData.skills = normalizeSkills(updateData.skills);
      }

      const updatedStudent = await Student.findOneAndUpdate(
        { studentId },
        { $set: updateData },
        { new: true }
      ).lean();

      if (!updatedStudent) {
        const hasCreatePayload =
          typeof updateData.name === 'string' && updateData.name.trim() &&
          typeof updateData.email === 'string' && updateData.email.trim();

        if (!hasCreatePayload) {
          return res.status(404).json({ error: 'Student not found' });
        }

        const normalizedEmail = String(updateData.email).trim().toLowerCase();

        const existingByEmail = await Student.findOne({ email: normalizedEmail });
        if (existingByEmail) {
          existingByEmail.name = String(updateData.name).trim();
          if (updateData.currentRole !== undefined) {
            existingByEmail.currentRole = updateData.currentRole || '';
          }
          if (updateData.experience !== undefined) {
            existingByEmail.experience = updateData.experience || '';
          }
          if (updateData.selectedRoleId !== undefined) {
            existingByEmail.selectedRoleId = updateData.selectedRoleId || '';
          }
          if (updateData.skills) {
            existingByEmail.skills = updateData.skills;
          }
          if (updateData.courses) {
            existingByEmail.courses = updateData.courses;
          }
          if (updateData.projects) {
            existingByEmail.projects = updateData.projects;
          }
          if (updateData.interests) {
            existingByEmail.interests = updateData.interests;
          }

          await existingByEmail.save();

          return res.json({
            success: true,
            message: 'Student profile updated',
            data: existingByEmail.toObject(),
          });
        }

        const createdStudent = await Student.create({
          studentId,
          name: String(updateData.name).trim(),
          email: normalizedEmail,
          currentRole: updateData.currentRole || '',
          experience: updateData.experience || '',
          selectedRoleId: updateData.selectedRoleId || '',
          skills: updateData.skills || [],
          courses: updateData.courses || [],
          projects: updateData.projects || [],
          interests: updateData.interests || [],
        });

        return res.status(201).json({
          success: true,
          message: 'Student profile created',
          data: createdStudent.toObject(),
        });
      }

      res.json({
        success: true,
        message: 'Student profile updated',
        data: updatedStudent
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = StudentController;
