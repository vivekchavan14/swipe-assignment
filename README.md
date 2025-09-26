# AI Interview Assistant

A modern, AI-powered interview platform built with React and OpenAI that streamlines the technical interview process for both candidates and interviewers.

## 🚀 Features

### For Candidates (Interviewee Experience)
- **Smart Resume Upload**: Supports PDF and DOCX formats with automatic text extraction
- **Contact Info Extraction**: AI automatically parses and extracts candidate details
- **Personalized Questions**: 6 AI-generated technical questions tailored to your resume
- **Real-time Chat Interface**: Modern, responsive chat-based interview experience
- **Timed Questions**: Difficulty-based time limits (Easy: 3min, Medium: 7min, Hard: 15min)
- **Progress Tracking**: Visual progress indicators and question counters

### For Interviewers (Dashboard)
- **Candidate Management**: Complete dashboard with search, filter, and sort capabilities
- **AI-Powered Scoring**: Automatic evaluation of candidate responses with detailed analysis
- **Interview Analytics**: Question-by-question breakdown with individual scores
- **Final Assessment**: Comprehensive AI-generated hiring recommendations
- **Data Persistence**: All interview data saved locally for review

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **UI Framework**: Ant Design with custom theming
- **AI Integration**: OpenAI GPT-3.5-turbo API
- **File Processing**: PDF.js for PDF parsing, Mammoth for DOCX
- **Styling**: Modern CSS with Inter font family
- **Build Tool**: Create React App

## 📋 Prerequisites

- Node.js 16 or higher
- npm or yarn
- OpenAI API key

## ⚡ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/vivekchavan14/swipe-assignment.git
   cd swipe-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   echo "REACT_APP_OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How It Works

### Interview Flow
1. **Upload Resume**: Candidate uploads PDF/DOCX resume
2. **Profile Setup**: Complete any missing contact information
3. **AI Question Generation**: System generates 6 personalized technical questions
4. **Interactive Interview**: Real-time chat-based Q&A with timers
5. **AI Evaluation**: Automatic scoring and detailed feedback
6. **Results Dashboard**: Comprehensive analytics for interviewers

### Key Highlights
- **Intelligent Personalization**: Questions are dynamically generated based on resume content
- **Fair Evaluation**: Consistent AI-powered scoring eliminates interviewer bias
- **Modern UX**: Beautiful, responsive design with smooth animations
- **Local Data Storage**: No external database required, all data persists locally
- **Scalable Architecture**: Clean, maintainable React codebase

## 🏗️ Architecture

```
src/
├── components/
│   ├── interviewee/     # Candidate-facing components
│   └── interviewer/     # Dashboard components
├── store/               # Redux state management
├── utils/               # AI service and resume parsing
├── hooks/               # Custom React hooks
└── types/               # TypeScript definitions
```

## 🔧 Configuration

The application uses environment variables for configuration:

- `REACT_APP_OPENAI_API_KEY`: Your OpenAI API key for AI features

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

This project was built as part of the Swipe assignment. For any questions or suggestions, please create an issue.

## 📄 License

MIT License - feel free to use this code for your projects.

---

Built with ❤️ using React, TypeScript, and OpenAI
