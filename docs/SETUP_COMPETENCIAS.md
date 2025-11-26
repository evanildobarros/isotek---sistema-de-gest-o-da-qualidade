# 🎓 Instruções para Ativar o Módulo "Competências e Treinamentos"

## ✅ O que já está pronto

Todo o código foi implementado! Agora você só precisa configurar o banco de dados.

## 📝 Passos para Configuração (5 minutos)

### Passo 1: Criar Tabela de Colaboradores

No **Supabase Dashboard** → **SQL Editor**, execute o arquivo:

📄 `supabase/employees.sql`

Ou copie e execute este SQL:

<details>
<summary>👉 Clique para expandir o SQL</summary>

```sql
-- Copie todo o conteúdo do arquivo supabase/employees.sql
```

Você pode encontrar o arquivo completo em:
`/home/evanildobarros/Projetos/isotek---sistema-de-gestão-da-qualidade/supabase/employees.sql`

</details>

### Passo 2: Criar Tabela de Treinamentos

Ainda no **SQL Editor**, execute o arquivo:

📄 `supabase/employee_trainings.sql`

Arquivo completo em:
`/home/evanildobarros/Projetos/isotek---sistema-de-gestão-da-qualidade/supabase/employee_trainings.sql`

### Passo 3: Criar Bucket para Certificados

No **Supabase Dashboard** → **Storage**:

1. Clique em **"New bucket"**
2. Nome: `certificates`
3. ✅ Marque como **"Public"**
4. Clique em **"Create bucket"**

Depois, configure as políticas RLS no **SQL Editor**:

```sql
-- Políticas para o bucket certificates
drop policy if exists "Certificates readable by authenticated users" on storage.objects;
create policy "Certificates readable by authenticated users"
  on storage.objects for select
  using (bucket_id = 'certificates' and auth.role() = 'authenticated');

drop policy if exists "Certificates uploadable by company members" on storage.objects;
create policy "Certificates uploadable by company members"
  on storage.objects for insert
  with check (
    bucket_id = 'certificates' 
    and auth.role() = 'authenticated'
  );

drop policy if exists "Certificates deletable by company members" on storage.objects;
create policy "Certificates deletable by company members"
  on storage.objects for delete
  using (
    bucket_id = 'certificates' 
    and auth.role() = 'authenticated'
  );
```

## 🚀 Como Usar o Módulo

### Acessar o Módulo

1. Faça login no sistema
2. No menu lateral, vá em **"Grupo B: Execução (Do)"**
3. Clique em **"Competências e Treinamentos"**

Ou acesse diretamente: **<http://localhost:3000/app/treinamentos>**

### Cadastrar Colaborador

1. Clique no botão **"+"** (Adicionar Colaborador)
2. Preencha:
   - Nome completo
   - Cargo (ex: "Operador de Empilhadeira")
   - Departamento (opcional)
   - Data de admissão
   - Status (Ativo/Inativo)
3. Clique em **"Salvar"**

### Registrar Treinamento

1. Selecione um colaborador na lista à esquerda
2. Clique em **"+ Registrar Treinamento"**
3. Preencha:
   - Nome do treinamento (ex: "NR-11 - Empilhadeira")
   - Data de realização
   - Data de validade (se aplicável)
   - Notas adicionais (opcional)
   - Faça upload do certificado (PDF ou imagem)
4. Clique em **"Salvar"**

## 🎨 Features Implementadas

### Indicadores Visuais de Status

Cada colaborador tem um **indicador colorido** na lista:

- 🟢 **Verde**: Todos os treinamentos em dia
- 🟡 **Amarelo**: Tem treinamentos a vencer (< 30 dias)
- 🔴 **Vermelho**: Tem treinamentos vencidos

### Badges de Status nos Treinamentos

- ✅ **REALIZADO** (Verde): Treinamento válido
- ⚠️ **A VENCER** (Amarelo): Vence em menos de 30 dias
- ❌ **VENCIDO** (Vermelho): Data de validade passou

### Upload de Certificados

- Aceita PDF, JPG e PNG
- Armazenamento seguro no Supabase Storage
- Visualização rápida (clique no ícone de link externo)

## 🔍 Verificação

Após executar as migrations, teste:

- [ ] Criar um colaborador
- [ ] Visualizar o colaborador na lista
- [ ] Registrar um treinamento sem certificado
- [ ] Registrar um treinamento COM certificado
- [ ] Criar treinamentos com datas diferentes para ver os badges:
  - Data futura (> 30 dias): Verde
  - Data próxima (< 30 dias): Amarelo
  - Data passada: Vermelho
- [ ] Excluir um treinamento
- [ ] Editar informações do colaborador

## ⚠️ Troubleshooting

### "Erro ao carregar colaboradores"

→ Verifique se executou o SQL do `employees.sql`

### "Erro ao salvar treinamento"

→ Verifique se executou o SQL do `employee_trainings.sql`

### "Erro ao fazer upload do certificado"

→ Certifique-se que o bucket `certificates` foi criado e é público

### Página não carrega / erro 404

→ O servidor de desenvolvimento está rodando? (`npm run dev`)

## 📞 Suporte

Se encontrar algum problema, verifique:

1. Console do navegador (F12) para erros JavaScript
2. Supabase Dashboard → Database → Policies (verifique RLS)
3. Supabase Dashboard → Storage → Buckets (verifique se `certificates` existe)

---

**Tudo pronto!** 🎉 Depois de executar os 3 passos acima, o módulo estará totalmente funcional.
