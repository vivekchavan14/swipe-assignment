import OpenAI from 'openai';
import { Question, Answer } from '../types';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AIService {
  generateQuestions: (resumeContent?: string) => Promise<Question[]>;
  scoreAnswer: (question: Question, answer: Answer) => Promise<{ score: number; analysis: string }>;
  generateFinalSummary: (questions: Question[], answers: Answer[]) => Promise<{ score: number; summary: string }>;
}

const MOCK_QUESTIONS: Omit<Question, 'id'>[] = [
  {
    text: "What is the difference between let, const, and var in JavaScript?",
    difficulty: 'Easy',
    timeLimit: 180, // 3 minutes
    order: 0,
  },
  {
    text: "Explain the concept of closures in JavaScript with an example.",
    difficulty: 'Easy',
    timeLimit: 180, // 3 minutes
    order: 1,
  },
  {
    text: "How would you implement a simple REST API using Node.js and Express? Walk me through the basic setup.",
    difficulty: 'Medium',
    timeLimit: 420, // 7 minutes
    order: 2,
  },
  {
    text: "What are React hooks and how do useState and useEffect work? Provide examples.",
    difficulty: 'Medium',
    timeLimit: 420, // 7 minutes
    order: 3,
  },
  {
    text: "Design a scalable system for handling real-time chat messages. Consider database design, WebSocket connections, and message delivery guarantees.",
    difficulty: 'Hard',
    timeLimit: 900, // 15 minutes
    order: 4,
  },
  {
    text: "Implement a function that efficiently finds the longest common subsequence between two strings. Explain the time and space complexity.",
    difficulty: 'Hard',
    timeLimit: 900, // 15 minutes
    order: 5,
  },
];

