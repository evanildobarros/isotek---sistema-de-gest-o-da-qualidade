-- Script para confirmar manualmente usuários que não confirmaram o email
-- Execute este script no SQL Editor do Supabase para confirmar usuários pendentes

-- 1. Ver todos os usuários e seu status de confirmação
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'NÃO CONFIRMADO'
        ELSE 'CONFIRMADO'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- 2. Confirmar TODOS os usuários que ainda não foram confirmados
-- ATENÇÃO: Descomente a linha abaixo para executar
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 3. Confirmar um usuário específico pelo email (exemplo: alda@isotek.com.br)
-- ATENÇÃO: Substitua o email e descomente para executar
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'alda@isotek.com.br';

-- 4. Verificar se a confirmação funcionou
-- SELECT email, email_confirmed_at FROM auth.users WHERE email = 'alda@isotek.com.br';
