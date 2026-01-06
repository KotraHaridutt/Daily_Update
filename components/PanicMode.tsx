import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, ShieldAlert, CheckCircle, Camera, Activity } from 'lucide-react';

// --- TYPES ---
interface PanicLog {
  id: string;
  timestamp: string;
  type: 'action' | 'thought' | 'evidence';
  content: string;
}

interface Props {
  isOpen: boolean;
  onClose: (report: string) => void;
}

// --- CONFIG ---
const IDLE_THRESHOLD = 25000; // 25 Seconds
const PROTOCOLS = [
  { id: 'CRASH', label: 'System Crash', checklist: ['Check Logs', 'Rollback Last Commit', 'Restart Services', 'Notify Team'] },
  { id: 'BUG', label: 'Critical Bug', checklist: ['Reproduce Issue', 'Isolate Component', 'Check Recent Changes', 'Disable Feature'] },
  { id: 'SECURITY', label: 'Security Breach', checklist: ['Close Ports', 'Rotate Keys', 'Check Access Logs', 'Lockdown Mode'] },
  { id: 'DEPLOY', label: 'Deploy Fail', checklist: ['Check Build Logs', 'Verify Env Vars', 'Revert to Stable', 'Clear Cache'] },
];

export const PanicMode: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // State
  const [logs, setLogs] = useState<PanicLog[]>([]);
  const [input, setInput] = useState('');
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  
  // Resolution State
  const [isResolving, setIsResolving] = useState(false);
  const [resolveData, setResolveData] = useState({ rootCause: '', fix: '', severity: 3 });

  // ⚠️ IDLE DETECTION STATE
  const [isIdle, setIsIdle] = useState(false);
  const lastInteractionTime = useRef(Date.now());

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- 1. HEARTBEAT & IDLE TIMER ---
  useEffect(() => {
    // Scroll to bottom on new log
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Focus input management
  useEffect(() => {
    if (activeProtocol && !isResolving) {
        inputRef.current?.focus();
    }
  }, [activeProtocol, isResolving, isIdle]);

  // THE DEAD MAN'S SWITCH (25s Timer)
  useEffect(() => {
    if (!activeProtocol || isResolving) return;

    const timer = setInterval(() => {
        const timeSinceLastAction = Date.now() - lastInteractionTime.current;
        if (timeSinceLastAction > IDLE_THRESHOLD && !isIdle) {
            setIsIdle(true);
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeProtocol, isResolving, isIdle]);

  // Function to wake up the pilot
  const wakeUp = useCallback(() => {
    lastInteractionTime.current = Date.now();
    if (isIdle) setIsIdle(false);
  }, [isIdle]);

  // --- 2. THE BLACK BOX LOGIC ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    wakeUp(); // Reset timer
    if (!input.trim()) return;

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    // Detect Type
    const isThought = input.trim().startsWith('//');
    const cleanContent = isThought ? input.replace('//', '').trim() : input;

    const newLog: PanicLog = {
      id: Date.now().toString(),
      timestamp,
      type: isThought ? 'thought' : 'action',
      content: cleanContent
    };

    setLogs(prev => [...prev, newLog]);
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      wakeUp(); // Reset timer on every keystroke
      setInput(e.target.value);
  };

  // --- 3. EVIDENCE SNAPPING ---
  const handlePaste = (e: React.ClipboardEvent) => {
    wakeUp();
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const now = new Date();
            const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
            setLogs(prev => [...prev, {
                id: Date.now().toString(),
                timestamp,
                type: 'evidence',
                content: `[EVIDENCE_CAPTURED_${Date.now()}.PNG] - Forensic Screenshot`
            }]);
            return;
        }
    }
  };

  // --- 4. THE DECOMPRESSION CHAMBER ---
  const handleResolve = () => {
    const report = `
## 🚨 INCIDENT REPORT [${new Date().toLocaleDateString()}]
**Protocol:** ${activeProtocol || 'GENERAL'} | **Severity:** ${'🔴'.repeat(resolveData.severity)}

### 📋 Summary
* **Root Cause:** ${resolveData.rootCause}
* **Fix Applied:** ${resolveData.fix}

### 📼 Black Box Log (FDR/CVR)
\`\`\`diff
${logs.map(l => {
    if (l.type === 'action') return `+ [${l.timestamp}] ${l.content}`;
    if (l.type === 'thought') return `! [${l.timestamp}] THOUGHT: ${l.content}`;
    if (l.type === 'evidence') return `> [${l.timestamp}] 📸 ${l.content}`;
    return '';
}).join('\n')}
\`\`\`
    `.trim();

    onClose(report);
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    
    // VIEW 1: RESOLUTION FORM
    if (isResolving) {
        return (
            <div className="fixed inset-0 z-[99999] bg-black text-green-500 font-mono flex items-center justify-center p-8">
                <div className="max-w-2xl w-full border-2 border-green-500 p-8 shadow-[0_0_50px_rgba(0,255,0,0.2)] bg-black">
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8" /> DECOMPRESSION CHAMBER
                    </h2>
                    {/* ... (Form Content Same as Before) ... */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm uppercase mb-2">Root Cause</label>
                            <input 
                                className="w-full bg-gray-900 border border-green-700 p-3 focus:outline-none focus:border-green-400 text-white"
                                value={resolveData.rootCause}
                                onChange={e => setResolveData({...resolveData, rootCause: e.target.value})}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm uppercase mb-2">The Fix</label>
                            <input 
                                className="w-full bg-gray-900 border border-green-700 p-3 focus:outline-none focus:border-green-400 text-white"
                                value={resolveData.fix}
                                onChange={e => setResolveData({...resolveData, fix: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm uppercase mb-2">Severity</label>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(num => (
                                    <button 
                                        key={num}
                                        onClick={() => setResolveData({...resolveData, severity: num})}
                                        className={`px-4 py-2 border ${resolveData.severity === num ? 'bg-green-500 text-black font-bold' : 'border-green-700 hover:bg-green-900'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button 
                            onClick={handleResolve}
                            disabled={!resolveData.rootCause || !resolveData.fix}
                            className="w-full py-4 bg-green-900 hover:bg-green-800 text-green-100 font-bold border border-green-500 mt-4 disabled:opacity-50"
                        >
                            FILE INCIDENT REPORT
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // VIEW 2: PROTOCOL SELECTOR
    if (!activeProtocol) {
        return (
            <div className="fixed inset-0 z-[99999] bg-red-950/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                <div className="w-full max-w-5xl p-8">
                    <div className="text-center mb-12 animate-pulse">
                        <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                        <h1 className="text-5xl font-black text-red-500 tracking-[0.2em] font-mono">PANIC PROTOCOL INITIATED</h1>
                        <p className="text-red-300 mt-4 font-mono text-xl">SELECT EMERGENCY TYPE TO BEGIN FLIGHT RECORDER</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        {PROTOCOLS.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => { setActiveProtocol(p.label); setChecklist(p.checklist); }}
                                className="group relative p-8 border-2 border-red-800 hover:border-red-500 bg-red-900/20 hover:bg-red-900/40 text-left transition-all overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <ShieldAlert className="w-12 h-12 text-red-500" />
                                </div>
                                <span className="block text-xs font-bold text-red-400 mb-1">CODE: {p.id}</span>
                                <span className="text-2xl font-bold text-white font-mono">{p.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <button onClick={() => onClose('')} className="mt-12 w-full text-center text-red-400 hover:text-white font-mono text-sm uppercase tracking-widest cursor-pointer">
                        [ FALSE ALARM - ABORT ]
                    </button>
                </div>
            </div>
        );
    }

    // VIEW 3: MAIN FLIGHT RECORDER (With Idle Overlay)
    return (
        <div className={`fixed inset-0 z-[99999] bg-black text-red-500 font-mono flex flex-col overflow-hidden transition-all duration-1000 ${isIdle ? 'grayscale brightness-50' : ''}`}>
        
        {/* 🚨 IDLE OVERLAY (PILOT UNRESPONSIVE) */}
        {isIdle && (
            <div className="absolute inset-0 z-[100000] flex items-center justify-center pointer-events-none">
                <div className="text-center animate-pulse">
                    <Activity className="w-32 h-32 text-white mx-auto mb-4" />
                    <h1 className="text-6xl font-black text-white tracking-[0.2em] bg-red-600 px-8 py-2 mb-4">PILOT UNRESPONSIVE</h1>
                    <p className="text-2xl text-white font-bold tracking-widest blink">RESUME INPUT IMMEDIATELY</p>
                </div>
            </div>
        )}

        {/* Status Bar */}
        <div className="flex justify-between items-center p-4 border-b border-red-900 bg-red-950/30">
            <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full bg-red-500 ${isIdle ? '' : 'animate-ping'}`}></div>
                <span className="font-bold tracking-widest text-xl text-white">RECORDING...</span>
            </div>
            <div className="flex items-center gap-6">
                <span className="text-red-400">PROTOCOL: <span className="text-white font-bold">{activeProtocol}</span></span>
                <button 
                    onClick={() => setIsResolving(true)}
                    className="px-4 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-sm"
                >
                    RESOLVE INCIDENT
                </button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            
            {/* Main Log */}
            <div className="flex-1 flex flex-col border-r border-red-900 relative">
                {/* Heartbeat Border - Fades out if idle */}
                {!isIdle && <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(255,0,0,0.1)] animate-pulse"></div>}

                <div className="flex-1 overflow-y-auto p-6 space-y-2" ref={scrollRef}>
                    {logs.length === 0 && (
                        <div className="text-red-900 italic text-center mt-20 select-none">
                            -- BLACK BOX STARTED --<br/>
                            Type actions normally.<br/>
                            Prefix with "//" for thoughts.<br/>
                            Paste images for evidence.
                        </div>
                    )}
                    {logs.map(log => (
                        <div key={log.id} className={`flex gap-4 font-mono text-lg ${log.type === 'thought' ? 'opacity-70 text-yellow-500' : 'text-green-500'}`}>
                            <span className="text-red-700 select-none">[{log.timestamp}]</span>
                            <span className="break-all">
                                {log.type === 'thought' && <span className="text-yellow-700 mr-2">{'//'}</span>}
                                {log.type === 'evidence' && <span className="text-blue-400 mr-2 flex items-center gap-2 inline-flex"><Camera className="w-4 h-4"/> EVIDENCE:</span>}
                                {log.content}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-red-950/20 border-t border-red-900">
                    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                        <span className="text-red-500 font-bold text-xl">{'>'}</span>
                        <input 
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange} // <--- UPDATED HANDLER
                            onPaste={handlePaste}
                            className="flex-1 bg-transparent border-none outline-none text-xl text-white font-mono placeholder-red-900"
                            placeholder={isIdle ? "RESUME INPUT..." : "Type action (or // for thought)..."}
                            autoFocus
                        />
                    </form>
                </div>
            </div>

            {/* Checklist */}
            <div className="w-80 bg-red-950/10 p-6 overflow-y-auto hidden md:block">
                <h3 className="text-red-400 font-bold mb-4 uppercase tracking-wider border-b border-red-900 pb-2">
                    Action Checklist
                </h3>
                <div className="space-y-3">
                    {checklist.map((item, idx) => {
                        const isChecked = checkedItems.includes(idx);
                        return (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    wakeUp(); // Interaction wakes up pilot
                                    if(isChecked) setCheckedItems(checkedItems.filter(i => i !== idx));
                                    else setCheckedItems([...checkedItems, idx]);
                                }}
                                className={`flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-red-900/20 transition-colors ${isChecked ? 'opacity-50' : 'opacity-100'}`}
                            >
                                <div className={`w-5 h-5 border border-red-500 flex items-center justify-center shrink-0 ${isChecked ? 'bg-red-500 text-black' : ''}`}>
                                    {isChecked && <CheckCircle className="w-3 h-3" />}
                                </div>
                                <span className={`text-sm ${isChecked ? 'line-through text-red-800' : 'text-red-300'}`}>{item}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-xs text-red-900 text-center">
                    SYSTEM STATUS: {isIdle ? 'UNRESPONSIVE' : 'CRITICAL'}<br/>
                    UPTIME: UNSTABLE
                </div>
            </div>
        </div>
        </div>
    );
  };

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(renderContent(), document.body);
};