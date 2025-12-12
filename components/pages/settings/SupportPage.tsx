import React from 'react';
import { LifeBuoy, Mail, MessageCircle, FileQuestion, Bug, ExternalLink, Phone } from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';

export const SupportPage: React.FC = () => {
  const supportChannels = [
    {
      icon: MessageCircle,
      title: 'Chat via WhatsApp',
      desc: 'Atendimento rápido para dúvidas do dia a dia.',
      action: 'Iniciar Conversa',
      link: 'https://wa.me/5598999999999', // Substitua pelo número real
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Mail,
      title: 'E-mail de Suporte',
      desc: 'Para questões técnicas detalhadas ou envio de arquivos.',
      action: 'suporte@isotek.com.br',
      link: 'mailto:suporte@isotek.com.br',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Bug,
      title: 'Reportar Bug',
      desc: 'Encontrou uma falha? Abra um chamado técnico.',
      action: 'Abrir Ticket',
      link: 'mailto:bugs@isotek.com.br',
      color: 'bg-red-100 text-red-600'
    }
  ];

  const faqs = [
    { q: 'Como adicionar novos usuários?', a: 'Acesse "Configurações > Usuários" e clique no botão "Convidar Usuário".' },
    { q: 'Como mudar o logo da empresa?', a: 'Vá em "Configurações > Perfil da Empresa" para fazer upload da sua marca.' },
    { q: 'Onde vejo minhas faturas?', a: 'No menu "Perfil da Empresa", acesse a aba "Assinatura".' }
  ];

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <PageHeader 
        icon={LifeBuoy} 
        title="Central de Suporte" 
        subtitle="Canais de atendimento e ajuda especializada."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportChannels.map((channel, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${channel.color} rounded-lg flex items-center justify-center mb-4`}>
              <channel.icon size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{channel.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{channel.desc}</p>
            <a 
              href={channel.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#025159] hover:underline"
            >
              {channel.action} <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FileQuestion className="text-gray-400" size={20} />
            Dúvidas Frequentes
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">{faq.q}</h4>
              <p className="text-sm text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
