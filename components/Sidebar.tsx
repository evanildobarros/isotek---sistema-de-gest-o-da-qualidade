import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Factory,
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  FileBarChart,
  Settings,
  UserCog,
  Database,
  ChevronDown,
  ChevronRight,
  Target,
  Briefcase,
  Truck,
  AlertOctagon,
  Search,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { IsoSection, NavigationItem } from '../types';

interface MenuSection {
  sectionNumber: string;
  sectionTitle: string;
  items: NavigationItem[];
}

interface MenuGroup {
  groupTitle: string;
  sections: MenuSection[];
}

const menuGroups: MenuGroup[] = [
  {
    groupTitle: 'Grupo A: Estratégia (Plan)',
    sections: [
      {
        sectionNumber: '4.0',
        sectionTitle: 'Contexto da Organização',
        items: [
          {
            label: 'Análise de Contexto',
            section: IsoSection.CONTEXT_ANALYSIS,
            path: '/app/contexto-analise',
            icon: Search
          },
          {
            label: 'Partes Interessadas',
            section: IsoSection.STAKEHOLDERS,
            path: '/app/partes-interessadas',
            icon: Users
          },
          {
            label: 'Processos e Escopo',
            section: IsoSection.PROCESSES_SCOPE,
            path: '/app/processos-escopo',
            icon: BookOpen
          }
        ]
      },
      {
        sectionNumber: '5.0',
        sectionTitle: 'Liderança',
        items: [
          {
            label: 'Política da Qualidade',
            section: IsoSection.QUALITY_POLICY,
            path: '/app/politica-qualidade',
            icon: FileText
          },
          {
            label: 'Responsabilidades',
            section: IsoSection.RESPONSIBILITIES,
            path: '/app/responsabilidades',
            icon: UserCog
          }
        ]
      },
      {
        sectionNumber: '6.0',
        sectionTitle: 'Planejamento',
        items: [
          {
            label: 'Matriz de Riscos',
            section: IsoSection.RISK_MATRIX,
            path: '/app/matriz-riscos',
            icon: ShieldCheck
          },
          {
            label: 'Objetivos da Qualidade',
            section: IsoSection.QUALITY_OBJECTIVES,
            path: '/app/objetivos-qualidade',
            icon: Target
          }
        ]
      }
    ]
  },
  {
    groupTitle: 'Grupo B: Execução (Do)',
    sections: [
      {
        sectionNumber: '7.0',
        sectionTitle: 'Apoio',
        items: [
          {
            label: 'Gestão de Documentos (GED)',
            section: IsoSection.DOCUMENTS,
            path: '/app/documentos',
            icon: FileText
          },
          {
            label: 'Competências e Treinamentos',
            section: IsoSection.COMPETENCIES_TRAINING,
            path: '/app/treinamentos',
            icon: GraduationCap
          }
        ]
      },
      {
        sectionNumber: '8.0',
        sectionTitle: 'Operação',
        items: [
          {
            label: 'Comercial e Requisitos',
            section: IsoSection.COMMERCIAL_REQUIREMENTS,
            path: '/app/comercial',
            icon: Briefcase
          },
          {
            label: 'Gestão de Fornecedores',
            section: IsoSection.SUPPLIER_MANAGEMENT,
            path: '/app/fornecedores',
            icon: Truck
          },
          {
            label: 'Controle de Produção',
            section: IsoSection.PRODUCTION_CONTROL,
            path: '/app/producao',
            icon: Factory
          },
          {
            label: 'Saídas Não Conformes',
            section: IsoSection.NON_CONFORMING_OUTPUTS,
            path: '/app/saidas-nao-conformes',
            icon: AlertOctagon
          }
        ]
      }
    ]
  },
  {
    groupTitle: 'Grupo C: Checagem (Check/Act)',
    sections: [
      {
        sectionNumber: '9.0',
        sectionTitle: 'Avaliação',
        items: [
          {
            label: 'Indicadores de Desempenho',
            section: IsoSection.PERFORMANCE_INDICATORS,
            path: '/app/indicadores',
            icon: BarChart3
          },
          {
            label: 'Auditorias Internas',
            section: IsoSection.INTERNAL_AUDITS,
            path: '/app/auditorias',
            icon: ClipboardCheck
          },
          {
            label: 'Análise Crítica',
            section: IsoSection.MANAGEMENT_REVIEW,
            path: '/app/analise-critica',
            icon: FileBarChart
          }
        ]
      },
      {
        sectionNumber: '10.0',
        sectionTitle: 'Melhoria',
        items: [
          {
            label: 'Não Conformidades (RNC)',
            section: IsoSection.NON_CONFORMANCES,
            path: '/app/nao-conformidades',
            icon: AlertTriangle
          },
          {
            label: 'Ações Corretivas',
            section: IsoSection.CORRECTIVE_ACTIONS,
            path: '/app/acoes-corretivas',
            icon: CheckCircle2
          }
        ]
      }
    ]
  }
];

