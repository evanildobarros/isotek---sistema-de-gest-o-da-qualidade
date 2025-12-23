import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity } from 'lucide-react';

export const ActiveAuditIndicator = () => {
    // Busca auditoria ativa
    const [activeAudit, setActiveAudit] = useState<any>(null);

    useEffect(() => {
        const fetchAudit = async () => {
            const { data: auditData, error } = await supabase
                .from('audit_assignments')
                .select('*')
                .eq('status', 'em_andamento')
                .maybeSingle();

            if (auditData) {
                // Fetch auditor profile separately to avoid join issues if FK is not formal
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', auditData.auditor_id)
                    .single();

                setActiveAudit({ ...auditData, auditor: profile });
            } else {
                setActiveAudit(null);
            }
        };

        fetchAudit();
        const interval = setInterval(fetchAudit, 30000); // Atualiza a cada 30s

        return () => clearInterval(interval);
    }, []);

    if (!activeAudit) return null;

    return (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full border border-red-200 shadow-sm animate-pulse mr-4">
            <div className="relative">
                <Activity size={16} />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-xs font-bold uppercase tracking-wider">Auditoria em Andamento</span>
                <span className="text-[10px] opacity-80">
                    Auditor: {activeAudit.auditor?.full_name?.split(' ')[0] || 'Externo'}
                </span>
            </div>
        </div>
    );
};
