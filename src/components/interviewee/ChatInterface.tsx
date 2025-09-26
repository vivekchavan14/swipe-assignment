import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Typography, Progress, Tag, Alert } from 'antd';
import { SendOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTimer } from '../../hooks/useTimer';
import { Question, ChatMessage } from '../../types';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface ChatInterfaceProps {
  question: Question;
  onAnswerSubmit: (answer: string, timeSpent: number) => void;
  questionNumber: number;
  totalQuestions: number;
  isLoadingNextQuestion?: boolean;
  candidateName?: string;
}

const getDifficultyColor = (difficulty: Question['difficulty']) => {
  switch (difficulty) {
    case 'Easy': return 'green';
    case 'Medium': return 'orange';
    case 'Hard': return 'red';
    default: return 'blue';
  }
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  question,
  onAnswerSubmit,
  questionNumber,
  totalQuestions,
  isLoadingNextQuestion = false,
  candidateName,
}) => {
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef(answer);
  const onAnswerSubmitRef = useRef(onAnswerSubmit);
  const currentQuestionIdRef = useRef<string | null>(null);

  // Create timer first
  const timer = useTimer(() => {
    setIsSubmitted(true);
    const finalAnswer = answerRef.current.trim() || "No answer provided";
    const timeSpentValue = timer.timeSpent;
    onAnswerSubmitRef.current(finalAnswer, timeSpentValue);
    
    // Add time up message
    const timeUpMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: 'Time is up! Your answer has been automatically submitted.',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, timeUpMessage]);
  });

  // Update refs
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  useEffect(() => {
    onAnswerSubmitRef.current = onAnswerSubmit;
  }, [onAnswerSubmit]);

  useEffect(() => {
    // Prevent duplicate question handling in React StrictMode
    if (currentQuestionIdRef.current === question.id) {
      return;
    }
    
    currentQuestionIdRef.current = question.id;
    
    // Start timer when component mounts or question changes
    timer.startTimer(question.timeLimit);
    setIsSubmitted(false);
    setAnswer('');

    // Reset messages and add welcome message for first question
    if (questionNumber === 1) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        type: 'system',
        content: `Welcome to your interview${candidateName ? `, ${candidateName}` : ''}! You'll be answering ${totalQuestions} questions total. Let's begin with your first question.`,
        timestamp: new Date().toISOString(),
      };
      const questionMessage: ChatMessage = {
        id: `question-${question.id}`,
        type: 'question',
        content: question.text,
        timestamp: new Date().toISOString(),
        isQuestion: true,
        difficulty: question.difficulty,
        timeLimit: question.timeLimit,
      };
      setMessages([welcomeMessage, questionMessage]);
    } else {
      // For subsequent questions, only add the question message
      const questionMessage: ChatMessage = {
        id: `question-${question.id}`,
        type: 'question',
        content: question.text,
        timestamp: new Date().toISOString(),
        isQuestion: true,
        difficulty: question.difficulty,
        timeLimit: question.timeLimit,
      };
      setMessages(prev => [...prev, questionMessage]);
    }

    return () => {
      timer.stopTimer();
    };
  }, [question.id, question.text, question.difficulty, question.timeLimit, questionNumber, totalQuestions, candidateName, timer]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    if (!answer.trim() || isSubmitted) return;

    setIsSubmitted(true);
    timer.stopTimer();
    
    // Add user answer message
    const answerMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: answer.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, answerMessage]);
    onAnswerSubmit(answer.trim(), timer.timeSpent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const progressPercent = Math.round(((questionNumber - 1) / totalQuestions) * 100);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      {/* Header */}
      <div className="progress-header chat-timer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
            Question {questionNumber} of {totalQuestions}
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tag color={getDifficultyColor(question.difficulty)} style={{ margin: 0 }}>
              {question.difficulty}
            </Tag>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClockCircleOutlined />
              <Text 
                strong 
                style={{ 
                  color: timer.timeRemaining <= 10 ? '#ef4444' : '#1e293b',
                  fontSize: '18px'
                }}
                className={timer.timeRemaining <= 10 ? 'timer-danger' : ''}
              >
                {formatTime(timer.timeRemaining)}
              </Text>
            </div>
          </div>
        </div>
        <Progress 
          percent={progressPercent} 
          showInfo={false} 
          strokeColor={{
            '0%': '#3b82f6',
            '100%': '#1e40af',
          }}
        />
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          marginBottom: 16, 
          padding: '20px 0',
          minHeight: '400px',
          maxHeight: '500px'
        }}>
          {messages.map((message) => (
            <div key={message.id} className="chat-message">
              {message.type === 'system' && (
                <div className="chat-message-system">
                  <Alert
                    message={message.content}
                    type="info"
                    showIcon
                    style={{ 
                      borderRadius: 12,
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#1e293b'
                    }}
                  />
                </div>
              )}
              
              {message.type === 'question' && (
                <div className="chat-message-question">
                  <div className="chat-bubble-question">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Text strong style={{ color: '#1e293b' }}>AI Interviewer</Text>
                      <Tag color={getDifficultyColor(message.difficulty!)}>
                        {message.difficulty}
                      </Tag>
                      <Text style={{ fontSize: '12px', color: '#64748b' }}>
                        {formatTime(message.timeLimit!)} to answer
                      </Text>
                    </div>
                    <Text style={{ 
                      fontSize: '16px', 
                      lineHeight: 1.7,
                      color: '#1e293b',
                      display: 'block'
                    }}>
                      {message.content}
                    </Text>
                  </div>
                </div>
              )}
              
              {message.type === 'user' && (
                <div className="chat-message-user">
                  <div className="chat-bubble-user">
                    <Text style={{ color: 'white', wordBreak: 'break-word' }}>
                      {message.content}
                    </Text>
                    <div style={{ 
                      fontSize: '11px', 
                      opacity: 0.8, 
                      marginTop: 6,
                      textAlign: 'right'
                    }}>
                      {dayjs(message.timestamp).format('HH:mm')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoadingNextQuestion && (
            <div className="typing-indicator">
              <Text style={{ color: '#64748b', marginRight: 12 }}>AI is thinking</Text>
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <Card style={{ 
          marginTop: 'auto',
          background: 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(15px)',
          border: '1px solid #e2e8f0',
          borderRadius: 16
        }}>
          {!isSubmitted && !isLoadingNextQuestion && (
            <div>
              <TextArea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here... (Press Ctrl+Enter to submit quickly)"
                rows={4}
                onKeyDown={handleKeyPress}
                disabled={isSubmitted || timer.timeRemaining === 0}
                style={{ 
                  marginBottom: 12, 
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#1e293b'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: '12px', color: '#64748b' }}>
                  {answer.length} characters • Press Ctrl+Enter to submit
                </Text>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isSubmitted || timer.timeRemaining === 0}
                  size="large"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    border: 'none',
                    borderRadius: 8,
                    height: 44
                  }}
                >
                  Submit Answer
                </Button>
              </div>
            </div>
          )}

          {isSubmitted && !isLoadingNextQuestion && (
            <Alert
              message="Answer submitted successfully!"
              description={`You completed this question in ${formatTime(timer.timeSpent)}.`}
              type="success"
              showIcon
              style={{ 
                borderRadius: 12,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatInterface;