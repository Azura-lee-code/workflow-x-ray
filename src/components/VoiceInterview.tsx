import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, X, Check, AlertCircle, Play, Sparkles } from 'lucide-react';

interface VoiceInterviewProps {
  language: string;
  onSaveTranscript: (transcript: string) => void;
  onClose: () => void;
}

const STAKEHOLDER_ROLES = [
  { id: 'Project Owner', label: 'Project Owner', desc: 'Owns the vision, timeline, and outcome' },
  { id: 'Business Leader', label: 'Business Leader', desc: 'Drives financial value and strategic metrics' },
  { id: 'Manager', label: 'Manager', desc: 'Coordinates the daily processes and workflows' },
  { id: 'Frontline Staff', label: 'Frontline Staff', desc: 'Uses the systems and executes the actual work' },
  { id: 'Engineer/IT', label: 'Engineer/IT', desc: 'Builds, maintains, and integrates technology' },
  { id: 'Risk/Legal', label: 'Risk/Legal', desc: 'Secures compliance, privacy, and risk bounds' }
];

interface TranscriptMessage {
  id: string;
  speaker: 'user' | 'interviewer';
  text: string;
}

export default function VoiceInterview({ language, onSaveTranscript, onClose }: VoiceInterviewProps) {
  const [selectedRole, setSelectedRole] = useState('Project Owner');
  const [intervieweeName, setIntervieweeName] = useState('');
  const [intervieweeDept, setIntervieweeDept] = useState('');
  const [intervieweeTitle, setIntervieweeTitle] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'interrupted' | 'disconnected'>('idle');
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userVolume, setUserVolume] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [editableText, setEditableText] = useState('');

  // Web Audio & WebSocket References
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll transcript to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudioAndSocket();
    };
  }, []);

  const cleanupAudioAndSocket = () => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop all playing audio sources
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;

    // Stop mic stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close contexts
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
  };

  const handleStartSession = async () => {
    try {
      setErrorMessage(null);
      setStatus('connecting');
      setIsSessionActive(true);
      setMessages([]);

      // 1. Request microphone permissions
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch (err: any) {
        throw new Error('Microphone access denied. Please grant microphone permissions in your browser to proceed.');
      }

      // 2. Initialize Web Audio Contexts
      // Input at 16kHz for mic capture (Gemini Live API expects 16kHz)
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      // Output at 24kHz for playing Gemini's speech (Gemini Live outputs 24kHz)
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      // 3. Connect WebSocket to backend server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-interview?role=${encodeURIComponent(selectedRole)}&language=${encodeURIComponent(language)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Voice session connected to Gemini Live');
        setStatus('speaking'); // Model starts by speaking the introduction
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'audio' && outputCtx) {
            playAudioChunk(outputCtx, msg.audio);
            setStatus('speaking');
          }

          if (msg.type === 'interrupted') {
            handleInterrupted();
          }

          if (msg.type === 'model-transcript') {
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.speaker === 'interviewer') {
                return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + msg.text }];
              } else {
                return [...prev, { id: crypto.randomUUID(), speaker: 'interviewer', text: msg.text }];
              }
            });
          }

          if (msg.type === 'user-transcript') {
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.speaker === 'user') {
                return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + msg.text }];
              } else {
                return [...prev, { id: crypto.randomUUID(), speaker: 'user', text: msg.text }];
              }
            });
          }

          if (msg.type === 'error') {
            setErrorMessage(msg.error);
            setStatus('disconnected');
          }
        } catch (e: any) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        setIsSessionActive(false);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setErrorMessage('Failed to maintain connection with the interview server.');
        setStatus('disconnected');
      };

      // 4. Set up Microphone Processor and Streaming
      const source = inputCtx.createMediaStreamSource(stream);
      // Buffer size 4096, 1 input channel, 1 output channel
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate input volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setUserVolume(rms);

        // Convert to 16-bit linear PCM and send to server
        const pcmBuffer = floatTo16BitPCM(inputData);
        const base64Audio = arrayBufferToBase64(pcmBuffer);
        
        ws.send(JSON.stringify({ audio: base64Audio }));
      };

    } catch (err: any) {
      console.error('Failed to start voice interview session:', err);
      setErrorMessage(err.message || 'Could not launch voice interview module.');
      setStatus('disconnected');
      cleanupAudioAndSocket();
    }
  };

  const playAudioChunk = (audioContext: AudioContext, base64Audio: string) => {
    try {
      const float32Data = base64ToFloat32(base64Audio);
      const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      const currentTime = audioContext.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.05; // tiny latency buffer to prevent gaps
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setStatus('listening'); // Idle, listening to user
        }
      };

      activeSourcesRef.current.push(source);
    } catch (e) {
      console.error('Playback error:', e);
    }
  };

  const handleInterrupted = () => {
    setStatus('interrupted');
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
  };

  const handleStopSession = () => {
    cleanupAudioAndSocket();
    setIsSessionActive(false);
    setStatus('idle');
  };

  // Step 1: stop the live session and move into an editable review of the transcript
  const handleReviewTranscript = () => {
    cleanupAudioAndSocket();
    setIsSessionActive(false);
    setStatus('idle');

    if (messages.length === 0) {
      onClose();
      return;
    }

    // Build an editable plain-text version the user can correct before saving
    let text = '';
    messages.forEach((msg) => {
      const label = msg.speaker === 'interviewer' ? 'WORKFLOW X-RAY' : selectedRole.toUpperCase();
      text += `[${label}]: ${msg.text.trim()}\n`;
    });
    setEditableText(text.trim());
    setReviewing(true);
  };

  // Step 2: confirm the (possibly edited) transcript and fold it into the diagnosis input
  const handleConfirmSave = () => {
    const block = `\n\n=== CLINICAL INQUIRY TRANSCRIPT: [Stakeholder: ${selectedRole}] ===\n${editableText.trim()}\n=====================================================\n`;
    onSaveTranscript(block);
    onClose();
  };

  // Helper arrays conversions
  const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToFloat32 = (base64: string): Float32Array => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const view = new DataView(bytes.buffer);
    const numSamples = len / 2;
    const float32 = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const int16 = view.getInt16(i * 2, true);
      float32[i] = int16 / (int16 < 0 ? 32768 : 32767);
    }
    return float32;
  };

  // Render volume waves
  const renderWaveform = () => {
    if (status === 'connecting') {
      return (
        <div className="flex items-center gap-1 justify-center h-12">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-sky-500 rounded-full h-4"
              animate={{ height: [12, 32, 12] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
            />
          ))}
        </div>
      );
    }

    if (status === 'speaking') {
      return (
        <div className="flex items-center gap-1.5 justify-center h-12">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-emerald-500 rounded-full h-8"
              animate={{ height: [16, 48, 16] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
            />
          ))}
        </div>
      );
    }

    if (status === 'listening') {
      // Scale dynamic userVolume factor
      const scale = Math.max(10, Math.min(60, userVolume * 150));
      return (
        <div className="flex items-center gap-1.5 justify-center h-12">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => {
            const staticH = i === 4 ? scale : scale * (1 - Math.abs(4 - i) * 0.2);
            return (
              <div
                key={i}
                className="w-1.5 bg-amber-500 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(6, staticH)}px` }}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-12">
        <div className="h-2 w-16 bg-slate-300 rounded-full"></div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl h-[90vh] max-h-[700px] text-slate-800"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg border border-emerald-200">
              <Mic className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                Live Voice Scoping Interview
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono font-normal">NATIVE AUDIO</span>
              </h3>
              <p className="text-xs text-slate-500">Challenge assumptions dynamically with an AI corporate auditor.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Panel View */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          {reviewing ? (
            /* Editable transcript review before saving */
            <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-600 uppercase font-mono tracking-wider font-semibold">Review &amp; edit before saving</span>
                <h4 className="text-sm font-semibold text-slate-800">Interview transcript — {selectedRole}</h4>
                <p className="text-xs text-slate-500">Correct any mis-heard words or trim irrelevant parts. This text is what gets folded into the diagnosis.</p>
              </div>
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="flex-1 w-full resize-none rounded-xl border border-slate-300 p-4 text-xs leading-relaxed text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Transcript..."
              />
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  onClick={() => { setReviewing(false); onClose(); }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono uppercase rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-sm"
                >
                  Discard
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Confirm &amp; Save to Diagnosis
                </button>
              </div>
            </div>
          ) : !isSessionActive && messages.length === 0 ? (
            /* Role Selection Screen */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-600 uppercase font-mono tracking-wider font-semibold">Step 1: Choose Stakeholder Viewpoint</span>
                  <h4 className="text-sm font-semibold text-slate-800">Whose perspective should we interview today?</h4>
                  <p className="text-xs text-slate-500">The AI interviewer will frame questions, tone, and critiques matching this specific workspace role.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STAKEHOLDER_ROLES.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedRole === role.id
                          ? 'bg-emerald-50/50 border-emerald-500 shadow-sm ring-1 ring-emerald-500/10'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <h5 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        {role.label}
                        {selectedRole === role.id && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
                      </h5>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{role.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Confirm interviewee identity */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-600 uppercase font-mono tracking-wider font-semibold">Step 2: Confirm Interviewee Identity</span>
                  <p className="text-xs text-slate-500">Who exactly are we interviewing? This personalizes the auditor's questions and labels the transcript.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Name</label>
                    <input value={intervieweeName} onChange={(e) => setIntervieweeName(e.target.value)} placeholder="e.g. Jane Doe" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Department</label>
                    <input value={intervieweeDept} onChange={(e) => setIntervieweeDept(e.target.value)} placeholder="e.g. Legal Operations" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Title / Position</label>
                    <input value={intervieweeTitle} onChange={(e) => setIntervieweeTitle(e.target.value)} placeholder="e.g. VP of Legal" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 max-w-md">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>The session uses <strong>Gemini 3.1 Flash Live</strong> to generate voice and listen to your answers in real-time.</span>
                </div>

                <button
                  onClick={handleStartSession}
                  disabled={!intervieweeName.trim()}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Launch Voice Scoper
                </button>
              </div>
            </div>
          ) : (
            /* Active Interview / Transcript View */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
              {/* Transcript list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="text-center py-2">
                  <span className="text-[10px] bg-white text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 font-mono uppercase tracking-wider shadow-sm">
                    Interview in progress: {selectedRole}
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                    <div className="animate-spin h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full" />
                    <p className="text-xs font-mono">Initializing corporate diagnostic channel...</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.speaker === 'user'
                            ? 'bg-amber-50/80 text-amber-900 border border-amber-200'
                            : 'bg-emerald-50/80 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        <span className={`font-mono text-[9px] block mb-1 opacity-80 uppercase tracking-wider ${
                          msg.speaker === 'user' ? 'text-amber-800' : 'text-emerald-800'
                        }`}>
                          {msg.speaker === 'user' ? 'You' : 'Workflow Auditor'}
                        </span>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Control Panel / Visualization */}
              <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Animated Voice Orb Visualizer */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  {renderWaveform()}
                  <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500">
                    {status === 'connecting' && 'Opening Socket...'}
                    {status === 'speaking' && 'Auditor is speaking...'}
                    {status === 'listening' && 'Listening (Speak into microphone)'}
                    {status === 'interrupted' && 'Interrupted...'}
                    {status === 'disconnected' && 'Disconnected'}
                  </span>
                </div>

                {/* Main Action Bar */}
                <div className="flex items-center gap-3 justify-between pt-2 border-t border-slate-200">
                  <button
                    onClick={handleStopSession}
                    disabled={!isSessionActive}
                    className="px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 hover:text-slate-900 text-xs font-mono uppercase rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-sm"
                  >
                    Disconnect
                  </button>

                  <button
                    onClick={handleReviewTranscript}
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    Stop & Review Transcript
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
