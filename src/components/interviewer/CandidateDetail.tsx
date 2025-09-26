import React from 'react';
import { Card, Typography, Tag, Button, Space, Divider, Timeline, Alert, Progress, Avatar } from 'antd';
import { ArrowLeftOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { CandidateProfile, Interview, Question } from '../../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface CandidateDetailProps {
  candidate: CandidateProfile;
  interview?: Interview;
  onBack: () => void;
}

const getDifficultyColor = (difficulty: Question['difficulty']) => {
  switch (difficulty) {
    case 'Easy': return 'green';
    case 'Medium': return 'orange';
    case 'Hard': return 'red';
    default: return 'blue';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 8) return '#52c41a';
  if (score >= 6) return '#faad14';
  if (score >= 4) return '#fa8c16';
  return '#ff4d4f';
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const CandidateDetail: React.FC<CandidateDetailProps> = ({ candidate, interview, onBack }) => {
  const getStatusColor = (status?: Interview['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status?: Interview['status']) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'paused': return 'Paused';
      default: return 'Not Started';
    }
  };

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            type="text"
            size="large"
          >
            Back to List
          </Button>
          <Title level={3} style={{ margin: 0 }}>Candidate Details</Title>
        </div>
        
        <div style={{ display: 'flex', gap: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} />
          <div style={{ flex: 1 }}>
            <Title level={4} style={{ margin: 0, marginBottom: 8 }}>{candidate.name}</Title>
            <Space direction="vertical" size={4}>
              <Text type="secondary">Email: {candidate.email}</Text>
              <Text type="secondary">Phone: {candidate.phone}</Text>
              <Text type="secondary">Applied: {dayjs(candidate.createdAt).format('MMM DD, YYYY HH:mm')}</Text>
              <Tag color={getStatusColor(interview?.status)}>
                {getStatusText(interview?.status)}
              </Tag>
            </Space>
          </div>
          
          {interview?.finalScore && (
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, color: getScoreColor(interview.finalScore / 10) }}>
                {interview.finalScore}/100
              </Title>
              <Text type="secondary">Final Score</Text>
            </div>
          )}
        </div>
      </Card>

      {/* Interview Summary */}
      {interview && (
        <Card title="Interview Summary" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div>
              <Text strong>Started:</Text>
              <div>{interview.startedAt ? dayjs(interview.startedAt).format('MMM DD, YYYY HH:mm') : 'Not started'}</div>
            </div>
            {interview.completedAt && (
              <div>
                <Text strong>Completed:</Text>
                <div>{dayjs(interview.completedAt).format('MMM DD, YYYY HH:mm')}</div>
              </div>
            )}
            <div>
              <Text strong>Progress:</Text>
              <div>{interview.currentQuestionIndex + 1}/{interview.questions.length} questions</div>
            </div>
            <div>
              <Text strong>Status:</Text>
              <div>
                <Tag color={getStatusColor(interview.status)}>
                  {getStatusText(interview.status)}
                </Tag>
              </div>
            </div>
          </div>

          {interview.finalSummary && (
            <Alert
              message="AI Assessment Summary"
              description={interview.finalSummary}
              type="info"
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      )}

      {/* Questions and Answers */}
      {interview && interview.questions.length > 0 && (
        <Card title="Interview Questions & Answers">
          <Timeline>
            {interview.questions.map((question: Question, index: number) => {
              const answer = interview.answers.find(a => a.questionId === question.id);
              const isAnswered = !!answer;
              
              return (
                <Timeline.Item
                  key={question.id}
                  dot={
                    isAnswered ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <QuestionCircleOutlined style={{ color: '#d9d9d9' }} />
                    )
                  }
                  color={isAnswered ? 'green' : 'gray'}
                >
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Text strong>Question {index + 1}</Text>
                          <Tag color={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ClockCircleOutlined /> {formatTime(question.timeLimit)} limit
                          </Text>
                        </div>
                        <Paragraph style={{ marginBottom: 0 }}>{question.text}</Paragraph>
                      </div>
                      
                      {answer?.score && (
                        <div style={{ textAlign: 'center', marginLeft: 16 }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            color: getScoreColor(answer.score)
                          }}>
                            {answer.score}/10
                          </div>
                          <Text type="secondary" style={{ fontSize: '11px' }}>Score</Text>
                        </div>
                      )}
                    </div>

                    {answer ? (
                      <div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ marginBottom: 8 }}>
                          <Text strong style={{ color: '#1890ff' }}>Candidate's Answer:</Text>
                          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Time spent: {formatTime(answer.timeSpent)}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Submitted: {dayjs(answer.timestamp).format('HH:mm:ss')}
                            </Text>
                          </div>
                        </div>
                        <div style={{ 
                          background: '#f8f9fa', 
                          padding: 12, 
                          borderRadius: 6,
                          marginBottom: 12,
                          border: '1px solid #e9ecef'
                        }}>
                          <Text>{answer.text}</Text>
                        </div>

                        {answer.aiAnalysis && (
                          <div>
                            <Text strong style={{ color: '#722ed1' }}>AI Analysis:</Text>
                            <div style={{ 
                              background: '#f6f0ff', 
                              padding: 12, 
                              borderRadius: 6,
                              marginTop: 4,
                              border: '1px solid #d3adf7'
                            }}>
                              <Text style={{ fontSize: '13px' }}>{answer.aiAnalysis}</Text>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '12px 0' }}>
                        <Text type="secondary" style={{ fontStyle: 'italic' }}>
                          {index < interview.currentQuestionIndex 
                            ? 'Question skipped or not answered' 
                            : 'Not answered yet'}
                        </Text>
                      </div>
                    )}
                  </Card>
                </Timeline.Item>
              );
            })}
          </Timeline>

          {interview.status === 'completed' && interview.finalScore && (
            <Card 
              size="small" 
              style={{ 
                marginTop: 24, 
                background: interview.finalScore >= 70 ? '#f6ffed' : '#fff2f0',
                border: `1px solid ${interview.finalScore >= 70 ? '#b7eb8f' : '#ffccc7'}`
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ 
                  margin: '0 0 8px 0', 
                  color: interview.finalScore >= 70 ? '#52c41a' : '#ff4d4f' 
                }}>
                  Interview {interview.finalScore >= 70 ? 'Passed' : 'Needs Review'}
                </Title>
                <Progress
                  percent={interview.finalScore}
                  strokeColor={interview.finalScore >= 70 ? '#52c41a' : '#ff4d4f'}
                  style={{ marginBottom: 8 }}
                />
                <Text type="secondary">
                  Recommendation: {interview.finalScore >= 80 
                    ? 'Strong candidate, proceed to next round' 
                    : interview.finalScore >= 70 
                    ? 'Good candidate, consider for interview' 
                    : 'Candidate needs further evaluation'}
                </Text>
              </div>
            </Card>
          )}
        </Card>
      )}

      {/* No interview data */}
      {!interview && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <QuestionCircleOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} style={{ color: '#999' }}>No Interview Data</Title>
            <Text type="secondary">This candidate hasn't started their interview yet.</Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CandidateDetail;