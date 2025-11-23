# Guia Completo - Configuração Supabase

## ✅ Arquivos Criados

1. **`.env`** - Variáveis de ambiente
2. **`lib/supabase.ts`** - Cliente Supabase
3. **`hooks/useAuth.ts`** - Hook de autenticação

## 📦 1. Instalação (Já feito)

```bash
npm install @supabase/supabase-js
```

## 🔑 2. Configurar Credenciais

### Passo 1: Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Aguarde a criação (1-2 minutos)

### Passo 2: Obter Credenciais
1. No Dashboard do Supabase, vá em **Settings → API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### Passo 3: Atualizar .env
Edite o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://sua-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### Passo 4: Reiniciar Servidor
```bash
npm run dev
```

## 🎯 3. Como Usar

### Usando o Hook useAuth

```typescript
import { useAuth } from '../hooks/useAuth';

function MeuComponente() {
  const { user, isAuthenticated, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <div>Você não está logado</div>;
  }

  return (
    <div>
      <h1>Bem-vindo, {user?.email}</h1>
      <button onClick={signOut}>Sair</button>
    </div>
  );
}
```

### Exemplo: Tela de Login

```typescript
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(email, password);
    
    if (result.success) {
      alert('Login realizado!');
    } else {
      alert(`Erro: ${result.error?.message}`);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
      />
      <button type="submit">Entrar</button>
    </form>
  );
};
```

### Exemplo: Cadastro de Usuário

```typescript
const { signUp } = useAuth();

const handleRegister = async () => {
  const result = await signUp('user@example.com', 'senha123');
  
  if (result.success) {
    alert('Cadastro realizado! Verifique seu e-mail.');
  }
};
```

### Exemplo: Acessar Dados do Usuário

```typescript
const { user, session } = useAuth();

console.log('ID do usuário:', user?.id);
console.log('E-mail:', user?.email);
console.log('Token:', session?.access_token);
```

## 🛡️ 4. Proteção de Rotas

Atualize o `ProtectedRoute.tsx` para usar o hook:

```typescript
import { useAuth } from '../hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```

## 🗄️ 5. Acessar Banco de Dados

```typescript
import { supabase } from '../lib/supabase';

// SELECT
const { data, error } = await supabase
  .from('tabela')
  .select('*');

// INSERT
const { data, error } = await supabase
  .from('tabela')
  .insert({ coluna: 'valor' });

// UPDATE
const { data, error } = await supabase
  .from('tabela')
  .update({ coluna: 'novo_valor' })
  .eq('id', 123);

// DELETE
const { data, error } = await supabase
  .from('tabela')
  .delete()
  .eq('id', 123);
```

## ⚠️ 6. Verificação de Erros

O cliente Supabase agora mostra alertas automáticos no console se:
- ✅ Credenciais não estão configuradas
- ✅ Arquivo .env está ausente
- ✅ Chaves são inválidas

### Console em Dev Mode:
```
✅ Supabase configurado corretamente
```

Ou:

```
⚠️ Supabase em modo offline (sem persistência de dados)
```

## 📝 7. Checklist de Configuração

- [ ] Criar projeto no Supabase
- [ ] Copiar URL e Anon Key
- [ ] Atualizar arquivo `.env`
- [ ] Reiniciar servidor (`npm run dev`)
- [ ] Verificar console (deve mostrar ✅)
- [ ] Testar login/cadastro

## 🔐 8. Segurança

### ✅ Boas Práticas
- Nunca commite o arquivo `.env` ao Git
- Use apenas a chave `anon` (pública)
- A `service_role` key fica SOMENTE no backend

### ❌ Não Fazer
- Não exponha credenciais no código
- Não use váriaveis hardcoded
- Não faça commit de `.env`

## 📚 Recursos Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Database Reference](https://supabase.com/docs/reference/javascript/select)
