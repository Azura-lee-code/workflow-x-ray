import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Play,
  History,
  Trash2,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  PlusCircle,
  FileText,
  ChevronRight,
  RefreshCw,
  Clock,
  Briefcase,
  Users,
  Database,
  Sliders,
  AlertCircle,
  ArrowRight,
  Sparkle,
  Mic,
  Menu,
  Upload,
  Paperclip,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReportItem, DiagnosticResult } from './types';
import ReportDashboard from './components/ReportDashboard';
import ReportHistory from './components/ReportHistory';
import VoiceInterview from './components/VoiceInterview';

// High-fidelity pre-scanned consultant examples to explore instantly
const EXAMPLES = [
  {
    title: 'AI Chatbot Overkill Initiative',
    description: 'Deploying custom LLMs to resolve 100% of customer tickets with unstructured raw files.',
    inputMode: 'guided' as const,
    statedGoal: 'Deploy a generative AI support chatbot to resolve 100% of customer support tickets within 3 months, eliminating the need for tier-1 human agents.',
    proposedSolution: 'Build a custom RAG (Retrieval-Augmented Generation) system connected to a vector database loaded with all product manual PDFs, and connect it to Webchat, Slack, and Zendesk.',
    stakeholdersInput: 'The support Director wants to cut headcount immediately to meet budget. The developers are excited to play with advanced embeddings and LLM frameworks. The compliance officer is terrified of hallucinations and data leaks. The Customer Success VP believes customers will hate the lack of human contact.',
    dataSourcesInput: 'Product manuals stored as unindexed raw PDFs in Google Drive. Stale Word files from 2023. Help center articles that have not been audited in 18 months.',
    optionalContext: 'Technology Start-up, 150 employees, highly aggressive risk appetite, zero experience in machine learning.',
    industry: 'Technology',
    orgSize: '150 employees',
    riskAppetite: 'Aggressive'
  },
  {
    title: 'Executive "450-Metric" Dashboard',
    description: 'A real-time executive dashboard compiling hundreds of real-time metrics across 12 legacy silos.',
    inputMode: 'guided' as const,
    statedGoal: 'Build a single real-time executive operations dashboard tracking 450 key performance indicators (KPIs) across 12 distinct business units to enable absolute direct micromanagement.',
    proposedSolution: 'Develop a custom React enterprise dashboard with real-time WebSocket pipelines scraping data directly from 12 distinct legacy department databases in real-time.',
    stakeholdersInput: 'The Chief Operating Officer (COO) demands absolute granular transparency. Department heads are defensive and feel this is a weapon to audit and micromanagement them. The engineering lead has warned about rate limits, massive database query latency, and unmapped database schemas.',
    dataSourcesInput: 'Siloed department databases, legacy Oracle servers, marketing spreadsheets updated manually weekly, external SaaS APIs, unstructured CSV files.',
    optionalContext: 'Legacy Retail Company, 5000 employees, low risk appetite, heavy bureaucratic friction.',
    industry: 'Retail & Distribution',
    orgSize: '5,000 employees',
    riskAppetite: 'Low'
  },
  {
    title: 'Manual Legal Contract Parsing',
    description: 'A team of paralegals manually parsing 10,000 PDFs weekly with spreadsheets and regular expressions.',
    inputMode: 'guided' as const,
    statedGoal: 'Identify, index, tag, and extract key clauses from 10,000 legal PDF contracts received weekly to reduce review turn-around from 5 days to 4 hours.',
    proposedSolution: 'Hire 8 additional contract junior paralegals to copy-paste metadata into shared Excel sheets, then run basic Python regular expressions to extract dates and values.',
    stakeholdersInput: 'VP of Legal Operations wants to clear the review bottleneck. Paralegals are burning out and threatening to leave. IT says they do not have the resources to build custom document search tools.',
    dataSourcesInput: 'Scanned contract PDFs received via email, often low-quality images, with no existing automated indexing or database schema.',
    optionalContext: 'Financial Services Enterprise, 12,000 employees, extremely conservative risk appetite, highly regulated environment.',
    industry: 'Financial Services',
    orgSize: '12,000 employees',
    riskAppetite: 'Conservative'
  }
];

