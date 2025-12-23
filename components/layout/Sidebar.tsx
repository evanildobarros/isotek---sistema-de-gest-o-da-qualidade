import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  FileText,
  GraduationCap,
  Factory,
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  FileBarChart,
  Settings,
  UserCog,
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
  Lock,
  ArrowLeft,
  Wallet,
  ChevronsUpDown,
  ChevronsDownUp
} from 'lucide-react';
import { IsoSection, NavigationItem } from '../../types';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import { useAuditor } from '../../contexts/AuditorContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { CompanySwitcher } from '../common/CompanySwitcher';

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
    groupTitle: 'Dashboard',
    sections: [
      {
        sectionNumber: '',
        sectionTitle: 'Visão Geral',
        icon: LayoutDashboard,
        items: [
          {
            label: 'Indicadores e Metas',
            section: IsoSection.PERFORMANCE_INDICATORS,
            path: '/app/dashboard',
            icon: BarChart3
          }
        ]
      }
    ]
  },
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
            section: IsoSection.CONTEXT_ANALYSIS,
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
            section: IsoSection.RISK_MATRIX,
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
            label: 'Auditorias Externas',
            section: IsoSection.EXTERNAL_AUDITS,
            path: '/app/auditorias-externas',
            icon: ShieldCheck
          },
          {
            label: 'Apontamentos',
            section: IsoSection.EXTERNAL_AUDITS,
            path: '/app/apontamentos-auditoria',
            icon: AlertTriangle
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
      },
      {
        sectionNumber: '',
        sectionTitle: 'Documentação',
        icon: BookOpen,
        items: [
          {
            label: 'Ajuda e Tutoriais',
            section: IsoSection.SUPPORT,
            path: '/app/ajuda',
            icon: BookOpen
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
      label: 'Auditores Externos',
      section: IsoSection.INTERNAL_AUDITS,
      path: '/app/auditores',
      icon: ClipboardCheck
    },
    {
      label: 'Perfil da Empresa',
      section: IsoSection.COMPANY_PROFILE,
      path: '/app/configuracoes',
      icon: Settings
    },
    {
      label: 'Suporte Técnico',
      section: IsoSection.SUPPORT,
      path: '/app/suporte',
      icon: HelpingHand
    }
  ]
};

// --- Menu Groups for Auditors ---

const auditorPortalGroups: MenuGroup[] = [
  {
    groupTitle: 'Portal do Auditor',
    sections: [
      {
        sectionNumber: '',
        sectionTitle: 'Menu Principal',
        icon: LayoutDashboard,
        items: [
          {
            label: 'Meus Clientes',
            section: IsoSection.CONTEXT_ANALYSIS,
            path: '/app/auditor-portal',
            icon: Briefcase
          },
          {
            label: 'Minha Carteira',
            section: IsoSection.USER_PROFILE,
            path: '/app/minha-carteira',
            icon: Wallet
          },
          {
            label: 'Consultar ISO 9001',
            section: IsoSection.SUPPORT,
            path: '/app/ajuda',
            icon: BookOpen
          },
          {
            label: 'Meu Perfil',
            section: IsoSection.SUPPORT,
            path: '/app/perfil',
            icon: UserCog
          }
        ]
      }
    ]
  }
];

