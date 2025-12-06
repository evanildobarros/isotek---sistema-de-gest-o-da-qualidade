# Isotek AI Assistant - Deploy Instructions

## 1. Configurar API Key do Gemini

Adicione a chave da API do Google Gemini nas variáveis de ambiente do Supabase:

```bash
# Via CLI
supabase secrets set GEMINI_API_KEY="sua-chave-aqui"

# Ou via Dashboard:
# Supabase Dashboard → Settings → Edge Functions → Secrets
```

## 2. Deploy da Edge Function

### Opção A: Via Supabase CLI

```bash
# Instalar CLI (se ainda não tiver)
npm install -g supabase

# Login
supabase login

# Link do projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy da função
supabase functions deploy ai-advisor
```

### Opção B: Via GitHub Actions (CI/CD)

Se você tiver CI/CD configurado, o deploy será automático ao fazer push.

## 3. Testar a Função

Após o deploy, você pode testar via curl:

```bash
curl -X POST 'https://SEU_PROJECT.supabase.co/functions/v1/ai-advisor' \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "O que é ISO 9001?", "context": "/app/dashboard"}'
```

## 4. Obter API Key do Gemini

1. Acesse: <https://makersuite.google.com/app/apikey>
2. Clique em "Create API Key"
3. Copie a chave gerada
4. Configure no Supabase (passo 1)

## Arquivos Criados

- `supabase/functions/ai-advisor/index.ts` - Edge Function com Gemini
- `components/common/AiChatWidget.tsx` - Widget de chat flutuante
- Modificado: `components/layout/DashboardLayout.tsx` - Integração do widget
