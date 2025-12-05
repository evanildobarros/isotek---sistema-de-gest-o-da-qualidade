import React, { useState, useEffect, useCallback } from 'react';
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
  CheckCircle2,
  HelpingHand,
  LayoutDashboard,
  Lock
} from 'lucide-react';
import { IsoSection, NavigationItem } from '../../types';
import { usePlanLimits } from '../../hooks/usePlanLimits';

// --- Interfaces ---

interface MenuSection {
  sectionNumber: string;
  sectionTitle: string;
  icon: React.ElementType;
  items: NavigationItem[];
}

interface MenuGroup {
  groupTitle: string;
  sections: MenuSection[];
}

interface SidebarGroupProps {
  title: string;
  sectionNumber?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isActive?: boolean;
}

// --- Data ---

const menuGroups: MenuGroup[] = [
  {
    groupTitle: 'Grupo A: Estratégia (Plan)',
    sections: [
      {
        sectionNumber: '4.0',
        sectionTitle: 'Contexto da Organização',
        icon: Building2,
        items: [
          {
            label: 'Definição Estratégica',
            section: IsoSection.CONTEXT_ANALYSIS, // Using same section enum for now or create new one
            path: '/app/definicao-estrategica',
            icon: Target
          },
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
        icon: Users,
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
        icon: Target,
        items: [
          {
            label: 'Matriz de Riscos',
            section: IsoSection.RISK_MATRIX,
            path: '/app/matriz-riscos',
            icon: ShieldCheck
          },
          {
            label: 'Planos de Ação',
            section: IsoSection.RISK_MATRIX, // Using same section or create new one
            path: '/app/planos-de-acao',
            icon: CheckCircle2
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
        icon: HelpingHand,
        items: [
          {
            label: 'Gestão de Documentos',
            section: IsoSection.DOCUMENTS,
            path: '/app/documentos',
            icon: FileText
          },
          {
            label: 'Capacitação',
            section: IsoSection.COMPETENCIES_TRAINING,
            path: '/app/treinamentos',
            icon: GraduationCap
          }
        ]
      },
      {
        sectionNumber: '8.0',
        sectionTitle: 'Operação',
        icon: Factory,
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
        icon: BarChart3,
        items: [
          {
            label: 'Indicadores',
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
        icon: TrendingUp,
        items: [
          {
            label: 'Não Conformidades',
            section: IsoSection.NON_CONFORMANCES,
            path: '/app/nao-conformidades',
            icon: AlertTriangle
          }
        ]
      }
    ]
  }
];

const settingsGroup: MenuSection = {
  sectionNumber: '',
  sectionTitle: 'Sistema',
  icon: Settings,
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

// --- Components ---

const SidebarGroup: React.FC<SidebarGroupProps> = ({
  title,
  sectionNumber,
  icon: Icon,
  children,
  isOpen,
  onToggle,
  isActive
}) => {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
          ? 'bg-[#025159]/5 text-[#025159] dark:bg-[#025159]/20'
          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-[#025159]/10 dark:bg-[#025159]/20' : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700'
            }`}>
            <Icon size={18} className={isActive ? 'text-[#025159]' : 'text-gray-500'} />
          </div>
          <div className="flex flex-col items-start text-left flex-1">
            {sectionNumber && (
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-[#025159]' : 'text-gray-400'
                }`}>
                {sectionNumber}
              </span>
            )}
            <span className={`text-sm font-semibold leading-tight ${isActive ? 'text-[#025159]' : 'text-gray-700 dark:text-gray-300'
              }`}>
              {title}
            </span>
          </div>
        </div>
        <div className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="pl-3 space-y-0.5 border-l-2 border-gray-100 dark:border-gray-800 ml-5">
          {children}
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { canAccessModule, planName } = usePlanLimits();

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

    // Check main menu groups
    menuGroups.forEach(group => {
      group.sections.forEach(section => {
        const hasActiveItem = section.items.some(item =>
          item.path === currentPath ||
          (item.children && item.children.some(child => child.path === currentPath))
        );

        if (hasActiveItem && !expandedGroups.includes(section.sectionTitle)) {
          setExpandedGroups(prev => [...prev, section.sectionTitle]);
        }
      });
    });

    // Check settings group
    const hasActiveSettings = settingsGroup.items.some(item => item.path === currentPath);
    if (hasActiveSettings && !expandedGroups.includes(settingsGroup.sectionTitle)) {
      setExpandedGroups(prev => [...prev, settingsGroup.sectionTitle]);
    }
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

    // Check if module is restricted by plan
    const moduleKey = item.path?.split('/').pop() || '';
    const isRestricted = !canAccessModule(moduleKey);

    // Special modules that require Pro plan
    const isAuditModule = item.section === IsoSection.INTERNAL_AUDITS;
    const isSupplierModule = item.section === IsoSection.SUPPLIER_MANAGEMENT;
    const needsUpgrade = isAuditModule || isSupplierModule;

    const handleClick = () => {
      if (isRestricted && needsUpgrade) {
        // Redirect to company profile for upgrade
        navigate('/app/settings/company-profile');
        return;
      }
      if (item.path) {
        navigate(item.path);
      }
    };

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleGroup(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isChildActive ? 'text-[#025159] bg-[#025159]/10 dark:bg-[#025159]/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
              }`}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon size={18} className={isChildActive ? 'text-[#025159]' : 'text-gray-400'} />}
              <span>{item.label}</span>
            </div>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {isExpanded && (
            <div className="ml-4 pl-3 border-l border-gray-100 dark:border-gray-800 mt-1 space-y-1">
              {item.children!.map(child => renderMenuItem(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.label}
        onClick={handleClick}
        title={isRestricted && needsUpgrade ? `Disponível no plano PRO` : undefined}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
          ? 'bg-[#025159]/10 text-[#025159] dark:bg-[#025159]/20'
          : isGed
            ? 'text-gray-700 font-semibold hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
            : isRestricted && needsUpgrade
              ? 'text-gray-400 hover:bg-purple-50 dark:text-gray-600 dark:hover:bg-purple-900/10 opacity-60 cursor-pointer'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
          }`}
      >
        <div className="flex items-center gap-3">
          {item.icon && (
            <item.icon
              size={18}
              className={
                isActive
                  ? 'text-[#025159]'
                  : isGed
                    ? 'text-[#025159]'
                    : isRestricted && needsUpgrade
                      ? 'text-gray-400'
                      : 'text-gray-400'
              }
            />
          )}
          <span>{item.label}</span>
        </div>
        {isRestricted && needsUpgrade && (
          <Lock size={14} className="text-purple-500" />
        )}
      </button>
    );
  };

  const renderSection = (section: MenuSection) => {
    const isActive = section.items.some(item =>
      item.path === location.pathname ||
      (item.children && item.children.some(child => child.path === location.pathname))
    );

    return (
      <SidebarGroup
        key={section.sectionTitle}
        title={section.sectionTitle}
        sectionNumber={section.sectionNumber}
        icon={section.icon}
        isOpen={expandedGroups.includes(section.sectionTitle)}
        onToggle={() => toggleGroup(section.sectionTitle)}
        isActive={isActive}
      >
        {section.items.map(item => renderMenuItem(item))}
      </SidebarGroup>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-72 bg-white dark:bg-gray-900 h-screen border-r border-gray-200 dark:border-gray-800 
        flex flex-col fixed left-0 top-0 z-50 transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="20" r="15" fill="#2dd4bf" />
              <path d="M15 40 H45 V85 C45 93.2843 38.2843 100 30 100 C21.7157 100 15 93.2843 15 85 V40 Z" fill="#2dd4bf" />
              <path d="M40 60 L80 95 L95 80 L55 45 Z" fill="#0c4a6e" />
              <path d="M5 70 L85 20 L95 35 L15 85 Z" fill="#86efac" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Isotek</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <div className="mb-2">
            <button
              onClick={() => navigate('/app/dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${location.pathname === '/app/dashboard'
                ? 'bg-[#025159] text-white shadow-md shadow-[#025159]/20'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-semibold">Dashboard</span>
            </button>
          </div>

          {menuGroups.map((group, index) => (
            <div key={group.groupTitle} className="mb-6">
              <h3 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                {group.groupTitle}
              </h3>
              {group.sections.map(section => renderSection(section))}
            </div>
          ))}

          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
            {renderSection(settingsGroup)}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
            <CheckCircle2 size={12} className="text-[#025159]" />
            <span>Metodologia <strong>PROCEM</strong></span>
          </div>
        </div>
      </aside>
    </>
  );
};