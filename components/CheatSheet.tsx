import React, { useEffect } from 'react';
import { Command, Calendar, Zap, Layout, Type, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatSheet: React.FC<Props> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections = [
    {
      title: "Navigation (Global)",
      icon: <Calendar className="w-4 h-4" />,
      items: [
        { keys: ["←", "→"], label: "Previous / Next Day" },
        { keys: ["T"], label: "Jump to Today" },
        { keys: ["⌘", "K"], label: "Search / Command Palette" },
        { keys: ["⌘", "\\"], label: "Toggle Zen Mode" },
      ]
    },
    {
      title: "Editor Macros",
      icon: <Zap className="w-4 h-4" />,
      items: [
        { keys: ["Alt", "1-5"], label: "Set Effort Level" },
        { keys: ["Alt", "W"], label: "Focus Work Log" },
        { keys: ["Alt", "L"], label: "Focus Learning Log" },
        { keys: ["⌘", "S"], label: "Save Entry" },
      ]
    },
    {
      title: "Text Snippets",
      icon: <Type className="w-4 h-4" />,
      items: [
        { keys: [";;bug"], label: "Insert Bug Report Template" },
        { keys: [";;meet"], label: "Insert Meeting Notes" },
        { keys: ["⌘", "B"], label: "Bold Text" },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Command className="w-6 h-6" /> Keyboard Shortcuts
            </h2>
            <button onClick={onClose} className="text-sm font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:text-ink">ESC</button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            {sections.map((section) => (
                <div key={section.title}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        {section.icon} {section.title}
                    </h3>
                    <ul className="space-y-3">
                        {section.items.map((item) => (
                            <li key={item.label} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                                <div className="flex gap-1">
                                    {item.keys.map(k => (
                                        <kbd key={k} className="min-w-[24px] text-center px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                                            {k}
                                        </kbd>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};