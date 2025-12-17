-- Migração para corrigir alertas de segurança do Supabase Linter

-- 1. Habilitar RLS na tabela public.manual_attachments
ALTER TABLE public.manual_attachments ENABLE ROW LEVEL SECURITY;

-- 2. Alterar Views para security_invoker (respeitar RLS do usuário)
-- Isso garante que as views não ignorem as políticas de segurança das tabelas base.

ALTER VIEW public.production_orders_with_details SET (security_invoker = true);
ALTER VIEW public.documents_with_responsibles SET (security_invoker = true);
ALTER VIEW public.policy_versions_with_creator SET (security_invoker = true);
ALTER VIEW public.audit_findings_summary SET (security_invoker = true);
ALTER VIEW public.employee_trainings_with_status SET (security_invoker = true);
ALTER VIEW public.supplier_evaluations_with_details SET (security_invoker = true);
ALTER VIEW public.sales_orders_with_reviewer SET (security_invoker = true);
ALTER VIEW public.risk_tasks_with_responsible SET (security_invoker = true);
ALTER VIEW public.non_conformities_with_responsible SET (security_invoker = true);

-- Nota: Certifique-se de que os usuários possuem permissões RLS apropriadas nas tabelas subjacentes
-- para continuar visualizando os dados através dessas views.
