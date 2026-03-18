import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Code2, Award, Clock, Sparkles, Target, CheckCircle2, Circle, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';
import API_BASE from '../config/api';

const AIRoadmap = () => {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topicProgressMap, setTopicProgressMap] = useState({});
  const [topicNotes, setTopicNotes] = useState({});
  const [savingTopicKey, setSavingTopicKey] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [expandedTopicKey, setExpandedTopicKey] = useState('');

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const studentId = localStorage.getItem('studentId');
        const roleId = localStorage.getItem('selectedRoleId');

        if (!studentId || !roleId) {
          setError('Please complete your profile and select a role first.');
          setLoading(false);
          return;
        }

        const existingResponse = await fetch(`${API_BASE}/api/roadmap/student/${studentId}`);
        const existingPayload = await existingResponse.json();
        const existingRoadmaps = existingPayload?.data || [];

        const existingForRole = existingRoadmaps.find((item) => item.roleId === roleId);
        const hasRichModules = existingForRole
          && Array.isArray(existingForRole.topics)
          && existingForRole.topics.length >= 8
          && existingForRole.topics.some((topic) => topic.moduleDescription || (topic.learningObjectives || []).length);

        if (hasRichModules) {
          setRoadmap(existingForRole);
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/roadmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, roleId }),
        });

        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to generate roadmap');
        }

        setRoadmap(payload.data);
      } catch (err) {
        setError(err.message || 'Unable to generate roadmap.');
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, []);

  useEffect(() => {
    if (!roadmap?.topicProgress) {
      setTopicProgressMap({});
      setTopicNotes({});
      return;
    }

    const progressMap = {};
    const notesMap = {};

    roadmap.topicProgress.forEach((entry) => {
      const key = `${entry.sequence || 0}:${entry.topic}`;
      progressMap[key] = Boolean(entry.completed);
      notesMap[key] = entry.note || '';
    });

    setTopicProgressMap(progressMap);
    setTopicNotes(notesMap);
  }, [roadmap]);

  const timeline = useMemo(() => {
    if (!roadmap?.topics) {
      return [];
    }

    return [...roadmap.topics]
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
      .map((topic, index) => ({
        ...topic,
        phase: index + 1,
        monthLabel: `Phase ${index + 1}`,
      }));
  }, [roadmap]);

  const completedCount = useMemo(() => {
    return timeline.filter((topic) => topicProgressMap[`${topic.sequence || 0}:${topic.topic}`]).length;
  }, [timeline, topicProgressMap]);

  const completionPercentage = timeline.length
    ? Math.round((completedCount / timeline.length) * 100)
    : 0;

  const saveTopicProgress = async (topic, updates) => {
    if (!roadmap?.roadmapId) {
      return;
    }

    const studentId = localStorage.getItem('studentId');
    const topicKey = `${topic.sequence || 0}:${topic.topic}`;

    try {
      setSavingTopicKey(topicKey);
      const response = await fetch(`${API_BASE}/api/roadmap/${roadmap.roadmapId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          topic: topic.topic,
          sequence: topic.sequence || 0,
          completed: Boolean(updates.completed),
          note: updates.note || '',
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Unable to save progress');
      }

      setRoadmap(payload.data);
      setStatusMessage('Progress saved to database.');
    } catch (err) {
      setStatusMessage(err.message || 'Could not save progress.');
    } finally {
      setSavingTopicKey('');
    }
  };

  const handleToggleTopic = async (topic) => {
    const topicKey = `${topic.sequence || 0}:${topic.topic}`;
    const nextCompleted = !topicProgressMap[topicKey];

    setTopicProgressMap((prev) => ({
      ...prev,
      [topicKey]: nextCompleted,
    }));

    await saveTopicProgress(topic, {
      completed: nextCompleted,
      note: topicNotes[topicKey] || '',
    });
  };

  const handleSaveNote = async (topic) => {
    const topicKey = `${topic.sequence || 0}:${topic.topic}`;
    await saveTopicProgress(topic, {
      completed: Boolean(topicProgressMap[topicKey]),
      note: topicNotes[topicKey] || '',
    });
  };

  const normalize = (value) => String(value || '').trim().toLowerCase();

  const getTopicVideos = (topic) => {
    if (Array.isArray(topic.moduleYouTubeVideos) && topic.moduleYouTubeVideos.length) {
      return topic.moduleYouTubeVideos;
    }

    const globalVideos = Array.isArray(roadmap?.youtubeResources) ? roadmap.youtubeResources : [];
    const topicKey = normalize(topic.topic);
    const matched = globalVideos.filter((video) => {
      const videoTopic = normalize(video.topic || video.title);
      return videoTopic.includes(topicKey) || topicKey.includes(videoTopic);
    });

    return (matched.length ? matched : globalVideos).slice(0, 2);
  };

  const getTopicPlatforms = (topic) => {
    if (Array.isArray(topic.moduleCodingPlatforms) && topic.moduleCodingPlatforms.length) {
      return topic.moduleCodingPlatforms;
    }

    const globalPlatforms = Array.isArray(roadmap?.codingPlatforms) ? roadmap.codingPlatforms : [];
    const topicKey = normalize(topic.topic);
    const matched = globalPlatforms.filter((platform) => {
      const focus = Array.isArray(platform.focusSkills) ? platform.focusSkills.map(normalize) : [];
      return focus.some((skill) => skill.includes(topicKey) || topicKey.includes(skill));
    });

    return (matched.length ? matched : globalPlatforms).slice(0, 3);
  };

  const getTopicNotesTemplate = (topic) => {
    if (Array.isArray(topic.moduleNotesTemplate) && topic.moduleNotesTemplate.length) {
      return topic.moduleNotesTemplate;
    }

    return [
      `What did I learn in ${topic.topic}?`,
      `What practice task did I complete for ${topic.topic}?`,
      `What should I revise before moving to the next module?`,
    ];
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="glass-card-strong rounded-3xl p-10 text-center">
          <div className="w-14 h-14 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Generating AI roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card-strong rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold gradient-text mb-3">Roadmap Unavailable</h2>
          <p className="text-gray-600 mb-5">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/roles')}
            className="glow-button inline-flex px-6 py-3 rounded-xl text-white font-semibold"
          >
            Choose a Role
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3">Your Learning Roadmap</h2>
        <p className="text-gray-600">Personalized timeline for {roadmap?.roleName || 'your selected role'}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <div className="glass-card-strong rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">ESTIMATED DURATION</p>
          <p className="text-xl font-semibold text-gray-800">{roadmap?.estimatedDuration || '12 weeks'}</p>
        </div>
        <div className="glass-card-strong rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">GENERATION SOURCE</p>
          <p className="text-xl font-semibold text-gray-800 capitalize">{roadmap?.generationSource || 'rule-based'}</p>
        </div>
        <div className="glass-card-strong rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">MODEL</p>
          <p className="text-xl font-semibold text-gray-800">{roadmap?.generationModel || 'Fallback Planner'}</p>
        </div>
        <div className="glass-card-strong rounded-2xl p-5 md:col-span-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">ROADMAP COMPLETION</p>
            <p className="text-sm font-semibold text-violet-700">{completedCount}/{timeline.length} topics ({completionPercentage}%)</p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div className="progress-bar h-2" style={{ width: `${completionPercentage}%` }} />
          </div>
          {statusMessage && <p className="text-xs text-slate-600">{statusMessage}</p>}
        </div>
      </div>

      <div className="relative mb-12">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-full hidden md:block" />
        <div className="space-y-7">
          {timeline.map((topic, idx) => (
            <motion.div
              key={`${topic.topic}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="relative flex gap-5"
            >
              <div className="timeline-dot w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 z-10">
                {topic.phase}
              </div>
              <div className="glass-card-strong rounded-3xl p-6 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">{topic.topic}</h3>
                  <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">{topic.monthLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleTopic(topic)}
                  className="inline-flex items-center gap-2 text-sm font-semibold mb-3 text-slate-700"
                >
                  {topicProgressMap[`${topic.sequence || 0}:${topic.topic}`] ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <Circle size={18} className="text-slate-500" />
                  )}
                  {topicProgressMap[`${topic.sequence || 0}:${topic.topic}`] ? 'Completed' : 'Mark as completed'}
                </button>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">{topic.difficulty || 'Intermediate'}</span>
                  <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold">{topic.priority || 'High'} priority</span>
                  <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-semibold">{topic.estimatedHours || 20} hrs</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="progress-bar h-2" style={{ width: `${Math.min(100, 20 + idx * 12)}%` }} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const topicKey = `${topic.sequence || 0}:${topic.topic}`;
                      setExpandedTopicKey((prev) => (prev === topicKey ? '' : topicKey));
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-300 bg-violet-100 text-violet-700 text-xs font-semibold"
                  >
                    <PlayCircle size={15} />
                    {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` ? 'Close Module' : 'Start Module'}
                    {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <span className="text-xs text-slate-500">Click Start Module to view topic-specific videos, coding platforms, and notes.</span>
                </div>

                {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` && topic.moduleDescription && (
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{topic.moduleDescription}</p>
                )}

                {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` && !!topic.learningObjectives?.length && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-violet-700 mb-1">Learning Objectives</p>
                    <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                      {topic.learningObjectives.map((objective, objectiveIdx) => (
                        <li key={`${topic.topic}-objective-${objectiveIdx}`}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` && !!topic.deliverables?.length && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Deliverables</p>
                    <div className="flex flex-wrap gap-2">
                      {topic.deliverables.map((deliverable, deliverableIdx) => (
                        <span key={`${topic.topic}-deliverable-${deliverableIdx}`} className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                          {deliverable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` && !!topic.practiceTasks?.length && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Practice Tasks</p>
                    <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                      {topic.practiceTasks.map((task, taskIdx) => (
                        <li key={`${topic.topic}-task-${taskIdx}`}>{task}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` && !!topic.prerequisites?.length && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Prerequisites</p>
                    <div className="flex flex-wrap gap-2">
                      {topic.prerequisites.map((prerequisite, prerequisiteIdx) => (
                        <span key={`${topic.topic}-pre-${prerequisiteIdx}`} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">
                          {prerequisite}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` && !!topic.moduleResources?.length && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-cyan-700 mb-1">Module Resources</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {topic.moduleResources.map((resource, resourceIdx) => (
                        <a
                          key={`${topic.topic}-resource-${resourceIdx}`}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg border border-cyan-200 bg-cyan-50/70 text-xs text-cyan-800 hover:glow-border transition-all"
                        >
                          <p className="font-semibold">{resource.title}</p>
                          <p className="text-cyan-700/80">{resource.type || 'Resource'}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-rose-700 mb-1">Module YouTube Videos</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {getTopicVideos(topic).map((video, videoIdx) => (
                        <a
                          key={`${topic.topic}-video-${videoIdx}`}
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50/70 text-xs text-rose-800 hover:glow-border transition-all"
                        >
                          <p className="font-semibold">{video.title}</p>
                          <p className="text-rose-700/80">{video.channel || 'YouTube'} - {video.duration || 'Varies'}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Module Coding Platforms</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {getTopicPlatforms(topic).map((platform, platformIdx) => (
                        <a
                          key={`${topic.topic}-platform-${platformIdx}`}
                          href={platform.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50/70 text-xs text-emerald-800 hover:glow-border transition-all"
                        >
                          <p className="font-semibold">{platform.name}</p>
                          <p className="text-emerald-700/80">{platform.why || 'Practice for this module'}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {expandedTopicKey === `${topic.sequence || 0}:${topic.topic}` && (
                <div className="mt-4">
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-violet-700">Notes Prompts</p>
                    <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1 mt-1">
                      {getTopicNotesTemplate(topic).map((prompt, promptIdx) => (
                        <li key={`${topic.topic}-note-prompt-${promptIdx}`}>{prompt}</li>
                      ))}
                    </ul>
                  </div>
                  <textarea
                    value={topicNotes[`${topic.sequence || 0}:${topic.topic}`] || ''}
                    onChange={(e) => {
                      const topicKey = `${topic.sequence || 0}:${topic.topic}`;
                      setTopicNotes((prev) => ({ ...prev, [topicKey]: e.target.value }));
                    }}
                    placeholder="Add your notes for this topic..."
                    className="w-full input-glass rounded-xl px-3 py-2 text-sm"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNote(topic)}
                    disabled={savingTopicKey === `${topic.sequence || 0}:${topic.topic}`}
                    className="mt-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold"
                  >
                    {savingTopicKey === `${topic.sequence || 0}:${topic.topic}` ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card-strong rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-violet-600" size={22} />
            <h3 className="text-lg font-bold text-gray-800">Milestones</h3>
          </div>
          <div className="space-y-2.5">
            {(roadmap?.milestones || []).map((milestone, idx) => (
              <div key={`${milestone.milestone}-${idx}`} className="glass-card rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800 text-base">{milestone.milestone}</p>
                  <span className="text-xs text-violet-600 font-semibold">Week {milestone.estimatedWeek || idx + 1}</span>
                </div>
                <p className="text-xs text-gray-600">{(milestone.topics || []).join(', ')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-strong rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="text-pink-600" size={22} />
            <h3 className="text-lg font-bold text-gray-800">Recommended Projects</h3>
          </div>
          <div className="space-y-2.5">
            {(roadmap?.suggestedProjects || []).map((project, idx) => (
              <div key={`${project.project}-${idx}`} className="glass-card rounded-xl p-3">
                <p className="font-semibold text-gray-800 text-base mb-1">{project.project}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <Sparkles size={13} />
                  <span>{project.difficulty || 'Intermediate'} - {project.duration || '2 weeks'}</span>
                </div>
                <p className="text-xs text-violet-700">{(project.skills || []).join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card-strong rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="text-cyan-600" size={22} />
          <h3 className="text-lg font-bold text-gray-800">Course Recommendations</h3>
        </div>
        {roadmap?.courseRecommendations?.length ? (
          <div className="grid md:grid-cols-2 gap-3">
            {roadmap.courseRecommendations.map((course, idx) => (
              <a
                key={`${course.title}-${idx}`}
                href={course.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="glass-card rounded-xl p-3 hover:glow-border transition-all"
              >
                <p className="font-semibold text-gray-800 text-base mb-1">{course.title}</p>
                <p className="text-xs text-gray-600 mb-1">{course.provider || 'Recommended Provider'}</p>
                <p className="text-xs text-gray-500">{course.estimatedDuration || 'Self-paced'} - {course.reason || 'Aligned with your skill gaps'}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Course recommendations will appear after roadmap generation.</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card-strong rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-rose-600" size={22} />
            <h3 className="text-lg font-bold text-gray-800">YouTube Learning Videos</h3>
          </div>
          <div className="space-y-2.5">
            {(roadmap?.youtubeResources || []).map((video, idx) => (
              <a
                key={`${video.title}-${idx}`}
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="glass-card rounded-xl p-3 block hover:glow-border transition-all"
              >
                <p className="font-semibold text-gray-800 text-base mb-1">{video.title}</p>
                <p className="text-xs text-gray-600">{video.channel || 'YouTube'} - {video.duration || 'Varies'}</p>
                <p className="text-xs text-violet-700 mt-1">Topic: {video.topic || 'General Learning'}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="glass-card-strong rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="text-emerald-600" size={22} />
            <h3 className="text-lg font-bold text-gray-800">Coding Practice Platforms</h3>
          </div>
          <div className="space-y-2.5">
            {(roadmap?.codingPlatforms || []).map((platform, idx) => (
              <a
                key={`${platform.name}-${idx}`}
                href={platform.url}
                target="_blank"
                rel="noreferrer"
                className="glass-card rounded-xl p-3 block hover:glow-border transition-all"
              >
                <p className="font-semibold text-gray-800 text-base mb-1">{platform.name}</p>
                <p className="text-xs text-gray-600 mb-1">{platform.why}</p>
                <p className="text-xs text-blue-700">Focus: {(platform.focusSkills || []).join(', ')}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card-strong rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="text-cyan-600" size={22} />
          <h3 className="text-lg font-bold text-gray-800">Deep-Dive Resources</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {(roadmap?.deepDiveResources || []).map((resource, idx) => (
            <a
              key={`${resource.title}-${idx}`}
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="glass-card rounded-xl p-3 block hover:glow-border transition-all"
            >
              <p className="font-semibold text-gray-800 text-base">{resource.title}</p>
              <p className="text-xs text-gray-600">{resource.type || 'Guide'} - {resource.topic}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/insights')}
          className="glow-button px-8 py-3 rounded-2xl text-white font-semibold inline-flex items-center gap-2"
        >
          <Target size={18} /> View Career Insights
        </button>
        <button
          type="button"
          onClick={() => navigate('/roles')}
          className="glass-card-strong px-8 py-3 rounded-2xl text-gray-700 font-semibold inline-flex items-center gap-2 hover:glow-border transition-all"
        >
          <Clock size={18} /> Explore Other Roles
        </button>
      </div>
    </div>
  );
};

export default AIRoadmap;

