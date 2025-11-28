# Integração do Módulo de Auditorias - Instruções

## ✅ Arquivos Criados/Modificados

1. **Migration SQL**: `supabase/migrations/create_audits_table.sql`
2. **Tipo TypeScript**: Adicionado `Audit` interface em `types.ts`
3. **Componente**: `AuditsPage.tsx` atualizado com integração Supabase

## 📋 Próximos Passos

### 1. Executar a Migration no Supabase

Você precisa executar o SQL no painel do Supabase:

**Opção A: Via Supabase Dashboard**

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo de `supabase/migrations/create_audits_table.sql`
5. Clique em **Run**

**Opção B: Via Supabase CLI** (se você tiver configurado)

```bash
# Se você usar Supabase CLI localmente
supabase db push
```

**Opção C: Via psql com variável de ambiente**

```bash
# Defina sua connection string do Supabase
export DATABASE_URL="postgresql://postgres:[SUA-SENHA]@[SEU-PROJETO].supabase.co:5432/postgres"

# Execute a migration
psql $DATABASE_URL -f supabase/migrations/create_audits_table.sql
```

### 2. Verificar a Tabela

Após executar, verifique se a tabela foi criada:

```sql
SELECT * FROM audits LIMIT 1;
```

### 3. Testar a Aplicação

1. Navegue até a página de **Auditorias** no app
2. Clique em "Nova Auditoria"
3. Preencha os dados e salve
4. Verifique se a auditoria aparece na lista

## 🔒 Políticas RLS Implementadas

As seguintes políticas foram configuradas:

- ✅ **SELECT**: Usuários veem apenas auditorias de sua empresa
- ✅ **INSERT**: Usuários podem criar auditorias apenas para sua empresa
- ✅ **UPDATE**: Usuários podem atualizar auditorias de sua empresa
- ✅ **DELETE**: Usuários podem deletar auditorias de sua empresa

## 📊 Estrutura da Tabela

```sql
Table: audits
├── id (uuid, PK)
├── company_id (uuid, FK → company_info)
├── scope (text)
├── type (text)
├── auditor (text)
├── date (date)
├── status (text) ['Agendada', 'Em Andamento', 'Concluída', 'Atrasada']
├── progress (integer 0-100)
├── notes (text, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

## 🎯 Funcionalidades Implementadas

- ✅ **CREATE**: Criar novas auditorias
- ✅ **READ**: Listar todas as auditorias da empresa
- ✅ **UPDATE**: Editar auditorias existentes
- ✅ **DELETE**: Excluir auditorias
- ✅ **Stats**: Cards com contadores por status
- ✅ **Empty State**: Mensagem quando não há auditorias
- ✅ **Loading State**: Indicador de carregamento
- ✅ **Modal Rico**: Formulário completo com todos os campos
- ✅ **Validação**: Tipos TypeScript garantem integridade

## 🔍 Observações

- O campo `notes` foi adicionado para observações adicionais
- A migration inclui triggers para atualizar automaticamente `updated_at`
- Índices foram criados para melhor performance de queries
- O componente usa `useAuthContext` para acessar a empresa do usuário logado
