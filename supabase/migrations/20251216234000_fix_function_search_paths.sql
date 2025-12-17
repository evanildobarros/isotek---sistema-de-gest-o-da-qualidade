-- Migração para corrigir alertas de Function Search Path Mutable - Versão Segura
-- Apenas funções confirmadas ou padrão (triggers) estão ativas.

-- 1. Funções Confirmadas (Encontradas no código fonte)
ALTER FUNCTION public.get_user_company_id() SET search_path = public;
ALTER FUNCTION public.is_active_auditor_for_company(uuid) SET search_path = public;
ALTER FUNCTION public.is_current_user_super_admin() SET search_path = public;
ALTER FUNCTION public.get_users_with_emails() SET search_path = public; -- Confirmed signature implied by creation

-- 2. Triggers e Funções de Helper Padrão (Sem argumentos)
-- Estas funções geralmente retorna trigger e não aceitam argumentos na chamada ALTER
ALTER FUNCTION public.update_audit_assignments_updated_at() SET search_path = public;
ALTER FUNCTION public.update_audits_updated_at() SET search_path = public;
ALTER FUNCTION public.update_non_conformities_updated_at() SET search_path = public;
ALTER FUNCTION public.update_corrective_actions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_employees_updated_at() SET search_path = public;
ALTER FUNCTION public.update_audit_findings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_employee_trainings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_sales_orders_updated_at() SET search_path = public;
ALTER FUNCTION public.update_suppliers_updated_at() SET search_path = public;
ALTER FUNCTION public.update_management_reviews_updated_at() SET search_path = public;
ALTER FUNCTION public.update_production_orders_updated_at() SET search_path = public;
ALTER FUNCTION public.update_supplier_iqf() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.create_action_timeline_on_create() SET search_path = public;
ALTER FUNCTION public.create_timeline_on_status_change() SET search_path = public;

-- 3. Funções "Missing" ou "Legacy" (Comentadas para evitar erro 42883)
-- Verificar assinatura manual no Dashboard se necessário
-- ALTER FUNCTION public.delete_company(uuid) SET search_path = public;
-- ALTER FUNCTION public.delete_company_users(uuid) SET search_path = public;
-- ALTER FUNCTION public.generate_next_rnc_code(uuid) SET search_path = public;
-- ALTER FUNCTION public.get_dashboard_metrics(uuid) SET search_path = public;
-- ALTER FUNCTION public.get_all_companies() SET search_path = public;
-- ALTER FUNCTION public.create_client_company(text, text, text, text, text) SET search_path = public;
-- ALTER FUNCTION public.handle_new_user() SET search_path = public;
-- ALTER FUNCTION public.get_my_company_id() SET search_path = public;
