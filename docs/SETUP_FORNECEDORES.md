# 🚚 Instruções para Ativar o Módulo "Gestão de Fornecedores"

## ✅ O que já está pronto

Todo o código foi implementado seguindo exatamente o design de referência! Agora você só precisa configurar o banco de dados.

## 📝 Passos para Configuração (3 minutos)

### Passo 1: Criar Tabela de Fornecedores

No **Supabase Dashboard** → **SQL Editor**, execute o arquivo:

📄 `supabase/suppliers.sql`

Arquivo completo em:
`/home/evanildobarros/Projetos/isotek---sistema-de-gestão-da-qualidade/supabase/suppliers.sql`

### Passo 2: Criar Tabela de Avaliações

Ainda no **SQL Editor**, execute o arquivo:

📄 `supabase/supplier_evaluations.sql`

⚠️ **IMPORTANTE:** Este arquivo contém um **trigger automático** que recalcula o IQF do fornecedor sempre que uma nova avaliação é registrada.

Arquivo completo em:
`/home/evanildobarros/Projetos/isotek---sistema-de-gestão-da-qualidade/supabase/supplier_evaluations.sql`

## 🚀 Como Usar o Módulo

### Acessar o Módulo

1. Faça login no sistema
2. No menu lateral, vá em **"Grupo B: Execução (Do)"** → **"8.0 Operação"**
3. Clique em **"Gestão de Fornecedores"**

Ou acesse diretamente: **<http://localhost:3000/app/fornecedores>**

### Cadastrar Fornecedor

1. Clique no botão **"+ Novo Fornecedor"** (azul, canto superior direito)
2. Preencha:
   - **Nome da Empresa** (obrigatório)
   - CNPJ
   - **Categoria** (selecione uma: Matéria Prima, Serviços, Transporte, TI/Hardware, Logística)
   - Email
   - Telefone
   - **Status Inicial** (Em Análise, Homologado ou Bloqueado)
   - Se Bloqueado: preencha o **Motivo do Bloqueio**
3. Clique em **"Salvar"**

### Avaliar Fornecedor

1. Na **Tab "DIRETÓRIO DE FORNECEDORES"**, localize o fornecedor
2. Clique no botão **"⭐ Avaliar"**
3. Ajuste os **3 sliders** (0-10):
   - Qualidade do Produto/Serviço
   - Cumprimento de Prazos
   - Atendimento/Comunicação
4. A **Nota Final** é calculada automaticamente (média)
5. Adicione comentários (opcional)
6. Clique em **"Salvar Avaliação"**

**✨ Mágica:** O **IQF** do fornecedor é atualizado automaticamente!

- IQF = Média das últimas 3 avaliações × 10 (escala 0-100)

### Ver Histórico de Avaliações

1. Clique na **Tab "AVALIAÇÕES (IQF)"**
2. Veja todas as avaliações realizadas com:
   - Nome do fornecedor
   - Data
   - Notas por critério
   - Nota final

## 🎨 Features Implementadas

### Indicadores Visuais por Categoria

Cada fornecedor tem um **ícone** baseado na categoria:

- 📦 **Matéria Prima / Mat. Escritório**: Caixa (Package)
- 🚚 **Transporte / Logística**: Caminhão (Truck)
- 💻 **TI / Hardware**: Laptop
- 🔧 **Serviços**: Chave Inglesa (Wrench)
- 🏢 **Outros**: Prédio (Building)

### Badges de Status Coloridos

- 🟢 **APROVADO** (Verde): Fornecedor homologado
- 🟡 **EM ANÁLISE** (Amarelo): Em processo de qualificação
- 🔴 **BLOQUEADO** (Vermelho): Bloqueado por problemas

### Alertas de IQF Baixo

- ⭐ **IQF ≥ 70**: Nota em preto (OK)
- ⚠️ **IQF < 70**: Nota em **vermelho** (Alerta - fornecedor com baixa qualificação)

### Motivo de Bloqueio Expandível

Para fornecedores bloqueados:

