import React from 'react';
import { TabType } from '../types';
import { LayoutGrid, DoorOpen, Layers, Scissors, Droplets, BookOpen, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isAdmin: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab, isAdmin }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'calc_countertops', label: 'Столешницы', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'calc_partitions', label: 'Сантехперегородки', icon: <DoorOpen className="w-4 h-4" /> },
    { id: 'calc_subsystem', label: 'Подсистема фасадная', icon: <Layers className="w-4 h-4" /> },
    { id: 'calc_cutting', label: 'Раскрой плит', icon: <Scissors className="w-4 h-4" /> },
    { id: 'calc_septic', label: 'Септики', icon: <Droplets className="w-4 h-4" /> },
    { id: 'pricelist', label: 'Прайс-лист декоров', icon: <BookOpen className="w-4 h-4" /> },
  ];

  if (isAdmin) {
    tabs.push({
      id: 'admin',
      label: 'Администрирование',
      icon: <Settings className="w-4 h-4" />,
      badge: 'Админ',
    });
  }

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 text-[10px] uppercase font-bold rounded ${
                    isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
