export interface MirrorSection {
  keyQuote: string;
  perceivedProblem: string;
  realProblem: string;
  perceivedSolution: string;
  whyItMightBeWrong: string;
}

export interface OverviewSection {
  overallVerdict: string;
  directionScore: number;
  executionScore: number;
  matrixPosition: 'ready_to_pilot' | 'good_direction_poor_execution' | 'efficiently_wrong' | 'stop_and_rethink';
  recommendedDecision: 'stop' | 'validate' | 'change' | 'pilot' | 'build';
  mainDiagnosis: string;
  safeAIEntryPoint: string;
}

export interface InputClaritySection {
  clarityLevel: 'clear' | 'partially_clear' | 'too_vague';
  whatIsClear: string[];
  whatIsMissing: string[];
  clarifyingQuestions: string[];
}

export interface ConflictingView {
  stakeholder: string;
  view: string;
  conflict: string;
}

export interface StakeholderAlignmentSection {
  alignmentScore: number;
  sharedUnderstanding: string[];
  misalignment: string[];
  conflictingViews: ConflictingView[];
  missingPerspectives: string[];
  diagnosis: string;
  recommendation: string;
}

export interface ExtractedFactsSection {
  statedGoal: string;
  proposedSolution: string;
  targetUsers: string[];
  stakeholders: string[];
  knownDataSources: string[];
  constraints: string[];
  risksMentioned: string[];
}

export interface AssumptionAuditSection {
  hiddenAssumptions: string[];
  validatedAssumptions: string[];
  unvalidatedAssumptions: string[];
  potentiallyWrongAssumptions: string[];
}

export interface DirectionDimension {
  name: 'Problem Realness' | 'User Clarity' | 'Value Potential' | 'Strategic Fit' | 'Differentiation' | 'Trend Fit' | string;
  score: number;
  diagnosis: string;
  evidence: string[];
  recommendation: string;
}

export interface DirectionDiagnosisSection {
  verdict: 'valid' | 'partially_valid' | 'unclear' | 'invalid';
  summary: string;
  dimensions: DirectionDimension[];
}

export interface ExecutionBlocker {
  type: 'Ownership Gap' | 'Decision Rights Gap' | 'Workflow Gap' | 'Data Readiness Gap' | 'Risk Control Gap' | 'Scope Gap' | string;
  severity: 'low' | 'medium' | 'high';
  diagnosis: string;
  evidence: string[];
  recommendation: string;
}

export interface ExecutionDiagnosisSection {
  verdict: 'ready' | 'partially_ready' | 'not_ready';
  summary: string;
  blockers: ExecutionBlocker[];
}

export interface ChangeStage {
  stage: string;
  goal: string;
  actions: string[];
}

export interface ChangePathSection {
  problemType: 'direction' | 'execution' | 'both';
  rootCause: {
    layer: string;
    diagnosis: string;
  };
  primaryChangeNeeded: string;
  reason: string;
  stages: ChangeStage[];
  recommendedSequence: string[];
  doNotStartWith: string[];
}

export interface AiLandingStep {
  step: number;
  businessStep: string;
  currentAction: string;
  aiFit: 'high' | 'medium' | 'low';
  aiRole: 'automate' | 'assist' | 'human_decide' | 'do_not_automate';
  humanJudgmentRequired: string;
  risk: string;
  recommendation: string;
}

export interface DecisionBriefSection {
  recommendedDecision: string;
  why: string;
  nextActions: string[];
  meetingQuestions: string[];
  mvpScope: string[];
  doNotBuildYet: string[];
  markdownReport: string;
}

export interface DiagnosticResult {
  mirror: MirrorSection;
  overview: OverviewSection;
  inputClarity: InputClaritySection;
  stakeholderAlignment: StakeholderAlignmentSection;
  extractedFacts: ExtractedFactsSection;
  assumptionAudit: AssumptionAuditSection;
  directionDiagnosis: DirectionDiagnosisSection;
  executionDiagnosis: ExecutionDiagnosisSection;
  changePath: ChangePathSection;
  aiLandingMap: AiLandingStep[];
  decisionBrief: DecisionBriefSection;
}

export interface ReportItem {
  id: string;
  title: string;
  createdAt: string;
  input: {
    language: string;
    inputMode: 'standard' | 'guided';
    optionalContext?: string;
    userMaterial: string;
    projectName?: string;
    statedGoal?: string;
    proposedSolution?: string;
    stakeholdersInput?: string;
    dataSourcesInput?: string;
  };
  result: DiagnosticResult;
}
