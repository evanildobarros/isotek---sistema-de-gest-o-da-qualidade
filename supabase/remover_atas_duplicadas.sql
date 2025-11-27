-- Script para remover atas duplicadas criadas por erro
-- Execute no SQL Editor do Supabase

-- OPÇÃO 1: Remover todas as atas com status 'draft' (rascunho)
-- Isso é seguro pois as atas completas têm status 'concluded'
DELETE FROM public.management_reviews
WHERE status = 'draft';

-- OPÇÃO 2: Se você quiser ser mais específico, veja primeiro quais atas existem:
-- (Execute este SELECT primeiro para verificar)
/*
SELECT 
    id,
    date,
    period_analyzed,
    status,
    created_at
FROM public.management_reviews
ORDER BY created_at ASC;
*/

-- OPÇÃO 3: Remover apenas as 2 primeiras atas criadas (as mais antigas)
-- (Descomente as linhas abaixo se preferir esta opção)
/*
DELETE FROM public.management_reviews
WHERE id IN (
    SELECT id 
    FROM public.management_reviews
    ORDER BY created_at ASC
    LIMIT 2
);
*/

-- OPÇÃO 4: Remover atas específicas por ID
-- Substitua 'ID_AQUI_1' e 'ID_AQUI_2' pelos IDs reais
/*
DELETE FROM public.management_reviews
WHERE id IN ('ID_AQUI_1', 'ID_AQUI_2');
*/

-- Após executar, verifique o resultado:
SELECT COUNT(*) as total_atas FROM public.management_reviews;
