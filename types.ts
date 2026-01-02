import React from 'react';
import { PLANS as PLANS_CONST } from './lib/constants';

export enum IsoSection {
  // Grupo A: Estratégia (Plan)
  // 4.0 Contexto da Organização
  CONTEXT_ANALYSIS = 'Análise de Contexto',
  STAKEHOLDERS = 'Partes Interessadas',
  PROCESSES_SCOPE = 'Processos e Escopo',
  STRATEGIC_DEFINITION = 'Identidade Corporativa',

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
  EXTERNAL_AUDITS = 'Auditorias Externas',
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
  USER_PROFILE = 'Meu Perfil',
  SUPPORT = 'Suporte',
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
  // Redes Sociais
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  // Campos de Gamificação
  gamification_xp?: number;
  gamification_level?: GamificationLevel;
  reputation_score?: number;
  audits_completed?: number;
  commission_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  custom_commission_rate?: number;
}

// ===========================================
// GAMIFICAÇÃO DE AUDITORES
// ===========================================

export type GamificationLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type BadgeCategory = 'achievement' | 'milestone' | 'special';

export interface Badge {
  id: string;                  // Slug único (ex: 'speedster')
  name: string;                // Nome exibido
  description?: string;        // Descrição da conquista
  icon_name: string;           // Nome do ícone Lucide (ex: 'Zap')
  color: string;               // Classe Tailwind (ex: 'text-yellow-500')
  category: BadgeCategory;     // Categoria do badge
  xp_reward: number;           // XP concedido ao ganhar
  created_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  awarded_reason?: string;
  // Joined field
  badge?: Badge;
}

export interface AuditorGamificationStats {
  xp: number;
  level: GamificationLevel;
  reputation: number;
  audits_completed: number;
  badges: UserBadge[];
  next_level_xp: number;      // XP necessário para próximo nível
  progress_percent: number;    // Progresso até próximo nível (0-100)
}

// ===========================================
// LÓGICA FINANCEIRA DE NÍVEIS
// ===========================================

export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