class RealAIService implements AIService {
  async generateQuestions(resumeContent?: string): Promise<Question[]> {
    try {
      const systemPrompt = resumeContent 
        ? `You are an AI interviewer for a full-stack developer position. Based on the candidate's resume, generate exactly 6 personalized technical interview questions: 2 Easy, 2 Medium, and 2 Hard. 
        
        Tailor questions to their experience level, technologies mentioned, and background. Return ONLY a JSON array with objects containing 'text' (the question), 'difficulty' (Easy/Medium/Hard), 'timeLimit' (Easy: 180 seconds, Medium: 420 seconds, Hard: 900 seconds), and 'order' (0-5).
        
        Resume content: ${resumeContent.substring(0, 2000)}`
        : "You are an AI interviewer for a full-stack developer position (React/Node.js). Generate exactly 6 interview questions: 2 Easy, 2 Medium, and 2 Hard. Return ONLY a JSON array with objects containing 'text' (the question), 'difficulty' (Easy/Medium/Hard), 'timeLimit' (Easy: 180 seconds, Medium: 420 seconds, Hard: 900 seconds), and 'order' (0-5)."
        
      const userPrompt = resumeContent
        ? "Generate 6 personalized technical interview questions based on this candidate's resume for a full-stack developer role."
        : "Generate 6 technical interview questions for a full-stack developer role focusing on React and Node.js.";

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const questions = JSON.parse(content);
        return questions.map((q: any, index: number) => ({
          id: Math.random().toString(36).substr(2, 9),
          text: q.text,
          difficulty: q.difficulty,
          timeLimit: q.timeLimit,
          order: index
        }));
      } catch (parseError) {
        console.log('Failed to parse AI response, using fallback questions');
        return MOCK_QUESTIONS.map((q, index) => ({
          ...q,
          id: Math.random().toString(36).substr(2, 9),
          order: index
        }));
      }
    } catch (error) {
      console.error('OpenAI API error, using fallback questions:', error);
      return MOCK_QUESTIONS.map((q, index) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        order: index
      }));
    }
  }

  async scoreAnswer(question: Question, answer: Answer): Promise<{ score: number; analysis: string }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert technical interviewer evaluating answers for a full-stack developer position. 
            
            Scoring criteria:
            - Technical accuracy and depth
            - Clarity of explanation
            - Use of appropriate terminology
            - Completeness of the answer
            - Time efficiency (they had ${question.timeLimit}s and used ${answer.timeSpent}s)
            
            Return a JSON object with:
            - "score": number from 1-10 (10 being excellent)
            - "analysis": detailed feedback (2-3 sentences)
            
            Question difficulty: ${question.difficulty}`
          },
          {
            role: "user",
            content: `Question: ${question.text}\n\nCandidate's Answer: ${answer.text}\n\nTime used: ${answer.timeSpent}s out of ${question.timeLimit}s allowed.\n\nPlease evaluate this answer.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const result = JSON.parse(content);
        return {
          score: Math.max(1, Math.min(10, result.score)),
          analysis: result.analysis
        };
      } catch (parseError) {
        // Fallback to simple scoring if JSON parsing fails
        return this.fallbackScoring(question, answer);
      }
    } catch (error) {
      console.error('OpenAI API error in scoring, using fallback:', error);
      return this.fallbackScoring(question, answer);
    }
  }

  private fallbackScoring(question: Question, answer: Answer): { score: number; analysis: string } {
    const answerLength = answer.text.trim().length;
    const hasCodeKeywords = /\b(function|const|let|var|class|import|export|async|await|promise|callback)\b/i.test(answer.text);
    
    let baseScore = 0;
    let analysis = '';

    switch (question.difficulty) {
      case 'Easy':
        baseScore = answerLength > 50 ? 7 : 4;
        if (hasCodeKeywords) baseScore += 1;
        analysis = `${question.difficulty} question response. ${hasCodeKeywords ? 'Good technical terminology.' : 'Could use more technical details.'}`;
        break;
      case 'Medium':
        baseScore = answerLength > 100 ? 6 : 4;
        if (hasCodeKeywords) baseScore += 2;
        analysis = `${question.difficulty} question response. ${hasCodeKeywords ? 'Demonstrates technical knowledge.' : 'Missing technical depth.'}`;
        break;
      case 'Hard':
        baseScore = answerLength > 200 ? 5 : 3;
        if (hasCodeKeywords) baseScore += 2;
        analysis = `${question.difficulty} question requiring deep knowledge. ${hasCodeKeywords ? 'Shows technical understanding.' : 'Could elaborate more on technical aspects.'}`;
        break;
    }

    if (answerLength < 10) {
      baseScore = 1;
      analysis = 'Very brief response. More detailed explanations needed.';
    }

    return {
      score: Math.max(1, Math.min(10, baseScore)),
      analysis,
    };
  }

  async generateFinalSummary(questions: Question[], answers: Answer[]): Promise<{ score: number; summary: string }> {
    try {
      const interviewData = questions.map((question, index) => {
        const answer = answers[index];
        return {
          question: question.text,
          difficulty: question.difficulty,
          answer: answer?.text || 'No answer provided',
          score: answer?.score || 0,
          timeSpent: answer?.timeSpent || 0,
          timeLimit: question.timeLimit
        };
      }).filter(item => item.answer !== 'No answer provided');

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert technical interviewer providing a final assessment for a full-stack developer candidate. 
            
            Analyze the complete interview performance and provide:
            1. An overall score from 0-100
            2. A comprehensive summary covering:
               - Strengths and weaknesses
               - Technical competency level
               - Areas for improvement
               - Hiring recommendation
            
            Return a JSON object with:
            - "score": number from 0-100
            - "summary": detailed assessment (4-6 sentences)
            
            Consider both the technical accuracy and the candidate's ability to explain concepts clearly.`
          },
          {
            role: "user",
            content: `Interview Results:\n\n${interviewData.map((item, i) => 
              `Question ${i+1} (${item.difficulty}): ${item.question}\n` +
              `Answer: ${item.answer}\n` +
              `Score: ${item.score}/10, Time: ${item.timeSpent}s/${item.timeLimit}s\n`
            ).join('\n')}\n\nPlease provide a comprehensive final assessment.`
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const result = JSON.parse(content);
        return {
          score: Math.max(0, Math.min(100, result.score)),
          summary: result.summary
        };
      } catch (parseError) {
        // Fallback to simple summary if JSON parsing fails
        return this.fallbackSummary(questions, answers);
      }
    } catch (error) {
      console.error('OpenAI API error in summary generation, using fallback:', error);
      return this.fallbackSummary(questions, answers);
    }
  }

  private fallbackSummary(questions: Question[], answers: Answer[]): { score: number; summary: string } {
    const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    const averageScore = answers.length > 0 ? Math.round((totalScore / answers.length) * 10) / 10 : 0;
    const overallScore = Math.round(averageScore * 10); // Convert to 0-100 scale

    const easyQuestions = answers.filter((_, index) => questions[index]?.difficulty === 'Easy');
    const mediumQuestions = answers.filter((_, index) => questions[index]?.difficulty === 'Medium');
    const hardQuestions = answers.filter((_, index) => questions[index]?.difficulty === 'Hard');

    const easyAvg = easyQuestions.reduce((sum, a) => sum + (a.score || 0), 0) / Math.max(easyQuestions.length, 1);
    const mediumAvg = mediumQuestions.reduce((sum, a) => sum + (a.score || 0), 0) / Math.max(mediumQuestions.length, 1);
    const hardAvg = hardQuestions.reduce((sum, a) => sum + (a.score || 0), 0) / Math.max(hardQuestions.length, 1);

    let summary = `Interview completed with an overall score of ${overallScore}/100. `;
    summary += `Performance breakdown: Easy Questions ${easyAvg.toFixed(1)}/10, Medium Questions ${mediumAvg.toFixed(1)}/10, Hard Questions ${hardAvg.toFixed(1)}/10. `;

    if (overallScore >= 80) {
      summary += 'Excellent performance! Strong technical knowledge and problem-solving skills demonstrated.';
    } else if (overallScore >= 70) {
      summary += 'Good performance with solid technical foundation. Some areas for improvement in advanced concepts.';
    } else if (overallScore >= 60) {
      summary += 'Satisfactory performance. Recommend strengthening core concepts and practicing system design.';
    } else {
      summary += 'Needs improvement. Focus on fundamental concepts and hands-on practice recommended.';
    }

    return {
      score: overallScore,
      summary,
    };
  }
}

export const aiService = new RealAIService();

// Utility function to get time limit based on difficulty
export const getTimeLimit = (difficulty: Question['difficulty']): number => {
  switch (difficulty) {
    case 'Easy': return 180;  // 3 minutes
    case 'Medium': return 420; // 7 minutes
    case 'Hard': return 900;  // 15 minutes
    default: return 420;
  }
};
