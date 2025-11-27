# 🚨 Instruções para Ativar o Módulo "Controle de Saídas Não Conformes"

## ✅ O que já está pronto

Todo o código foi implementado com layout Kanban! Agora você só precisa configurar o banco de dados.

## 📝 Passos para Configuração (3 minutos)

### Passo 1: Criar Tabela de Não Conformidades

No **Supabase Dashboard** → **SQL Editor**, execute o arquivo:

📄 `supabase/non_conformities_products.sql`

Arquivo completo em:
`/home/evanildobarros/Projetos/isotek---sistema-de-gestão-da-qualidade/supabase/non_conformities_products.sql`

### Passo 2: Criar Bucket para Fotos de Evidência

No **Supabase Dashboard** → **Storage**:

1. Clique em **"New bucket"**
2. Nome: `nc_photos`
3. ✅ Marque como **"Public"**
4. Clique em **"Create bucket"**

Depois, configure as políticas RLS no **SQL Editor** (copie do SQL comentado no arquivo):

```sql
drop policy if exists "NC photos readable by authenticated users" on storage.objects;
create policy "NC photos readable by authenticated users"
  on storage.objects for select
  using (bucket_id = 'nc_photos' and auth.role() = 'authenticated');

drop policy if exists "NC photos uploadable by company members" on storage.objects;
create policy "NC photos uploadable by company members"
  on storage.objects for insert
  with check (bucket_id = 'nc_photos' and auth.role() = 'authenticated');

drop policy if exists "NC photos deletable by company members" on storage.objects;
create policy "NC photos deletable by company members"
  on storage.objects for delete
  using (bucket_id = 'nc_photos' and auth.role() = 'authenticated');
```

## 🚀 Como Usar o Módulo

### Acessar o Módulo

1. Faça login no sistema
2. No menu lateral, vá em **"Grupo B: Execução (Do)"** → **"8.0 Operação"**
3. Clique em **"Saídas Não Conformes"**

Ou acesse diretamente: **<http://localhost:3000/app/saidas-nao-conformes>**

### Registrar Nova RNC (Não Conformidade)

1. Clique no botão **"+ Nova RNC"** (vermelho, canto superior direito)
2. Preencha:
   - **Descrição do defeito** (ex: "Peças com acabamento irregular, arranhões visíveis")
   - **Onde foi detectado:** Produção / Fornecedor / Cliente/Reclamação
   - **Severidade:** Baixa / Média / Crítica
   - Data de ocorrência
   - Quantidade afetada (opcional)
   - **Foto de evidência** (opcional - PDF ou imagem)
3. Clique em **"Registrar RNC"**

A RNC aparecerá na coluna **"🚨 Identificada"** com borda colorida conforme a severidade.

### Fluxo de Tratamento (Kanban)

**Coluna 1: 🚨 Identificada** (RNCs abertas)

- Clique em **"Analisar"** → move para próxima coluna

**Coluna 2: 🧪 Em Análise** (em investigação)

- Clique em **"Tratar"** → abre modal de disposição

**Coluna 3: ✅ Tratada/Encerrada** (resolvidas)

- RNCs com disposição aplicada

### Aplicar Disposição (Tratar RNC)

1. Na coluna "Em Análise", clique em **"Tratar"**
2. No modal, escolha a **Decisão de Disposição:**
   - 🛠️ **Retrabalho** (Consertar o produto)
   - 🗑️ **Refugo** (Descarte/Lixo - produto irrecuperável)
   - ✅ **Concessão** (Cliente aceitou assim mesmo)
   - 🔄 **Devolução** (Devolver ao fornecedor)
3. Preencha a **Justificativa** (obrigatório - explique o motivo da decisão)
4. Preencha **Autorizado por** (obrigatório - nome de quem aprovou)
5. Clique em **"Aplicar Disposição"**

A RNC será movida automaticamente para **"Tratada/Encerrada"** com o badge da disposição aplicada.

## 🎨 Features Implementadas

### Cores de Severidade

As RNCs têm **borda lateral colorida** conforme a severidade:

