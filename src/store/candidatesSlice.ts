import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CandidateProfile } from '../types';

interface CandidatesState {
  candidates: CandidateProfile[];
  currentCandidateId?: string;
}

const initialState: CandidatesState = {
  candidates: [],
  currentCandidateId: undefined,
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<CandidateProfile>) => {
      state.candidates.push(action.payload);
    },
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<CandidateProfile> }>) => {
      const { id, updates } = action.payload;
      const candidateIndex = state.candidates.findIndex(c => c.id === id);
      if (candidateIndex !== -1) {
        state.candidates[candidateIndex] = { ...state.candidates[candidateIndex], ...updates };
      }
    },
    setCurrentCandidate: (state, action: PayloadAction<string | undefined>) => {
      state.currentCandidateId = action.payload;
    },
    deleteCandidate: (state, action: PayloadAction<string>) => {
      state.candidates = state.candidates.filter(c => c.id !== action.payload);
      if (state.currentCandidateId === action.payload) {
        state.currentCandidateId = undefined;
      }
    },
  },
});

export const { addCandidate, updateCandidate, setCurrentCandidate, deleteCandidate } = candidatesSlice.actions;
export default candidatesSlice.reducer;