const auditorClientGroups: MenuGroup[] = [
  {
    groupTitle: 'Auditoria em Andamento',
    sections: [
      {
        sectionNumber: '',
        sectionTitle: 'Visão Geral',
        icon: LayoutDashboard,
        items: [
          {
            label: 'Dashboard da Empresa',
            section: IsoSection.CONTEXT_ANALYSIS,
            path: '/app/dashboard',
            icon: BarChart3
          }
        ]
      },
      {
        sectionNumber: 'EXEC.',
        sectionTitle: 'Auditar',
        icon: ClipboardCheck,
        items: [
          {
            label: 'Documentação (GED)',
            section: IsoSection.DOCUMENTS,
            path: '/app/documentos',
            icon: FileText
          },
          {
            label: 'Matriz de Riscos',
            section: IsoSection.RISK_MATRIX,
            path: '/app/matriz-riscos',
            icon: AlertTriangle
          },
          {
            label: 'Processos e Escopo',
            section: IsoSection.PROCESSES_SCOPE,
            path: '/app/processos-escopo',
            icon: Factory
          },
          {
            label: 'Não Conformidades e Ações',
            section: IsoSection.NON_CONFORMANCES,
            path: '/app/acoes-corretivas',
            icon: AlertOctagon
          },
          {
            label: 'Auditorias Internas',
            section: IsoSection.INTERNAL_AUDITS,
            path: '/app/auditorias',
            icon: CheckCircle2
          },
          {
            label: 'Auditorias Externas',
            section: IsoSection.EXTERNAL_AUDITS,
            path: '/app/auditorias-externas',
            icon: ShieldCheck
          }
        ]
      },
      {
        sectionNumber: 'FINAL',
        sectionTitle: 'Conclusão',
        icon: GraduationCap,
        items: [
          {
            label: 'Análise Crítica',
            section: IsoSection.MANAGEMENT_REVIEW,
            path: '/app/analise-critica',
            icon: FileBarChart
          }
        ]
      }
    ]
  }
];

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
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
      >
        <div className="pl-3 space-y-0.5 border-l-2 border-gray-100 dark:border-gray-800 ml-5">
          {children}
        </div>
      </div>
    </div>
  );
};

