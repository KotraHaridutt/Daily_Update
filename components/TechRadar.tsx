import React, { useMemo } from 'react';
import { LedgerEntry } from '../types';
import { Trophy, AlertTriangle, Zap, Star } from 'lucide-react';

interface Props {
  entries: LedgerEntry[];
  onClose: () => void;
}

// --- RPG CONSTANTS ---
const XP_PER_TAG = 10; 
const LEVEL_CONSTANT = 100; 
const DECAY_DAYS = 14; 

interface SkillStat {
  name: string;
  xp: number;
  level: number;
  nextLevelProgress: number; 
  lastUsed: string; 
  daysSince: number;
  status: 'active' | 'decaying' | 'master';
}

export const TechRadar: React.FC<Props> = ({ entries, onClose }) => {
  const today = new Date();

  // --- 1. THE XP ENGINE ---
  const skills = useMemo(() => {
    const stats: Record<string, { xp: number; lastUsed: string }> = {};

    entries.forEach(entry => {
      // Regex allows hyphens/underscores
      const text = `${entry.workLog} ${entry.learningLog} ${entry.workLog}`.toLowerCase();
      const tags = text.match(/#[a-z0-9_\-]+/g); 

      if (tags) {
        const uniqueTags = [...new Set(tags)];
        
        uniqueTags.forEach(t => {
          const tag = t.replace('#', '').toUpperCase(); 
          
          // --- ⚔️ BOSS FIGHT XP FIX ⚔️ ---
          let xpGain = 0;

          if (tag === 'PROJECT_LAUNCH' || tag === 'PROJECT-LAUNCH') {
             // Legendary Tag: Worth 5000 XP immediately
             xpGain = 5000;
          } else {
             // Standard Tag: Base + Effort Bonus
             const effortBonus = (entry.effortRating || 1) * 5; 
             xpGain = XP_PER_TAG + effortBonus;
          }
          // -------------------------------

          if (!stats[tag]) {
            stats[tag] = { xp: 0, lastUsed: entry.date };
          }
          
          stats[tag].xp += xpGain;
          
          if (entry.date > stats[tag].lastUsed) {
            stats[tag].lastUsed = entry.date;
          }
        });
      }
    });

    return Object.entries(stats)
      .map(([name, data]) => {
        const lastDate = new Date(data.lastUsed);
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Linear Leveling: 0-99 = Lvl 1
        const level = Math.floor(data.xp / LEVEL_CONSTANT) + 1;
        const nextLevelProgress = data.xp % LEVEL_CONSTANT; 

        return {
          name,
          xp: data.xp,
          level,
          nextLevelProgress,
          lastUsed: data.lastUsed,
          daysSince,
          status: daysSince > DECAY_DAYS ? 'decaying' : (level > 10 ? 'master' : 'active')
        } as SkillStat;
      })
      .sort((a, b) => b.xp - a.xp) 
      .slice(0, 6); 
  }, [entries]);

  // --- 2. BADGE CALCULATOR (Advanced Stack Combos) ---
  const badges = useMemo(() => {
    const list = [];
    const totalEntries = entries.length;
    const allTags = new Set(skills.map(s => s.name)); // Get normalized tag names

    // -- MILESTONES --
    if (totalEntries >= 1) list.push({ name: "Hello World", icon: "🌱", color: "text-green-500", desc: "First Entry" });
    if (totalEntries >= 7) list.push({ name: "Week Warrior", icon: "🔥", color: "text-orange-500", desc: "7 Entries" });
    
    // -- STACK COMBOS --
    // MERN Stack
    if ((allTags.has('REACT') || allTags.has('NEXTJS')) && allTags.has('NODE') && (allTags.has('MONGO') || allTags.has('SQL'))) {
        list.push({ name: "Full Stack", icon: "🏗️", color: "text-indigo-500", desc: "React + Node + DB" });
    }
    
    // Data Science
    if (allTags.has('PYTHON') && (allTags.has('PANDAS') || allTags.has('NUMPY') || allTags.has('AI'))) {
        list.push({ name: "Data Alchemist", icon: "🧪", color: "text-teal-500", desc: "Python + Data Libs" });
    }

    // Sys Admin (OS)
    if (allTags.has('OPERATING-SYSTEMS') || allTags.has('OPERATING') || allTags.has('LINUX')) {
         list.push({ name: "Sys Admin", icon: "💻", color: "text-blue-500", desc: "OS Mastery" });
    }

    // Firefighter (High Effort Bug Fixes)
    const hasFirefighter = entries.some(e => e.workLog.toLowerCase().includes('#bugfix') && e.effortRating === 5);
    if (hasFirefighter) list.push({ name: "Firefighter", icon: "🧯", color: "text-red-500", desc: "Max Effort Bug Fix" });

    // Polyglot (3+ Strong Skills)
    const strongSkills = skills.filter(s => s.level >= 3).length;
    if (strongSkills >= 3) list.push({ name: "Polyglot", icon: "🧠", color: "text-purple-500", desc: "3+ Skills > Lvl 3" });

    return list;
  }, [entries, skills]);


  // --- 3. RADAR CHART RENDERING ---
  const radarPoints = useMemo(() => {
    if (skills.length < 3) return ""; 
    const maxXP = Math.max(...skills.map(s => s.xp), 100);
    const radius = 80; 
    const center = 100; 
    
    const points = skills.map((skill, i) => {
      const angle = (Math.PI * 2 * i) / skills.length - (Math.PI / 2); 
      const value = (skill.xp / maxXP) * radius;
      const x = center + Math.cos(angle) * value;
      const y = center + Math.sin(angle) * value;
      return `${x},${y}`;
    });
    return points.join(" ");
  }, [skills]);

  const getPolyPath = (r: number) => {
    if (skills.length < 3) return "";
    const center = 100;
    return skills.map((_, i) => {
       const angle = (Math.PI * 2 * i) / skills.length - (Math.PI / 2);
       const x = center + Math.cos(angle) * r;
       const y = center + Math.sin(angle) * r;
       return `${x},${y}`;
    }).join(" ");
  }

  return (
    <div className="animate-fade-in bg-white dark:bg-gray-900 p-8 rounded-xl border border-border dark:border-gray-800 shadow-sm h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" /> 
                Developer Stats
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Based on effort-weighted analysis of your tags.</p>
        </div>
        <button onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-ink uppercase tracking-wider">
            Back to Log
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* LEFT: RADAR CHART */}
        <div className="flex flex-col items-center justify-center relative">
           {skills.length >= 3 ? (
             <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                    <polygon points={getPolyPath(80)} fill="none" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-gray-700" />
                    <polygon points={getPolyPath(60)} fill="none" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-gray-700" />
                    <polygon points={getPolyPath(40)} fill="none" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-gray-700" />
                    <polygon points={getPolyPath(20)} fill="none" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-gray-700" />
                    
                    {skills.map((_, i) => {
                        const angle = (Math.PI * 2 * i) / skills.length - (Math.PI / 2);
                        const x = 100 + Math.cos(angle) * 80;
                        const y = 100 + Math.sin(angle) * 80;
                        return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-gray-700" />;
                    })}
                    <polygon points={radarPoints} fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" strokeWidth="2" className="animate-fade-in" />
                    {skills.map((skill, i) => {
                        const angle = (Math.PI * 2 * i) / skills.length - (Math.PI / 2);
                        const x = 100 + Math.cos(angle) * 95; 
                        const y = 100 + Math.sin(angle) * 95;
                        return (
                            <text key={skill.name} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[8px] fill-gray-500 dark:fill-gray-400 font-bold uppercase font-mono">
                                {skill.name.slice(0, 10)}
                            </text>
                        );
                    })}
                </svg>
             </div>
           ) : (
             <div className="w-64 h-64 flex items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-full">
                <p className="text-xs">Tag at least 3 distinct skills<br/>to generate Radar.</p>
             </div>
           )}

           {/* BADGES ROW */}
           <div className="mt-8 flex gap-2 flex-wrap justify-center">
                {badges.map(badge => (
                    <div key={badge.name} className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 w-20 group relative cursor-help">
                        <span className="text-xl mb-1">{badge.icon}</span>
                        <span className={`text-[8px] font-bold uppercase text-center ${badge.color}`}>{badge.name}</span>
                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-gray-900 text-white text-[10px] p-2 rounded z-10 text-center">
                            {badge.desc}
                        </div>
                    </div>
                ))}
           </div>
        </div>

        {/* RIGHT: SKILL LIST */}
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Top Skills</h3>
            {skills.map((skill) => (
                <div key={skill.name} className="group">
                    <div className="flex justify-between items-end mb-1">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-ink dark:text-gray-200">#{skill.name}</span>
                            {skill.status === 'decaying' && (
                                <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 rounded flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Rust
                                </span>
                            )}
                            {skill.status === 'master' && (
                                <span className="text-[10px] text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 rounded flex items-center gap-1">
                                    <Star className="w-3 h-3" /> Master
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-mono text-gray-400">Lvl {skill.level}</span>
                    </div>
                    {/* XP Bar */}
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                                skill.status === 'decaying' ? 'bg-red-400' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${skill.nextLevelProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-gray-400">Total XP: {skill.xp}</span>
                        <span className="text-[10px] text-indigo-400">{skill.nextLevelProgress}/100 to next lvl</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};