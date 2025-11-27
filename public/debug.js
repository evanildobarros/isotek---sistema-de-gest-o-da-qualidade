// Teste simples para verificar se os botões funcionam
console.log('✅ CorrectiveActionsPage carregado');

// Log quando handleOpenModal é chamado
const originalHandleOpenModal = window.handleOpenModal;
if (typeof originalHandleOpenModal === 'function') {
    console.log('✅ handleOpenModal encontrado');
} else {
    console.warn('⚠️ handleOpenModal não encontrado');
}

// Verificar se há erros globais
window.addEventListener('error', (e) => {
    console.error('❌ Erro global capturado:', e.message, e.filename, e.lineno);
});

console.log('🔍 Script de debug carregado');