- Seta ao lado das ações
- Clique para expandir e ver o motivo
- Fundo vermelho claro destaca a informação

### Sistema de Avaliação com Sliders

- Interface elegante com gradiente azul
- Sliders interativos de 0 a 10 (passos de 0.5)
- Cálculo da média em tempo real
- Exibição grande da nota final com estrela

## 🔍 Verificação

Após executar as migrations, teste:

### Teste Básico

- [ ] Criar um fornecedor de cada categoria
- [ ] Verificar que os ícones estão corretos
- [ ] Testar badges de status (Homologado, Em Análise, Bloqueado)

### Teste de Avaliação

- [ ] Avaliar um fornecedor
- [ ] Ajustar sliders e ver média calcular
- [ ] Salvar avaliação
- [ ] Verificar que IQF foi atualizado na tabela
- [ ] Ver avaliação na Tab "AVALIAÇÕES (IQF)"

### Teste de IQF Automático

- [ ] Avaliar o mesmo fornecedor 3 vezes com notas diferentes
- [ ] Verificar que IQF é a média das 3 avaliações × 10
- [ ] Fazer uma 4ª avaliação
- [ ] Confirmar que IQF usa apenas as últimas 3

### Teste de Alerta

- [ ] Avaliar fornecedor com notas baixas (ex: 5, 6, 6)
- [ ] IQF deve ficar ~57 (vermelho)
- [ ] Avaliar com notas altas (ex: 9, 9, 10)
- [ ] IQF deve ficar ~93 (preto)

### Teste de Bloqueio

- [ ] Criar fornecedor com status "Bloqueado"
- [ ] Preencher motivo de bloqueio
- [ ] Verificar badge vermelho "BLOQUEADO"
- [ ] Clicar na seta para expandir o motivo
- [ ] Ver fundo vermelho com o texto do motivo

## ⚠️ Troubleshooting

### "Erro ao carregar fornecedores"

→ Verifique se executou o SQL do `suppliers.sql`

### "Erro ao salvar avaliação"

→ Verifique se executou o SQL do `supplier_evaluations.sql` (inclui o trigger!)

### IQF não atualiza após avaliação

→ Certifique-se que o trigger foi criado corretamente. Re-execute o `supplier_evaluations.sql`

### Página não carrega / erro 404

→ O servidor de desenvolvimento está rodando? (`npm run dev`)

### Ícones não aparecem

→ Isso é um bug visual, os ícones devem carregar automaticamente. Recarregue a página.

## 📊 Como Funciona o IQF

**IQF** = Índice de Qualificação de Fornecedor (0-100)

**Cálculo:**

```
1. Usuário avalia fornecedor com 3 notas (0-10)
   - Exemplo: Qualidade=9, Prazos=8, Comunicação=9

2. Sistema calcula média:
   - (9 + 8 + 9) / 3 = 8.67

3. Trigger pega as últimas 3 avaliações e faz média:
   - Se for a 1ª avaliação: IQF = 8.67 × 10 = 86.7
   - Se tiver 3 avaliações (8.67, 9.0, 7.5): IQF = (8.67+9.0+7.5)/3 × 10 = 84.5

4. Fornecedor é atualizado automaticamente
```

**Regra de Ouro:**

- **IQF ≥ 70**: Fornecedor OK ✅
- **IQF < 70**: Alerta! ⚠️ Considere revisão ou bloqueio

## 🎯 Dicas de Uso

1. **Avaliações Periódicas:** Avalie fornecedores após cada compra/entrega
2. **Homologação:** Novos fornecedores entram como "Em Análise", façam 2-3 avaliações antes de homologar
3. **Bloqueio:** Use para fornecedores com problemas recorrentes, sempre com motivo documentado
4. **IQF Mínimo:** Defina um IQF mínimo (ex: 70) para fornecedores homologados

---

**Tudo pronto!** 🎉 Depois de executar os 2 passos SQL, o módulo estará totalmente funcional com cálculo automático de IQF.
