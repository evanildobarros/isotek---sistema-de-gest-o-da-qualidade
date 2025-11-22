import React from 'react';

export enum IsoSection {
  // Main
  DASHBOARD = 'Dashboard',

  // Gestão da Qualidade
  DOCUMENTS = 'Documentos (GED)',
  NON_CONFORMANCES = 'Não Conformidades',
  CORRECTIVE_ACTIONS = 'Ações Corretivas',
  AUDITS = 'Auditorias',

  // Gestão de Riscos
  RISK_MATRIX = 'Matriz de Riscos',
  OPPORTUNITIES = 'Oportunidades',

  // Gestão Administrativa
  EMPLOYEES = 'Colaboradores',
  TRAININGS = 'Treinamentos',

  // Relatórios
  KPIS = 'Indicadores',
  MANAGEMENT_REVIEW = 'Análise Crítica',

  // Configurações
  USERS = 'Usuários',
  SYSTEM = 'Sistema',

  // Legacy (Keep for compatibility during refactor, will be removed or remapped)
  CONTEXTO = '4. Contexto da Organização',
  LIDERANCA = '5. Liderança',
  PLANEJAMENTO = '6. Planejamento',
  APOIO = '7. Apoio (GED)',
  OPERACAO = '8. Operação',
  AVALIACAO = '9. Avaliação de Desempenho',
  MELHORIA = '10. Melhoria'
}

export interface NavigationItem {
  label: string;
  icon?: React.ElementType;
  section?: IsoSection;
  path?: string;
  children?: NavigationItem[];
  isOpen?: boolean; // For UI state
}

export interface SwotItem {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  content: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface NonConformance {
  id: string;
  code: string;
  description: string;
  source: string; // e.g., Audit, Client Complaint
  status: 'Open' | 'Analysis' | 'Implementation' | 'Closed';
  dateOpened: string;
  severity: 'Critical' | 'Major' | 'Minor';
}

export interface KpiMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}