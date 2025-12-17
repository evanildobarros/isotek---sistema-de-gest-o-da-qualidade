-- =============================================================================
-- MIGRAÇÃO: Corrigir Status e RLS de Auditoria
-- Descrição: Alinha os status do banco com o frontend (PT-BR) e corrige a função RLS
-- =============================================================================

-- 1. Remover constraint antiga se existir e adicionar nova com valores em PT-BR
alter table audit_assignments drop constraint if exists audit_assignments_status_check;

alter table audit_assignments 
  add constraint audit_assignments_status_check 
  check (status in ('agendada', 'em_andamento', 'concluida', 'cancelada'));

-- 2. Atualizar função helper para considerar status 'agendada' e 'em_andamento' como ativos
create or replace function is_active_auditor_for_company(target_company_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from audit_assignments aa
    where aa.auditor_id = auth.uid()
    and aa.company_id = target_company_id
    and aa.status in ('agendada', 'em_andamento') -- Permite acesso antes e durante
    and (aa.end_date is null or aa.end_date >= current_date) -- Data limite (se houver)
    -- Remover filtro de start_date para permitir que vejam empresas de auditorias futuras?
    -- Se quiser restringir apenas a partir da data de início:
    -- and aa.start_date <= current_date 
  );
end;
$$ language plpgsql security definer stable;

-- 3. Garantir que a função pode ser executada
grant execute on function is_active_auditor_for_company(uuid) to authenticated;
