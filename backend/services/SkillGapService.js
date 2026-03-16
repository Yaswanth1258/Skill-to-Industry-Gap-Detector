/**
 * Skill Gap Detection Algorithm
 * Core service for comparing student skills with role requirements
 */

class SkillGapService {
  static normalizeStudentSkills(studentSkills) {
    if (!Array.isArray(studentSkills)) {
      return [];
    }

    return studentSkills
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
      .filter((item) => item.name);
  }

  static findSkillEntry(skill, normalizedSkills) {
    const target = String(skill || '').trim().toLowerCase();
    if (!target) {
      return null;
    }

    const exact = normalizedSkills.find((item) => item.name.toLowerCase() === target);
    if (exact) {
      return exact;
    }

    return normalizedSkills.find((item) => {
      const normalized = item.name.toLowerCase();
      return normalized.includes(target) || target.includes(normalized);
    }) || null;
  }

  /**
   * Analyze skill gap between student and role
   */
  static analyzeSkillGap(studentSkills, roleRequirements, skillWeights) {
    const matchedSkills = [];
    const missingSkills = [];
    const weakSkills = [];
    let totalMatchScore = 0;

    const normalizedStudentSkills = this.normalizeStudentSkills(studentSkills);
    const normalizedStudentSkillNames = normalizedStudentSkills.map(s => s.name.toLowerCase());

    // Analyze each required skill
    roleRequirements.forEach(skill => {
      const skillLower = skill.toLowerCase();
      const weight = skillWeights[skill] || 1;
      const matchedEntry = this.findSkillEntry(skill, normalizedStudentSkills);
      const userPercentage = matchedEntry?.percentage || 0;
      const targetPercentage = Math.max(70, Math.min(95, 75 + Math.round(weight * 5)));

      if (matchedEntry && userPercentage >= targetPercentage - 10) {
        matchedSkills.push({
          skill,
          proficiency: userPercentage >= 85 ? 'Advanced' : 'Intermediate',
          weight,
          userPercentage,
          targetPercentage,
        });
        totalMatchScore += weight * (userPercentage / targetPercentage);
      } else if (matchedEntry || this.isSimilarSkill(skillLower, normalizedStudentSkillNames)) {
        weakSkills.push({
          skill,
          relatedSkill: matchedEntry?.name || this.findSimilarSkill(skillLower, normalizedStudentSkillNames),
          weight,
          userPercentage,
          targetPercentage,
        });
        const weakContribution = Math.max(0.2, userPercentage / targetPercentage);
        totalMatchScore += weight * Math.min(0.85, weakContribution);
      } else {
        missingSkills.push({
          skill,
          importance: 'Critical',
          weight,
          userPercentage: 0,
          targetPercentage,
        });
      }
    });

    // Calculate scores
    const totalRequiredWeight = roleRequirements.reduce((sum, skill) => {
      return sum + (skillWeights[skill] || 1);
    }, 0);

    const matchPercentage = Math.round((totalMatchScore / totalRequiredWeight) * 100);
    const readinessScore = this.calculateReadinessScore(matchPercentage, matchedSkills.length, weakSkills.length, roleRequirements.length);

    const estimatedMonths = this.estimateMonthsToReady(missingSkills, weakSkills);

    return {
      matchedSkills,
      missingSkills,
      weakSkills,
      matchPercentage,
      readinessScore,
      estimatedMonthsToReady: estimatedMonths,
      careerReadinessLevel: this.getReadinessLevel(matchPercentage)
    };
  }

  /**
   * Calculate readiness score (0-100)
   */
  static calculateReadinessScore(matchPercentage, matched, weak, total) {
    const coverage = total > 0 ? ((matched + weak * 0.6) / total) * 100 : 0;
    const blended = matchPercentage * 0.7 + coverage * 0.3;
    return Math.max(0, Math.min(100, Math.round(blended)));
  }

  /**
   * Estimate months needed to become job-ready
   */
  static estimateMonthsToReady(missingSkills, weakSkills) {
    const missingEffort = missingSkills.reduce((sum, skill) => sum + Math.max(1.4, (skill.targetPercentage || 75) / 45), 0);
    const weakEffort = weakSkills.reduce((sum, skill) => {
      const deficit = Math.max(0, (skill.targetPercentage || 75) - (skill.userPercentage || 0));
      return sum + Math.max(0.3, deficit / 55);
    }, 0);

    return Math.max(1, Math.ceil(missingEffort + weakEffort));
  }

