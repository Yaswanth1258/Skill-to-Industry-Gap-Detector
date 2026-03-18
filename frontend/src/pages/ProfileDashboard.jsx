import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Trophy, Target, TrendingUp, CheckCircle2, ListChecks } from 'lucide-react';
import API_BASE from '../config/api';

const ProfileDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const studentId = localStorage.getItem('studentId');
        if (!studentId) {
          setError('Please login and create your profile first.');
          setLoading(false);
          return;
        }

        const [profileResponse, roadmapResponse, analysisResponse] = await Promise.all([
          fetch(`${API_BASE}/api/student/${studentId}`),
          fetch(`${API_BASE}/api/roadmap/student/${studentId}`),
          fetch(`${API_BASE}/api/analysis/student/${studentId}`),
        ]);

        const profilePayload = await profileResponse.json();
        const roadmapPayload = await roadmapResponse.json();
        const analysisPayload = await analysisResponse.json();

        if (!profileResponse.ok || !profilePayload?.success) {
          throw new Error(profilePayload?.error || 'Unable to load student profile');
        }

        setStudent(profilePayload.data || null);
        setRoadmaps(Array.isArray(roadmapPayload?.data) ? roadmapPayload.data : []);
        setAnalyses(Array.isArray(analysisPayload?.data) ? analysisPayload.data : []);
      } catch (err) {
        setError(err.message || 'Unable to load profile dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const roadmapProgress = useMemo(() => {
    return roadmaps.map((roadmap) => {
      const totalTopics = Array.isArray(roadmap.topics) ? roadmap.topics.length : 0;
      const completedTopics = Array.isArray(roadmap.topicProgress)
        ? roadmap.topicProgress.filter((item) => item.completed).length
        : 0;
      const completion = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      return {
        roadmapId: roadmap.roadmapId,
        roleName: roadmap.roleName || 'Selected role',
        totalTopics,
        completedTopics,
        completion,
      };
    });
  }, [roadmaps]);

  const completedRoadmapsCount = useMemo(() => {
    return roadmapProgress.filter((item) => item.completion >= 100).length;
  }, [roadmapProgress]);

  const completedRoadmapSkills = useMemo(() => {
    const completedSkillSet = new Set();

    roadmaps.forEach((roadmap) => {
      const topicProgress = Array.isArray(roadmap.topicProgress) ? roadmap.topicProgress : [];
      topicProgress
        .filter((item) => item.completed)
        .forEach((item) => completedSkillSet.add(String(item.topic || '').trim()));
    });

    return [...completedSkillSet].filter(Boolean);
  }, [roadmaps]);

  const skillImprovement = useMemo(() => {
    if (!analyses.length) {
      return {
        readinessDelta: 0,
        matchDelta: 0,
        hasTrend: false,
      };
    }

    const ordered = [...analyses].sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));
    const first = ordered[0];
    const latest = ordered[ordered.length - 1];

    return {
      readinessDelta: Math.round((latest?.readinessScore || 0) - (first?.readinessScore || 0)),
      matchDelta: Math.round((latest?.matchPercentage || 0) - (first?.matchPercentage || 0)),
      hasTrend: ordered.length > 1,
    };
  }, [analyses]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass-card-strong rounded-3xl p-10 text-center">
          <div className="w-14 h-14 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card-strong rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold gradient-text mb-3">Profile Dashboard Unavailable</h2>
          <p className="text-gray-600 mb-5">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/skill-profile')}
            className="glow-button inline-flex px-6 py-3 rounded-xl text-white font-semibold"
          >
            Go To Skill Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">My Profile Dashboard</h1>
        <p className="text-slate-700">Track your skills, roadmap generation, and completion-driven improvement.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="glass-card-strong rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">PROFILE NAME</p>
          <p className="text-lg font-bold text-blue-700 flex items-center gap-2"><User size={18} />{student?.name || 'Student'}</p>
        </div>
        <div className="glass-card-strong rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">ROADMAPS GENERATED</p>
          <p className="text-2xl font-bold text-violet-700">{roadmaps.length}</p>
        </div>
        <div className="glass-card-strong rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">COMPLETED ROADMAPS</p>
          <p className="text-2xl font-bold text-emerald-700">{completedRoadmapsCount}</p>
        </div>
        <div className="glass-card-strong rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">SKILLS IMPROVEMENT</p>
          <p className="text-lg font-bold text-rose-700">
            {skillImprovement.hasTrend ? `${skillImprovement.readinessDelta >= 0 ? '+' : ''}${skillImprovement.readinessDelta}% readiness` : 'Not enough analysis data'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-blue-700" size={20} />
            <h2 className="text-xl font-bold text-slate-800">Your Skills</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(student?.skills || []).map((skill, idx) => {
              const name = typeof skill === 'string' ? skill : skill.name;
              const percentage = typeof skill === 'string' ? 60 : Number(skill.percentage || 0);
              return (
                <span
                  key={`${name}-${idx}`}
                  className="px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold"
                >
                  {name} {percentage}%
                </span>
              );
            })}
            {!(student?.skills || []).length && (
              <p className="text-sm text-slate-600">No skills saved yet. Add skills in Skill Profile.</p>
            )}
          </div>
        </div>

        <div className="glass-card-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-violet-700" size={20} />
            <h2 className="text-xl font-bold text-slate-800">Improvement Snapshot</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3">
              <p className="text-xs text-slate-600 mb-1">READINESS CHANGE</p>
              <p className="font-semibold text-violet-700">
                {skillImprovement.hasTrend ? `${skillImprovement.readinessDelta >= 0 ? '+' : ''}${skillImprovement.readinessDelta}%` : 'Run at least 2 analyses'}
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
              <p className="text-xs text-slate-600 mb-1">MATCH SCORE CHANGE</p>
              <p className="font-semibold text-rose-700">
                {skillImprovement.hasTrend ? `${skillImprovement.matchDelta >= 0 ? '+' : ''}${skillImprovement.matchDelta}%` : 'Run at least 2 analyses'}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <p className="text-xs text-slate-600 mb-1">ANALYSES TRACKED</p>
              <p className="font-semibold text-emerald-700">{analyses.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card-strong rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="text-cyan-700" size={20} />
          <h2 className="text-xl font-bold text-slate-800">Generated Roadmaps & Completion</h2>
        </div>
        <div className="space-y-3">
          {roadmapProgress.map((item) => (
            <div key={item.roadmapId} className="rounded-xl border border-slate-200 bg-white/65 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="font-semibold text-slate-800">{item.roleName}</p>
                <p className="text-xs font-semibold text-violet-700">{item.completedTopics}/{item.totalTopics} topics</p>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="progress-bar h-2" style={{ width: `${item.completion}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-600">Completion: {item.completion}%</span>
                {item.completion >= 100 && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 size={14} /> Completed
                  </span>
                )}
              </div>
            </div>
          ))}
          {!roadmapProgress.length && (
            <p className="text-sm text-slate-600">No roadmaps generated yet. Generate one from the Roadmap page.</p>
          )}
        </div>
      </div>

      <div className="glass-card-strong rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-amber-600" size={20} />
          <h2 className="text-xl font-bold text-slate-800">Completed Roadmap Skills</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {completedRoadmapSkills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-semibold"
            >
              {skill}
            </span>
          ))}
          {!completedRoadmapSkills.length && (
            <p className="text-sm text-slate-600">Complete roadmap topics to see finished skills here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard;
