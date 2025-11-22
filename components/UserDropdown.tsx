import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';

export const UserDropdown: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load avatar from localStorage
    useEffect(() => {
        const loadAvatar = () => {
            const savedAvatar = localStorage.getItem('isotek_avatar');
            setAvatarUrl(savedAvatar);
        };

        loadAvatar();

        // Listen for avatar updates
        window.addEventListener('avatarUpdated', loadAvatar);
        return () => window.removeEventListener('avatarUpdated', loadAvatar);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isotek_token');
        navigate('/login');
    };

    const handleProfileClick = () => {
        setIsOpen(false);
        navigate('/app/perfil');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
                {/* Avatar */}
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover shadow-md border-2 border-gray-100"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-isotek-500 to-isotek-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        AD
                    </div>
                )}

                {/* User Info */}
                <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900">Admin User</p>
                    <p className="text-xs text-gray-500">Administrador</p>
                </div>

                {/* Chevron Icon */}
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
                    {/* User Info Header (visible on mobile) */}
                    <div className="md:hidden px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">Admin User</p>
                        <p className="text-xs text-gray-500">admin@isotek.com</p>
                    </div>

                    {/* Menu Items */}
                    <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <User size={18} className="text-gray-400" />
                        <span>Meu Perfil</span>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} className="text-red-500" />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            )}
        </div>
    );
};
