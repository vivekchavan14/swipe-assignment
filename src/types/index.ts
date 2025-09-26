export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile?: File;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number; // in seconds
  order: number;
}

export interface Answer {
  questionId: string;
  text: string;
  timeSpent: number;
  timestamp: string;
  score?: number;
  aiAnalysis?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  currentQuestionIndex: number;
  questions: Question[];
  answers: Answer[];
  finalScore?: number;
  finalSummary?: string;
  startedAt?: string;
  completedAt?: string;
  lastResumedAt?: string;
}

export interface AppState {
  candidates: CandidateProfile[];
  interviews: Interview[];
  currentInterviewId?: string;
  currentCandidateId?: string;
  isResuming: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'system' | 'user' | 'question' | 'timer';
  content: string;
  timestamp: string;
  isQuestion?: boolean;
  difficulty?: Question['difficulty'];
  timeLimit?: number;
}

export interface TimerState {
  isActive: boolean;
  timeRemaining: number;
  initialTime: number;
}