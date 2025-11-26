import React from 'react';
import { Bell, Search, HelpCircle, ChevronRight } from 'lucide-react';
import { UserDropdown } from './UserDropdown';
import { IsoSection } from '../types';

interface HeaderProps {
  activeSection: IsoSection;
}

export const Header: React.FC<HeaderProps> = ({ activeSection }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-72 z-10 px-8 flex items-center justify-between">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500">
        <span className="hover:text-gray-700 cursor-pointer">Home</span>
        <ChevronRight size={16} className="mx-2" />
        <span className="font-medium text-gray-900">{activeSection}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar documentos..."
            className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-isotek-500 focus:border-transparent transition-all"
          />
        </div>

        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
          <HelpCircle size={20} />
        </button>

        {/* User Dropdown */}
        <div className="ml-2 pl-4 border-l border-gray-200">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};