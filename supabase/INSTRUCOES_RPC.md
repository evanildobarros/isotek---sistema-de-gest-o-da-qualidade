# Instruções para Aplicar a Função RPC no Supabase

## Objetivo

Criar uma função RPC que retorna os usuários com seus emails da tabela `auth.users`.

## Passos

### 1. Acessar o Supabase Dashboard

- Acesse <https://supabase.com>
- Faça login na sua conta
- Selecione o projeto do Isotek

### 2. Abrir o SQL Editor

- No menu lateral, clique em **SQL Editor**
- Clique em **New Query**

### 3. Executar o Script SQL

Copie e cole o seguinte código SQL:

```sql
-- Função RPC para buscar usuários com seus emails
-- Esta função retorna os perfis dos usuários junto com seus emails da tabela auth.users

CREATE OR REPLACE FUNCTION get_users_with_emails(p_company_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  company_id uuid,
  company_name text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.full_name,
    p.role,
    p.created_at,
    au.last_sign_in_at,
    p.company_id,
    ci.name as company_name
  FROM profiles p
  INNER JOIN auth.users au ON au.id = p.id
  LEFT JOIN company_info ci ON ci.id = p.company_id
  WHERE p.company_id = p_company_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_users_with_emails(uuid) TO authenticated;
```

### 4. Executar

- Clique no botão **Run** (ou pressione Ctrl+Enter)
- Aguarde a confirmação de sucesso

### 5. Verificar

- Recarregue a página de Gerenciamento de Usuários no aplicativo
- O email dos usuários agora deve aparecer abaixo do nome

## O que esta função faz?

- **Busca perfis** da tabela `profiles`
- **Faz JOIN** com `auth.users` para obter o email
- **Faz JOIN** com `company_info` para obter o nome da empresa
- **Filtra** apenas usuários da empresa especificada
- **Retorna** todos os dados necessários em uma única chamada

## Arquivo SQL

O script também está disponível em:
[get_users_with_emails.sql](file:///home/evanildobarros/Projetos/isotek---sistema-de-gestão-da-qualidade/supabase/get_users_with_emails.sql)
