import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import API_BASE from '../config/api';

const SkillGapDashboard = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSkills, setSavingSkills] = useState(false);

  // initializeDashboard is intentionally run once on page mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    const studentId = localStorage.getItem('studentId');
    const roleId = localStorage.getItem('selectedRoleId');

    if (!studentId || !roleId) {
      alert('Please complete your profile and select a role first!');
      setLoading(false);
      return;
    }

    await Promise.all([fetchStudentProfile(studentId), fetchAnalysis(studentId, roleId)]);
  };

  const fetchStudentProfile = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/student/${studentId}`);
      const payload = await response.json();
      if (response.ok && payload?.success) {
        setStudentProfile(payload.data);
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
    }
  };

  const fetchAnalysis = async (studentIdArg, roleIdArg) => {
    try {
      const studentId = studentIdArg || localStorage.getItem('studentId');
      const roleId = roleIdArg || localStorage.getItem('selectedRoleId');

      if (!studentId || !roleId) {
        alert('Please complete your profile and select a role first!');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, roleId })
      });

      const data = await response.json();
      if (response.ok && data?.success) {
        setAnalysis(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setLoading(false);
    }
  };

  const handleSkillPercentageChange = (skillName, percentage) => {
    if (!studentProfile) {
      return;
    }

    setStudentProfile({
      ...studentProfile,
      skills: (studentProfile.skills || []).map((skill) => {
        const name = typeof skill === 'string' ? skill : skill.name;
        const value = typeof skill === 'string' ? 60 : Number(skill.percentage || 0);

        if (name !== skillName) {
          return typeof skill === 'string' ? { name, percentage: value } : skill;
        }

        return {
          name,
          percentage: Math.max(0, Math.min(100, Number(percentage) || 0)),
        };
      }),
    });
  };

  const saveSkillPercentages = async () => {
    const studentId = localStorage.getItem('studentId');
    const roleId = localStorage.getItem('selectedRoleId');

    if (!studentId || !roleId || !studentProfile) {
      return;
    }

    try {
      setSavingSkills(true);
      await fetch(`${API_BASE}/api/student/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: studentProfile.skills || [] }),
      });

      await fetchAnalysis(studentId, roleId);
    } catch (error) {
      console.error('Error saving skill percentages:', error);
    } finally {
      setSavingSkills(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your skills...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GlassCard className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">No Analysis Found</h2>
          <p className="text-gray-600 mb-6">Please create a profile and select a role to see analysis</p>
          <AnimatedButton onClick={() => navigate('/skill-profile')}>Get Started</AnimatedButton>
        </GlassCard>
      </div>
    );
  }

  // Prepare chart data
  const skillComparisonData = [
    {
      name: 'Matched',
      value: analysis.matchedSkills?.length || 0,
      fill: '#0ff0fc'
    },
    {
      name: 'Weak',
      value: analysis.weakSkills?.length || 0,
      fill: '#ffc107'
    },
    {
      name: 'Missing',
      value: analysis.missingSkills?.length || 0,
      fill: '#ff006e'
    }
  ];

  const readinessData = [
    { name: 'Current', value: analysis.readinessScore || 0 },
    { name: 'Target', value: 100 }
  ];

  return (
    <div className="pb-12 px-1">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">{analysis.roleName}</h1>
          <p className="text-gray-700 text-lg">Comprehensive skill gap analysis</p>
        </motion.div>

        {/* Main KPIs */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard strong className="text-center p-6">
              <div className="text-4xl font-bold text-blue-700 mb-2">
                {analysis.matchPercentage}%
              </div>
              <p className="text-gray-600">Match Score</p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard strong className="text-center p-6">
              <div className="text-4xl font-bold text-cyan-700 mb-2">
                {analysis.readinessScore}%
              </div>
              <p className="text-gray-600">Readiness</p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard strong className="text-center p-6">
              <div className="text-4xl font-bold text-rose-700 mb-2">
                {analysis.estimatedMonthsToReady}
              </div>
              <p className="text-gray-600">Months to Ready</p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <GlassCard strong className="text-center p-6">
              <div className="text-2xl font-bold text-violet-700 mb-2">
                {analysis.readinessLevel}
              </div>
              <p className="text-gray-600">Status</p>
            </GlassCard>
          </motion.div>
        </div>

        {studentProfile?.skills?.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <GlassCard strong className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-blue-700">Your Skill Levels</h2>
                <AnimatedButton onClick={saveSkillPercentages} loading={savingSkills} className="text-sm px-4 py-2">
                  Save and Re-Analyze
                </AnimatedButton>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {(studentProfile.skills || []).map((skill, index) => {
                  const name = typeof skill === 'string' ? skill : skill.name;
                  const percentage = typeof skill === 'string' ? 60 : Number(skill.percentage || 0);

                  return (
                    <div key={`${name}-${index}`} className="rounded-xl border border-slate-200 bg-white/60 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-slate-800">{name}</p>
                        <p className="text-sm font-semibold text-violet-700">{percentage}%</p>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) => handleSkillPercentageChange(name, e.target.value)}
                        className="w-full"
                      />
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Skill Distribution */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <GlassCard strong className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-blue-700">Skill Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={skillComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.15)" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(148, 163, 184, 0.45)', borderRadius: '12px' }}
                    cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
                  />
                  <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>

          {/* Readiness Progress */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <GlassCard strong className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-violet-700">Career Readiness</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={readinessData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.15)" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(148, 163, 184, 0.45)', borderRadius: '12px' }}
                    cursor={{ stroke: 'rgba(124, 58, 237, 0.2)' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} dot={{ fill: '#7c3aed', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>
        </div>

        {/* Skills Breakdown */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Matched Skills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <GlassCard strong className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="text-emerald-600" size={24} />
                <h3 className="text-xl font-bold text-emerald-700">
                  Matched ({analysis.matchedSkills?.length})
                </h3>
              </div>
              <div className="space-y-2">
                {analysis.matchedSkills?.map((skill, idx) => (
                  <div key={idx} className="px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-emerald-700 font-semibold text-sm">{skill.skill}</p>
                    <p className="text-emerald-700/80 text-xs">Your {skill.userPercentage || 0}% / Target {skill.targetPercentage || 80}%</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Weak Skills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <GlassCard strong className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="text-amber-600" size={24} />
                <h3 className="text-xl font-bold text-amber-700">
                  Weak ({analysis.weakSkills?.length})
                </h3>
              </div>
              <div className="space-y-2">
                {analysis.weakSkills?.map((skill, idx) => (
                  <div key={idx} className="px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-amber-700 font-semibold text-sm">{skill.skill}</p>
                    <p className="text-gray-600 text-xs">Related: {skill.relatedSkill}</p>
                    <p className="text-amber-700/80 text-xs">Your {skill.userPercentage || 0}% / Target {skill.targetPercentage || 80}%</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Missing Skills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <GlassCard strong className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-rose-600" size={24} />
                <h3 className="text-xl font-bold text-rose-700">
                  Missing ({analysis.missingSkills?.length})
                </h3>
              </div>
              <div className="space-y-2">
                {analysis.missingSkills?.map((skill, idx) => (
                  <div key={idx} className="px-3 py-2 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="text-rose-700 font-semibold text-sm">{skill.skill}</p>
                    <p className="text-rose-700/80 text-xs">Your {skill.userPercentage || 0}% / Target {skill.targetPercentage || 80}%</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Industry Insights */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8">
          <GlassCard strong className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-600 text-sm mb-2">INDUSTRY DEMAND</p>
                <p className="text-2xl font-bold text-blue-700">{analysis.industryDemand}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-2">AVERAGE SALARY</p>
                <p className="text-2xl font-bold text-violet-700">{analysis.averageSalary}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-2">MARKET GROWTH</p>
                <p className="text-2xl font-bold text-emerald-700">+{analysis.jobMarketGrowth}%</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 flex gap-4">
          <AnimatedButton className="w-full flex-1" onClick={() => navigate('/roadmap')}>Get Learning Roadmap</AnimatedButton>
          <AnimatedButton variant="outline" className="w-full flex-1" onClick={() => navigate('/roles')}>Explore Other Roles</AnimatedButton>
        </motion.div>
      </div>
    </div>
  );
};

export default SkillGapDashboard;
