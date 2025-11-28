import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    action?: React.ReactNode;
    iconColor?: 'blue' | 'indigo' | 'sky' | 'cyan' | 'orange' | 'amber' | 'yellow' | 'purple' | 'violet' | 'fuchsia';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    icon: Icon,
    title,
    subtitle,
    action,
    iconColor = 'blue'
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
        sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
        cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
        fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400'
    };

    return (
        <div className="flex justify-between items-start mb-8">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-3 rounded-lg ${colorClasses[iconColor]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#025159]">{title}</h1>
                </div>
                <p className="text-gray-500 text-sm">{subtitle}</p>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};
