import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Interview, Question, Answer } from '../types';

interface InterviewsState {
  interviews: Interview[];
  currentInterviewId?: string;
  isResuming: boolean;
}

const initialState: InterviewsState = {
  interviews: [],
  currentInterviewId: undefined,
  isResuming: false,
};

const interviewsSlice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {
    createInterview: (state, action: PayloadAction<Interview>) => {
      state.interviews.push(action.payload);
    },
    setCurrentInterview: (state, action: PayloadAction<string | undefined>) => {
      state.currentInterviewId = action.payload;
    },
    updateInterviewStatus: (state, action: PayloadAction<{ id: string; status: Interview['status'] }>) => {
      const { id, status } = action.payload;
      const interview = state.interviews.find(i => i.id === id);
      if (interview) {
        interview.status = status;
        if (status === 'in_progress' && !interview.startedAt) {
          interview.startedAt = new Date().toISOString();
        }
        if (status === 'completed') {
          interview.completedAt = new Date().toISOString();
        }
        if (status === 'in_progress') {
          interview.lastResumedAt = new Date().toISOString();
        }
      }
    },
    addAnswer: (state, action: PayloadAction<{ interviewId: string; answer: Answer }>) => {
      const { interviewId, answer } = action.payload;
      const interview = state.interviews.find(i => i.id === interviewId);
      if (interview) {
        interview.answers.push(answer);
      }
    },
    updateAnswer: (state, action: PayloadAction<{ interviewId: string; questionId: string; updates: Partial<Answer> }>) => {
      const { interviewId, questionId, updates } = action.payload;
      const interview = state.interviews.find(i => i.id === interviewId);
      if (interview) {
        const answerIndex = interview.answers.findIndex(a => a.questionId === questionId);
        if (answerIndex !== -1) {
          interview.answers[answerIndex] = { ...interview.answers[answerIndex], ...updates };
        }
      }
    },
    moveToNextQuestion: (state, action: PayloadAction<string>) => {
      const interview = state.interviews.find(i => i.id === action.payload);
      if (interview && interview.currentQuestionIndex < interview.questions.length - 1) {
        interview.currentQuestionIndex += 1;
      }
    },
    setInterviewQuestions: (state, action: PayloadAction<{ interviewId: string; questions: Question[] }>) => {
      const { interviewId, questions } = action.payload;
      const interview = state.interviews.find(i => i.id === interviewId);
      if (interview) {
        interview.questions = questions;
      }
    },
    setFinalResults: (state, action: PayloadAction<{ interviewId: string; score: number; summary: string }>) => {
      const { interviewId, score, summary } = action.payload;
      const interview = state.interviews.find(i => i.id === interviewId);
      if (interview) {
        interview.finalScore = score;
        interview.finalSummary = summary;
        interview.status = 'completed';
        interview.completedAt = new Date().toISOString();
      }
    },
    setIsResuming: (state, action: PayloadAction<boolean>) => {
      state.isResuming = action.payload;
    },
  },
});

export const {
  createInterview,
  setCurrentInterview,
  updateInterviewStatus,
  addAnswer,
  updateAnswer,
  moveToNextQuestion,
  setInterviewQuestions,
  setFinalResults,
  setIsResuming,
} = interviewsSlice.actions;

export default interviewsSlice.reducer;