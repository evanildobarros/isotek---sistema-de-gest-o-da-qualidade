import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, HelpCircle, ChevronRight, Sun, Moon, X, ExternalLink, Book, Menu, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserDropdown } from './UserDropdown';
import { IsoSection } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  activeSection: IsoSection;
  onMenuClick?: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  code: string;
  status: string;
}

export const Header: React.FC<HeaderProps> = ({ activeSection, onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const { data, error } = await supabase
            .from('documents')
            .select('id, title, code, status')
            .or(`title.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
            .limit(10);

          if (!error && data) {
            setSearchResults(data);
            setShowSearchResults(true);
          }
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setShowSearchResults(false);
    setSearchQuery('');
    navigate('/documentos', { state: { highlightId: result.id } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vigente': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'rascunho': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'obsoleto': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 right-0 lg:left-72 left-0 z-10 px-4 md:px-8 flex items-center justify-between transition-colors duration-200">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-gray-600 hover:text-[#025159] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Breadcrumbs */}
      <div className="hidden md:flex items-center text-sm text-gray-500 dark:text-gray-400">
        <span className="hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer">Home</span>
        <ChevronRight size={16} className="mx-2" />
        <span className="font-medium text-gray-900 dark:text-white">{activeSection}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div className="relative hidden md:block" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar documentos..."
            className="pl-10 pr-4 py-2 w-64 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#025159] focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
          />

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-2 animate-fade-in max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#025159] mx-auto"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors flex items-start gap-3 text-left"
                    >
                      <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
                          {result.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{result.code}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Nenhum documento encontrado
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-400 hover:text-[#025159] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
          title={theme === 'light' ? 'Alternar para Modo Escuro' : 'Alternar para Modo Claro'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowHelp(false);
            }}
            className={`p-2 rounded-full transition-colors relative ${showNotifications
              ? 'text-[#025159] bg-[#025159]/10'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-2 animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">Nova Política Publicada</p>
                  <p className="text-xs text-gray-500 mt-1">A Política da Qualidade v1.0 foi aprovada.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Há 2 horas</p>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border-t border-gray-50 dark:border-gray-800">
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">Ação Corretiva Pendente</p>
                  <p className="text-xs text-gray-500 mt-1">Você tem uma ação aguardando aprovação.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Há 5 horas</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-center">
                <button className="text-xs font-medium text-[#025159] hover:underline">
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="relative">
          <button
            onClick={() => {
              setShowHelp(!showHelp);
              setShowNotifications(false);
            }}
            className={`p-2 rounded-full transition-colors ${showHelp
              ? 'text-[#025159] bg-[#025159]/10'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            <HelpCircle size={20} />
          </button>

          {/* Help Dropdown */}
          {showHelp && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-2 animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">Ajuda & Suporte</h3>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                  <Book size={16} />
                  Documentação
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                  <ExternalLink size={16} />
                  Suporte Técnico
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="ml-2 pl-4 border-l border-gray-200 dark:border-gray-700">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};