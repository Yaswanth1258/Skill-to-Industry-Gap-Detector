import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import SkillChip from '../components/SkillChip';
import { Plus, Save } from 'lucide-react';
import API_BASE from '../config/api';

const normalizeSkills = (skills = []) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill) => {
      if (typeof skill === 'string') {
        return { name: skill.trim(), percentage: 60 };
      }

      return {
        name: String(skill?.name || skill?.skill || '').trim(),
        percentage: Number.isFinite(Number(skill?.percentage)) ? Math.max(0, Math.min(100, Math.round(Number(skill.percentage)))) : 0,
      };
    })
    .filter((item) => item.name)
    .filter((item, index, arr) => arr.findIndex((entry) => entry.name.toLowerCase() === item.name.toLowerCase()) === index);
};

const SkillProfilePage = ({ onProfileSaved }) => {
  const [formData, setFormData] = useState({
    name: localStorage.getItem('userName') || '',
    email: localStorage.getItem('userEmail') || '',
    currentRole: '',
    experience: '',
    skills: [],
    courses: [],
    projects: [],
    interests: []
  });

  const [courseInput, setCourseInput] = useState('');
  const [projectInput, setProjectInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillPercentage, setCustomSkillPercentage] = useState('50');

  const availableSkills = [
    'Python', 'JavaScript', 'React', 'Node.js', 'Machine Learning',
    'Deep Learning', 'TensorFlow', 'PyTorch', 'SQL', 'MongoDB',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
    'Java', 'C++', 'Go', 'Rust', 'TypeScript',
    'Data Science', 'Statistics', 'NLP', 'Computer Vision', 'IoT'
  ];

  useEffect(() => {
    const loadExistingProfile = async () => {
      const studentId = localStorage.getItem('studentId');

      if (!studentId) {
        setLoadingProfile(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/student/${studentId}`);
        const payload = await response.json();

        if (!response.ok || !payload?.success || !payload?.data) {
          throw new Error(payload?.error || 'Unable to load saved profile');
        }

        const profile = payload.data;
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          currentRole: profile.currentRole || '',
          experience: profile.experience || '',
          skills: normalizeSkills(profile.skills),
          courses: Array.isArray(profile.courses) ? profile.courses : [],
          projects: Array.isArray(profile.projects) ? profile.projects : [],
          interests: Array.isArray(profile.interests) ? profile.interests : [],
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        if ((error?.message || '').toLowerCase().includes('student not found')) {
          localStorage.removeItem('studentId');
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    loadExistingProfile();
  }, []);

  const handleAddSkill = (skill) => {
    if (!formData.skills.some((entry) => entry.name.toLowerCase() === skill.toLowerCase())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { name: skill, percentage: 50 }]
      });
    }
  };

  const handleAddCustomSkill = () => {
    const skillName = customSkillName.trim();
    if (!skillName) {
      setErrorMessage('Enter a skill name to add your own skill.');
      return;
    }

    if (formData.skills.some((entry) => entry.name.toLowerCase() === skillName.toLowerCase())) {
      setErrorMessage('This skill already exists in your profile.');
      return;
    }

    const percentage = Math.max(0, Math.min(100, Number(customSkillPercentage) || 0));

    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: skillName, percentage }],
    }));
    setCustomSkillName('');
    setCustomSkillPercentage('50');
    setErrorMessage('');
  };

  const handleRemoveSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s.name !== skill)
    });
  };

  const handleSkillPercentageChange = (skillName, percentage) => {
    setFormData({
      ...formData,
      skills: formData.skills.map((skill) => {
        if (skill.name !== skillName) {
          return skill;
        }

        return {
          ...skill,
          percentage: Math.max(0, Math.min(100, Number(percentage) || 0)),
        };
      }),
    });
  };

  const handleAddCourse = () => {
    if (courseInput.trim()) {
      setFormData({
        ...formData,
        courses: [...formData.courses, courseInput]
      });
      setCourseInput('');
    }
  };

  const handleAddProject = () => {
    if (projectInput.trim()) {
      setFormData({
        ...formData,
        projects: [...formData.projects, projectInput]
      });
      setProjectInput('');
    }
  };

  const handleAddInterest = () => {
    if (interestInput.trim()) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interestInput]
      });
      setInterestInput('');
    }
  };

  const handleSaveProfile = async () => {
    setSaveMessage('');
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage('Name and email are required.');
      return;
    }

    if (!formData.skills.length) {
      setErrorMessage('Please select at least one skill.');
      return;
    }

    const studentId = localStorage.getItem('studentId');
    const requestBody = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
    };

    try {
      setSaving(true);
      let response = await fetch(studentId ? `${API_BASE}/api/student/${studentId}` : `${API_BASE}/api/student/profile`, {
        method: studentId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      let data = await response.json();

      const staleStudentId = studentId && response.status === 404 && data?.error === 'Student not found';
      if (staleStudentId) {
        localStorage.removeItem('studentId');
        response = await fetch(`${API_BASE}/api/student/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        data = await response.json();
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to save profile');
      }

      if (data?.data?.studentId) {
        localStorage.setItem('studentId', data.data.studentId);
      }

      localStorage.setItem('userName', formData.name.trim());
      localStorage.setItem('userEmail', formData.email.trim().toLowerCase());
      if (onProfileSaved) {
        onProfileSaved(formData.name.trim());
      }

      setSaveMessage('Profile saved to database successfully.');
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2800);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage(error.message || 'Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-12">
      {showSaveToast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-24 right-6 z-[70] px-5 py-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 shadow-xl"
        >
          <p className="text-sm font-bold text-emerald-700">Profile Saved Successfully</p>
          <p className="text-xs text-emerald-800/80">Your updated skill percentages are now stored and ready for analysis.</p>
        </motion.div>
      )}
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            Your Skill Profile
          </h1>
          <p className="text-gray-700 text-lg">Tell us about your skills and experience</p>
          {loadingProfile && <p className="text-sm text-slate-500 mt-2">Loading your saved profile...</p>}
          {errorMessage && <p className="text-sm text-rose-600 mt-2">{errorMessage}</p>}
          {saveMessage && <p className="text-sm text-emerald-700 mt-2">{saveMessage}</p>}
        </motion.div>

        <GlassCard strong className="p-6 md:p-8">
          {/* Basic Info */}
          <div className="space-y-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-700">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full input-glass rounded-xl px-4 py-3 placeholder:text-slate-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full input-glass rounded-xl px-4 py-3 placeholder:text-slate-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-cyan-700">Current Role</label>
                <input
                  type="text"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                  className="w-full input-glass rounded-xl px-4 py-3 placeholder:text-slate-500"
                  placeholder="e.g., Junior Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-cyan-700">Experience (Years)</label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full input-glass rounded-xl px-4 py-3 placeholder:text-slate-500"
                  placeholder="2"
                />
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-violet-700">Core Skills</h3>
            <div className="glass-card rounded-2xl p-4 mb-4 border border-violet-200/70">
              <p className="text-sm font-semibold text-violet-700 mb-3">Add your own skill</p>
              <div className="grid md:grid-cols-[1fr_140px_auto] gap-2">
                <input
                  type="text"
                  value={customSkillName}
                  onChange={(e) => setCustomSkillName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                  className="input-glass rounded-xl px-4 py-2.5 placeholder:text-slate-500"
                  placeholder="e.g., Rust, FastAPI, Power BI"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customSkillPercentage}
                  onChange={(e) => setCustomSkillPercentage(e.target.value)}
                  className="input-glass rounded-xl px-4 py-2.5 placeholder:text-slate-500"
                  placeholder="%"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-4 py-2.5 rounded-xl bg-violet-100 text-violet-700 border border-violet-300 font-semibold"
                >
                  Add Skill
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-2">Roadmap, analysis, and recommendations are generated from your saved profile skills.</p>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {availableSkills.map(skill => (
                <motion.button
                  key={skill}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddSkill(skill)}
                  className={`
                    px-4 py-2 rounded-xl transition-all text-sm font-medium border
                    ${formData.skills.some((entry) => entry.name.toLowerCase() === skill.toLowerCase())
                      ? 'bg-violet-100 border-violet-300 text-violet-700 shadow-sm'
                      : 'bg-white/70 border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50'
                    }
                  `}
                >
                  {formData.skills.some((entry) => entry.name.toLowerCase() === skill.toLowerCase()) && <span className="mr-1">✓</span>}
                  {skill}
                </motion.button>
              ))}
            </div>
            <div className="space-y-4">
              {formData.skills.map((skill) => (
                <div key={skill.name} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <SkillChip
                      label={`${skill.name} ${skill.percentage}%`}
                      variant="blue"
                      removable
                      onRemove={() => handleRemoveSkill(skill.name)}
                    />
                    <span className="text-sm font-semibold text-violet-700">{skill.percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skill.percentage}
                    onChange={(e) => handleSkillPercentageChange(skill.name, e.target.value)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-700">Courses Completed</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                className="flex-1 input-glass rounded-xl px-4 py-3 placeholder:text-slate-500"
                placeholder="e.g., Advanced React Course"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddCourse}
                className="px-4 py-2 rounded-xl bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200 transition"
              >
                <Plus size={20} />
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.courses.map((course, idx) => (
                <SkillChip
                  key={idx}
                  label={course}
                  variant="purple"
                  removable
                  onRemove={() => setFormData({
                    ...formData,
                    courses: formData.courses.filter((_, i) => i !== idx)
                  })}
                />
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-emerald-700">Projects</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                className="flex-1 input-glass rounded-xl px-4 py-3 placeholder:text-slate-500"
                placeholder="e.g., AI Chatbot Project"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddProject}
                className="px-4 py-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 hover:bg-emerald-200 transition"
              >
                <Plus size={20} />
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.projects.map((project, idx) => (
                <SkillChip
                  key={idx}
                  label={project}
                  variant="cyan"
                  removable
                  onRemove={() => setFormData({
                    ...formData,
                    projects: formData.projects.filter((_, i) => i !== idx)
                  })}
                />
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-rose-700">Career Interests</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                className="flex-1 input-glass rounded-xl px-4 py-3 placeholder:text-slate-500"
                placeholder="e.g., Data Science"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddInterest}
                className="px-4 py-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 hover:bg-rose-200 transition"
              >
                <Plus size={20} />
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest, idx) => (
                <SkillChip
                  key={idx}
                  label={interest}
                  variant="pink"
                  removable
                  onRemove={() => setFormData({
                    ...formData,
                    interests: formData.interests.filter((_, i) => i !== idx)
                  })}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full px-8 py-4 glow-button text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Profile'}
          </motion.button>
        </GlassCard>
      </div>
    </div>
  );
};

export default SkillProfilePage;
