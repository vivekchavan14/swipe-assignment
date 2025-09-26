import React, { useState, useMemo } from 'react';
import { Table, Card, Input, Select, Tag, Button, Typography, Space, Badge, Avatar } from 'antd';
import { SearchOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { CandidateProfile, Interview } from '../../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { Option } = Select;

interface CandidateListProps {
  candidates: CandidateProfile[];
  interviews: Interview[];
  onViewCandidate: (candidateId: string) => void;
}

interface CandidateWithInterview extends CandidateProfile {
  interview?: Interview;
  finalScore?: number;
  status: Interview['status'] | 'not_started';
  completedAt?: string;
}

const getStatusColor = (status: Interview['status'] | 'not_started') => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'processing';
    case 'paused': return 'warning';
    case 'not_started': return 'default';
    default: return 'default';
  }
};

const getStatusText = (status: Interview['status'] | 'not_started') => {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'paused': return 'Paused';
    case 'not_started': return 'Not Started';
    default: return 'Unknown';
  }
};

const getScoreColor = (score?: number) => {
  if (!score) return 'default';
  if (score >= 80) return 'success';
  if (score >= 70) return 'warning';
  if (score >= 60) return 'orange';
  return 'error';
};

const CandidateList: React.FC<CandidateListProps> = ({ candidates, interviews, onViewCandidate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');

  const candidatesWithInterviews: CandidateWithInterview[] = useMemo(() => {
    return candidates.map(candidate => {
      const interview = interviews.find(i => i.candidateId === candidate.id);
      return {
        ...candidate,
        interview,
        finalScore: interview?.finalScore,
        status: interview?.status || 'not_started',
        completedAt: interview?.completedAt,
      };
    });
  }, [candidates, interviews]);

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidatesWithInterviews;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.phone.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'score':
          return (b.finalScore || 0) - (a.finalScore || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [candidatesWithInterviews, searchTerm, statusFilter, sortBy]);

  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (record: CandidateWithInterview) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="large" />
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{record.name}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.email}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.phone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: CandidateWithInterview) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      render: (record: CandidateWithInterview) => {
        if (record.finalScore === undefined) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Badge 
            count={`${record.finalScore}/100`} 
            color={getScoreColor(record.finalScore)}
            style={{ fontSize: '12px' }}
          />
        );
      },
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (record: CandidateWithInterview) => {
        if (!record.interview) {
          return <Text type="secondary">Not started</Text>;
        }
        const { currentQuestionIndex, questions } = record.interview;
        const progress = questions.length > 0 ? `${currentQuestionIndex + 1}/${questions.length}` : '0/6';
        return <Text>{progress} questions</Text>;
      },
    },
    {
      title: 'Date',
      key: 'date',
      render: (record: CandidateWithInterview) => {
        const date = record.completedAt || record.createdAt;
        return (
          <div>
            <div style={{ fontSize: '12px' }}>{dayjs(date).format('MMM DD, YYYY')}</div>
            <div style={{ fontSize: '11px', color: '#666' }}>{dayjs(date).fromNow()}</div>
          </div>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: CandidateWithInterview) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => onViewCandidate(record.id)}
          size="small"
        >
          View Details
        </Button>
      ),
    },
  ];

  const statusCounts = useMemo(() => {
    const counts = candidatesWithInterviews.reduce(
      (acc, candidate) => {
        acc[candidate.status] = (acc[candidate.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return counts;
  }, [candidatesWithInterviews]);

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>Candidate Dashboard</Title>
          <div style={{ display: 'flex', gap: 16 }}>
            <Space>
              <Text type="secondary">Total:</Text>
              <Badge count={candidates.length} color="#1890ff" />
            </Space>
            {Object.entries(statusCounts).map(([status, count]) => (
              <Space key={status}>
                <Text type="secondary">{getStatusText(status as any)}:</Text>
                <Badge count={count} color={getStatusColor(status as any)} />
              </Space>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="Search candidates..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: 250 }}
          />
          
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ minWidth: 150 }}
            placeholder="Filter by status"
          >
            <Option value="all">All Status</Option>
            <Option value="completed">Completed</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="paused">Paused</Option>
            <Option value="not_started">Not Started</Option>
          </Select>
          
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ minWidth: 150 }}
            placeholder="Sort by"
          >
            <Option value="createdAt">Date Added</Option>
            <Option value="name">Name</Option>
            <Option value="score">Score</Option>
            <Option value="status">Status</Option>
          </Select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredAndSortedCandidates}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} candidates`,
          }}
          locale={{
            emptyText: searchTerm || statusFilter !== 'all' 
              ? 'No candidates match your filters'
              : 'No candidates yet',
          }}
        />
      </Card>
    </div>
  );
};

export default CandidateList;