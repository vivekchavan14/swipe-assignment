import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  fullText: string;
}

export const parseResume = async (file: File): Promise<ParsedResumeData> => {
  try {
    let text = '';
    
    if (file.type === 'application/pdf') {
      text = await parsePDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await parseDOCX(file);
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
    }

    return extractContactInfo(text);
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume. Please check the file format and try again.');
  }
};

const parsePDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + ' ';
  }

  return fullText;
};

const parseDOCX = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const extractContactInfo = (text: string): ParsedResumeData => {
  const result: ParsedResumeData = {
    fullText: text,
  };

  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // Phone regex (supports various formats)
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    result.phone = phoneMatch[0];
  }

  // Name extraction (simple heuristic - first line or first capitalized words)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine && !emailMatch?.includes(firstLine) && !phoneMatch?.includes(firstLine)) {
      // Check if it looks like a name (contains only letters, spaces, and common punctuation)
      if (/^[A-Za-z\s.,'-]+$/.test(firstLine) && firstLine.split(' ').length <= 4) {
        result.name = firstLine;
      }
    }
  }

  // Alternative name extraction using patterns
  if (!result.name) {
    const namePatterns = [
      /Name\s*:?\s*([A-Za-z\s.,'-]+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m,
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.name = match[1].trim();
        break;
      }
    }
  }

  return result;
};