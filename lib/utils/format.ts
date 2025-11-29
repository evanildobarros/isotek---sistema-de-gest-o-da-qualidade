/**
 * Formata data para o padrão brasileiro
 */
export function formatDate(date: string | Date, includeTime = false): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return '-';
    }

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('pt-BR', options).format(d);
}

/**
 * Mapeia status para cores do Tailwind
 */
export function getStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
        // Status genéricos
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-gray-100 text-gray-800',
        'blocked': 'bg-red-100 text-red-800',
        'bloqueado': 'bg-red-100 text-red-800',

        // Ações corretivas
        'open': 'bg-blue-100 text-blue-800',
        'root_cause_analysis': 'bg-yellow-100 text-yellow-800',
        'implementation': 'bg-purple-100 text-purple-800',
        'effectiveness_check': 'bg-orange-100 text-orange-800',
        'closed': 'bg-green-100 text-green-800',

        // Não conformidades
        'analyzing': 'bg-yellow-100 text-yellow-800',
        'resolved': 'bg-green-100 text-green-800',

        // Pedidos
        'pending_review': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
        'delivered': 'bg-blue-100 text-blue-800',

        // Produção
        'scheduled': 'bg-gray-100 text-gray-800',
        'in_progress': 'bg-blue-100 text-blue-800',
        'quality_check': 'bg-yellow-100 text-yellow-800',
        'completed': 'bg-green-100 text-green-800',

        // Fornecedores
        'homologado': 'bg-green-100 text-green-800',
        'em_analise': 'bg-yellow-100 text-yellow-800',

        // Objetivos
        'pending': 'bg-gray-100 text-gray-800',
        'on_track': 'bg-green-100 text-green-800',
        'at_risk': 'bg-red-100 text-red-800',

        // Análise crítica
        'draft': 'bg-gray-100 text-gray-800',
        'concluded': 'bg-green-100 text-green-800',
    };

    return statusMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Traduz status para português
 */
export function getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
        // Status genéricos
        'active': 'Ativo',
        'inactive': 'Inativo',
        'blocked': 'Bloqueado',
        'bloqueado': 'Bloqueado',

        // Ações corretivas
        'open': 'Aberta',
        'root_cause_analysis': 'Análise de Causa',
        'implementation': 'Implementação',
        'effectiveness_check': 'Verificação de Eficácia',
        'closed': 'Concluída',

        // Não conformidades
        'analyzing': 'Em Análise',
        'resolved': 'Resolvida',

        // Pedidos
        'pending_review': 'Aguardando Revisão',
        'approved': 'Aprovado',
        'rejected': 'Rejeitado',
        'delivered': 'Entregue',

        // Produção
        'scheduled': 'Agendada',
        'in_progress': 'Em Andamento',
        'quality_check': 'Verificação de Qualidade',
        'completed': 'Concluída',

        // Fornecedores
        'homologado': 'Homologado',
        'em_analise': 'Em Análise',

        // Objetivos
        'pending': 'Pendente',
        'on_track': 'No Prazo',
        'at_risk': 'Em Risco',

        // Análise crítica
        'draft': 'Rascunho',
        'concluded': 'Concluída',
    };

    return statusLabels[status] || status;
}

/**
 * Calcula dias até uma data
 */
export function daysUntil(date: string | Date): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const diffTime = d.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se uma data está próxima (dentro de X dias)
 */
export function isDateNear(date: string | Date, daysThreshold = 7): boolean {
    const days = daysUntil(date);
    return days >= 0 && days <= daysThreshold;
}

/**
 * Verifica se uma data está vencida
 */
export function isDateOverdue(date: string | Date): boolean {
    return daysUntil(date) < 0;
}
