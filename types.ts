import React from 'react';

export enum IsoSection {
  // Grupo A: Estratégia (Plan)
  // 4.0 Contexto da Organização
  CONTEXT_ANALYSIS = 'Análise de Contexto',
  STAKEHOLDERS = 'Partes Interessadas',
  PROCESSES_SCOPE = 'Processos e Escopo',

  // 5.0 Liderança
  QUALITY_POLICY = 'Política da Qualidade',
  RESPONSIBILITIES = 'Responsabilidades',

  // 6.0 Planejamento
  RISK_MATRIX = 'Matriz de Riscos',
  QUALITY_OBJECTIVES = 'Objetivos da Qualidade',

  // Grupo B: Execução (Do)
  // 7.0 Apoio
  DOCUMENTS = 'Gestão de Documentos (GED)',
  COMPETENCIES_TRAINING = 'Competências e Treinamentos',

  // 8.0 Operação
  COMMERCIAL_REQUIREMENTS = 'Comercial e Requisitos',
  SUPPLIER_MANAGEMENT = 'Gestão de Fornecedores (PROCEM)',
  PRODUCTION_CONTROL = 'Controle de Produção',
  NON_CONFORMING_OUTPUTS = 'Saídas Não Conformes',

  // Grupo C: Checagem (Check/Act)
  // 9.0 Avaliação
  PERFORMANCE_INDICATORS = 'Indicadores de Desempenho',
  INTERNAL_AUDITS = 'Auditorias Internas',
  MANAGEMENT_REVIEW = 'Análise Crítica',

  // 10.0 Melhoria
  NON_CONFORMANCES = 'Não Conformidades (RNC)',
  CORRECTIVE_ACTIONS = 'Ações Corretivas',

  // Configurações
  SETTINGS = 'Configurações',
  SETTINGS_USERS = 'Usuários',
  SETTINGS_SYSTEM = 'Sistema',
  UNITS = 'Minhas Unidades',
  COMPANY_PROFILE = 'Perfil da Empresa',

  // Legacy mappings (to avoid breaking existing code temporarily)
  DASHBOARD = 'Painel de Controle',
  CONTEXT_SWOT = 'Contexto (SWOT)',
  CONTEXT_OPPORTUNITIES = 'Oportunidades',
  CONTEXT_SYSTEM_INFRASTRUCTURE = 'Sistema (Infraestrutura)',
  PLANNING_SWOT = 'Contexto (SWOT)',
  PLANNING_OPPORTUNITIES = 'Oportunidades',
  ADMINISTRATIVE_MANAGEMENT = 'Gestão Administrativa',
  EMPLOYEES = 'Colaboradores',
  TRAININGS = 'Treinamentos',
  SYSTEM_RESOURCES = 'Sistema (Recursos)',
  USERS = 'Usuários',
  OPERATION_CONTROL = 'Operação e Controle',
  REPORTS = 'Relatórios',
  KPIS = 'Indicadores (KPIs)',
  AUDITS = 'Auditorias',
  QUALITY_MANAGEMENT = 'Gestão da Qualidade'
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

export interface Unit {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  is_headquarters: boolean;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  created_at?: string;
}

export interface QualityManual {
  id: string;
  company_id: string;
  scope: string;
  applies_to_all_units: boolean;
  excluded_units?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Process {
  id: string;
  company_id: string;
  name: string;
  owner: string;
  inputs: string;
  outputs: string;
  resources: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  company_id: string;
  unit_id?: string;
  is_super_admin?: boolean;
}

export interface Stakeholder {
  id: string;
  company_id: string;
  name: string;
  type: string; // 'Cliente', 'Fornecedor', 'Governo', 'Colaborador', 'Sociedade', etc.
  needs: string;
  expectations: string;
  monitor_frequency: string;
  created_at?: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  slogan?: string;
  owner_id?: string;
  created_at?: string;
  // New fields for Super Admin
  status?: 'active' | 'blocked' | 'inactive';
  plan?: 'start' | 'pro' | 'enterprise';
  cnpj?: string;
  monthly_revenue?: number;
  owner_name?: string;
  owner_email?: string;
}