export default function App() {
  // Application State
  const [history, setHistory] = useState<ReportItem[]>([]);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'standard' | 'guided'>('guided');
  const [projectName, setProjectName] = useState('');
  
  // Guided Form State
  const [statedGoal, setStatedGoal] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [stakeholdersInput, setStakeholdersInput] = useState('');
  const [dataSourcesInput, setDataSourcesInput] = useState('');
  // Voice interview transcripts are stored separately so template prefill never overwrites them
  const [voiceTranscript, setVoiceTranscript] = useState('');
  
  // Standard Form State
  const [userMaterial, setUserMaterial] = useState('');
  const [isVoiceInterviewOpen, setIsVoiceInterviewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const allowedExtensions = ['.pdf', '.docx', '.txt'];
      const lastDotIndex = file.name.lastIndexOf('.');
      if (lastDotIndex === -1) {
        throw new Error("Invalid file name. It should have a .pdf, .docx, or .txt extension.");
      }
      const fileExtension = file.name.substring(lastDotIndex).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error("Unsupported file type. Only .pdf, .docx, and .txt files are supported.");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File is too large. Maximum allowed size is 10MB.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to extract text from file.");
      }

      const data = await response.json();
      
      // Append text to userMaterial
      setUserMaterial((prev) => {
        const trimmed = prev.trim();
        const header = `=== EXTRACTED FROM ${file.name.toUpperCase()} ===\n`;
        return trimmed ? `${trimmed}\n\n${header}${data.text}` : `${header}${data.text}`;
      });

      // Add to uploaded files list
      setUploadedFiles((prev) => [...prev, { name: file.name, size: file.size }]);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "An error occurred during file upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveVoiceTranscript = (transcriptText: string) => {
    setVoiceTranscript((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n${transcriptText}` : transcriptText;
    });
  };
  
  // Optional Context State
  const [industry, setIndustry] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [riskAppetite, setRiskAppetite] = useState('Moderate');

  // Loading and Diagnostic status sequence state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  const loadingSteps = [
    'Deploying Workflow X-Ray diagnostic probe to corporate workspace...',
    'Interrogating stated objectives vs. underlying organizational motives...',
    'Mapping political alignment lines and unvalidated stakeholder assumptions...',
    'Evaluating information readiness index and administrative friction...',
    'Assessing Strategic Direction suitability vs. Operational Readiness...',
    'Synthesizing clinical report and formulating Change Path sequence...',
    'Rendering executive strategic matrix, AI Fit scorecards, and action roadmaps...'
  ];

  // Load History from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('workflow_xray_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ReportItem[];
        setHistory(parsed);
        if (parsed.length > 0) {
          setCurrentReportId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse report history', e);
      }
    }
  }, []);

  // Sync loading step progression
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 4500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Helper: Save reports list
  const saveToHistory = (newHistory: ReportItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('workflow_xray_history', JSON.stringify(newHistory));
  };

  // Pre-fill an example
  const handlePreFillExample = (example: typeof EXAMPLES[number]) => {
    setProjectName(example.title);
    setInputMode(example.inputMode);
    setStatedGoal(example.statedGoal);
    setProposedSolution(example.proposedSolution);
    setStakeholdersInput(example.stakeholdersInput);
    setDataSourcesInput(example.dataSourcesInput);
    setUserMaterial('');
    setIndustry(example.industry);
    setOrgSize(example.orgSize);
    setRiskAppetite(example.riskAppetite);
  };

  // Run Diagnosis analysis
  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('Please enter a project name before running the scan.');
      return;
    }
    setIsLoading(true);
    setLoadingStepIdx(0);

    const contextStr = [
      industry ? `Industry: ${industry}` : '',
      orgSize ? `Organization Size: ${orgSize}` : '',
      riskAppetite ? `Risk Appetite: ${riskAppetite}` : '',
    ].filter(Boolean).join(' | ');

    const payload = {
      language: 'English',
      inputMode,
      userMaterial: inputMode === 'standard' ? userMaterial : '',
      optionalContext: contextStr,
      statedGoal: inputMode === 'guided' ? statedGoal : '',
      proposedSolution: inputMode === 'guided' ? proposedSolution : '',
      stakeholdersInput: [inputMode === 'guided' ? stakeholdersInput : '', voiceTranscript].filter((s) => s.trim()).join('\n'),
      dataSourcesInput: inputMode === 'guided' ? dataSourcesInput : '',
    };

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to complete diagnosis.');
      }

      const resultData = (await response.json()) as DiagnosticResult;

      const normalizedProjectName = projectName.trim();

      const newReport: ReportItem = {
        id: crypto.randomUUID(),
        title: normalizedProjectName,
        createdAt: new Date().toISOString(),
        input: {
          language: 'English',
          inputMode,
          userMaterial: userMaterial,
          projectName: normalizedProjectName,
          optionalContext: contextStr,
          statedGoal,
          proposedSolution,
          stakeholdersInput,
          dataSourcesInput,
        },
        result: resultData,
      };

      const updatedHistory = [newReport, ...history];
      saveToHistory(updatedHistory);
      setCurrentReportId(newReport.id);
    } catch (err: any) {
      alert(`[Workflow X-Ray Clinical Exception]: ${err.message || 'Verification Error during diagnosis sweep.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a specific diagnostic report
  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this diagnosis from your archive? This operation is irreversible.')) {
      const updated = history.filter(item => item.id !== id);
      saveToHistory(updated);
      if (currentReportId === id) {
        setCurrentReportId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  // Start fresh scan
  const handleNewDiagnosis = () => {
    setCurrentReportId(null);
    setProjectName('');
    setStatedGoal('');
    setProposedSolution('');
    setStakeholdersInput('');
    setDataSourcesInput('');
    setUserMaterial('');
    setVoiceTranscript('');
    setUploadedFiles([]);
    setUploadError(null);
  };

  // Clear entire history
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to purge the entire corporate diagnostics database? All archived scans will be deleted.')) {
      saveToHistory([]);
      setCurrentReportId(null);
    }
  };

  // Current active report object
  const activeReport = history.find(item => item.id === currentReportId);
  const loadingProgress = Math.round(((loadingStepIdx + 1) / loadingSteps.length) * 100);

  return (
    <div className="h-screen max-h-screen bg-[#F1F5F9] text-slate-900 font-sans flex flex-col antialiased overflow-hidden">
      {/* Upper Navigation Header */}
      <header className="bg-white text-slate-900 border-b border-slate-200 py-3.5 px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Sidebar toggle button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-950 transition-colors cursor-pointer flex items-center justify-center border border-slate-200"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Logo & Website Title (Clickable) */}
          <div
            onClick={handleNewDiagnosis}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-all select-none group"
            title="Return to Home / New Diagnosis"
          >
            <div className="w-8 h-8 bg-slate-900 group-hover:bg-slate-800 flex items-center justify-center rounded text-white font-bold font-display transition-colors">
              X
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold tracking-tight text-lg text-slate-900 uppercase group-hover:text-slate-850 transition-colors">Workflow X-Ray</span>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono">v1.1</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase hidden sm:block">Organizational Problem Diagnostician</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Archive Sidebar / Drawer (Left) */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden flex h-full shrink-0"
            >
              <ReportHistory
                history={history}
                currentReportId={currentReportId}
                onSelectReport={(id) => setCurrentReportId(id)}
                onDeleteReport={handleDeleteReport}
                onNewDiagnosis={handleNewDiagnosis}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Panel (Middle & Right) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <AnimatePresence mode="wait">
            {isLoading ? (
              /* Report generation progress */
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto bg-[#F1F5F9] p-6 md:p-8"
              >
                <div className="mx-auto flex min-h-full w-full max-w-5xl items-center">
                  <div className="w-full space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-white text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider font-semibold">
                            Diagnosis in progress
                          </span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider font-semibold">
                            Gemini analysis
                          </span>
                        </div>
                        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900">
                          Building the workflow diagnosis
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                          Workflow X-Ray is comparing stated goals, stakeholder signals, operational constraints, and data readiness before rendering the report.
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Readiness</div>
                        <div className="font-display text-2xl font-bold text-slate-900">{loadingProgress}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                          <div>
                            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-800">
                              Current diagnostic stage
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                              The report will open automatically when synthesis is complete.
                            </p>
                          </div>
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        </div>

                        <div className="mt-6 space-y-4">
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700">
                                <Sparkle className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                  Step {loadingStepIdx + 1} of {loadingSteps.length}
                                </div>
                                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-900">
                                  {loadingSteps[loadingStepIdx]}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-slate-400">
                              <span>Analysis progress</span>
                              <span>{loadingProgress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                              <motion.div
                                className="h-full rounded-full bg-emerald-500"
                                initial={{ width: '8%' }}
                                animate={{ width: `${loadingProgress}%` }}
                                transition={{ duration: 0.45, ease: 'easeOut' }}
                              ></motion.div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-800">
                          Diagnostic queue
                        </h3>
                        <div className="mt-5 space-y-3">
                          {loadingSteps.map((step, idx) => {
                            const complete = idx < loadingStepIdx;
                            const active = idx === loadingStepIdx;
                            return (
                              <div
                                key={step}
                                className={`flex items-start gap-3 rounded-lg border p-3 ${
                                  active
                                    ? 'border-emerald-200 bg-emerald-50/70'
                                    : complete
                                    ? 'border-slate-200 bg-slate-50'
                                    : 'border-slate-100 bg-white'
                                }`}
                              >
                                <div
                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                    complete
                                      ? 'border-emerald-200 bg-emerald-500 text-white'
                                      : active
                                      ? 'border-emerald-300 bg-white text-emerald-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-400'
                                  }`}
                                >
                                  {complete ? (
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  ) : active ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Clock className="h-3.5 w-3.5" />
                                  )}
                                </div>
                                <p className={`text-xs leading-relaxed ${active ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                                  {step}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-slate-400 shadow-sm">
                      Server-side Gemini analysis is running. Keep this tab open until the report appears.
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeReport ? (
              /* High-fidelity interactive report dashboard panel */
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <ReportDashboard report={activeReport} />
              </motion.div>
            ) : (
              /* Scoping Form / Landing Workspace */
              <motion.div
                key="scoping-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-4xl mx-auto w-full"
              >
                {/* Hero section */}
                <div className="text-center md:text-left space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold font-mono border border-emerald-500/20">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    New Scoping Session
                  </div>
                  <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight">
                    Find the real problem before you solve it.
                  </h2>
                  <p className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed">
                    Workflow X-Ray acts as a clinical corporate auditor. Bring us an initiative, KPI, manual process, or AI/automation idea. We reveal which layers are actually broken and map a staged path to real change.
                  </p>
                </div>

                {/* Explore Examples (Actionable Pre-fills) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-display font-bold text-xs uppercase text-slate-500 tracking-wider">
                      Explore Diagnostic Templates (Click to Pre-fill)
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Quick Scoping templates</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {EXAMPLES.map((ex, idx) => (
                      <div
                        key={idx}
                        onClick={() => handlePreFillExample(ex)}
                        className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow hover:border-emerald-500/40 cursor-pointer transition-all text-left flex flex-col justify-between group"
                      >
                        <div className="space-y-1.5">
                          <h4 className="font-display font-bold text-slate-800 text-xs md:text-sm group-hover:text-emerald-700 transition-colors">
                            {ex.title}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {ex.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 font-bold mt-4 pt-2 border-t border-slate-100">
                          <span>Load template</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main diagnostic Form */}
                <form onSubmit={handleRunAnalysis} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
                  
                  {/* Mode Selector and Form Heading */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-3">
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900">
                        Diagnostics Intake Form
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Scrutinize the initiative through structured inquiry or raw material.</p>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setInputMode('guided')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          inputMode === 'guided'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Guided scoping
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('standard')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          inputMode === 'standard'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Raw material
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      Project Name
                    </label>
                    <p className="text-[11px] text-slate-500">Name this scan so the report and archive are easy to identify.</p>
                    <input
                      required
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Customer Support AI Triage Rollout"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:bg-white text-slate-900 transition-colors"
                    />
                  </div>

                  {/* Form Content */}
                  {inputMode === 'guided' ? (
                    <div className="space-y-5">
                      {/* Stated Goal */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                          <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                          1. Stated Goal / KPI / Business Objective
                        </label>
                        <p className="text-[11px] text-slate-500">What does the team claim is their primary business goal or target output?</p>
                        <textarea
                          required
                          value={statedGoal}
                          onChange={(e) => setStatedGoal(e.target.value)}
                          placeholder="e.g. Reduce customer ticket response latency to under 5 minutes by using standard AI pipelines..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:bg-white text-slate-900 transition-colors"
                        />
                      </div>

                      {/* Proposed Solution */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                          <Sparkle className="h-3.5 w-3.5 text-slate-500" />
                          2. Proposed Path / Technology / Solution
                        </label>
                        <p className="text-[11px] text-slate-500">What is the planned execution path? What technology or software do they think solves this?</p>
                        <textarea
                          required
                          value={proposedSolution}
                          onChange={(e) => setProposedSolution(e.target.value)}
                          placeholder="e.g. Build an LLM vector database matching against manuals, running completely serverless..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:bg-white text-slate-900 transition-colors"
                        />
                      </div>

                      {/* Stakeholders Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                            <Users className="h-3.5 w-3.5 text-slate-500" />
                            3. Stakeholders & Their Feedback / Motives
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsVoiceInterviewOpen(true)}
                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border border-emerald-200 transition-all cursor-pointer shadow-sm"
                          >
                            <Mic className="h-3 w-3 animate-pulse text-emerald-600" />
                            Live Voice Interview
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500">Who is driving this? What do the teams say? Are there conflicting interests or concerns?</p>
                        <textarea
                          required
                          value={stakeholdersInput}
                          onChange={(e) => setStakeholdersInput(e.target.value)}
                          placeholder="e.g. Support VP wants immediate headcount reduction. Engineers are excited about vector search. Compliance is worried about client PII..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:bg-white text-slate-900 transition-colors"
                        />
                      </div>

                      {/* Data Sources Input */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                          <Database className="h-3.5 w-3.5 text-slate-500" />
                          4. Known Data Sources & System Constraints
                        </label>
                        <p className="text-[11px] text-slate-500">Where does the required data live? What database schemas, Excel sheets, or physical inputs exist?</p>
                        <textarea
                          required
                          value={dataSourcesInput}
                          onChange={(e) => setDataSourcesInput(e.target.value)}
                          placeholder="e.g. Product manuals stored as unindexed raw PDFs in Google Drive. Old Word files from 2023..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:bg-white text-slate-900 transition-colors"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Standard Raw Text mode */
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            Raw Meeting Transcript or Scoping Material
                          </label>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Paste a raw meeting transcript, chat log, project brief, or executive summary describing the initiative, motives, and team plans:
                          </p>
                        </div>

                        {/* Drag & Drop Upload Zone */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files?.[0]) {
                              handleFileUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => document.getElementById('file-input')?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                            isDragging
                              ? 'border-emerald-500 bg-emerald-50/30'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                          } flex flex-col items-center justify-center gap-2 cursor-pointer relative group`}
                        >
                          <input
                            type="file"
                            id="file-input"
                            accept=".pdf,.docx,.txt"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0]);
                              }
                            }}
                          />
                          
                          {isUploading ? (
                            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                          ) : (
                            <Upload className="h-8 w-8 text-slate-400 group-hover:text-emerald-600 group-hover:scale-105 transition-all" />
                          )}

                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              {isUploading ? "Extracting document text..." : "Drag & drop PDF, DOCX, or TXT file here, or click to browse"}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">
                              Max size 10MB • Text will be automatically appended below
                            </p>
                          </div>
                        </div>

                        {/* Upload Error Message */}
                        {uploadError && (
                          <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{uploadError}</span>
                          </div>
                        )}

                        {/* Uploaded File Chips */}
                        {uploadedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1.5">
                            {uploadedFiles.map((f, i) => (
                              <div
                                key={i}
                                className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 rounded-full text-xs font-medium font-mono shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Paperclip className="h-3 w-3 text-emerald-600" />
                                <span className="max-w-[180px] truncate">{f.name}</span>
                                <span className="text-[10px] text-emerald-600/70">({formatFileSize(f.size)})</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));
                                  }}
                                  className="text-emerald-600 hover:text-emerald-950 ml-1 rounded-full hover:bg-emerald-100 p-0.5 cursor-pointer transition-colors"
                                  title="Remove chip"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <textarea
                          required
                          value={userMaterial}
                          onChange={(e) => setUserMaterial(e.target.value)}
                          placeholder="e.g. Project brief: We need to build a unified client billing sync platform to automate audit trails..."
                          rows={8}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:bg-white text-slate-900 transition-colors font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Optional Context Grid */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                      <Sliders className="h-3.5 w-3.5 text-slate-500" />
                      Optional Context & Scope Boundaries
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Industry */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Industry</span>
                        <input
                          type="text"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="e.g. Financial Services"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:bg-white text-slate-900 transition-colors"
                        />
                      </div>

                      {/* Org Size */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Organization Size</span>
                        <input
                          type="text"
                          value={orgSize}
                          onChange={(e) => setOrgSize(e.target.value)}
                          placeholder="e.g. 500 employees"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:bg-white text-slate-900 transition-colors"
                        />
                      </div>

                      {/* Risk Appetite */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Risk Appetite</span>
                        <select
                          value={riskAppetite}
                          onChange={(e) => setRiskAppetite(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:bg-white text-slate-900 transition-colors cursor-pointer"
                        >
                          <option value="Conservative">Conservative</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Aggressive">Aggressive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-mono max-w-sm leading-normal">
                      By submitting, Gemini 3.5 Flash will map root causes across problem definition, value, data readiness, risk, and ownership layers.
                    </p>

                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-display font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer border border-slate-800"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Run Diagnostic
                    </button>
                  </div>

                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isVoiceInterviewOpen && (
              <VoiceInterview
                language="English"
                onSaveTranscript={handleSaveVoiceTranscript}
                onClose={() => setIsVoiceInterviewOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
