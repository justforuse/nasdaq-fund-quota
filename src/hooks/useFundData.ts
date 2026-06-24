import { useState, useEffect, useCallback } from 'react';
import { Fund, FilterOptions } from '../types/fund';

const CACHE_KEY = 'fund_data_cache';
const CACHE_DURATION = 5 * 60 * 1000;

interface ApiResponse {
  funds: Fund[];
  lastUpdated: string;
  discoveredCount: number;
  source: string;
}

interface UseFundDataReturn {
  funds: Fund[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  refresh: () => Promise<void>;
  filteredFunds: Fund[];
}

export const useFundData = (): UseFundDataReturn => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    sortBy: 'return',
    sortOrder: 'desc',
  });

  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setFunds(data.funds);
            setLastUpdated(data.lastUpdated);
            setLoading(false);
            return;
          }
        }
      }

      const response = await fetch('/data/funds.json');
      if (!response.ok) {
        throw new Error('Failed to fetch fund data');
      }
      const data: ApiResponse = await response.json();

      setFunds(data.funds);
      setLastUpdated(data.lastUpdated);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      setError('数据加载失败，请稍后重试');
      console.error('Failed to fetch fund data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const filteredFunds = funds
    .filter(fund => {
      if (filters.status === 'all') return true;
      return fund.limitStatus === filters.status;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'limit':
          const aAmount = a.limitAmount ?? Infinity;
          const bAmount = b.limitAmount ?? Infinity;
          comparison = aAmount - bAmount;
          break;
        case 'return':
          comparison = a.oneYearReturn - b.oneYearReturn;
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

  return {
    funds,
    loading,
    error,
    lastUpdated,
    filters,
    setFilters,
    refresh,
    filteredFunds,
  };
};
