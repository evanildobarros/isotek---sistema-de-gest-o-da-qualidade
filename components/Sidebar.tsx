import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  CheckSquare,
  ClipboardCheck,
  ShieldAlert,
  Grid,
  TrendingUp,
  Users,
  User,
  GraduationCap,
  BarChart3,
  PieChart,
  FileBarChart,
  Settings,
  UserCog,
  Database,
  ChevronDown,
  ChevronRight,
  Award
} from 'lucide-react';
import { IsoSection, NavigationItem } from '../types';

const navigationData: NavigationItem[] = [
  {
    label: 'Painel de Controle',
    section: IsoSection.DASHBOARD,
    path: '/app/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Gestão da Qualidade',
    icon: Award,
    children: [
      { label: 'Documentos (GED)', section: IsoSection.DOCUMENTS, path: '/app/documentos', icon: FileText },
      { label: 'Não Conformidades', section: IsoSection.NON_CONFORMANCES, path: '/app/nao-conformidades', icon: AlertTriangle },
      { label: 'Ações Corretivas', section: IsoSection.CORRECTIVE_ACTIONS, path: '/app/acoes-corretivas', icon: CheckSquare },
      { label: 'Auditorias', section: IsoSection.AUDITS, path: '/app/auditorias', icon: ClipboardCheck },
    ]
  },
  {
    label: 'Gestão de Riscos',
    icon: ShieldAlert,
    children: [
      { label: 'Contexto (SWOT)', section: IsoSection.RISK_MATRIX, path: '/app/contexto', icon: Grid },
      { label: 'Oportunidades', section: IsoSection.OPPORTUNITIES, path: '/app/oportunidades', icon: TrendingUp },
    ]
  },
  {
    label: 'Gestão Administrativa',
    icon: Users,
    children: [
      { label: 'Colaboradores', section: IsoSection.EMPLOYEES, path: '/app/colaboradores', icon: User },
      { label: 'Treinamentos', section: IsoSection.TRAININGS, path: '/app/treinamentos', icon: GraduationCap },
    ]
  },
  {
    label: 'Relatórios',
    icon: BarChart3,
    children: [
      { label: 'Indicadores (KPIs)', section: IsoSection.KPIS, path: '/app/indicadores', icon: PieChart },
      { label: 'Análise Crítica', section: IsoSection.MANAGEMENT_REVIEW, path: '/app/analise-critica', icon: FileBarChart },
    ]
  },
  {
    label: 'Configurações',
    icon: Settings,
    children: [
      { label: 'Usuários', section: IsoSection.USERS, path: '/app/usuarios', icon: UserCog },
      { label: 'Sistema', section: IsoSection.SYSTEM, path: '/app/sistema', icon: Database },
    ]
  }
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Gestão da Qualidade']);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load and sync avatar
  useEffect(() => {
    const loadAvatar = () => {
      const savedAvatar = localStorage.getItem('isotek_avatar');
      setAvatarUrl(savedAvatar);
    };

    loadAvatar();
    window.addEventListener('avatarUpdated', loadAvatar);
    return () => window.removeEventListener('avatarUpdated', loadAvatar);
  }, []);

  // Auto-expand group if child is active
  useEffect(() => {
    const currentPath = location.pathname;
    navigationData.forEach(group => {
      if (group.children) {
        const hasActiveChild = group.children.some(child => child.path === currentPath);
        if (hasActiveChild && !expandedGroups.includes(group.label)) {
          setExpandedGroups(prev => [...prev, group.label]);
        }
      }
    });
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const renderMenuItem = (item: NavigationItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.includes(item.label);
    const isActive = item.path === location.pathname;
    const isChildActive = hasChildren && item.children?.some(child => child.path === location.pathname);

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleGroup(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isChildActive ? 'text-isotek-700 bg-isotek-50/50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon size={18} className={isChildActive ? 'text-isotek-600' : 'text-gray-400'} />}
              <span>{item.label}</span>
            </div>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {isExpanded && (
            <div className="ml-4 pl-3 border-l border-gray-100 mt-1 space-y-1">
              {item.children!.map(child => renderMenuItem(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.label}
        onClick={() => item.path && navigate(item.path)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
          ? 'bg-isotek-50 text-isotek-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
      >
        {item.icon && (
          <item.icon
            size={18}
            className={isActive ? 'text-isotek-600' : 'text-gray-400'}
          />
        )}
        {item.label}
      </button>
    );
  };

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

      <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Menu Principal
        </p>
        <div className="space-y-1">
          {navigationData.map(renderMenuItem)}
        </div>
      </nav>
    </aside>
  );
};