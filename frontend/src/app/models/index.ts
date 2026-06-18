export interface PreBlockModel {
  blockId: string;
  blockName: string;
  learningObjectives: string[];
  expectedEvidence: string[];
  misconceptionPatterns: string[];
  rubricCriteria: string[];
  vfuPolicy: {
    maxVFUs: number;
  };
}

export interface StudentSubmission {
  artifact: string;
  narrative: string;
}

export interface DiagnosticHypothesis {
  demonstratedCompetencies: string[];
  missingCompetencies: string[];
  misconceptionsDetected: string[];
  confidence: 'low' | 'medium' | 'high';
  needVFU: boolean;
  diagnosticHypothesis: string;
  suggestedVFU: string | null;
}

export interface VFUHistory {
  question: string;
  answer: string;
  hypothesisAfterVFU?: DiagnosticHypothesis;
}

export interface TeacherReport {
  classification: 'Completely Correct' | 'Partially Correct' | 'Completely Incorrect';
  recommendation: 'Proceed' | 'Conditional Progression' | 'Rework';
  confidence: 'low' | 'medium' | 'high';
  mainGap: string;
  deficiencyProfile: string[];
  rationale: string;
}

export interface Session {
  sessionId: string;
  preBlockId: string;
  submission: StudentSubmission;
  vfuHistory: VFUHistory[];
  status: 'pending_analysis' | 'awaiting_vfu' | 'completed';
  currentVFUCount: number;
  latestHypothesis?: DiagnosticHypothesis;
  teacherReport?: TeacherReport;
  createdAt: string;
  updatedAt: string;
}

export interface DemoCase {
  caseId: string;
  title: string;
  blockId: string;
  description: string;
  artifact: string;
  narrative: string;
  expectedVFUs: number;
  suggestedAnswers: string[];
}
