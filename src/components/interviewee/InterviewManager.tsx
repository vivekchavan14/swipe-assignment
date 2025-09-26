import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Card, Typography, Spin, Alert, Button } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import ResumeUpload from './ResumeUpload';
import ChatInterface from './ChatInterface';
import { CandidateProfile, Interview, Answer } from '../../types';
import { addCandidate, setCurrentCandidate } from '../../store/candidatesSlice';
import { 
  createInterview, 
  setCurrentInterview, 
  updateInterviewStatus,
  addAnswer,
  moveToNextQuestion,
  setFinalResults,
  updateAnswer
} from '../../store/interviewsSlice';
import { aiService } from '../../utils/aiService';
import { ParsedResumeData } from '../../utils/resumeParser';

const { Title, Text } = Typography;

type InterviewStep = 'upload' | 'interview' | 'completed';

const InterviewManager: React.FC = () => {
  const dispatch = useDispatch();
  const { candidates, currentCandidateId } = useSelector((state: RootState) => state.candidates);
  const { currentInterviewId, interviews } = useSelector((state: RootState) => state.interviews);
  
  const [step, setStep] = useState<InterviewStep>('upload');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false);
  const [currentCandidate, setCurrentCandidateState] = useState<CandidateProfile | null>(null);
  const [currentInterview, setCurrentInterviewState] = useState<Interview | null>(null);
  const [resumeContent, setResumeContent] = useState<string>('');

  const currentInterviewData = currentInterviewId 
    ? interviews.find(i => i.id === currentInterviewId) 
    : null;
  
  const currentCandidateData = currentCandidateId
    ? candidates.find(c => c.id === currentCandidateId)
    : null;

  useEffect(() => {
    if (currentInterviewData) {
      setCurrentInterviewState(currentInterviewData);
      if (currentInterviewData.status === 'completed') {
        setStep('completed');
      } else if (currentInterviewData.questions.length > 0) {
        setStep('interview');
      }
    }
  }, [currentInterviewData]);
  
  useEffect(() => {
    if (currentCandidateData) {
      setCurrentCandidateState(currentCandidateData);
    }
  }, [currentCandidateData, currentInterviewData]);

  // Sync current interview state with Redux store
  useEffect(() => {
    if (currentInterviewData) {
      setCurrentInterviewState(currentInterviewData);
    }
  }, [currentInterviewData, currentInterviewData?.currentQuestionIndex]);

  const handleResumeProcessed = (data: ParsedResumeData & { file: File }) => {
    console.log('Resume processed:', data);
    setResumeContent(data.fullText);
  };

  const handleProfileComplete = async (profile: { name: string; email: string; phone: string; file: File }) => {
    try {
      // Clear any existing current interview/candidate to start fresh
      dispatch(setCurrentCandidate(undefined));
      dispatch(setCurrentInterview(undefined));
      
      const candidateId = Math.random().toString(36).substr(2, 9);
      const candidate: CandidateProfile = {
        id: candidateId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        createdAt: new Date().toISOString(),
      };

      // Add candidate to store
      dispatch(addCandidate(candidate));
      dispatch(setCurrentCandidate(candidateId));
      setCurrentCandidateState(candidate);

      // Start loading questions
      setLoadingQuestions(true);

      // Generate interview questions based on resume content
      const questions = await aiService.generateQuestions(resumeContent);
      
      // Create interview
      const interviewId = Math.random().toString(36).substr(2, 9);
      const interview: Interview = {
        id: interviewId,
        candidateId: candidateId,
        status: 'in_progress',
        currentQuestionIndex: 0,
        questions: questions,
        answers: [],
        startedAt: new Date().toISOString(),
      };

      dispatch(createInterview(interview));
      dispatch(setCurrentInterview(interviewId));
      dispatch(updateInterviewStatus({ id: interviewId, status: 'in_progress' }));
      setCurrentInterviewState(interview);

      setLoadingQuestions(false);
      setStep('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
      setLoadingQuestions(false);
    }
  };

  const handleAnswerSubmit = async (answerText: string, timeSpent: number) => {
    if (!currentInterview || !currentInterviewId) return;

    try {
      setLoadingNextQuestion(true);

      const currentQuestion = currentInterview.questions[currentInterview.currentQuestionIndex];
      
      // Create answer
      const answer: Answer = {
        questionId: currentQuestion.id,
        text: answerText,
        timeSpent: timeSpent,
        timestamp: new Date().toISOString(),
      };

      // Add answer to store
      dispatch(addAnswer({ interviewId: currentInterviewId, answer }));

      // Score the answer with AI
      const { score, analysis } = await aiService.scoreAnswer(currentQuestion, answer);
      
      // Update answer with AI score
      dispatch(updateAnswer({ 
        interviewId: currentInterviewId, 
        questionId: currentQuestion.id, 
        updates: { score, aiAnalysis: analysis }
      }));

      // Check if this was the last question
      const isLastQuestion = currentInterview.currentQuestionIndex >= currentInterview.questions.length - 1;

      if (isLastQuestion) {
        // Interview completed - generate final summary
        const updatedAnswers = [...currentInterview.answers, { ...answer, score, aiAnalysis: analysis }];
        const { score: finalScore, summary } = await aiService.generateFinalSummary(
          currentInterview.questions,
          updatedAnswers
        );

        dispatch(setFinalResults({ 
          interviewId: currentInterviewId, 
          score: finalScore, 
          summary 
        }));

        setStep('completed');
      } else {
        // Move to next question
        dispatch(moveToNextQuestion(currentInterviewId));
      }

      setLoadingNextQuestion(false);
    } catch (error) {
      console.error('Error processing answer:', error);
      setLoadingNextQuestion(false);
    }
  };

  const startNewInterview = () => {
    setStep('upload');
    setCurrentCandidateState(null);
    setCurrentInterviewState(null);
    dispatch(setCurrentCandidate(undefined));
    dispatch(setCurrentInterview(undefined));
  };

  if (loadingQuestions) {
    return (
      <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', marginTop: 50 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Title level={4}>Preparing Your Interview</Title>
          <Text type="secondary">
            Generating personalized questions based on full-stack development role...
          </Text>
        </div>
      </Card>
    );
  }

  if (step === 'upload') {
    return (
      <div style={{ padding: 24 }}>
        <ResumeUpload 
          onResumeProcessed={handleResumeProcessed}
          onProfileComplete={handleProfileComplete}
        />
      </div>
    );
  }

  if (step === 'interview' && currentInterviewData && currentCandidate) {
    const currentQuestion = currentInterviewData.questions[currentInterviewData.currentQuestionIndex];
    
    if (!currentQuestion) {
      return (
        <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', marginTop: 50 }}>
          <Alert
            message="Interview Error"
            description="Unable to load the current question. Please try refreshing the page."
            type="error"
            showIcon
          />
        </Card>
      );
    }

    return (
      <div style={{ padding: 24 }}>
        <ChatInterface
          question={currentQuestion}
          onAnswerSubmit={handleAnswerSubmit}
          questionNumber={currentInterviewData.currentQuestionIndex + 1}
          totalQuestions={currentInterviewData.questions.length}
          isLoadingNextQuestion={loadingNextQuestion}
          candidateName={currentCandidate.name}
        />
      </div>
    );
  }

  if (step === 'completed' && currentInterviewData && currentCandidate) {
    return (
      <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', marginTop: 50 }}>
        <div style={{ padding: 24 }}>
          <TrophyOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
          
          <Title level={2} style={{ marginBottom: 16 }}>
            Interview Completed!
          </Title>
          
          <Text style={{ fontSize: '18px', display: 'block', marginBottom: 24 }}>
            Congratulations {currentCandidate.name}, you have successfully completed the interview.
          </Text>

          {currentInterviewData.finalScore && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                fontSize: '48px', 
                fontWeight: 'bold', 
                color: currentInterviewData.finalScore >= 70 ? '#52c41a' : '#faad14',
                marginBottom: 8 
              }}>
                {currentInterviewData.finalScore}/100
              </div>
              <Text type="secondary" style={{ fontSize: '16px' }}>Your Final Score</Text>
            </div>
          )}

          {currentInterviewData.finalSummary && (
            <Alert
              message="AI Assessment Summary"
              description={currentInterviewData.finalSummary}
              type="info"
              style={{ textAlign: 'left', marginBottom: 24 }}
            />
          )}

          <div style={{ marginTop: 32 }}>
            <Text type="secondary">
              Thank you for taking the time to complete this interview. 
              Our team will review your responses and get back to you soon.
            </Text>
          </div>

          <div style={{ marginTop: 24 }}>
            <Button type="primary" size="large" onClick={startNewInterview}>
              Start New Interview
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Debug/fallback state - show something if we're in an unclear state
  return (
    <div style={{ padding: 24 }}>
      <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', marginTop: 50 }}>
        <div style={{ padding: 24 }}>
          <Title level={4} style={{ marginBottom: 16 }}>Interview Status</Title>
          
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            <Text strong>Debug Information:</Text><br/>
            <Text>Current Step: {step}</Text><br/>
            <Text>Has Interview Data: {currentInterviewData ? 'Yes' : 'No'}</Text><br/>
            <Text>Has Candidate Data: {currentCandidate ? 'Yes' : 'No'}</Text><br/>
            <Text>Interview Status: {currentInterviewData?.status || 'N/A'}</Text><br/>
            <Text>Questions Count: {currentInterviewData?.questions.length || 0}</Text><br/>
          </div>
          
          <Alert
            message="Waiting for Interview State"
            description="The interview state is being initialized. If this persists, please start a new interview."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Button type="primary" size="large" onClick={startNewInterview}>
            Start New Interview
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default InterviewManager;
