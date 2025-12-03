/**
 * Paleta de Cores Consistente do Isotek
 * Define a paleta de cores padrão para toda a aplicação
 */

export const ColorPalette = {
  // Cores do Brand
  primary: {
    dark: '#025159',     // Cor primária escura (azul-verde)
    medium: '#3F858C',   // Cor primária média
    light: '#7AB8BF',    // Cor primária clara
    lighter: '#C4EEF2',  // Cor primária bem clara
  },
  
  // Cores Secundárias
  secondary: {
    dark: '#A67458',     // Marrom
    medium: '#D4A574',   // Marrom claro
  },

  // Cores de Ação - Padrão Tailwind
  action: {
    primary: 'bg-[#025159] hover:bg-[#3F858C]',      // Botão primário (nova ação)
    secondary: 'bg-blue-600 hover:bg-blue-700',      // Botão secundário
    success: 'bg-green-600 hover:bg-green-700',      // Concluir/Aprovar
    danger: 'bg-red-600 hover:bg-red-700',           // Deletar/Rejeitar
    warning: 'bg-yellow-600 hover:bg-yellow-700',    // Aviso
    purple: 'bg-purple-600 hover:bg-purple-700',     // Upgrade/Premium
  },

  // Cores de Status (badges)
  status: {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  }
};

/**
 * Mapa de classes CSS Tailwind para botões consistentes
 */
export const ButtonClasses = {
  // Botão Primário (Novo, Criar, Adicionar)
  primary: 'flex items-center gap-2 px-4 py-2.5 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-md font-medium',
  
  // Botão Secundário
  secondary: 'flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium',
  
  // Botão de Sucesso (Aprovar, Concluir)
  success: 'flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-medium',
  
  // Botão de Perigo (Deletar, Rejeitar)
  danger: 'flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-medium',
  
  // Botão Outline
  outline: 'flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium',
};
