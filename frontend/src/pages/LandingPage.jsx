import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Brain, Lightbulb, TrendingUp, Sparkles } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';

const LandingPage = ({ onNavigate, userName }) => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Skill Analysis',
      description: 'Advanced algorithms analyze your skills against industry requirements',
      iconColor: 'text-blue-700',
      iconBg: 'bg-blue-100',
      glow: 'hover:shadow-blue-200/70'
    },
    {
      icon: BarChart3,
      title: 'Visual Gap Detection',
      description: 'See exactly where you stand in your career journey with interactive dashboards',
      iconColor: 'text-violet-700',
      iconBg: 'bg-violet-100',
      glow: 'hover:shadow-violet-200/70'
    },
    {
      icon: TrendingUp,
      title: 'Market Insights',
      description: 'Get real-time industry trends and demand forecasts for various roles',
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      glow: 'hover:shadow-emerald-200/70'
    },
    {
      icon: Lightbulb,
      title: 'Smart Roadmap',
      description: 'Get personalized learning paths tailored to your career goals',
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-100',
      glow: 'hover:shadow-rose-200/70'
    }
  ];

  const highlights = [
    { label: 'Roles Mapped', value: '8+', tone: 'from-blue-500 to-cyan-500' },
    { label: 'Gap Accuracy', value: '92%', tone: 'from-violet-500 to-fuchsia-500' },
    { label: 'Roadmap Phases', value: '12', tone: 'from-emerald-500 to-teal-500' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="min-h-screen flex items-start justify-center pt-4 md:pt-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto relative w-full">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-strong mb-6"
              >
                <Sparkles size={15} className="text-amber-600" />
                <span className="text-sm font-semibold text-slate-700">AI Career Accelerator</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl md:text-6xl font-bold font-poppins mb-6 leading-tight"
              >
                <span className="gradient-text">Bridge the Gap Between</span>
                <br />
                <span className="text-slate-800">Skills & Industry</span>
              </motion.h1>

              {userName && (
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="inline-flex px-4 py-2 rounded-full border border-blue-200 bg-white/70 text-sm font-semibold text-blue-700 mb-4"
                >
                  Welcome back, {userName}. Let&apos;s level up your career today.
                </motion.p>
              )}

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl text-slate-700 mb-8 max-w-xl"
              >
                AI-powered platform that analyzes your skills, detects gaps, and creates a personalized roadmap to your dream job
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex gap-4 flex-wrap"
              >
                <AnimatedButton className="gap-2" onClick={() => onNavigate('/skill-profile', true)}>
                  Analyze My Skills <ArrowRight size={20} />
                </AnimatedButton>
                <AnimatedButton variant="outline" className="border border-white/70" onClick={() => onNavigate('/roles', true)}>
                  Explore Roles
                </AnimatedButton>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55 }}
                className="grid sm:grid-cols-3 gap-3 md:gap-4 mt-8"
              >
                {highlights.map((item) => (
                  <motion.div
                    key={item.label}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card-strong rounded-2xl px-4 py-4"
                  >
                    <div className={`h-1.5 w-16 rounded-full mb-2 bg-gradient-to-r ${item.tone}`} />
                    <p className="text-2xl font-bold text-slate-800">{item.value}</p>
                    <p className="text-sm text-slate-600">{item.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="relative lg:pl-2 lg:-mt-8"
            >
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                className="rounded-3xl p-0 shadow-none"
              >
                <div className="relative overflow-hidden rounded-2xl">
                  <video
                    className="w-full aspect-[16/9] object-cover"
                    src="/media/frontend_video.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-4">Powerful Features</h2>
            <p className="text-slate-600 text-lg">Everything you need to advance your career</p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 items-stretch"
          >
            {features.map((feature, idx) => (
              <motion.div key={idx} variants={item} className="h-full">
                <GlassCard
                  delay={idx * 0.1}
                  strong
                  className={`h-full p-6 md:p-7 flex flex-col justify-start shadow-lg transition-all ${feature.glow}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} mb-4 flex items-center justify-center`}>
                    <feature.icon className={feature.iconColor} size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-800">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <GlassCard strong className="text-center p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Career?</h2>
            <p className="text-slate-700 mb-8 text-lg">Start your journey towards your dream job with AI-powered insights</p>
            <AnimatedButton className="mx-auto" onClick={() => onNavigate('/skill-profile', true)}>
              Start Analysis Now
            </AnimatedButton>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
