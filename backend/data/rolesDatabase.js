/**
 * Industry Roles Database
 * Contains real-world job roles with skill requirements
 */

const rolesDatabase = [
  {
    roleId: 'role_001',
    roleName: 'Data Scientist',
    description: 'Analyze complex data, build predictive models, and drive data-informed business decisions',
    requiredSkills: ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Data Visualization', 'Pandas', 'NumPy'],
    skillWeights: {
      'Python': 2,
      'Machine Learning': 2.5,
      'SQL': 1.5,
      'Statistics': 2,
      'Data Visualization': 1.5,
      'Pandas': 1.5,
      'NumPy': 1
    },
    industryDemand: 'Very High',
    averageSalary: '$120,000 - $180,000',
    jobMarketGrowth: 36,
    seniority: 'Mid-Senior',
    relatedRoles: ['AI Engineer', 'Machine Learning Engineer', 'Analytics Engineer']
  },
  {
    roleId: 'role_002',
    roleName: 'AI Engineer',
    description: 'Design and implement AI systems, optimize algorithms, and deploy machine learning models',
    requiredSkills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision'],
    skillWeights: {
      'Python': 2.5,
      'Machine Learning': 2.5,
      'Deep Learning': 2,
      'TensorFlow': 1.5,
      'PyTorch': 1.5,
      'NLP': 2,
      'Computer Vision': 2
    },
    industryDemand: 'Critical',
    averageSalary: '$130,000 - $200,000',
    jobMarketGrowth: 48,
    seniority: 'Mid-Senior',
    relatedRoles: ['Data Scientist', 'Machine Learning Engineer', 'Research Engineer']
  },
  {
    roleId: 'role_003',
    roleName: 'Full Stack Developer',
    description: 'Develop both frontend and backend components of web applications',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'SQL', 'HTML', 'CSS', 'REST APIs'],
    skillWeights: {
      'JavaScript': 2.5,
      'React': 2,
      'Node.js': 2,
      'MongoDB': 1.5,
      'SQL': 1.5,
      'HTML': 1,
      'CSS': 1,
      'REST APIs': 2
    },
    industryDemand: 'Very High',
    averageSalary: '$100,000 - $160,000',
    jobMarketGrowth: 22,
    seniority: 'Mid-level',
    relatedRoles: ['Frontend Developer', 'Backend Developer', 'IoT Engineer']
  },
  {
    roleId: 'role_004',
    roleName: 'Frontend Developer',
    description: 'Create responsive and interactive user interfaces for web and mobile applications',
    requiredSkills: ['JavaScript', 'React', 'CSS', 'HTML', 'Responsive Design', 'State Management', 'UI/UX'],
    skillWeights: {
      'JavaScript': 2.5,
      'React': 2.5,
      'CSS': 2,
      'HTML': 1.5,
      'Responsive Design': 1.5,
      'State Management': 1.5,
      'UI/UX': 1
    },
    industryDemand: 'High',
    averageSalary: '$90,000 - $150,000',
    jobMarketGrowth: 20,
    seniority: 'Junior-Mid',
    relatedRoles: ['Full Stack Developer', 'UI Designer', 'UX Designer']
  },
  {
    roleId: 'role_005',
    roleName: 'Backend Developer',
    description: 'Build scalable server-side applications and manage databases',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'SQL', 'REST APIs', 'System Design', 'Docker'],
    skillWeights: {
      'Node.js': 2.5,
      'Express': 2,
      'MongoDB': 1.5,
      'SQL': 1.5,
      'REST APIs': 2,
      'System Design': 2,
      'Docker': 1.5
    },
    industryDemand: 'Very High',
    averageSalary: '$100,000 - $170,000',
    jobMarketGrowth: 24,
    seniority: 'Mid-level',
    relatedRoles: ['Full Stack Developer', 'DevOps Engineer', 'Cloud Architect']
  },
  {
    roleId: 'role_006',
    roleName: 'IoT Engineer',
    description: 'Design and develop Internet of Things solutions and embedded systems',
    requiredSkills: ['Embedded C', 'Python', 'IoT Protocols', 'Microcontrollers', 'Sensors', 'MQTT', 'Arduino', 'Circuit Design'],
    skillWeights: {
      'Embedded C': 2.5,
      'Python': 1.5,
      'IoT Protocols': 2,
      'Microcontrollers': 2,
      'Sensors': 1.5,
      'MQTT': 1.5,
      'Arduino': 1,
      'Circuit Design': 2
    },
    industryDemand: 'High',
    averageSalary: '$95,000 - $155,000',
    jobMarketGrowth: 28,
    seniority: 'Mid-level',
    relatedRoles: ['Embedded Systems Engineer', 'Hardware Engineer', 'Full Stack Developer']
  },
  {
    roleId: 'role_007',
    roleName: 'DevOps Engineer',
    description: 'Manage infrastructure, automate deployments, and ensure system reliability',
    requiredSkills: ['Docker', 'Kubernetes', 'Linux', 'CI/CD', 'Cloud (AWS/GCP/Azure)', 'Terraform', 'Monitoring'],
    skillWeights: {
      'Docker': 2.5,
      'Kubernetes': 2.5,
      'Linux': 2,
      'CI/CD': 2,
      'Cloud (AWS/GCP/Azure)': 2.5,
      'Terraform': 1.5,
      'Monitoring': 1.5
    },
    industryDemand: 'Critical',
    averageSalary: '$110,000 - $190,000',
    jobMarketGrowth: 32,
    seniority: 'Mid-Senior',
    relatedRoles: ['Cloud Architect', 'Systems Engineer', 'Backend Developer']
  },
  {
    roleId: 'role_008',
    roleName: 'Cloud Architect',
    description: 'Design scalable cloud infrastructure and solutions',
    requiredSkills: ['AWS', 'Cloud Design', 'System Architecture', 'Docker', 'Kubernetes', 'Security', 'Cost Optimization'],
    skillWeights: {
      'AWS': 2.5,
      'Cloud Design': 2.5,
      'System Architecture': 2.5,
      'Docker': 1.5,
      'Kubernetes': 2,
      'Security': 2,
      'Cost Optimization': 1.5
    },
    industryDemand: 'Critical',
    averageSalary: '$140,000 - $220,000',
    jobMarketGrowth: 35,
    seniority: 'Senior',
    relatedRoles: ['DevOps Engineer', 'Systems Engineer', 'Solutions Architect']
  }
];

module.exports = rolesDatabase;
