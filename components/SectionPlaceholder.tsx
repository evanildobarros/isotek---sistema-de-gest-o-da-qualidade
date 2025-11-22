import React from 'react';
import { Construction } from 'lucide-react';

interface SectionPlaceholderProps {
  title: string;
}

export const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Construction size={48} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Módulo em Desenvolvimento</h2>
      <p className="text-gray-500 max-w-md mt-2">
        A seção <strong>{title}</strong> estará disponível na próxima atualização do sistema Isotek.
      </p>
    </div>
  );
};
