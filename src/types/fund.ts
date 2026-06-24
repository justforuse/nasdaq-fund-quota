export type FundLimitStatus = 'unlimited' | 'limited' | 'suspended';

export interface Fund {
  id: string;
  code: string;
  name: string;
  limitStatus: FundLimitStatus;
  limitAmount?: number;
  limitNote?: string;
  oneYearReturn: number;
  company?: string;
  establishDate?: string;
  fundSize?: number;
  fundType: string;
  riskLevel?: string;
  lastUpdated: string;
  netValue?: number;
  estimatedValue?: number;
  estimatedChange?: number;
  sourceRate?: number;
  rate?: number;
}

export interface FilterOptions {
  status: 'all' | FundLimitStatus;
  sortBy: 'name' | 'code' | 'limit' | 'return';
  sortOrder: 'asc' | 'desc';
}

export const statusLabels: Record<FundLimitStatus, string> = {
  unlimited: '不限购',
  limited: '限购',
  suspended: '暂停申购',
};

export const sortLabels: Record<FilterOptions['sortBy'], string> = {
  name: '基金名称',
  code: '基金代码',
  limit: '限额金额',
  return: '近一年涨幅',
};