const NavigationItemComponent = ({ item, isActive }: { item: NavigationItem; isActive: boolean }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(item.path)}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
        ${isActive
          ? 'bg-[#3F858C] text-white shadow-sm font-medium'
          : 'text-gray-600 hover:text-[#025159] hover:bg-gray-50'
        }
      `}
    >
      <div className={`
        w-1.5 h-1.5 rounded-full transition-colors
        ${isActive ? 'bg-white' : 'bg-transparent group-hover:bg-[#67B7BF]'}
      `} />
      <span className="truncate">{item.label}</span>
      {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
    </button>
  );
};

// --- Main Sidebar Component ---

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const SidebarComponent: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['Visão Geral']);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const planLimits = usePlanLimits();
  const { canAccessModule } = planLimits;

  // Auditor Context
  const { isAuditorMode, targetCompany, exitAuditorMode } = useAuditor();
  const { auditorAssignments, company } = useAuthContext(); // Removed unused 'user'

  const isAuditorUser = auditorAssignments?.length > 0;

  // Determine which menu to show
  const displayedGroups = React.useMemo(() => {
    if (isAuditorUser) {
      if (isAuditorMode) {
        return auditorClientGroups;
      } else {
        return auditorPortalGroups;
      }
    }
    return menuGroups;
  }, [isAuditorUser, isAuditorMode]);

  // Effect to close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Effect to auto-expand groups
  useEffect(() => {
    const currentPath = location.pathname;

    displayedGroups.forEach(group => {
      group.sections.forEach(section => {
        const hasActiveItem = section.items.some(item => item.path === currentPath);
        if (hasActiveItem && !openGroups.includes(section.sectionTitle)) {
          setOpenGroups(prev => [...prev, section.sectionTitle]);
        }
      });
    });
  }, [location.pathname, displayedGroups]);

  const toggleGroup = React.useCallback((title: string) => {
    setOpenGroups(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  }, []);

  const collapseAll = React.useCallback(() => {
    setOpenGroups([]);
  }, []);

  const expandAll = React.useCallback(() => {
    const allTitles: string[] = [];
    displayedGroups.forEach(group => {
      group.sections.forEach(section => {
        allTitles.push(section.sectionTitle);
      });
    });
    setOpenGroups(allTitles);
  }, [displayedGroups]);

  const handleExitAuditorMode = React.useCallback(() => {
    exitAuditorMode();
    navigate('/app/portal-auditor');
  }, [exitAuditorMode, navigate]);

  const renderMenuItem = React.useCallback((item: NavigationItem) => {
    // Check if module is restricted by plan (Only for Company Owner, Auditor usually has unrestricted view or specific)
    const moduleKey = item.path?.split('/').pop() || '';
    const isRestricted = !isAuditorUser && !canAccessModule(moduleKey);

    const isAuditModule = item.section === IsoSection.INTERNAL_AUDITS;
    const isSupplierModule = item.section === IsoSection.SUPPLIER_MANAGEMENT;
    const needsUpgrade = isAuditModule || isSupplierModule;

    const isActive = location.pathname === item.path;

    const handleClick = () => {
      if (isRestricted && needsUpgrade && !isAuditorUser) {
        navigate('/app/configuracoes');
        return;
      }
      if (item.path) navigate(item.path);
    };

    return (
      <button
        key={item.label}
        onClick={handleClick}
        className={`
            w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
            ${isActive
            ? 'bg-[#025159]/10 text-[#025159] dark:bg-[#025159]/20'
            : 'text-gray-600 hover:text-[#025159] hover:bg-gray-50'
          }
          `}
      >
        <div className="flex items-center gap-3">
          {item.icon && <item.icon size={18} className={isActive ? 'text-[#025159]' : 'text-gray-400'} />}
          <span>{item.label}</span>
        </div>
        {isRestricted && needsUpgrade && !isAuditorUser && <Lock size={14} className="text-purple-500" />}
      </button>
    );
  }, [canAccessModule, isAuditorUser, location.pathname, navigate]);

  return (
    <>
      {/* Mobile Trigger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden"
      >
        <LayoutDashboard className="w-6 h-6 text-[#025159]" />
      </button>

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-72 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          {auditorAssignments?.length > 0 ? (
            <div className="w-full space-y-3">
              <CompanySwitcher fullWidth variant="sidebar" />
              {isAuditorMode && (
                <button
                  onClick={() => {
                    exitAuditorMode();
                    navigate('/app/auditor-portal');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors font-medium"
                >
                  <ArrowLeft size={16} />
                  Voltar aos Meus Projetos
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {company?.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-10 h-10 rounded-lg object-contain bg-gray-50 p-1"
                />
              ) : (
                <div className="p-2 bg-[#025159] rounded-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {company?.name || 'Isotek'}
                </h1>
                <p className="text-xs text-[#025159] truncate">
                  {company?.slogan || 'Gestão da Qualidade'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {displayedGroups.map((group, index) => (
            <div key={group.groupTitle} className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {group.groupTitle}
                </h3>
                {index === 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={expandAll}
                      className="p-1 text-gray-400 hover:text-[#025159] transition-colors rounded-md hover:bg-gray-100"
                      title="Expandir todas as seções"
                    >
                      <ChevronsUpDown size={14} />
                    </button>
                    <button
                      onClick={collapseAll}
                      className="p-1 text-gray-400 hover:text-[#025159] transition-colors rounded-md hover:bg-gray-100"
                      title="Recolher todas as seções"
                    >
                      <ChevronsDownUp size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {group.sections.map((section) => (
                  <SidebarGroup
                    key={section.sectionTitle}
                    title={section.sectionTitle}
                    sectionNumber={section.sectionNumber}
                    icon={section.icon}
                    isActive={section.items.some(item => location.pathname === item.path)}
                    isOpen={openGroups.includes(section.sectionTitle)}
                    onToggle={() => toggleGroup(section.sectionTitle)}
                  >
                    {section.items.map((item) => renderMenuItem(item))}
                  </SidebarGroup>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Settings Section (Only for Company Owner) */}
        {!isAuditorUser && (
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <h3 className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {settingsGroup.sectionTitle}
            </h3>
            <SidebarGroup
              title={settingsGroup.sectionTitle}
              icon={settingsGroup.icon}
              isOpen={openGroups.includes(settingsGroup.sectionTitle)}
              onToggle={() => toggleGroup(settingsGroup.sectionTitle)}
              isActive={settingsGroup.items.some(item => location.pathname === item.path)}
            >
              {settingsGroup.items.map(item => renderMenuItem(item))}
            </SidebarGroup>
          </div>
        )}

        {/* Footer/Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          {isAuditorUser ? (
            <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="p-2 bg-amber-50 rounded-lg">
                <UserCog className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Perfil Auditor</p>
                <p className="text-xs text-gray-500">Acesso Externo</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Plan Status */}
              <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Plano {planLimits.planId === 'enterprise' ? 'Empresa' : planLimits.planId === 'pro' ? 'Pro' : 'Start'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                    ATIVO
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Usuários</span>
                    <span>{planLimits.usage.usersUsed}/{planLimits.usage.usersLimit}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#025159] rounded-full"
                      style={{ width: `${Math.min((planLimits.usage.usersUsed / planLimits.usage.usersLimit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 p-2 text-sm text-gray-500 hover:text-[#025159] transition-colors">
                <HelpingHand className="w-4 h-4" />
                Precisa de ajuda?
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);