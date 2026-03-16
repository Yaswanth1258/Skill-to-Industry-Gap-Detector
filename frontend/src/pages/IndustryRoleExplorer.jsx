import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { TrendingUp, Briefcase, DollarSign, Search, Wand2 } from 'lucide-react';

const IndustryRoleExplorer = () => {
  const API_BASE = 'http://localhost:5000';
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingCustomRole, setCreatingCustomRole] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const parseApiResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const rawText = await response.text();
    throw new Error(
      rawText && rawText.includes('<!DOCTYPE')
        ? 'Backend API route not found. Please restart backend server and try again.'
        : (rawText || 'Unexpected API response from server.')
    );
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/roles`);
      const data = await parseApiResponse(response);
      const normalizedRoles = (data.data || []).map((role) => ({
        ...role,
        requiredSkills: Array.isArray(role.requiredSkills) ? role.requiredSkills : [],
        relatedRoles: Array.isArray(role.relatedRoles) ? role.relatedRoles : [],
      }));

      setRoles(normalizedRoles);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setLoading(false);
    }
  };

  const handleAnalyzeRole = async (roleId) => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      alert('Please create your skill profile first!');
      return;
    }

    try {
      await fetch(`${API_BASE}/api/student/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRoleId: roleId }),
      });
    } catch (error) {
      console.error('Failed to sync selected role to database:', error);
    }

    // Store selected role and navigate to dashboard
    localStorage.setItem('selectedRoleId', roleId);
    window.location.href = '/dashboard';
  };

  const handleCreateCustomRole = async () => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      alert('Please create your skill profile first!');
      return;
    }

    if (!searchTerm.trim()) {
      alert('Enter a role name first.');
      return;
    }

    try {
      setCreatingCustomRole(true);
      const response = await fetch(`${API_BASE}/api/roles/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName: searchTerm.trim() }),
      });

      const payload = await parseApiResponse(response);
      if (!response.ok || !payload?.success || !payload?.data?.roleId) {
        throw new Error(payload?.error || 'Unable to create custom role');
      }

      const customRole = {
        ...payload.data,
        requiredSkills: Array.isArray(payload.data.requiredSkills) ? payload.data.requiredSkills : [],
        relatedRoles: Array.isArray(payload.data.relatedRoles) ? payload.data.relatedRoles : [],
      };

      setRoles((prev) => {
        const withoutDuplicate = prev.filter((role) => role.roleId !== customRole.roleId);
        return [customRole, ...withoutDuplicate];
      });

      await handleAnalyzeRole(customRole.roleId);
    } catch (error) {
      alert(error.message || 'Failed to generate custom role roadmap');
    } finally {
      setCreatingCustomRole(false);
    }
  };

  const filteredRoles = roles.filter((role) => {
    if (!searchTerm.trim()) {
      return true;
    }

    const query = searchTerm.toLowerCase();
    return role.roleName.toLowerCase().includes(query)
      || role.description.toLowerCase().includes(query)
      || role.requiredSkills.some((skill) => skill.toLowerCase().includes(query));
  });

  const getDemandColor = (demand) => {
    switch(demand) {
      case 'Critical': return 'text-rose-700';
      case 'Very High': return 'text-violet-700';
      case 'High': return 'text-blue-700';
      default: return 'text-gray-600';
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="pb-12 px-1">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
            Industry Role Explorer
          </h1>
          <p className="text-gray-700 text-lg">Discover in-demand roles and their requirements</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <GlassCard strong className="p-5">
            <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search roles or type your own role (e.g., Prompt Engineer, Blockchain Developer)"
                  className="w-full input-glass rounded-xl pl-9 pr-4 py-3 text-sm"
                />
              </div>
              <AnimatedButton variant="outline" className="text-sm" onClick={() => setSearchTerm('')}>
                Clear
              </AnimatedButton>
              <AnimatedButton className="text-sm gap-2" onClick={handleCreateCustomRole} loading={creatingCustomRole}>
                <Wand2 size={16} /> Generate Roadmap For This Role
              </AnimatedButton>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              If the role is not available in the list, use the generator button to create a custom role and continue directly to analysis.
            </p>
          </GlassCard>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading roles...</p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRoles.map((role, idx) => (
              <motion.div key={role.roleId} variants={item}>
                <GlassCard
                  className="h-full flex flex-col cursor-pointer p-6"
                  strong
                  hover={true}
                  delay={idx * 0.05}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-blue-700 mb-1">{role.roleName}</h3>
                        <p className={`font-semibold ${getDemandColor(role.industryDemand)}`}>
                          {role.industryDemand} Demand
                        </p>
                      </div>
                      <Briefcase className="text-cyan-700" size={24} />
                    </div>

                    <p className="text-gray-700 text-sm mb-4">{role.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={16} className="text-blue-700" />
                        <span className="text-gray-700">{role.averageSalary}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp size={16} className="text-emerald-700" />
                        <span className="text-gray-700">+{role.jobMarketGrowth}% Growth</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-600 text-xs font-semibold mb-2">REQUIRED SKILLS</p>
                      <div className="flex flex-wrap gap-1">
                        {role.requiredSkills.slice(0, 4).map((skill, i) => (
                          <span key={i} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 border border-blue-200">
                            {skill}
                          </span>
                        ))}
                        {role.requiredSkills.length > 4 && (
                          <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-600 border border-slate-200">
                            +{role.requiredSkills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatedButton
                    onClick={() => handleAnalyzeRole(role.roleId)}
                    className="w-full text-sm"
                  >
                    Analyze Gap
                  </AnimatedButton>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Role Detail Modal */}
        {selectedRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedRole(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card-strong p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-blue-700 mb-2">{selectedRole.roleName}</h2>
                  <p className={`font-semibold ${getDemandColor(selectedRole.industryDemand)}`}>
                    {selectedRole.industryDemand} Demand
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-700 mb-6">{selectedRole.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <GlassCard className="!p-4">
                  <p className="text-gray-600 text-sm mb-1">Salary Range</p>
                  <p className="text-blue-700 font-semibold">{selectedRole.averageSalary}</p>
                </GlassCard>
                <GlassCard className="!p-4">
                  <p className="text-gray-600 text-sm mb-1">Growth Trend</p>
                  <p className="text-emerald-700 font-semibold">+{selectedRole.jobMarketGrowth}%</p>
                </GlassCard>
              </div>

              <h3 className="font-semibold text-lg mb-4 text-violet-700">Required Skills</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedRole.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {selectedRole.relatedRoles && (
                <>
                  <h3 className="font-semibold text-lg mb-4 text-rose-700">Related Roles</h3>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {selectedRole.relatedRoles.map((role, idx) => (
                      <span key={idx} className="px-3 py-1 rounded bg-rose-100 text-rose-700 text-sm border border-rose-200">
                        {role}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <AnimatedButton
                onClick={() => {
                  handleAnalyzeRole(selectedRole.roleId);
                  setSelectedRole(null);
                }}
                className="w-full"
              >
                Analyze My Gap for This Role
              </AnimatedButton>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default IndustryRoleExplorer;
