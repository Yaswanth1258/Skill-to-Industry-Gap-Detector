import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Lightbulb, Award, Briefcase, Target, ArrowUpRight } from 'lucide-react';
import API_BASE from '../config/api';

const CareerInsights = () => {
  const [insights, setInsights] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const studentId = localStorage.getItem('studentId');
        if (!studentId) {
          setError('Please create your profile to view career insights.');
          setLoading(false);
          return;
        }

        const [insightsResponse, analysisResponse, profileResponse] = await Promise.all([
          fetch(`${API_BASE}/api/insights/${studentId}`),
          fetch(`${API_BASE}/api/analysis/student/${studentId}`),
          fetch(`${API_BASE}/api/student/${studentId}`),
        ]);

        const payload = await insightsResponse.json();
        const analysisPayload = await analysisResponse.json();
        const profilePayload = await profileResponse.json();

        if (!insightsResponse.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to fetch insights');
        }

        setInsights(payload.data);
        if (analysisResponse.ok && analysisPayload?.success && Array.isArray(analysisPayload?.data)) {
          setLatestAnalysis(analysisPayload.data[0] || null);
        }

        if (profileResponse.ok && profilePayload?.success) {
          setStudentProfile(profilePayload.data || null);
        }

        const selectedRoleId = localStorage.getItem('selectedRoleId');
        const latestForSelectedRole = selectedRoleId
          ? (analysisPayload?.data || []).find((item) => item.roleId === selectedRoleId)
          : null;
        const roleIdToLoad = selectedRoleId || latestForSelectedRole?.roleId || analysisPayload?.data?.[0]?.roleId;

        if (roleIdToLoad) {
          const roleResponse = await fetch(`${API_BASE}/api/roles/${roleIdToLoad}`);
          const rolePayload = await roleResponse.json();
          if (roleResponse.ok && rolePayload?.success) {
            setSelectedRole(rolePayload.data);
          }
        }
      } catch (err) {
        setError(err.message || 'Unable to load insights.');
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  const skillTrends = useMemo(() => {
    if (!insights?.marketAnalysis?.topInDemandSkills) {
      return [];
    }
    return insights.marketAnalysis.topInDemandSkills.slice(0, 8);
  }, [insights]);

  const skillComparisonData = useMemo(() => {
    const mapped = [];
    const studentSkills = Array.isArray(studentProfile?.skills) ? studentProfile.skills : [];

    const normalize = (value) => String(value || '').trim().toLowerCase();
    const getSkillPercentage = (requiredSkill) => {
      const normalizedRequired = normalize(requiredSkill);
      if (!normalizedRequired) {
        return 0;
      }

      const match = studentSkills.find((skill) => {
        const skillName = typeof skill === 'string' ? skill : skill?.name;
        const normalizedStudentSkill = normalize(skillName);
        return normalizedStudentSkill === normalizedRequired
          || normalizedStudentSkill.includes(normalizedRequired)
          || normalizedRequired.includes(normalizedStudentSkill);
      });

      if (!match) {
        return 0;
      }

      if (typeof match === 'string') {
        return 60;
      }

      return Math.max(0, Math.min(100, Number(match.percentage) || 0));
    };

    const pushSkill = (skill, userLevel, targetLevel) => {
      if (!skill) {
        return;
      }
      const normalized = String(skill).trim();
      if (!normalized) {
        return;
      }

      if (mapped.some((item) => item.skill.toLowerCase() === normalized.toLowerCase())) {
        return;
      }

      mapped.push({
        skill: normalized,
        user: Math.max(0, Math.min(100, userLevel)),
        target: Math.max(0, Math.min(100, targetLevel)),
      });
    };

    if (selectedRole?.requiredSkills?.length) {
      const weights = selectedRole?.skillWeights || {};
      const maxWeight = Math.max(
        1,
        ...selectedRole.requiredSkills.map((skill) => Number(weights?.[skill] || 1))
      );

      selectedRole.requiredSkills.slice(0, 5).forEach((requiredSkill) => {
        const weight = Number(weights?.[requiredSkill] || 1);
        const targetFromWeight = Math.round(55 + (weight / maxWeight) * 35);
        const userFromProfile = getSkillPercentage(requiredSkill);
        pushSkill(requiredSkill, userFromProfile, targetFromWeight);
      });
    }

    const matchedSet = new Set((latestAnalysis?.matchedSkills || []).map((item) => normalize(item.skill || item)));
    const weakSet = new Set((latestAnalysis?.weakSkills || []).map((item) => normalize(item.skill || item)));
    const missingSet = new Set((latestAnalysis?.missingSkills || []).map((item) => normalize(item.skill || item)));

    mapped.forEach((item) => {
      const normalizedSkill = normalize(item.skill);
      const matchedItem = (latestAnalysis?.matchedSkills || []).find((entry) => normalize(entry.skill || entry) === normalizedSkill);
      const weakItem = (latestAnalysis?.weakSkills || []).find((entry) => normalize(entry.skill || entry) === normalizedSkill);
      const missingItem = (latestAnalysis?.missingSkills || []).find((entry) => normalize(entry.skill || entry) === normalizedSkill);

      if (matchedSet.has(normalizedSkill)) {
        item.user = Math.max(item.user, Number(matchedItem?.userPercentage || 80));
        item.target = Math.max(item.target, Number(matchedItem?.targetPercentage || 90));
      } else if (weakSet.has(normalizedSkill)) {
        item.user = Math.max(item.user, Number(weakItem?.userPercentage || 45));
        item.target = Math.max(item.target, Number(weakItem?.targetPercentage || 80));
      } else if (missingSet.has(normalizedSkill)) {
        item.user = Math.min(item.user, Number(missingItem?.userPercentage || 20));
        item.target = Math.max(item.target, Number(missingItem?.targetPercentage || 70));
      }
    });

    (latestAnalysis?.matchedSkills || []).slice(0, 2).forEach((item) => pushSkill(item.skill || item, item.userPercentage || 80, item.targetPercentage || 90));
    (latestAnalysis?.weakSkills || []).slice(0, 2).forEach((item) => pushSkill(item.skill || item, item.userPercentage || 45, item.targetPercentage || 80));
    (latestAnalysis?.missingSkills || []).slice(0, 2).forEach((item) => pushSkill(item.skill || item, item.userPercentage || 20, item.targetPercentage || 70));

    if (mapped.length < 5) {
      (insights?.marketAnalysis?.topInDemandSkills || []).forEach((item) => {
        if (mapped.length >= 5) {
          return;
        }
        pushSkill(item.skill, Math.max(20, Math.round((item.percentage || 50) * 0.55)), Math.min(98, (item.percentage || 70) + 15));
      });
    }

    return mapped.slice(0, 5);
  }, [latestAnalysis, insights, selectedRole, studentProfile]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass-card-strong rounded-3xl p-10 text-center">
          <div className="w-14 h-14 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Analyzing market trends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card-strong rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold gradient-text mb-3">Insights Unavailable</h2>
          <p className="text-gray-600 mb-5">{error}</p>
          <a href="/skill-profile" className="glow-button inline-flex px-6 py-3 rounded-xl text-white font-semibold">
            Complete Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3">Career Insights</h2>
        <p className="text-gray-600">Live readiness and market demand intelligence for your profile</p>
      </div>

      <div className="grid md:grid-cols-4 gap-5 mb-8">
        <div className="glass-card-strong rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">CAREER READINESS</p>
          <p className="text-2xl font-bold text-violet-700">{insights?.careerReadiness?.overall || 0}%</p>
        </div>
        <div className="glass-card-strong rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">TECHNICAL MATCH</p>
          <p className="text-2xl font-bold text-blue-700">{insights?.careerReadiness?.technical || 0}%</p>
        </div>
        <div className="glass-card-strong rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">AVG SALARY</p>
          <p className="text-2xl font-bold text-pink-700">{insights?.marketAnalysis?.averageSalary || '$0'}</p>
        </div>
        <div className="glass-card-strong rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">MARKET TREND</p>
          <p className="text-2xl font-bold text-cyan-700">{insights?.marketAnalysis?.careerGrowthTrend || 'Unknown'}</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6 mb-8">
        <div className="glass-card-strong rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-blue-700" size={22} />
            <h3 className="text-xl font-bold text-gray-800">Skill Comparison</h3>
          </div>

          <div className="space-y-5">
            {skillComparisonData.map((item, idx) => {
              const barWidth = Math.max(8, item.user);
              return (
                <motion.div
                  key={`${item.skill}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-slate-800">{item.skill}</p>
                    <p className="text-xs font-medium text-slate-600">Your {item.user}% / Req {item.target}%</p>
                  </div>

                  <div className="relative h-4 rounded-full bg-slate-200/80 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.08 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-rose-500"
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-white/90 shadow"
                      style={{ left: `${item.target}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="glass-card-strong rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-violet-700" size={22} />
            <h3 className="text-xl font-bold text-gray-800">Skills Radar</h3>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillComparisonData} outerRadius="72%">
                <PolarGrid stroke="rgba(100, 116, 139, 0.35)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#334155', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: 'rgba(37, 99, 235, 0.25)', strokeWidth: 1 }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.4)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
                  }}
                  labelStyle={{ color: '#1e293b', fontWeight: 700 }}
                  formatter={(value, name) => [`${value}%`, name]}
                />
                <Radar
                  name="Your Profile"
                  dataKey="user"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
                <Radar
                  name={latestAnalysis?.roleName ? `Role Target (${latestAnalysis.roleName})` : 'Role Target'}
                  dataKey="target"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.2}
                  strokeDasharray="4 4"
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 mt-3 mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Your Profile
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold border border-violet-200">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              {latestAnalysis?.roleName ? `Role Target (${latestAnalysis.roleName})` : 'Role Target'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {skillComparisonData.map((item) => (
              <div key={`mini-${item.skill}`} className="rounded-xl border border-slate-200 bg-white/55 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">{item.skill}</p>
                <p className="text-xs text-slate-600">Hover radar to view percentages</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card-strong rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <TrendingUp className="text-violet-600" size={22} />
            <h3 className="text-xl font-bold text-gray-800">Top Demanding Roles</h3>
          </div>
          <div className="space-y-3">
            {(insights?.marketAnalysis?.topDemandingRoles || []).map((role, idx) => (
              <motion.div
                key={`${role.roleName}-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="glass-card rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-800">{role.roleName}</p>
                  <p className="text-xs text-gray-500">{role.demand} demand</p>
                  {typeof role.readiness === 'number' && (
                    <p className="text-xs text-blue-700">Your readiness: {role.readiness}% | Fit: {role.fitScore || 0}%</p>
                  )}
                </div>
                <p className="text-violet-700 font-bold">{role.growth}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card-strong rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Target className="text-cyan-600" size={22} />
            <h3 className="text-xl font-bold text-gray-800">In-Demand Skills</h3>
          </div>
          <div className="space-y-3">
            {skillTrends.map((skill, idx) => (
              <div key={`${skill.skill}-${idx}`}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                  <span className="text-sm font-semibold text-violet-700">{skill.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="progress-bar h-2" style={{ width: `${skill.percentage}%` }} />
                </div>
                {(typeof skill.userPercentage === 'number' || typeof skill.gap === 'number') && (
                  <p className="text-[11px] text-slate-500 mt-1">Your skill: {skill.userPercentage || 0}% | Gap: {skill.gap || 0}%</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card-strong rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Lightbulb className="text-yellow-600" size={22} />
            <h3 className="text-xl font-bold text-gray-800">Focus Areas</h3>
          </div>
          <div className="space-y-3">
            {(insights?.recommendations?.focusAreas || []).map((item, idx) => (
              <div key={`${item}-${idx}`} className="glass-card rounded-xl p-3 flex items-center justify-between">
                <span className="text-gray-700 font-medium">{item}</span>
                <ArrowUpRight size={16} className="text-violet-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-strong rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Award className="text-pink-600" size={22} />
            <h3 className="text-xl font-bold text-gray-800">Recommended Certifications</h3>
          </div>
          <div className="space-y-3">
            {(insights?.recommendations?.certifications || []).map((cert, idx) => (
              <div key={`${cert}-${idx}`} className="glass-card rounded-xl p-3">
                <span className="text-gray-700 font-medium">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card-strong rounded-3xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Briefcase className="text-blue-600" size={22} />
          <h3 className="text-xl font-bold text-gray-800">Industry Outlook</h3>
        </div>
        <p className="text-gray-700">{insights?.marketAnalysis?.industryOutlook || 'No outlook available'}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <a href="/roadmap" className="glow-button px-8 py-3 rounded-2xl text-white font-semibold inline-flex items-center gap-2">
          Continue Learning Path
        </a>
        <a href="/roles" className="glass-card-strong px-8 py-3 rounded-2xl text-gray-700 font-semibold hover:glow-border transition-all">
          Explore Roles
        </a>
      </div>
    </div>
  );
};

export default CareerInsights;