export interface AuditorLevel {
  level_id: GamificationLevel;
  name: string;
  min_xp: number;
  commission_rate: number;     // 0.70 = 70%
  allowed_plans: string[];     // ['start', 'pro', 'enterprise']
  max_simultaneous_audits: number;
  priority_support: boolean;
  badge_icon: string;
  badge_color: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditAssignmentFinancials {
  agreed_amount: number;           // Valor total acordado
  auditor_commission_rate: number; // Taxa no momento da contratação
  auditor_payout: number;          // Quanto auditor recebe
  platform_fee: number;            // Quanto Isotek recebe
  payment_status: PaymentStatus;
  paid_at?: string;
}

export interface AuditorFinancialSummary {
  auditor_id: string;
  auditor_name: string;
  gamification_xp: number;
  gamification_level: GamificationLevel;
  audits_completed: number;
  total_earnings: number;
  open_audits: number;
}

export interface XpLedgerEntry {
  id: string;
  user_id: string;
  action_type: 'audit_completed' | 'five_star_review' | 'fast_validation' | 'penalty' | 'manual_adjustment';
  xp_amount: number;
  reference_id?: string;
  reason?: string;
  created_at: string;
}

export interface AuditReview {
  id: string;
  audit_id: string;
  reviewer_id?: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
  metadata?: Record<string, any>;
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

// Subscription types
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';
export type PlanId = 'start' | 'pro' | 'enterprise';

export interface PlanLimits {
  users: number;
  storage_gb: number;
  ai_prompts: number;
  has_marketplace: boolean;
  has_risk_matrix: boolean;
  hasAdvancedReports?: boolean;
  hasApiAccess?: boolean;
  hasPrioritySupport?: boolean;
}

export const PLANS = PLANS_CONST;

export interface Plan {
  id: PlanId;
  label: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  limits: PlanLimits;
  isPopular?: boolean;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  slogan?: string;
  owner_id?: string;
  created_at?: string;
  // Super Admin fields
  status?: 'active' | 'blocked' | 'inactive';
  plan?: 'start' | 'pro' | 'enterprise';
  cnpj?: string;
  monthly_revenue?: number;
  owner_name?: string;
  owner_email?: string;
  email?: string;
  phone?: string;
  address?: string;
  // Subscription fields
  subscription_status?: SubscriptionStatus;
  plan_id?: PlanId;
  current_period_end?: string;
  max_users?: number;
  max_storage_gb?: number;
  // Billing fields
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  payment_method_brand?: string;
  payment_method_last4?: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  stripe_invoice_id?: string;
  amount: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoice_pdf_url?: string;
  created_at: string;
}

export interface Employee {
  id: string;
  company_id: string;
  name: string;
  job_title: string;
  department?: string;
  admission_date: string;
  status: 'active' | 'inactive';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeTraining {
  id: string;
  employee_id: string;
  training_name: string;
  date_completed: string;
  expiration_date?: string;
  certificate_url?: string;
  notes?: string;
  status?: 'completed' | 'pending' | 'expired' | 'expiring_soon';
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  category: string;
  status: 'homologado' | 'em_analise' | 'bloqueado';
  iqf_score: number;
  last_evaluation?: string;
  blocked_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierEvaluation {
  id: string;
  supplier_id: string;
  evaluator_id: string;
  evaluation_date: string;
  criteria_quality: number; // 0-10
  criteria_deadline: number; // 0-10
  criteria_communication: number; // 0-10
  final_score: number; // Calculated average
  comments?: string;
  created_at?: string;

  // Joined fields from view
  supplier_name?: string;
  supplier_category?: string;
  evaluator_name?: string;
}

export interface NonConformityProduct {
  id: string;
  company_id: string;
  description: string;
  date_occurred: string;
  origin: 'Produção' | 'Fornecedor' | 'Cliente/Reclamação';
  severity: 'Baixa' | 'Média' | 'Crítica';
  status: 'open' | 'analyzing' | 'resolved';
  disposition?: 'Retrabalho' | 'Refugo' | 'Concessão/Aceite' | 'Devolução';
  quantity_affected?: number;
  photo_url?: string;
  responsible_id?: string;
  disposition_justification?: string;
  authorized_by?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  responsible_name?: string;
}

export interface SalesOrder {
  id: string;
  company_id: string;
  code: string; // Número do pedido/contrato
  client_name: string;
  description: string; // Produto/serviço vendido
  delivery_deadline: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'delivered';
  review_notes?: string;

  // Checklist da análise crítica (ISO 8.2.3)
  requirements_defined?: boolean;
  has_capacity?: boolean;
  risks_considered?: boolean;

  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  reviewer_name?: string;
}

export interface ProductionOrder {
  id: string;
  company_id: string;
  code: string; // Número da OP/OS
  sales_order_id?: string; // FK opcional para sales_orders
  product_service: string; // O que está sendo produzido/executado
  status: 'scheduled' | 'in_progress' | 'quality_check' | 'completed';
  start_date?: string;
  end_date?: string;
  batch_number?: string; // Rastreabilidade (Lote/Série)
  work_instructions?: string; // Instruções documentadas
  notes?: string; // Registros de execução
  current_stage?: string; // Etapa atual
  created_at?: string;
  updated_at?: string;

  // Joined fields
  sales_order_code?: string;
  client_name?: string;
}

export interface CorrectiveAction {
  id: string;
  company_id: string;
  code: string; // RNC-2024-01
  origin: string; // Auditoria, Reclamação Cliente, Indicador
  description: string; // O problema
  root_cause?: string; // Análise 5 Porquês / Ishikawa
  immediate_action?: string; // Ação imediata
  deadline: string;
  responsible_id: string;
  status: 'open' | 'root_cause_analysis' | 'implementation' | 'effectiveness_check' | 'closed';
  effectiveness_verified?: boolean; // Problem voltou a ocorrer?
  effectiveness_notes?: string; // Parecer do gestor
  created_at?: string;
  updated_at?: string;

  // Joined fields
  responsible_name?: string;
  tasks?: CorrectiveActionTask[];
}

export interface CorrectiveActionTask {
  id: string;
  corrective_action_id: string;
  description: string; // O que fazer
  responsible_id: string; // Quem
  due_date: string; // Quando
  completed: boolean;
  completed_at?: string;
  created_at?: string;

  // Joined
  responsible_name?: string;
}

export interface QualityObjective {
  id: string;
  company_id: string;
  name: string;
  target_value: number;
  metric_name: string;
  frequency?: string;
  deadline: string;
  status?: 'pending' | 'on_track' | 'at_risk' | 'completed';
  process_id?: string | null;
  current_value?: number;
  action_plan?: string;
  created_at?: string;
  // Joined fields
  process?: { name: string };
}

export interface KpiMeasurement {
  id: string;
  company_id: string;
  objective_id: string;
  date: string;
  value: number;
  notes?: string;
  created_at?: string;
}

export interface CustomerSurvey {
  id: string;
  company_id: string;
  date: string;
  client_name: string;
  score: number;
  feedback?: string;
  created_at?: string;
}

export interface ManagementReview {
  id: string;
  company_id: string;
  date: string;
  period_analyzed: string;
  participants: string;
  inputs_json: {
    previous_actions: string;
    context_changes: string;
    customer_satisfaction: string;
    supplier_performance: string;
    audit_results: string;
    process_performance: string;
  };
  outputs_decisions: string;
  status: 'draft' | 'concluded';
  created_at?: string;
  updated_at?: string;
}

export interface Audit {
  id: string;
  company_id: string;
  scope: string; // Escopo da auditoria (ex: "Vendas e Marketing", "Produção")
  type: string; // 'Auditoria Interna', 'Auditoria de Processo', 'Auditoria Externa'
  auditor: string; // Nome do auditor responsável
  date: string; // Data planejada/realizada (formato YYYY-MM-DD)
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Atrasada';
  progress: number; // 0-100
  notes?: string; // Notas/observações adicionais
  // Campos ISO 19011 (Auditoria 2.0)
  objectives?: string; // Objetivos da auditoria
  criteria?: string; // Critérios de auditoria (normas, documentos de referência)
  audit_type?: 'internal' | 'supplier' | 'certification' | 'process' | 'product';
  template_id?: string; // Template de checklist vinculado
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Tipos do Sistema de Checklist de Auditoria (Auditoria 2.0)
// ============================================================================

export interface AuditChecklistTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category?: string; // Ex: "ISO 9001", "ISO 14001", "5S"
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditChecklistItem {
  id: string;
  template_id: string;
  question: string;
  help_text?: string; // Dicas para o auditor
  category?: string; // Agrupamento (ex: "Liderança", "Operação")
  iso_clause?: string; // Referência ISO (ex: "7.1.4")
  order_index: number;
  is_required: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AuditResponseStatus = 'compliant' | 'non_compliant' | 'not_applicable' | 'pending';

export interface AuditChecklistResponse {
  id: string;
  audit_id: string;
  item_id: string;
  status: AuditResponseStatus;
  evidence_text?: string; // Obrigatório se non_compliant
  evidence_url?: string; // URL do arquivo de evidência
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
  // Campos joined (para exibição)
  item?: AuditChecklistItem;
}

export interface RiskTask {
  id: string;
  risk_id: string;
  description: string;
  responsible_id?: string;
  deadline?: string;
  status: 'pending' | 'completed';
  created_at?: string;

  // Joined fields
  responsible_name?: string;
}

export interface PolicyVersion {
  id: string;
  company_id: string;
  content: string;
  version: string;
  approval_date?: string;
  created_by?: string;
  created_at: string;

  // Joined fields
  created_by_name?: string;
}

// Notification Types
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: string;
  company_id: string;
  recipient_id?: string;
  title: string;
  message?: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  created_at: string;
}

// Audit Assignment Types (External Auditor)
export type AuditAssignmentStatus = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';

export interface AuditAssignment {
  id: string;
  auditor_id: string;
  company_id: string;
  template_id?: string | null;
  progress?: number;
  start_date: string;
  end_date?: string | null;
  status: AuditAssignmentStatus;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  auditor_name?: string;
  auditor_email?: string;
  company_name?: string;
}

// Audit Findings Types (Constatações de Auditoria)
export type AuditFindingEntityType =
  | 'document'
  | 'risk'
  | 'rnc'
  | 'supplier'
  | 'process'
  | 'objective'
  | 'training'
  | 'audit'
  | 'general';

export type AuditFindingSeverity =
  | 'conforme'
  | 'oportunidade'
  | 'nao_conformidade_menor'
  | 'nao_conformidade_maior';

export type AuditFindingWorkflowStatus =
  | 'open'           // Auditor criou a constatação
  | 'waiting_validation' // Empresa respondeu, aguardando validação
  | 'closed';        // Auditor aceitou a resposta

export interface AuditFinding {
  id: string;
  audit_assignment_id: string;
  entity_type: AuditFindingEntityType;
  entity_id?: string | null;

  // Severidade da constatação
  severity: AuditFindingSeverity;

  // Notas do auditor
  auditor_notes: string;

  // Resposta da empresa
  company_response?: string | null;

  // Status do fluxo de trabalho
  status: AuditFindingWorkflowStatus;

  // Cláusula ISO relacionada (opcional)
  iso_clause?: string;

  created_at?: string;
  updated_at?: string;

  // Joined fields
  entity_name?: string; // Nome do documento, risco, etc.
}

// Audit Findings Summary (View)
export interface AuditFindingsSummary {
  audit_assignment_id: string;
  company_id: string;
  auditor_id: string;
  audit_status: AuditAssignmentStatus;
  total_findings: number;
  // Por severidade
  conformes: number;
  nao_conformes_maiores: number;
  nao_conformes_menores: number;
  oportunidades: number;
  // Por status do workflow
  pendentes: number;
  aguardando_validacao: number;
  resolvidas: number;
}

export interface AuditContextInfo {
  clause: string;
  title: string;
  description?: string;
}