- 🔴 **Crítica**: Vermelho (`border-red-500`)
- 🟡 **Média**: Amarelo (`border-yellow-500`)
- 🟢 **Baixa**: Verde (`border-green-500`)

### Badges Visuais

Cada RNC mostra:

- **Badge de Origem** com ícone:
  - 📦 Produção
  - 🔧 Fornecedor
  - 👥 Cliente/Reclamação
- **Badge de Severidade** colorido
- **Badge de Disposição** (quando aplicada):
  - 🛠️ Retrabalho (azul)
  - 🗑️ Refugo (vermelho)
  - ✅ Concessão (verde)
  - 🔄 Devolução (roxo)

### Contadores por Coluna

Cada coluna mostra quantas RNCs estão naquele estágio.

### Upload de Fotos

- Clique no ícone 🔗 (link externo) no card para ver a foto de evidência
- Fotos são armazenadas no Supabase Storage
- Aceita imagens (JPG, PNG) e PDFs

## 🔍 Verificação

Após executar as configurações, teste:

### Teste Básico

- [ ] Criar RNC sem foto
- [ ] Criar RNC com foto
- [ ] Verificar cores de severidade
- [ ] Verificar badges de origem

### Teste de Fluxo Kanban

- [ ] Mover RNC de "Identificada" para "Em Análise"
- [ ] Clicar em "Tratar" e aplicar disposição
- [ ] Verificar que moveu para "Tratada"
- [ ] Verificar que badge de disposição apareceu

### Teste de Evidências

- [ ] Upload de foto ao criar RNC
- [ ] Clicar no link de evidência
- [ ] Verificar que abre em nova aba

### Teste de Dados

- [ ] Verificar justificativa salva
- [ ] Verificar autoridade salva
- [ ] Verificar quantidade afetada salva

## ⚠️ Troubleshooting

### "Erro ao carregar não conformidades"

→ Verifique se executou o SQL do `non_conformities_products.sql`

### "Erro ao fazer upload da foto"

→ Certifique-se que o bucket `nc_photos` foi criado e é público

### Página não carrega / erro 404

→ O servidor de desenvolvimento está rodando? (`npm run dev`)

### Foto não aparece

→ Verifique as políticas RLS do bucket `nc_photos`

## 📊 Como Funciona o Kanban

**Status da RNC:**

- `open` = 🚨 Identificada (coluna 1)
- `analyzing` = 🧪 Em Análise (coluna 2)
- `resolved` = ✅ Tratada/Encerrada (coluna 3)

**Transições:**

1. Nova RNC → Sempre começa como `open`
2. Botão "Analisar" → Muda para `analyzing`
3. Botão "Tratar" → Abre modal, após salvar muda para `resolved`

**Regra:** Só pode mover para "Tratada" se preencher a disposição (obrigatório).

## 🎯 Dicas de Uso

1. **Fotos são Importantes:** Sempre que possível, tire foto do defeito. É crucial para auditorias ISO.
2. **Severidade Crítica:** Use para defeitos que podem chegar ao cliente e causar danos.
3. **Disposição de Concessão:** Registre sempre a aprovação do cliente/responsável técnico.
4. **Refugo vs. Retrabalho:** Refugo = irrecuperável. Retrabalho = pode ser consertado.
5. **Devolução ao Fornecedor:** Use quando o defeito for de responsabilidade do fornecedor.

## 📞 ISO 9001 - Requisito 8.7

Este módulo atende completamente ao requisito **8.7 (Controle de Saídas Não Conformes)**:

✅ **Identificação:** Registro detalhado de cada não conformidade  
✅ **Controle:** Status Kanban impede perda de rastreamento  
✅ **Disposição:** 4 opções documentadas + justificativa + autoridade  
✅ **Evidências:** Fotos armazenadas permanentemente  
✅ **Rastreabilidade:** Histórico completo de mudanças

---

**Tudo pronto!** 🎉 Depois de executar os 2 passos SQL, o módulo estará totalmente funcional com layout Kanban!
