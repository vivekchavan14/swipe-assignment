import React, { useState } from 'react';
import { Upload, Button, message, Card, Form, Input, Typography, Space, Spin } from 'antd';
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { parseResume, ParsedResumeData } from '../../utils/resumeParser';

const { Text, Title } = Typography;

interface ResumeUploadProps {
  onResumeProcessed: (data: ParsedResumeData & { file: File }) => void;
  onProfileComplete: (profile: { name: string; email: string; phone: string; file: File }) => void;
}

interface MissingFields {
  name: boolean;
  email: boolean;
  phone: boolean;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onResumeProcessed, onProfileComplete }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeData, setResumeData] = useState<(ParsedResumeData & { file: File }) | null>(null);
  const [missingFields, setMissingFields] = useState<MissingFields>({ name: false, email: false, phone: false });
  const [showForm, setShowForm] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10;
  };

  const uploadProps: UploadProps = {
    name: 'resume',
    multiple: false,
    accept: '.pdf,.docx',
    beforeUpload: async (file) => {
      const isPDF = file.type === 'application/pdf';
      const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (!isPDF && !isDOCX) {
        message.error('Please upload a PDF or DOCX file only');
        return Upload.LIST_IGNORE;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB');
        return Upload.LIST_IGNORE;
      }

      setUploading(true);
      setParsing(true);

      try {
        const parsedData = await parseResume(file);
        const dataWithFile = { ...parsedData, file };
        
        setResumeData(dataWithFile);
        onResumeProcessed(dataWithFile);

        // Check for missing fields
        const missing: MissingFields = {
          name: !parsedData.name || parsedData.name.trim().length === 0,
          email: !parsedData.email || !validateEmail(parsedData.email),
          phone: !parsedData.phone || !validatePhone(parsedData.phone),
        };

        setMissingFields(missing);

        if (missing.name || missing.email || missing.phone) {
          setShowForm(true);
          form.setFieldsValue({
            name: parsedData.name || '',
            email: parsedData.email || '',
            phone: parsedData.phone || '',
          });
        } else {
          // All fields present, proceed directly
          onProfileComplete({
            name: parsedData.name!,
            email: parsedData.email!,
            phone: parsedData.phone!,
            file,
          });
        }

        message.success('Resume uploaded and processed successfully');
      } catch (error) {
        message.error('Failed to process resume. Please try again.');
        console.error('Resume parsing error:', error);
      } finally {
        setUploading(false);
        setParsing(false);
      }

      return false; // Prevent default upload behavior
    },
    showUploadList: false,
  };

  const handleFormSubmit = (values: any) => {
    if (!resumeData) {
      message.error('Please upload a resume first');
      return;
    }

    const { name, email, phone } = values;

    if (!validateEmail(email)) {
      message.error('Please enter a valid email address');
      return;
    }

    if (!validatePhone(phone)) {
      message.error('Please enter a valid phone number');
      return;
    }

    onProfileComplete({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      file: resumeData.file,
    });
  };

  if (resumeData && !showForm) {
    return (
      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <Title level={3}>Resume Processed Successfully!</Title>
          <Text type="secondary">
            All required information has been extracted. Starting interview...
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Upload Your Resume
        </Title>
        
        {!resumeData ? (
          <div style={{ textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <div style={{ marginBottom: 16 }}>
              <Text>Upload your resume to get started with the interview process.</Text>
              <br />
              <Text type="secondary">Supported formats: PDF, DOCX (Max size: 10MB)</Text>
            </div>
            
            <Upload.Dragger {...uploadProps} style={{ marginBottom: 16 }}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 24 }} />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                We'll extract your contact information automatically
              </p>
            </Upload.Dragger>

            {(uploading || parsing) && (
              <div style={{ marginTop: 16 }}>
                <Spin size="large" />
                <div style={{ marginTop: 8 }}>
                  <Text>{parsing ? 'Processing resume...' : 'Uploading...'}</Text>
                </div>
              </div>
            )}
          </div>
        ) : showForm ? (
          <div>
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
              <Title level={4}>Resume Uploaded Successfully!</Title>
              <Text type="secondary">
                Please complete any missing information below:
              </Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleFormSubmit}
              autoComplete="off"
            >
              <Form.Item
                label="Full Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter your full name' },
                  { min: 2, message: 'Name must be at least 2 characters' },
                ]}
                extra={missingFields.name ? "We couldn't extract your name from the resume" : undefined}
              >
                <Input placeholder="Enter your full name" size="large" />
              </Form.Item>

              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email address' },
                  { type: 'email', message: 'Please enter a valid email address' },
                ]}
                extra={missingFields.email ? "We couldn't extract your email from the resume" : undefined}
              >
                <Input placeholder="Enter your email address" size="large" />
              </Form.Item>

              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  { required: true, message: 'Please enter your phone number' },
                  { 
                    pattern: /^[+]?[1-9][\d\s\-()./]{8,15}$/,
                    message: 'Please enter a valid phone number'
                  },
                ]}
                extra={missingFields.phone ? "We couldn't extract your phone number from the resume" : undefined}
              >
                <Input placeholder="Enter your phone number" size="large" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
                <Space>
                  <Button type="primary" htmlType="submit" size="large">
                    Start Interview
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default ResumeUpload;