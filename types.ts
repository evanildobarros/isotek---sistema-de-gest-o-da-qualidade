export enum IsoSection {
  DASHBOARD = 'Dashboard',
  CONTEXTO = '4. Contexto da Organização',
  LIDERANCA = '5. Liderança',
  PLANEJAMENTO = '6. Planejamento',
  APOIO = '7. Apoio (GED)',
  OPERACAO = '8. Operação',
  AVALIACAO = '9. Avaliação de Desempenho',
  MELHORIA = '10. Melhoria'
}

export interface SwotItem {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  content: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface NonConformance {
  id: string;
  code: string;
  description: string;
  source: string; // e.g., Audit, Client Complaint
  status: 'Open' | 'Analysis' | 'Implementation' | 'Closed';
  dateOpened: string;
  severity: 'Critical' | 'Major' | 'Minor';
}

export interface KpiMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}