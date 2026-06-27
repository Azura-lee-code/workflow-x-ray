import React, { useState } from 'react';
import {
  FileText,
  TrendingUp,
  ShieldAlert,
  Users,
  Compass,
  AlertOctagon,
  Zap,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  ChevronRight,
  AlertCircle,
  Lock,
  Download,
  Flame,
  Info,
  Layers3
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { DiagnosticResult, ReportItem } from '../types';

interface ReportDashboardProps {
  report: ReportItem;
}

export default function ReportDashboard({ report }: ReportDashboardProps) {
  const [activeTab, setActiveTab] = useState<'mirror' | 'direction' | 'execution' | 'stakeholders' | 'assumptions' | 'roadmap' | 'brief'>('mirror');
  const result = report.result;

  // Custom tooltips and charts data
  const directionChartData = result.directionDiagnosis.dimensions.map(d => ({
    subject: d.name,
    A: d.score,
    fullMark: 100,
  }));

  const matrixData = [
    {
      name: report.title,
      direction: result.overview.directionScore,
      execution: result.overview.executionScore,
    }
  ];

  // Helper colors
  const getDecisionBadgeColor = (decision: string) => {
    switch (decision.toLowerCase()) {
      case 'stop':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'validate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'change':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'pilot':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'build':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getMatrixLabel = (pos: string) => {
    switch (pos) {
      case 'ready_to_pilot':
        return 'Ready to Pilot (High Direction & High Execution)';
      case 'good_direction_poor_execution':
        return 'Good Direction, Poor Execution';
      case 'efficiently_wrong':
        return 'Efficiently Wrong (Wrong Direction, Great Execution)';
      case 'stop_and_rethink':
        return 'Stop & Rethink (Critical Failure risk)';
      default:
        return pos.replace(/_/g, ' ');
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const getClarityBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'clear':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'partially_clear':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'too_vague':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const getFitBadgeColor = (fit: string) => {
    switch (fit.toLowerCase()) {
      case 'high':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'low':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'automate':
        return <Zap className="h-4 w-4 text-emerald-600" />;
      case 'assist':
        return <Layers className="h-4 w-4 text-sky-600" />;
      case 'human_decide':
        return <Users className="h-4 w-4 text-amber-600" />;
      default:
        return <Lock className="h-4 w-4 text-rose-600" />;
    }
  };

  const verdictStyle = (score: number) => {
    if (score >= 75) {
      return {
        level: 'strong',
        icon: <CheckCircle className="h-4 w-4" />,
        bg: 'bg-emerald-50',
        color: 'text-emerald-700',
        ring: 'border-emerald-200',
      };
    }

    if (score >= 50) {
      return {
        level: 'mixed',
        icon: <AlertCircle className="h-4 w-4" />,
        bg: 'bg-amber-50',
        color: 'text-amber-700',
        ring: 'border-amber-200',
      };
    }

    return {
      level: 'weak',
      icon: <XCircle className="h-4 w-4" />,
      bg: 'bg-rose-50',
      color: 'text-rose-700',
      ring: 'border-rose-200',
    };
  };

  const directionVerdictText = (level: string) => {
    switch (level) {
      case 'strong':
        return 'Direction is validated';
      case 'mixed':
        return 'Direction needs validation';
      default:
        return 'Direction is high-risk';
    }
  };

  const workflowVerdictText = (level: string) => {
    switch (level) {
      case 'strong':
        return 'Workflow is ready';
      case 'mixed':
        return 'Workflow has blockers';
      default:
        return 'Workflow is not ready';
    }
  };

  const hasText = (value?: string) => Boolean(value?.trim());

  const hasEvidence = (evidence?: string[]) =>
    Array.isArray(evidence) && evidence.some((item) => hasText(item));

  const evidenceCount = (evidence?: string[]) =>
    Array.isArray(evidence) ? evidence.filter((item) => hasText(item)).length : 0;

  const directionEvidenceCount = result.directionDiagnosis.dimensions.reduce(
    (count, dim) => count + evidenceCount(dim.evidence),
    0
  );

  const executionEvidenceCount = result.executionDiagnosis.blockers.reduce(
    (count, blocker) => count + evidenceCount(blocker.evidence),
    0
  );

  const EvidenceBadge = ({ backed, count }: { backed: boolean; count?: number }) => (
    <span
      title={backed ? `${count ?? 0} evidence item${count === 1 ? '' : 's'} attached` : 'No direct evidence item is attached to this judgment'}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
        backed
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      {backed ? 'Has evidence' : 'Assumption only'}
    </span>
  );

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9] text-slate-900 overflow-hidden">
      {/* Report Header Info Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider font-semibold">
              Clinical Assessment
            </span>
            <span className="text-slate-400 font-mono text-xs">ID: {report.id.substring(0, 8)}</span>
          </div>
          <h1 className="font-display font-bold text-lg md:text-xl text-slate-900 mt-1">
            {report.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Verdict</p>
            <p className="font-display font-bold text-slate-900 uppercase text-sm">
              {result.overview.recommendedDecision}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-lg border text-xs uppercase font-bold font-mono tracking-wider ${getDecisionBadgeColor(result.overview.recommendedDecision)}`}>
            {result.overview.recommendedDecision}
          </span>
        </div>
      </div>

      {/* Verdict Panel — one-glance read of Direction & Workflow */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Direction', score: result.overview.directionScore, sub: result.overview.overallVerdict, vtext: directionVerdictText, evidenceCount: directionEvidenceCount },
              { label: 'Workflow / Execution', score: result.overview.executionScore, sub: getMatrixLabel(result.overview.matrixPosition), vtext: workflowVerdictText, evidenceCount: executionEvidenceCount },
            ].map((c) => {
              const st = verdictStyle(c.score);
              return (
                <div key={c.label} className={`flex items-start gap-3 p-3 rounded-lg border ${st.ring} bg-slate-50/40`}>
                  <div className={`shrink-0 h-8 w-8 rounded-full ${st.bg} ${st.color} flex items-center justify-center font-bold text-sm`}>{st.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">{c.label}</span>
                      <EvidenceBadge backed={c.evidenceCount > 0} count={c.evidenceCount} />
                    </div>
                    <div className={`text-sm font-bold ${st.color}`}>{c.vtext(st.level)}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{c.sub}</div>
                  </div>
                </div>
            );
          })}
        </div>
          <div className="mt-3 flex items-center flex-wrap gap-2">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Verdict</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">{result.overview.recommendedDecision}</span>
            <EvidenceBadge backed={directionEvidenceCount + executionEvidenceCount > 0} count={directionEvidenceCount + executionEvidenceCount} />
            <span className="text-xs text-slate-600">{result.overview.mainDiagnosis}</span>
          </div>
        </div>

      {/* Tabs navigation */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="flex px-4 min-w-[760px] md:min-w-0">
          <button
            onClick={() => setActiveTab('mirror')}
            className={`px-4 py-3 border-b-2 font-display text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'mirror'
                ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20'
            }`}
          >
            <Eye className="h-4 w-4" />
            The Mirror
          </button>
          <button
            onClick={() => setActiveTab('direction')}
            className={`px-4 py-3 border-b-2 font-display text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'direction'
                ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20'
            }`}
          >
            <Compass className="h-4 w-4" />
            Direction suitability
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`px-4 py-3 border-b-2 font-display text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'execution'
                ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20'
            }`}
          >
            <AlertOctagon className="h-4 w-4" />
            Operational Readiness
          </button>
          <button
            onClick={() => setActiveTab('stakeholders')}
            className={`px-4 py-3 border-b-2 font-display text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'stakeholders'
                ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20'
            }`}
          >
            <Users className="h-4 w-4" />
            Alignment Dynamics
          </button>
          <button
            onClick={() => setActiveTab('assumptions')}
            className={`px-4 py-3 border-b-2 font-display text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'assumptions'
                ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20'
            }`}
          >
            <FileText className="h-4 w-4" />
            Extracted Facts & Audit
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-3 border-b-2 font-display text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'roadmap'
                ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Reform Roadmap
          </button>
          <button
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-3 border-b-2 font-display text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'brief'
                ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20'
            }`}
          >
            <Layers3 className="h-4 w-4" />
            Executive Brief
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* TAB 1: THE MIRROR */}
        {activeTab === 'mirror' && (
          <div className="space-y-6">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Verdict Status */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
                <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-xs tracking-wider uppercase text-slate-500">
                        Primary Diagnosis
                      </h3>
                      <div className="flex items-center gap-2">
                        <EvidenceBadge backed={directionEvidenceCount + executionEvidenceCount > 0} count={directionEvidenceCount + executionEvidenceCount} />
                        <span className="text-xs text-slate-400 font-mono">Matrix: {getMatrixLabel(result.overview.matrixPosition)}</span>
                      </div>
                    </div>
                    <p className="font-display font-bold text-xl md:text-2xl text-slate-900 mt-3 leading-snug">
                      {result.overview.overallVerdict}
                    </p>
                    <p className="text-sm text-slate-600 mt-4 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                      <span className="font-bold text-slate-800">Core Blocker:</span>{' '}
                      <EvidenceBadge backed={directionEvidenceCount + executionEvidenceCount > 0} count={directionEvidenceCount + executionEvidenceCount} />{' '}
                      {result.overview.mainDiagnosis}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-250">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-mono text-slate-450">Direction Readiness</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display font-bold text-2xl text-emerald-600">
                        {result.overview.directionScore}
                      </span>
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${result.overview.directionScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-mono text-slate-450">Execution Readiness</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display font-bold text-2xl text-sky-600">
                        {result.overview.executionScore}
                      </span>
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full"
                        style={{ width: `${result.overview.executionScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500 leading-normal">
                  <span className="text-amber-500 font-bold shrink-0">ℹ</span>
                  <p>
                    These direction and execution metrics serve as qualitative <strong className="text-slate-700">readiness indicators</strong> regarding scoping clarity and operational alignment, rather than objective, absolute truths.
                  </p>
                </div>
              </div>

              {/* Matrix Position Visualization */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
                <h3 className="font-display font-bold text-xs tracking-wider uppercase text-slate-500 mb-4">
                  Strategic Matrix Mapping
                </h3>
                <div className="h-56 relative bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-10">
                    <div className="border-r border-b border-slate-300"></div>
                    <div className="border-b border-slate-300"></div>
                    <div className="border-r border-slate-300"></div>
                    <div></div>
                  </div>

                  {/* Corner Labels */}
                  <div className="absolute top-2 left-2 text-[8px] font-mono font-bold text-slate-450 uppercase">
                    Good Direction, Poor Exec
                  </div>
                  <div className="absolute top-2 right-2 text-[8px] font-mono font-bold text-emerald-600/70 uppercase">
                    Ready to Pilot
                  </div>
                  <div className="absolute bottom-2 left-2 text-[8px] font-mono font-bold text-rose-600/70 uppercase">
                    Stop & Rethink
                  </div>
                  <div className="absolute bottom-2 right-2 text-[8px] font-mono font-bold text-amber-600/70 uppercase">
                    Efficiently Wrong
                  </div>

                  {/* Scatter Chart Representation */}
                  <ResponsiveContainer width="95%" height="90%">
                    <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
                      <XAxis
                        type="number"
                        dataKey="direction"
                        name="Direction"
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: '#475569' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="number"
                        dataKey="execution"
                        name="Execution"
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: '#475569' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ReferenceLine x={50} stroke="#cbd5e1" strokeDasharray="3 3" />
                      <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3" />
                      <Scatter name="Initiative" data={matrixData} fill="#10b981">
                        {matrixData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill="#10b981" r={10} className="animate-pulse" />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>

                  {/* Current Position Indicator */}
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[9px] font-mono text-white">
                    D:{result.overview.directionScore} // E:{result.overview.executionScore}
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200/80">
                  <span className="font-bold text-slate-700">Diagnostic Position:</span>{' '}
                  <span className="text-emerald-600 font-bold">{getMatrixLabel(result.overview.matrixPosition)}</span>
                </div>
              </div>
            </div>

            {/* The Corporate Mirror Card (Key Quote and Perceived vs Real Contrast) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-slate-900" />
                  <h2 className="font-display font-bold text-sm tracking-wider uppercase text-slate-800">
                    The Corporate Mirror
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Reveal Truth</span>
              </div>

              <div className="p-6 space-y-6">
                {/* Revealing Quote */}
                <div className="border-l-4 border-slate-900 bg-slate-50 p-5 rounded-r-lg">
                  <span className="text-xs text-slate-500 uppercase font-mono tracking-wider block mb-2">
                    Key Quote (Unintentional Self-Reveal)
                  </span>
                  <blockquote className="font-display italic text-base md:text-lg text-slate-800 font-semibold">
                    &ldquo;{result.mirror.keyQuote}&rdquo;
                  </blockquote>
                </div>

                {/* Perceived vs Real Contrast Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Perceived (Left side) */}
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                        Perceived Problem (The Symptom)
                      </span>
                      <h4 className="font-display font-bold text-slate-800 text-sm mt-1">
                        {result.mirror.perceivedProblem}
                      </h4>
                    </div>
                    <div className="pt-3 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block font-bold">
                        Perceived Solution (The Silver Bullet)
                      </span>
                      <p className="text-sm text-slate-600 mt-1">
                        {result.mirror.perceivedSolution}
                      </p>
                    </div>
                  </div>

                  {/* Real (Right side) */}
                  <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-200 space-y-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 bg-emerald-600 text-white text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 border-b border-l border-emerald-600">
                      Diagnostic Reality
                    </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-800 font-mono uppercase tracking-wider block font-bold">
                            Real Underlying Problem
                          </span>
                          <EvidenceBadge backed={false} />
                        </div>
                        <h4 className="font-display font-bold text-emerald-950 text-sm mt-1">
                          {result.mirror.realProblem}
                        </h4>
                      </div>
                      <div className="pt-3 border-t border-emerald-200">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-red-700 font-mono uppercase tracking-wider block font-bold">
                            Why That Solution Framing Fails
                          </span>
                          <EvidenceBadge backed={false} />
                        </div>
                        <p className="text-sm text-red-950 mt-1">
                          {result.mirror.whyItMightBeWrong}
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safe AI entry point */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-200 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-slate-800">
                  Safe Technology & AI Entry Point
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {result.overview.safeAIEntryPoint}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIRECTION SUITABILITY */}
        {activeTab === 'direction' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radar visualization & Overview */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
                <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <h3 className="font-display font-bold text-sm tracking-wider uppercase text-slate-800">
                        Direction Suitability Analysis
                      </h3>
                      <div className="flex items-center gap-2">
                        <EvidenceBadge backed={directionEvidenceCount > 0} count={directionEvidenceCount} />
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${getClarityBadgeColor(result.directionDiagnosis.verdict)}`}>
                          Verdict: {result.directionDiagnosis.verdict}
                        </span>
                      </div>
                    </div>
                  <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                    {result.directionDiagnosis.summary}
                  </p>
                </div>

                {/* Radar chart of direction */}
                <div className="h-72 mt-6 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={directionChartData}>
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                      <Radar
                        name="Suitability"
                        dataKey="A"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.15}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dynamic explanations for each dimension */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col space-y-4 shadow-sm">
                <h3 className="font-display font-bold text-xs tracking-wider uppercase text-slate-500">
                  Strategic Dimension Breakdown
                </h3>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
                  {result.directionDiagnosis.dimensions.map((dim, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="font-display font-bold text-xs text-slate-800">{dim.name}</span>
                          <div className="flex items-center gap-1.5">
                            <EvidenceBadge backed={hasEvidence(dim.evidence)} count={evidenceCount(dim.evidence)} />
                            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              {dim.score}/100
                            </span>
                          </div>
                        </div>
                      <p className="text-[11px] text-slate-600 mt-1.5">{dim.diagnosis}</p>
                      {dim.recommendation && (
                        <div className="mt-2 pt-2 border-t border-slate-250 text-[10px] text-emerald-800 font-medium">
                          <span className="font-bold">Next Action:</span> {dim.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* In-depth Dimension Cards */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xs tracking-wider uppercase text-slate-500">
                Detailed Direction Dimension Evaluations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {result.directionDiagnosis.dimensions.map((dim, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-display font-bold text-slate-800 text-sm">{dim.name}</h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <EvidenceBadge backed={hasEvidence(dim.evidence)} count={evidenceCount(dim.evidence)} />
                            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              {dim.score}
                            </span>
                          </div>
                        </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {dim.diagnosis}
                      </p>
                    </div>

                    {dim.evidence && dim.evidence.length > 0 && (
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-[9px] font-mono text-slate-450 uppercase tracking-wider block font-semibold">Evidence Support</span>
                        {dim.evidence.map((ev, eIdx) => (
                          <div key={eIdx} className="flex gap-1.5 items-start text-[10px] text-slate-700">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {dim.recommendation && (
                      <div className="border-t border-slate-200 pt-3 text-xs text-emerald-800 font-bold">
                        {dim.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OPERATIONAL READINESS */}
        {activeTab === 'execution' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="h-5 w-5 text-rose-600" />
                    <h3 className="font-display font-bold text-sm tracking-wider uppercase text-slate-800">
                      Operational Readiness & Blockers
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <EvidenceBadge backed={executionEvidenceCount > 0} count={executionEvidenceCount} />
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${getSeverityBadgeColor(result.executionDiagnosis.verdict === 'ready' ? 'low' : result.executionDiagnosis.verdict === 'partially_ready' ? 'medium' : 'high')}`}>
                      Status: {result.executionDiagnosis.verdict}
                    </span>
                  </div>
                </div>
              <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                {result.executionDiagnosis.summary}
              </p>
            </div>

            {/* Execution Blockers Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.executionDiagnosis.blockers.map((blocker, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-all shadow-sm ${
                    blocker.severity === 'high'
                      ? 'bg-rose-50 border-rose-200 hover:border-rose-300'
                      : blocker.severity === 'medium'
                      ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                      : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-display font-bold text-sm text-slate-900">{blocker.type}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <EvidenceBadge backed={hasEvidence(blocker.evidence)} count={evidenceCount(blocker.evidence)} />
                          <span className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full ${getSeverityBadgeColor(blocker.severity)}`}>
                            {blocker.severity} severity
                          </span>
                        </div>
                      </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {blocker.diagnosis}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    {blocker.evidence && blocker.evidence.length > 0 && (
                        <div className="bg-white/60 p-2.5 rounded text-[10px] text-slate-600 space-y-1 border border-slate-200/50">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[8px] text-slate-450 uppercase block tracking-wider font-semibold">Witnessed Symptoms</span>
                            <EvidenceBadge backed={true} count={evidenceCount(blocker.evidence)} />
                          </div>
                        {blocker.evidence.map((ev, eIdx) => (
                          <p key={eIdx} className="line-clamp-2">“{ev}”</p>
                        ))}
                      </div>
                    )}
                    <div className="text-xs font-medium text-slate-800 bg-white/80 p-2.5 rounded border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-mono text-emerald-850 block mb-0.5 font-bold">Clinical Prescription:</span>
                      {blocker.recommendation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ALIGNMENT DYNAMICS */}
        {activeTab === 'stakeholders' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score and Overview */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display font-bold text-xs tracking-wider uppercase text-slate-500">
                        Stakeholder Alignment Index
                      </h3>
                      <EvidenceBadge backed={false} />
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                    <span className="font-display font-bold text-4xl text-emerald-600">
                      {result.stakeholderAlignment.alignmentScore}
                    </span>
                    <span className="text-sm text-slate-400">/100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${result.stakeholderAlignment.alignmentScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-600 mt-6 leading-relaxed">
                    {result.stakeholderAlignment.diagnosis}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-6 text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block mb-1">Prescribed Alignment Strategy:</span>
                  {result.stakeholderAlignment.recommendation}
                </div>
              </div>

              {/* Shared Understanding and Friction List */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                      Stated Areas of Alignment
                    </h4>
                  </div>
                    <ul className="space-y-2 mt-4">
                      {result.stakeholderAlignment.sharedUnderstanding.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-600">
                          <span className="text-emerald-600">•</span>
                          <EvidenceBadge backed={false} />
                          <span>{item}</span>
                        </li>
                      ))}
                    {result.stakeholderAlignment.sharedUnderstanding.length === 0 && (
                      <li className="text-xs text-slate-405 italic">No aligned perspectives identified.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                      Hidden Friction & Misalignments
                    </h4>
                  </div>
                    <ul className="space-y-2 mt-4">
                      {result.stakeholderAlignment.misalignment.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-600">
                          <span className="text-rose-600">•</span>
                          <EvidenceBadge backed={false} />
                          <span>{item}</span>
                        </li>
                      ))}
                    {result.stakeholderAlignment.misalignment.length === 0 && (
                      <li className="text-xs text-slate-405 italic">No hidden misalignment found.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Conflicting Views Interactive Matrix */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                  Friction Matrix (Conflict of Interests)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Comparing Perspectives</span>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 font-mono text-slate-400 uppercase text-[10px]">
                        <th className="py-3 px-4 w-1/4 font-semibold">Stakeholder / Role</th>
                        <th className="py-3 px-4 w-2/5 font-semibold">Stated View / Objective</th>
                        <th className="py-3 px-4 w-2/5 font-semibold">Underlying Conflict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {result.stakeholderAlignment.conflictingViews.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-4 px-4 font-display font-bold text-slate-800">
                            {item.stakeholder}
                          </td>
                            <td className="py-4 px-4 text-slate-600 leading-relaxed">
                              <div className="flex items-start gap-2">
                                <EvidenceBadge backed={hasText(item.view)} count={hasText(item.view) ? 1 : 0} />
                                <span>{item.view}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-rose-700 leading-relaxed font-mono text-[11px] bg-rose-50/30">
                              <div className="flex items-start gap-2">
                                <EvidenceBadge backed={false} />
                                <span>{item.conflict}</span>
                              </div>
                            </td>
                        </tr>
                      ))}
                      {result.stakeholderAlignment.conflictingViews.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-slate-500 italic">
                            No active stakeholder conflicts extracted.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Missing Perspectives Box */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-start gap-4 shadow-sm">
              <div className="p-2.5 bg-rose-100 rounded-lg text-rose-700 shrink-0 animate-pulse">
                <Users className="h-5 w-5" />
              </div>
              <div>
                  <h4 className="font-display font-bold text-sm text-slate-800">
                    Critical Missing Perspectives (Excluded from the Room)
                    <span className="ml-2 align-middle">
                      <EvidenceBadge backed={false} />
                    </span>
                  </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  These crucial roles or users were not represented in the project scoping phase, leading to high delivery failure risk:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.stakeholderAlignment.missingPerspectives.map((pers, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono bg-white border border-rose-200 text-rose-700 px-2 py-1 rounded font-bold shadow-xs"
                    >
                      {pers}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXTRACTED FACTS & ASSUMPTION AUDIT */}
        {activeTab === 'assumptions' && (
          <div className="space-y-6">
            {/* Fact Extraction Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                  Diagnostic Extraction Log
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Acknowledge Real Facts</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Stated Initiative Goal</span>
                        <EvidenceBadge backed={hasText(result.extractedFacts.statedGoal)} count={hasText(result.extractedFacts.statedGoal) ? 1 : 0} />
                      </div>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{result.extractedFacts.statedGoal}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Proposed Path/Solution</span>
                        <EvidenceBadge backed={hasText(result.extractedFacts.proposedSolution)} count={hasText(result.extractedFacts.proposedSolution) ? 1 : 0} />
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{result.extractedFacts.proposedSolution}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Identified Target Users</span>
                        <EvidenceBadge backed={hasEvidence(result.extractedFacts.targetUsers)} count={evidenceCount(result.extractedFacts.targetUsers)} />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                      {result.extractedFacts.targetUsers.map((item, idx) => (
                        <span key={idx} className="bg-slate-50 px-2.5 py-0.5 rounded text-xs border border-slate-200 text-slate-600">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Known Technical & Process Constraints</span>
                        <EvidenceBadge backed={hasEvidence(result.extractedFacts.constraints)} count={evidenceCount(result.extractedFacts.constraints)} />
                      </div>
                      <ul className="list-disc pl-4 space-y-1.5 mt-1 text-xs text-slate-600">
                      {result.extractedFacts.constraints.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Known Data Assets & Sources</span>
                        <EvidenceBadge backed={hasEvidence(result.extractedFacts.knownDataSources)} count={evidenceCount(result.extractedFacts.knownDataSources)} />
                      </div>
                      <ul className="list-disc pl-4 space-y-1.5 mt-1 text-xs text-slate-600">
                      {result.extractedFacts.knownDataSources.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Assumption Audit Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center mb-6">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                  Friction & Assumption Audit
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Ground Truth vs. Blind Spots</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Potentially Wrong Assumptions */}
                <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700">
                    <Flame className="h-4 w-4" />
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider">
                      Critical Risks & Flawed Assumptions
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    These assumptions are highly likely to break once in contact with operational reality:
                  </p>
                  <ul className="space-y-2 mt-2">
                      {result.assumptionAudit.potentiallyWrongAssumptions.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-rose-900 bg-white p-2.5 rounded border border-rose-200 font-medium shadow-xs">
                          <span>❌</span>
                          <EvidenceBadge backed={false} />
                          <span>{item}</span>
                        </li>
                    ))}
                    {result.assumptionAudit.potentiallyWrongAssumptions.length === 0 && (
                      <li className="text-xs text-slate-405 italic">No highly flawed assumptions audited.</li>
                    )}
                  </ul>
                </div>

                {/* Hidden Assumptions */}
                <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <HelpCircle className="h-4 w-4 text-slate-800" />
                    <h4 className="font-display font-semibold text-xs uppercase tracking-wider">
                      Hidden & Implicit Assumptions
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Things the team assumes are true but has never explicitly discussed or documented:
                  </p>
                  <ul className="space-y-2 mt-2">
                      {result.assumptionAudit.hiddenAssumptions.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 shadow-xs">
                          <span>•</span>
                          <EvidenceBadge backed={false} />
                          <span>{item}</span>
                        </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Unvalidated Assumptions */}
                <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-700">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <h4 className="font-display font-semibold text-xs uppercase tracking-wider">
                      Unvalidated Assumptions (Require Proof)
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    High-risk assumptions currently treated as facts without any empirical evidence:
                  </p>
                  <ul className="space-y-2 mt-2">
                      {result.assumptionAudit.unvalidatedAssumptions.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 shadow-xs">
                          <span className="text-amber-600 font-bold">?</span>
                          <EvidenceBadge backed={false} />
                          <span>{item}</span>
                        </li>
                    ))}
                  </ul>
                </div>

                {/* Validated Assumptions */}
                <div className="bg-emerald-50/40 rounded-xl p-5 space-y-3 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <h4 className="font-display font-semibold text-xs uppercase tracking-wider">
                      Empirically Validated Assumptions
                    </h4>
                  </div>
                  <p className="text-[11px] text-emerald-900">
                    Scoping points supported by hard historical logs, surveys, or database metrics:
                  </p>
                  <ul className="space-y-2 mt-2">
                      {result.assumptionAudit.validatedAssumptions.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-800 bg-white p-2.5 rounded border border-emerald-100/50 shadow-xs">
                          <span className="text-emerald-600">✓</span>
                          <EvidenceBadge backed={true} count={1} />
                          <span>{item}</span>
                        </li>
                    ))}
                    {result.assumptionAudit.validatedAssumptions.length === 0 && (
                      <li className="text-xs text-slate-500 italic">No validated assumptions found in scoping material.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: REFORM ROADMAP */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            {/* Core Cause & Diagnosis */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                ROOT LAYER ANALYSIS
              </span>
              <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg text-slate-900">
                        Deep Root Cause: {result.changePath.rootCause.layer}
                      </h3>
                      <EvidenceBadge backed={false} />
                    </div>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {result.changePath.rootCause.diagnosis}
                    </p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 shrink-0 text-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Problem Category</span>
                  <span className="font-display font-bold text-sm text-rose-600 uppercase mt-1 block">
                    {result.changePath.problemType} FAILURE
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase font-mono text-[10px] text-slate-500">
                        Primary Change Required:
                      </span>
                      <EvidenceBadge backed={false} />
                    </div>
                    <p className="text-slate-700 mt-1 font-semibold">{result.changePath.primaryChangeNeeded}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase font-mono text-[10px] text-slate-500">
                        Causal Link To Symptoms:
                      </span>
                      <EvidenceBadge backed={false} />
                    </div>
                    <p className="text-slate-600 mt-1">{result.changePath.reason}</p>
                  </div>
              </div>
            </div>

            {/* Stages of Change Timeline */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xs tracking-wider uppercase text-slate-500">
                Staged Change Roadmap
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {result.changePath.stages.map((stage, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 relative overflow-hidden shadow-sm">
                    {/* Stage number block */}
                    <div className="absolute right-0 top-0 bg-slate-100 px-3 py-1 text-xs font-mono font-bold text-slate-600 border-l border-b border-slate-200">
                      0{idx + 1}
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider block">
                        Phase {idx + 1}
                      </span>
                      <h4 className="font-display font-bold text-slate-900 text-sm mt-1">{stage.stage}</h4>
                      <p className="text-xs text-slate-600 mt-1">{stage.goal}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-200">
                      <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">Required Tactical Actions</span>
                      {stage.actions.map((act, actIdx) => (
                        <div key={actIdx} className="flex gap-2 items-start text-xs text-slate-650">
                          <span className="text-emerald-600 font-bold font-mono">[{actIdx + 1}]</span>
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Sequence list and warning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sequence */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-wider block mb-3 font-bold">
                  Sequence of Execution
                </span>
                <div className="space-y-3">
                  {result.changePath.recommendedSequence.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                      <div className="h-6 w-6 rounded-full bg-white border border-emerald-255 text-emerald-700 text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-xs">
                        {idx + 1}
                      </div>
                      <span className="text-xs text-slate-700 font-semibold">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Do not start with */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-rose-700 mb-3">
                  <XCircle className="h-5 w-5 animate-bounce" />
                  <span className="font-display font-bold text-xs uppercase tracking-wider">
                    DO NOT START WITH (Forbidden Traps)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Avoid starting with these premature activities under any circumstances. Starting here ensures budget waste and organizational friction:
                </p>
                <div className="space-y-2">
                  {result.changePath.doNotStartWith.map((item, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-rose-950 bg-white p-3 rounded border border-rose-200 shadow-xs font-medium">
                      <span>🛑</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Landing Map Tabular */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-905" />
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                    AI Scoping & Landing Map
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Process-by-Process Evaluation</span>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 font-mono text-slate-400 uppercase text-[10px]">
                        <th className="py-3 px-4 w-8 font-semibold">Step</th>
                        <th className="py-3 px-4 w-1/4 font-semibold">Process / Business Step</th>
                        <th className="py-3 px-4 w-1/5 font-semibold">AI Role & Fit</th>
                        <th className="py-3 px-4 w-1/4 font-semibold">Human Judgment / Risk</th>
                        <th className="py-3 px-4 w-1/4 font-semibold">Tactical Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {result.aiLandingMap.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-4 px-4 font-mono text-slate-600">{item.step}</td>
                          <td className="py-4 px-4">
                            <h5 className="font-display font-bold text-slate-850">{item.businessStep}</h5>
                            <p className="text-[10px] text-slate-600 mt-0.5">As-Is: {item.currentAction}</p>
                          </td>
                            <td className="py-4 px-4 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getFitBadgeColor(item.aiFit)}`}>
                                  Fit: {item.aiFit}
                                </span>
                                <EvidenceBadge backed={false} />
                              </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-605 mt-1">
                              {getRoleIcon(item.aiRole)}
                              <span className="capitalize font-mono text-[10px]">{item.aiRole.replace(/_/g, ' ')}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 space-y-1 leading-normal">
                            <p className="text-slate-600 text-xs">
                              <span className="font-semibold text-slate-800">Human supervision:</span> {item.humanJudgmentRequired}
                            </p>
                              <p className="text-red-700 text-[10px] font-mono">
                                <span className="font-bold text-red-600">Risk:</span> <EvidenceBadge backed={false} /> {item.risk}
                              </p>
                            </td>
                            <td className="py-4 px-4 text-slate-800 leading-relaxed font-mono text-[11px] bg-emerald-50/20">
                              <div className="flex items-start gap-2">
                                <EvidenceBadge backed={false} />
                                <span>{item.recommendation}</span>
                              </div>
                            </td>
                        </tr>
                      ))}
                      {result.aiLandingMap.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                            No active AI mappings scoped.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: EXECUTIVE BRIEF (MARKDOWN) */}
        {activeTab === 'brief' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Markdown Executive Report Sheet */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 md:p-8 space-y-6 max-w-none overflow-x-auto text-slate-850 leading-relaxed shadow-sm">
                <div className="border-b border-slate-200 pb-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-800" />
                    <h3 className="font-display font-bold text-slate-900">
                      Executive Diagnostics Assessment Brief
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Pristine Copy
                  </span>
                </div>

                <div className="markdown-body text-slate-700 text-xs md:text-sm prose prose-slate max-w-none">
                  <ReactMarkdown>{result.decisionBrief.markdownReport}</ReactMarkdown>
                </div>
              </div>

              {/* Action and Meeting Questions */}
              <div className="space-y-6">
                {/* Decision Rationale Brief */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h4 className="font-display font-bold text-xs tracking-wider uppercase text-slate-500 mb-3">
                    Diagnostic Summary
                  </h4>
                  <p className="text-sm font-bold text-emerald-700">
                    {result.decisionBrief.recommendedDecision}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {result.decisionBrief.why}
                  </p>
                </div>

                {/* Team Meeting Icebreakers */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-wider block mb-3 font-bold">
                    Questions to spark organizational honesty
                  </span>
                  <div className="space-y-2">
                    {result.decisionBrief.meetingQuestions.map((q, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-700 shadow-xs">
                        <span className="text-rose-600 font-mono font-bold block mb-1">Question {idx + 1}:</span>
                        {q}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scope boundaries */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-wider block mb-2 font-bold">
                      MVP Scopes (If Piloted)
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-650">
                      {result.decisionBrief.mvpScope.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-[10px] font-mono text-rose-750 uppercase tracking-wider block mb-2 font-bold">
                      Do NOT Build Yet (Strictly Out of Scope)
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-red-750">
                      {result.decisionBrief.doNotBuildYet.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
