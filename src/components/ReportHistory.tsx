import React from 'react';
import { History, Calendar, Trash2, ArrowRight, Layers } from 'lucide-react';
import { ReportItem } from '../types';

interface ReportHistoryProps {
  history: ReportItem[];
  currentReportId: string | null;
  onSelectReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onNewDiagnosis: () => void;
}

export default function ReportHistory({
  history,
  currentReportId,
  onSelectReport,
  onDeleteReport,
  onNewDiagnosis,
}: ReportHistoryProps) {
  return (
    <div className="bg-white border-r border-slate-200 text-slate-900 flex flex-col h-full w-full max-w-xs md:max-w-sm shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-900" />
          <span className="font-display font-bold tracking-tight text-xs uppercase text-slate-800">
            Diagnosis Archive
          </span>
        </div>
        <button
          onClick={onNewDiagnosis}
          className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-sm cursor-pointer"
        >
          New Scan
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {history.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400 text-sm">
            <History className="h-8 w-8 mx-auto mb-3 opacity-30 text-slate-300" />
            <p className="font-display font-semibold text-slate-500">No diagnostic history</p>
            <p className="text-xs mt-1 text-slate-400">Run a scan to see archive</p>
          </div>
        ) : (
          history.map((item) => {
            const isActive = item.id === currentReportId;
            const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                onClick={() => onSelectReport(item.id)}
                className={`group relative p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-100/80 border-slate-300 border-l-4 border-l-slate-900 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2 pr-6">
                  <div>
                    <h4 className="font-display font-bold text-xs md:text-sm line-clamp-1 text-slate-800 group-hover:text-slate-950 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                  <div className="absolute right-2 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteReport(item.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slogan Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80 font-mono text-[9px] text-slate-400 text-center tracking-wider uppercase">
        Workflow X-Ray // Find the real problem before you solve it
      </div>
    </div>
  );
}
