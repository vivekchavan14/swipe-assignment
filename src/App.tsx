import React, { useState, useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Layout, Tabs, Typography, Spin } from 'antd';
import { UserOutlined, DashboardOutlined } from '@ant-design/icons';
import { store, persistor, RootState } from './store';
import InterviewManager from './components/interviewee/InterviewManager';
import CandidateList from './components/interviewer/CandidateList';
import CandidateDetail from './components/interviewer/CandidateDetail';
import WelcomeBackModal from './components/WelcomeBackModal';
import { setIsResuming } from './store/interviewsSlice';
import { setCurrentCandidate } from './store/candidatesSlice';
import { setCurrentInterview, updateInterviewStatus } from './store/interviewsSlice';
import 'antd/dist/reset.css';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { candidates } = useSelector((state: RootState) => state.candidates);
  const { interviews } = useSelector((state: RootState) => state.interviews);
  
  const [activeTab, setActiveTab] = useState('interviewee');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [resumableInterview, setResumableInterview] = useState<any>(null);
  const [hasCheckedForResumable, setHasCheckedForResumable] = useState(false);

  // Check for resumable sessions on app load (only once)
  useEffect(() => {
    if (hasCheckedForResumable || interviews.length === 0) return;
    
    const checkResumableSession = () => {
      // Find any in-progress or paused interviews
      const resumable = interviews.find(interview => 
        interview.status === 'in_progress' || interview.status === 'paused'
      );
      
      if (resumable) {
        const candidate = candidates.find(c => c.id === resumable.candidateId);
        if (candidate) {
          setResumableInterview({ interview: resumable, candidate });
          setShowWelcomeBack(true);
          dispatch(setIsResuming(true));
        }
      }
      setHasCheckedForResumable(true);
    };

    // Small delay to ensure data is loaded from persistence
    setTimeout(checkResumableSession, 500);
  }, [interviews, candidates, dispatch, hasCheckedForResumable]);

  const handleResumeInterview = () => {
    if (resumableInterview) {
      dispatch(setCurrentCandidate(resumableInterview.candidate.id));
      dispatch(setCurrentInterview(resumableInterview.interview.id));
      dispatch(updateInterviewStatus({ 
        id: resumableInterview.interview.id, 
        status: 'in_progress' 
      }));
      setActiveTab('interviewee');
    }
    setShowWelcomeBack(false);
    dispatch(setIsResuming(false));
  };

  const handleStartNewInterview = () => {
    // Mark the current interview as cancelled/completed to avoid showing welcome back modal again
    if (resumableInterview?.interview) {
      dispatch(updateInterviewStatus({ 
        id: resumableInterview.interview.id, 
        status: 'completed' 
      }));
    }
    
    // Clear current states
    dispatch(setCurrentCandidate(undefined));
    dispatch(setCurrentInterview(undefined));
    setActiveTab('interviewee');
    setShowWelcomeBack(false);
    dispatch(setIsResuming(false));
    setResumableInterview(null);
  };

  const handleViewCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
  };

  const handleBackToList = () => {
    setSelectedCandidateId(null);
  };

  const selectedCandidate = selectedCandidateId 
    ? candidates.find(c => c.id === selectedCandidateId)
    : null;
  
  const selectedInterview = selectedCandidate
    ? interviews.find(i => i.candidateId === selectedCandidate.id)
    : null;

  const tabItems = [
    {
      key: 'interviewee',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <UserOutlined style={{ fontSize: 18 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Interviewee</span>
            <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 400 }}>Take the interview</span>
          </div>
        </div>
      ),
      children: <InterviewManager />,
    },
    {
      key: 'interviewer',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <DashboardOutlined style={{ fontSize: 18 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Dashboard</span>
            <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 400 }}>Review candidates</span>
          </div>
        </div>
      ),
      children: selectedCandidate ? (
        <CandidateDetail 
          candidate={selectedCandidate}
          interview={selectedInterview || undefined}
          onBack={handleBackToList}
        />
      ) : (
        <CandidateList 
          candidates={candidates}
          interviews={interviews}
          onViewCandidate={handleViewCandidate}
        />
      ),
    },
  ];

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: 'transparent', 
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          height: 80
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              <span style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>AI</span>
            </div>
            <div>
              <Title level={2} style={{ 
                color: 'white', 
                margin: 0,
                fontWeight: 700,
                letterSpacing: '-0.02em'
              }}>
                Interview Assistant
              </Title>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '14px',
                fontWeight: 500
              }}>
                Powered by AI • Smart Interviewing
              </Text>
            </div>
          </div>
        </Header>
        
        <Content style={{ padding: '24px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            style={{
              background: 'transparent',
              borderRadius: 0,
              padding: 0
            }}
            tabBarStyle={{
              marginBottom: 0,
              borderBottom: 'none',
              padding: '0 32px'
            }}
          />
        </Content>
      </Layout>

      <WelcomeBackModal
        visible={showWelcomeBack}
        candidate={resumableInterview?.candidate}
        interview={resumableInterview?.interview}
        onResume={handleResumeInterview}
        onStartNew={handleStartNewInterview}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
};

export default App;