  /**
   * Get readiness level label
   */
  static getReadinessLevel(percentage) {
    if (percentage >= 80) return 'Job Ready';
    if (percentage >= 60) return 'Nearly Ready';
    if (percentage >= 40) return 'Developing';
    if (percentage >= 20) return 'Early Stage';
    return 'Just Starting';
  }

  /**
   * Check if skill is similar to existing student skills
   */
  static isSimilarSkill(skill, studentSkills) {
    const skillKeywords = skill.split(' ');
    return studentSkills.some(s => 
      skillKeywords.some(kw => s.includes(kw) || kw.length > 3 && this.levenshteinDistance(kw, s) < 2)
    );
  }

  /**
   * Find most similar skill
   */
  static findSimilarSkill(skill, studentSkills) {
    let bestMatch = '';
    let bestScore = 0;

    studentSkills.forEach(s => {
      const score = 1 / (this.levenshteinDistance(skill, s) + 1);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = s;
      }
    });

    return bestMatch;
  }

  /**
   * Levenshtein distance for string similarity
   */
  static levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Generate learning roadmap
   */
  static generateRoadmap(missingSkills, weakSkills, matchedSkills) {
    let topics = [];
    const learningOrder = [];

    // Prioritize missing skills
    missingSkills.forEach((skill, index) => {
      topics.push(this.createTopicModule(skill.skill, index + 1, {
        difficulty: 'Intermediate',
        priority: 'High',
        estimatedHours: Math.round(40 + Math.random() * 40),
      }));
      learningOrder.push(skill.skill);
    });

    // Then weak skills
    weakSkills.forEach((skill, index) => {
      topics.push(this.createTopicModule(`Advanced ${skill.skill}`, missingSkills.length + index + 1, {
        difficulty: 'Advanced',
        priority: 'Medium',
        estimatedHours: Math.round(20 + Math.random() * 20),
      }));
      learningOrder.push(`Advanced ${skill.skill}`);
    });

    if (!topics.length) {
      const matchedSkillNames = (matchedSkills || []).map((item) => item.skill || item).filter(Boolean);
      matchedSkillNames.slice(0, 6).forEach((skill, index) => {
        topics.push(this.createTopicModule(`Advanced ${skill}`, index + 1, {
          difficulty: 'Advanced',
          priority: 'Medium',
          estimatedHours: 18,
        }));
        learningOrder.push(`Advanced ${skill}`);
      });
    }

    // Create milestones
    const milestones = this.createMilestones(learningOrder);

    // Suggest projects
    const projects = this.suggestProjects(learningOrder);

    // Suggest learning resources/courses
    const courseRecommendations = this.suggestCourses(learningOrder);
    const youtubeResources = this.suggestYouTubeVideos(learningOrder);
    const codingPlatforms = this.suggestCodingPlatforms(learningOrder);
    const deepDiveResources = this.suggestDeepDiveResources(learningOrder);

    return {
      topics,
      learningOrder,
      milestones,
      suggestedProjects: projects,
      courseRecommendations,
      youtubeResources,
      codingPlatforms,
      deepDiveResources,
      estimatedDuration: `${Math.ceil(topics.reduce((sum, t) => sum + t.estimatedHours, 0) / 10)} weeks`
    };
  }

  static createTopicModule(topicName, sequence, options = {}) {
    const cleanName = String(topicName || 'Learning Module').trim();
    const difficulty = options.difficulty || 'Intermediate';
    const priority = options.priority || 'Medium';
    const estimatedHours = Number(options.estimatedHours) || 24;
    const moduleYouTubeVideos = this.suggestYouTubeVideos([cleanName]).slice(0, 2);
    const moduleCodingPlatforms = this.suggestCodingPlatforms([cleanName]).slice(0, 3);
    const moduleNotesTemplate = [
      'What did I learn in this module?',
      'Which concept felt difficult and why?',
      'What did I build or practice?',
      'What is my next action before moving to the next module?',
    ];

    return {
      topic: cleanName,
      difficulty,
      estimatedHours,
      priority,
      sequence,
      moduleDescription: `Build practical proficiency in ${cleanName} with guided theory, implementation, and review.`,
      learningObjectives: [
        `Understand the core concepts of ${cleanName}`,
        `Implement ${cleanName} in a realistic mini-project`,
        `Evaluate and improve your ${cleanName} implementation quality`,
      ],
      deliverables: [
        `${cleanName} concept notes`,
        `${cleanName} implementation artifact`,
        `${cleanName} progress report`,
      ],
      prerequisites: ['Basic programming fundamentals', 'Version control basics (Git)'],
      practiceTasks: [
        `Complete 3 focused exercises on ${cleanName}`,
        `Build 1 mini-project using ${cleanName}`,
        `Document learnings and blockers for ${cleanName}`,
      ],
      moduleResources: [
        {
          title: `${cleanName} roadmap`,
          type: 'Guide',
          url: `https://roadmap.sh/${cleanName.toLowerCase().replace(/\s+/g, '-')}`,
        },
        {
          title: `${cleanName} docs`,
          type: 'Documentation',
          url: `https://www.google.com/search?q=${encodeURIComponent(cleanName + ' official documentation')}`,
        },
      ],
      moduleYouTubeVideos,
      moduleCodingPlatforms,
      moduleNotesTemplate,
    };
  }

  /**
   * Create learning milestones
   */
  static createMilestones(learningOrder) {
    const milestones = [];
    const chunkSize = Math.max(1, Math.ceil(learningOrder.length / 4));

    for (let i = 0; i < learningOrder.length; i += chunkSize) {
      milestones.push({
        milestone: `Level ${Math.floor(i / chunkSize) + 1}`,
        topics: learningOrder.slice(i, i + chunkSize),
        estimatedWeek: Math.floor(i / chunkSize) * 2 + 1
      });
    }

    return milestones;
  }

  /**
   * Suggest projects for learning
   */
  static suggestProjects(topics) {
    const projectMap = {
      'python': 'Build a Python data scraper',
      'javascript': 'Create an interactive web app',
      'react': 'Build a single-page React application',
      'machine learning': 'Train and deploy an ML model',
      'data science': 'Analyze a real-world dataset',
      'sql': 'Design a relational database',
      'nodejs': 'Build a REST API server',
      'typescript': 'Refactor project with TypeScript',
      'ai': 'Implement an AI chatbot',
      'docker': 'Containerize an application'
    };

    return topics.map((topic, idx) => ({
      project: projectMap[topic.toLowerCase()] || `Build a ${topic} project`,
      difficulty: idx % 3 === 0 ? 'Beginner' : idx % 3 === 1 ? 'Intermediate' : 'Advanced',
      duration: `${1 + (idx % 4)} weeks`,
      skills: [topic]
    })).slice(0, 5);
  }

  /**
   * Suggest practical courses for each topic
   */
  static suggestCourses(topics) {
    const courseMap = {
      'python': { title: 'Python for Everybody', provider: 'Coursera', url: 'https://www.coursera.org/specializations/python', estimatedDuration: '8 weeks' },
      'machine learning': { title: 'Machine Learning Specialization', provider: 'Coursera', url: 'https://www.coursera.org/specializations/machine-learning-introduction', estimatedDuration: '12 weeks' },
      'deep learning': { title: 'Deep Learning Specialization', provider: 'Coursera', url: 'https://www.coursera.org/specializations/deep-learning', estimatedDuration: '16 weeks' },
      'sql': { title: 'Databases and SQL for Data Science', provider: 'Coursera', url: 'https://www.coursera.org/learn/sql-data-science', estimatedDuration: '4 weeks' },
      'node.js': { title: 'Node.js Essential Training', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/', estimatedDuration: '6 weeks' },
      'react': { title: 'React - The Complete Guide', provider: 'Udemy', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', estimatedDuration: '10 weeks' },
      'docker': { title: 'Docker Essentials', provider: 'IBM SkillsBuild', url: 'https://skillsbuild.org/', estimatedDuration: '4 weeks' },
      'kubernetes': { title: 'Kubernetes Basics', provider: 'Kubernetes Docs', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', estimatedDuration: '5 weeks' }
    };

    return topics.slice(0, 8).map((topic) => {
      const key = String(topic).toLowerCase();
      const direct = courseMap[key];
      if (direct) {
        return {
          ...direct,
          reason: `Recommended to build strong ${topic} fundamentals`
        };
      }

      const matchedKey = Object.keys(courseMap).find((entry) => key.includes(entry) || entry.includes(key));
      if (matchedKey) {
        return {
          ...courseMap[matchedKey],
          reason: `Supports your ${topic} learning milestone`
        };
      }

      return {
        title: `${topic} Fundamentals`,
        provider: 'Official Documentation',
        url: 'https://roadmap.sh/',
        estimatedDuration: '4-6 weeks',
        reason: `Covers core concepts required for ${topic}`
      };
    });
  }

  /**
   * Suggest targeted YouTube learning resources
   */
  static suggestYouTubeVideos(topics) {
    const youtubeMap = {
      'python': { title: 'Python Full Course for Beginners', channel: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', duration: '4h 26m' },
      'javascript': { title: 'JavaScript Full Course', channel: 'Bro Code', url: 'https://www.youtube.com/watch?v=lfmg-EJ8gm4', duration: '3h 26m' },
      'react': { title: 'React Course - Beginner to Advanced', channel: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=bMknfKXIFA8', duration: '12h' },
      'node.js': { title: 'Node.js and Express.js Full Course', channel: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=Oe421EPjeBE', duration: '8h' },
      'machine learning': { title: 'Machine Learning Course for Beginners', channel: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=i_LwzRVP7bg', duration: '6h' },
      'sql': { title: 'SQL Tutorial - Full Database Course', channel: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', duration: '4h 20m' },
      'docker': { title: 'Docker Tutorial for Beginners', channel: 'TechWorld with Nana', url: 'https://www.youtube.com/watch?v=3c-iBn73dDE', duration: '2h 57m' },
      'kubernetes': { title: 'Kubernetes Crash Course', channel: 'TechWorld with Nana', url: 'https://www.youtube.com/watch?v=s_o8dwzRlu4', duration: '1h 20m' },
    };

    return topics.slice(0, 8).map((topic) => {
      const key = String(topic).toLowerCase();
      const direct = youtubeMap[key];
      if (direct) {
        return {
          topic,
          ...direct,
        };
      }

      const matchedKey = Object.keys(youtubeMap).find((entry) => key.includes(entry) || entry.includes(key));
      if (matchedKey) {
        return {
          topic,
          ...youtubeMap[matchedKey],
        };
      }

      return {
        topic,
        title: `${topic} tutorial series`,
        channel: 'YouTube Learning',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`,
        duration: 'Varies',
      };
    });
  }

  /**
   * Suggest coding practice platforms
   */
  static suggestCodingPlatforms(topics) {
    const topicText = topics.join(' ').toLowerCase();
    const platforms = [
      {
        name: 'LeetCode',
        url: 'https://leetcode.com/',
        why: 'Practice problem-solving and interview-style coding challenges.',
        focusSkills: ['Data Structures', 'Algorithms'],
      },
      {
        name: 'HackerRank',
        url: 'https://www.hackerrank.com/',
        why: 'Structured tracks for SQL, Python, JavaScript, and backend roles.',
        focusSkills: ['SQL', 'Python', 'JavaScript'],
      },
      {
        name: 'Codewars',
        url: 'https://www.codewars.com/',
        why: 'Short coding kata to build daily coding consistency.',
        focusSkills: ['JavaScript', 'Python'],
      },
      {
        name: 'Kaggle',
        url: 'https://www.kaggle.com/',
        why: 'Hands-on ML projects, notebooks, and datasets for portfolio building.',
        focusSkills: ['Machine Learning', 'Data Science'],
      },
      {
        name: 'Exercism',
        url: 'https://exercism.org/',
        why: 'Mentored programming exercises across many languages.',
        focusSkills: ['Language Fundamentals', 'Best Practices'],
      },
    ];

    if (topicText.includes('machine learning') || topicText.includes('data')) {
      return platforms;
    }

    return platforms.filter((item) => item.name !== 'Kaggle');
  }

  /**
   * Suggest deep-dive reading resources
   */
  static suggestDeepDiveResources(topics) {
    return topics.slice(0, 8).map((topic) => ({
      topic,
      type: 'Documentation',
      title: `${topic} official learning path`,
      url: `https://roadmap.sh/${String(topic).toLowerCase().replace(/\s+/g, '-')}`,
    }));
  }
}

module.exports = SkillGapService;
