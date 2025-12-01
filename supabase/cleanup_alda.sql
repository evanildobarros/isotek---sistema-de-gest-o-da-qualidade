-- Script para limpar todos os dados da Dra. Alda e começar do zero

-- 1. Apaga a empresa (se existir)
DELETE FROM public.company_info
WHERE owner_id IN (SELECT id FROM auth.users WHERE email = 'dra.aldanorrara@hotmail.com');

-- 2. Apaga o perfil
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM auth.users WHERE email = 'dra.aldanorrara@hotmail.com');

-- 3. Apaga o usuário de autenticação
DELETE FROM auth.users
WHERE email = 'dra.aldanorrara@hotmail.com';

-- 4. Limpa perfis órfãos (sem usuário correspondente)
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- 5. Limpa empresas órfãs (sem owner válido)
DELETE FROM public.company_info
WHERE owner_id IS NOT NULL 
AND owner_id NOT IN (SELECT id FROM auth.users);

-- Verificação: mostra o que sobrou
SELECT 'Usuários restantes:' as status, email FROM auth.users WHERE email LIKE '%alda%'
UNION ALL
SELECT 'Perfis restantes:', full_name FROM public.profiles WHERE full_name LIKE '%Alda%'
UNION ALL
SELECT 'Empresas restantes:', name FROM public.company_info WHERE name LIKE '%Alda%' OR name LIKE '%Norrara%';