const settingsGroup: MenuSection = {
  sectionNumber: '',
  sectionTitle: 'Sistema',
  items: [
    {
      label: 'Minhas Unidades',
      section: IsoSection.UNITS,
      path: '/app/unidades',
      icon: Building2
    },
    {
      label: 'Usuários',
      section: IsoSection.SETTINGS_USERS,
      path: '/app/usuarios',
      icon: Users
    },
    {
      label: 'Perfil da Empresa',
      section: IsoSection.COMPANY_PROFILE,
      path: '/app/configuracoes',
      icon: Settings
    }
  ]
};

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
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
    menuGroups.forEach(group => {
      group.sections.forEach(section => {
        section.items.forEach(item => {
          if (item.children) {
            const hasActiveChild = item.children.some(child => child.path === currentPath);
            if (hasActiveChild && !expandedGroups.includes(item.label)) {
              setExpandedGroups(prev => [...prev, item.label]);
            }
          }
        });
      });
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

    // Special highlighting for "Gestão de Documentos (GED)" as requested
    const isGed = item.section === IsoSection.DOCUMENTS;

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleGroup(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isChildActive ? 'text-[#BF7960] bg-[#BF7960]/10' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon size={18} className={isChildActive ? 'text-[#BF7960]' : 'text-gray-400'} />}
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
          ? 'bg-[#BF7960]/10 text-[#BF7960]'
          : isGed ? 'text-gray-700 font-semibold hover:bg-gray-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
      >
        {item.icon && (
          <item.icon
            size={18}
            className={isActive ? 'text-[#BF7960]' : isGed ? 'text-[#BF7960]' : 'text-gray-400'}
          />
        )}
        {item.label}
      </button>
    );
  };

  const renderSection = (section: MenuSection) => {
    return (
      <div key={section.sectionNumber + section.sectionTitle} className="mb-4">
        <div className="px-3 mb-2 flex items-center gap-2">
          {section.sectionNumber && (
            <span className="text-xs font-bold text-[#BF7960] bg-[#BF7960]/10 px-1.5 py-0.5 rounded">
              {section.sectionNumber}
            </span>
          )}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {section.sectionTitle}
          </span>
        </div>
        <div className="space-y-0.5">
          {section.items.map(item => renderMenuItem(item))}
        </div>
      </div>
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

      <nav className="flex-1 flex flex-col py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        {menuGroups.map((group, index) => (
          <div key={group.groupTitle} className="mb-8">
            <h3 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
              {group.groupTitle}
            </h3>
            {group.sections.map(section => renderSection(section))}
          </div>
        ))}

        <div className="mt-auto pt-4 border-t border-gray-200">
          {renderSection(settingsGroup)}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
          <CheckCircle2 size={12} className="text-[#BF7960]" />
          <span>Metodologia <strong>PROCEM</strong></span>
        </div>
      </div>
    </aside>
  );
};