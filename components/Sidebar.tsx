import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Compass, 
  FolderOpen, 
  Settings, 
  BarChart3, 
  RefreshCw
} from 'lucide-react';
import { IsoSection } from '../types';

interface SidebarProps {
  activeSection: IsoSection;
  onNavigate: (section: IsoSection) => void;
}

const menuItems = [
  { section: IsoSection.DASHBOARD, icon: LayoutDashboard, label: 'Visão Geral' },
  { section: IsoSection.CONTEXTO, icon: Building2, label: '4. Contexto' },
  { section: IsoSection.LIDERANCA, icon: Users, label: '5. Liderança' },
  { section: IsoSection.PLANEJAMENTO, icon: Compass, label: '6. Planejamento' },
  { section: IsoSection.APOIO, icon: FolderOpen, label: '7. Apoio (GED)' },
  { section: IsoSection.OPERACAO, icon: Settings, label: '8. Operação' },
  { section: IsoSection.AVALIACAO, icon: BarChart3, label: '9. Avaliação' },
  { section: IsoSection.MELHORIA, icon: RefreshCw, label: '10. Melhoria' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate }) => {
  return (
    <aside className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
           <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="20" r="15" fill="#2dd4bf" />
            <path d="M15 40 H45 V85 C45 93.2843 38.2843 100 30 100 C21.7157 100 15 93.2843 15 85 V40 Z" fill="#2dd4bf" />
            <path d="M40 60 L80 95 L95 80 L55 45 Z" fill="#0c4a6e" />
            <path d="M5 70 L85 20 L95 35 L15 85 Z" fill="#86efac" />
          </svg>
          <span className="text-xl font-bold tracking-tight text-gray-900">Isotek</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Menu Principal
        </p>
        {menuItems.map((item) => {
          const isActive = activeSection === item.section;
          return (
            <button
              key={item.section}
              onClick={() => onNavigate(item.section)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group ${
                isActive
                  ? 'bg-isotek-50 text-isotek-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                size={18}
                className={isActive ? 'text-isotek-600' : 'text-gray-400 group-hover:text-gray-600'}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-isotek-100 flex items-center justify-center text-isotek-700 font-bold text-xs">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">Gerente da Qualidade</p>
          </div>
        </div>
      </div>
    </aside>
  );
};