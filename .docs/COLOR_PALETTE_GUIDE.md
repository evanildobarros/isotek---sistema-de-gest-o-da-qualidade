# Guia de Paleta de Cores - Isotek

## 🎨 Cores Primárias do Brand

| Cor | Código | Uso |
|-----|--------|-----|
| **Primária Escura** | `#025159` | Botões de ação primária, headers, elementos principais |
| **Primária Média** | `#3F858C` | Hover state da cor primária |
| **Primária Clara** | `#7AB8BF` | Backgrounds claros, estados hover secundários |
| **Primária Muito Clara** | `#C4EEF2` | Backgrounds muito claros, overlays |
| **Secundária** | `#A67458` | Acentos, destaques especiais |

## 🔘 Cores de Botões - Padrão

### Botões de Ação Principal
- **Novo**, **Criar**, **Adicionar**
- Classe: `bg-[#025159] hover:bg-[#3F858C]`
- Exemplo: "Novo Pedido", "Nova Ordem"

### Botões de Sucesso
- **Aprovar**, **Concluir**, **Salvar**
- Classe: `bg-green-600 hover:bg-green-700`
- Status badge: `bg-green-100 text-green-800`

### Botões de Perigo
- **Deletar**, **Rejeitar**, **Cancelar**
- Classe: `bg-red-600 hover:bg-red-700`
- Status badge: `bg-red-100 text-red-800`

### Botões Secundários
- **Editar**, **Registrar**, **Salvar**
- Classe: `bg-blue-600 hover:bg-blue-700`
- Status badge: `bg-blue-100 text-blue-800`

### Botões de Aviso
- **Atenção**, **Aguardando**
- Classe: `bg-yellow-600 hover:bg-yellow-700`
- Status badge: `bg-yellow-100 text-yellow-800`

### Botões Premium/Upgrade
- **Fazer Upgrade**, **Ver Planos**
- Classe: `bg-purple-600 hover:bg-purple-700`

## 📊 Cores de Status - Badges

| Status | Cor | Classe |
|--------|-----|--------|
| Pendente | Amarelo | `bg-yellow-100 text-yellow-800` |
| Aprovado | Verde | `bg-green-100 text-green-800` |
| Rejeitado | Vermelho | `bg-red-100 text-red-800` |
| Ativo | Verde | `bg-green-100 text-green-800` |
| Inativo | Cinza | `bg-gray-100 text-gray-800` |
| Em Andamento | Azul | `bg-blue-100 text-blue-800` |
| Verificação | Roxo | `bg-purple-100 text-purple-700` |

## ✅ Regras de Consistência

1. **Botões "Novo/Criar"** sempre usam cor primária (`#025159`)
2. **Botões de Sucesso** sempre usam verde (`bg-green-600`)
3. **Botões de Perigo** sempre usam vermelho (`bg-red-600`)
4. **Botões Secundários** sempre usam azul (`bg-blue-600`)
5. Todos os botões devem seguir o padrão: `rounded-lg hover:bg-[+1shade] transition-colors`
6. Badges de status devem usar cores claras (100) com texto escuro (800)

## 📝 Exemplos de Uso

```tsx
// Botão Primário - Novo Pedido
<button className="flex items-center gap-2 px-4 py-2.5 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-md font-medium">
  <Plus className="w-5 h-5" />
  Novo Pedido
</button>

// Badge de Status
<span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium">
  ✓ APROVADO
</span>

// Botão de Ação (Concluir)
<button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
  Concluir
</button>
```

## 🔗 Referência de Arquivo

- Paleta importável: `lib/utils/colorPalette.ts`
- Usar `ColorPalette` para variáveis de cor
- Usar `ButtonClasses` para classes padronizadas
