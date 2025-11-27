import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    icon: Icon,
    title,
    subtitle,
    action
}) => {
    return (
        <div className="flex justify-between items-start mb-8">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-7 h-7 text-[#025159]" />
                    <h1 className="text-2xl font-bold text-[#025159]">{title}</h1>
                </div>
                <p className="text-gray-500 text-sm">{subtitle}</p>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};
