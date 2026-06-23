import { FundLimitStatus } from '../types/fund';

export const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) return '-';
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}万元`;
  }
  return `${amount.toLocaleString()}元`;
};

export const formatReturn = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getReturnColor = (value: number): string => {
  if (value > 0) return 'text-success-500';
  if (value < 0) return 'text-danger-500';
  return 'text-gray-400';
};

export const getStatusColor = (status: FundLimitStatus): string => {
  switch (status) {
    case 'unlimited':
      return 'bg-success-500/20 text-success-500 border-success-500/30';
    case 'limited':
      return 'bg-warning-500/20 text-warning-500 border-warning-500/30';
    case 'suspended':
      return 'bg-danger-500/20 text-danger-500 border-danger-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const formatFundSize = (size: number): string => {
  return `${size.toFixed(2)}亿元`;
};
