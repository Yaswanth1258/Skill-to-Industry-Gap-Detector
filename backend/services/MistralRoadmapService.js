class MistralRoadmapService {
  static async generateCareerPlan({ student, role, missingSkills, weakSkills }) {
    const prompt = this.buildPrompt({ student, role, missingSkills, weakSkills });

    if (process.env.OPENROUTER_API_KEY) {
      return this.generateWithOpenRouter(prompt);
    }

    return this.generateWithOllama(prompt);
  }

  static async generateWithOllama(prompt) {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    const model = process.env.MISTRAL_MODEL || 'mistral:7b';

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral generation failed with status ${response.status}`);
    }

    const payload = await response.json();
    const parsed = this.extractJson(payload.response || '{}');

    return this.normalizeRoadmap(parsed);
  }

  static async generateWithOpenRouter(prompt) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a career mentor AI that returns only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(`OpenRouter generation failed with status ${response.status}: ${errorPayload}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || '{}';
    const parsed = this.extractJson(content);
    return this.normalizeRoadmap(parsed);
  }

  static buildPrompt({ student, role, missingSkills, weakSkills }) {
    return [
      'You are a career mentor AI. Generate a practical, realistic learning plan.',
      'Return only valid JSON and no markdown.',
      'Expected JSON schema:',
      '{',
      '  "estimatedDuration": "string",',
      '  "topics": [{"topic":"string","difficulty":"Beginner|Intermediate|Advanced","estimatedHours":number,"priority":"High|Medium|Low","sequence":number,"moduleDescription":"string","learningObjectives":["string"],"deliverables":["string"],"prerequisites":["string"],"practiceTasks":["string"],"moduleResources":[{"title":"string","type":"Guide|Documentation|Video","url":"string"}]}],',
      '  "learningOrder": ["string"],',
      '  "milestones": [{"milestone":"string","topics":["string"],"estimatedWeek":number}],',
      '  "suggestedProjects": [{"project":"string","difficulty":"Beginner|Intermediate|Advanced","duration":"string","skills":["string"]}],',
      '  "courseRecommendations": [{"title":"string","provider":"string","url":"string","reason":"string","estimatedDuration":"string"}],',
      '  "youtubeResources": [{"topic":"string","title":"string","channel":"string","url":"string","duration":"string"}],',
      '  "codingPlatforms": [{"name":"string","url":"string","why":"string","focusSkills":["string"]}],',
      '  "deepDiveResources": [{"topic":"string","type":"Documentation|Article|Guide","title":"string","url":"string"}]',
      '}',
      `Student: ${JSON.stringify({
        currentRole: student.currentRole || '',
        experience: student.experience || '',
        skills: student.skills || [],
        interests: student.interests || [],
      })}`,
      `Target role: ${JSON.stringify({
        roleName: role.roleName,
        description: role.description,
        requiredSkills: role.requiredSkills || [],
      })}`,
      `Missing skills: ${JSON.stringify(missingSkills || [])}`,
      `Weak skills: ${JSON.stringify(weakSkills || [])}`,
      'Constraints:',
      '- Create 8 to 14 topics.',
      '- Create 4 milestones.',
      '- Recommend 4 to 6 projects.',
      '- Recommend 6 to 8 courses with real providers (Coursera/Udemy/edX/YouTube/official docs).',
      '- Recommend 6 to 8 YouTube resources with valid links.',
      '- Recommend 4 to 6 coding practice platforms with links.',
      '- Keep outputs concise and actionable.',
    ].join('\n');
  }

  static extractJson(text) {
    try {
      return JSON.parse(text);
    } catch (_error) {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON object found in model response');
      }

      const candidate = text.slice(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    }
  }

  static normalizeRoadmap(data) {
    const topics = Array.isArray(data.topics)
      ? data.topics.map((topic, index) => ({
          topic: topic.topic,
          difficulty: topic.difficulty || 'Intermediate',
          estimatedHours: Number(topic.estimatedHours) || 20,
          priority: topic.priority || 'Medium',
          sequence: Number(topic.sequence) || index + 1,
          moduleDescription: topic.moduleDescription || `Build applied confidence in ${topic.topic}.`,
          learningObjectives: Array.isArray(topic.learningObjectives) ? topic.learningObjectives : [],
          deliverables: Array.isArray(topic.deliverables) ? topic.deliverables : [],
          prerequisites: Array.isArray(topic.prerequisites) ? topic.prerequisites : [],
          practiceTasks: Array.isArray(topic.practiceTasks) ? topic.practiceTasks : [],
          moduleResources: Array.isArray(topic.moduleResources) ? topic.moduleResources : [],
        }))
      : [];
    const milestones = Array.isArray(data.milestones) ? data.milestones : [];
    const projects = Array.isArray(data.suggestedProjects) ? data.suggestedProjects : [];
    const courses = Array.isArray(data.courseRecommendations) ? data.courseRecommendations : [];
    const youtubeResources = Array.isArray(data.youtubeResources) ? data.youtubeResources : [];
    const codingPlatforms = Array.isArray(data.codingPlatforms) ? data.codingPlatforms : [];
    const deepDiveResources = Array.isArray(data.deepDiveResources) ? data.deepDiveResources : [];

    if (topics.length === 0 || milestones.length === 0 || projects.length === 0) {
      throw new Error('Incomplete roadmap returned by model');
    }

    const learningOrder = Array.isArray(data.learningOrder) && data.learningOrder.length > 0
      ? data.learningOrder
      : topics
          .slice()
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
          .map((topic) => topic.topic)
          .filter(Boolean);

    return {
      estimatedDuration: data.estimatedDuration || '12 weeks',
      topics,
      learningOrder,
      milestones,
      suggestedProjects: projects,
      courseRecommendations: courses,
      youtubeResources,
      codingPlatforms,
      deepDiveResources,
    };
  }
}

module.exports = MistralRoadmapService;