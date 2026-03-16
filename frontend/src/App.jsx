import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import SkillProfilePage from './pages/SkillProfilePage';
import IndustryRoleExplorer from './pages/IndustryRoleExplorer';
import SkillGapDashboard from './pages/SkillGapDashboard';
import AIRoadmap from './pages/AIRoadmap';
import CareerInsights from './pages/CareerInsights';
import ProfileDashboard from './pages/ProfileDashboard';
import './styles/globals.css';

const API_BASE = 'http://localhost:5000';

const ProtectedView = ({ children, onOpenLogin }) => {
  const loggedIn = Boolean(localStorage.getItem('studentId'));

  if (loggedIn) {
    return children;
  }

  return (
    <div className="max-w-3xl mx-auto mt-20">
      <div className="glass-card-strong rounded-3xl p-10 text-center">
        <h2 className="text-3xl font-bold gradient-text mb-3">Login Required</h2>
        <p className="text-slate-600 mb-6">Please login to continue your personalized skill journey.</p>
        <button
          type="button"
          onClick={() => onOpenLogin()}
          className="glow-button px-7 py-3 rounded-xl text-white font-semibold"
        >
          Continue with Email
        </button>
      </div>
    </div>
  );
};

const AppShell = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPath, setPendingPath] = useState('/skill-profile');
  const [loginName, setLoginName] = useState(localStorage.getItem('userName') || '');
  const [loginEmail, setLoginEmail] = useState(localStorage.getItem('userEmail') || '');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

  const openLogin = (path = '/skill-profile') => {
    setPendingPath(path);
    setLoginError('');
    setShowLoginModal(true);
  };

  const handleNavigate = (path, needsAuth = true) => {
    if (!needsAuth || localStorage.getItem('studentId')) {
      navigate(path);
      return;
    }

    openLogin(path);
  };

  const handleLogin = async () => {
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Email is required.');
      return;
    }

    try {
      setLoginLoading(true);
      const response = await fetch(`${API_BASE}/api/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: loginName.trim(),
          email: loginEmail.trim().toLowerCase(),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Login failed');
      }

      localStorage.setItem('studentId', payload.data.studentId);
      localStorage.setItem('userName', payload.data.name);
      localStorage.setItem('userEmail', payload.data.email);
      setUserName(payload.data.name);
      setShowLoginModal(false);
      navigate(pendingPath || '/skill-profile');
    } catch (error) {
      setLoginError(error.message || 'Unable to login right now.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <>
      <div className="mesh-gradient min-h-screen w-full overflow-x-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="floating-shape absolute top-20 left-10 w-64 h-64 rounded-full bg-gradient-to-br from-blue-300/20 to-purple-300/20 blur-3xl" />
          <div className="floating-shape-delayed absolute top-40 right-20 w-80 h-80 rounded-full bg-gradient-to-br from-pink-300/20 to-cyan-300/20 blur-3xl" />
          <div className="floating-shape absolute bottom-20 left-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-purple-300/15 to-blue-300/15 blur-3xl" />
        </div>
        <Navbar onNavigate={handleNavigate} userName={userName} />
        <div className="pt-24 pb-12 px-4 md:px-8">
          <Routes>
            <Route path="/" element={<LandingPage onNavigate={handleNavigate} userName={userName} />} />
            <Route path="/skill-profile" element={<ProtectedView onOpenLogin={() => openLogin('/skill-profile')}><SkillProfilePage onProfileSaved={(name) => {
              if (name) {
                localStorage.setItem('userName', name);
                setUserName(name);
              }
            }} /></ProtectedView>} />
            <Route path="/roles" element={<ProtectedView onOpenLogin={() => openLogin('/roles')}><IndustryRoleExplorer /></ProtectedView>} />
            <Route path="/dashboard" element={<ProtectedView onOpenLogin={() => openLogin('/dashboard')}><SkillGapDashboard /></ProtectedView>} />
            <Route path="/roadmap" element={<ProtectedView onOpenLogin={() => openLogin('/roadmap')}><AIRoadmap /></ProtectedView>} />
            <Route path="/insights" element={<ProtectedView onOpenLogin={() => openLogin('/insights')}><CareerInsights /></ProtectedView>} />
            <Route path="/profile-dashboard" element={<ProtectedView onOpenLogin={() => openLogin('/profile-dashboard')}><ProfileDashboard /></ProtectedView>} />
          </Routes>
        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="glass-card-strong rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold gradient-text mb-2">Welcome To SkillGap AI</h3>
            <p className="text-slate-600 mb-5">Login with your email to continue your personalized path.</p>

            <div className="space-y-4">
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="Your name"
                className="w-full input-glass rounded-xl px-4 py-3"
              />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Your email"
                className="w-full input-glass rounded-xl px-4 py-3"
              />

              {loginError && <p className="text-sm text-rose-600">{loginError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loginLoading}
                  className="flex-1 glow-button rounded-xl py-3 text-white font-semibold"
                >
                  {loginLoading ? 'Please wait...' : 'Login'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
