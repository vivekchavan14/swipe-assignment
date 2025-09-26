import React from 'react';
import { Modal, Typography, Button, Space, Card, Progress, Tag } from 'antd';
import { ClockCircleOutlined, UserOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { CandidateProfile, Interview } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface WelcomeBackModalProps {
  visible: boolean;
  candidate?: CandidateProfile;
  interview?: Interview;
  onResume: () => void;
  onStartNew: () => void;
}

const getDifficultyColor = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
  switch (difficulty) {
    case 'Easy': return 'green';
    case 'Medium': return 'orange';
    case 'Hard': return 'red';
    default: return 'blue';
  }
};

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  visible,
  candidate,
  interview,
  onResume,
  onStartNew,
}) => {
  if (!candidate || !interview) {
    return null;
  }

  const progress = Math.round(((interview.currentQuestionIndex + 1) / interview.questions.length) * 100);
  const currentQuestion = interview.questions[interview.currentQuestionIndex];
  const timeAgo = interview.lastResumedAt 
    ? dayjs(interview.lastResumedAt).fromNow() 
    : dayjs(interview.startedAt).fromNow();

  return (
    <Modal
      open={visible}
      title={
        <div style={{ textAlign: 'center' }}>
          <UserOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }} />
          <span>Welcome Back!</span>
        </div>
      }
      centered
      width={500}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          Hello {candidate.name}!
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          We found your unfinished interview from {timeAgo}
        </Text>
      </div>

      <Card style={{ margin: '24px 0', background: '#fafafa' }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: '16px' }}>Interview Progress</Text>
          <Progress 
            percent={progress} 
            strokeColor="#1890ff" 
            style={{ marginTop: 8 }} 
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Text type="secondary">
              Question {interview.currentQuestionIndex + 1} of {interview.questions.length}
            </Text>
            <Text type="secondary">
              {interview.answers.length} answers submitted
            </Text>
          </div>
        </div>

        <div style={{ padding: 12, background: 'white', borderRadius: 6, border: '1px solid #e8e8e8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text strong>Next Question:</Text>
            <Tag color={getDifficultyColor(currentQuestion.difficulty)}>
              {currentQuestion.difficulty}
            </Tag>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <ClockCircleOutlined /> {currentQuestion.timeLimit}s
            </Text>
          </div>
          <Text style={{ color: '#666' }}>
            {currentQuestion.text.length > 100 
              ? `${currentQuestion.text.substring(0, 100)}...` 
              : currentQuestion.text}
          </Text>
        </div>
      </Card>

      <div style={{ textAlign: 'center' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Would you like to continue where you left off or start a new interview?
        </Text>

        <Space size="large">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="large"
            onClick={onResume}
          >
            Resume Interview
          </Button>
          
          <Button
            icon={<StopOutlined />}
            size="large"
            onClick={onStartNew}
            style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
          >
            Start New Interview
          </Button>
        </Space>
      </div>

      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: '#f6f8fa', 
        borderRadius: 6,
        border: '1px solid #e1e4e8' 
      }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>Note:</strong> Starting a new interview will permanently delete your current progress. 
          This action cannot be undone.
        </Text>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;