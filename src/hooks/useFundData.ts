import { useState, useEffect, useCallback } from 'react';
import { Fund, FilterOptions } from '../types/fund';

const CACHE_KEY = 'fund_data_cache';
const RETURNS_CACHE_KEY = 'fund_returns_cache';
const CACHE_DURATION = 5 * 60 * 1000;

interface ListApiResponse {
  funds: Fund[];
  lastUpdated: string;
  discoveredCount: number;
  source: string;
  codesForReturns: string;
}

interface ReturnsApiResponse {
  returns: Record<string, number>;
  lastUpdated: string;
}

interface UseFundDataReturn {
  funds: Fund[];
  loading: boolean;
  returnsLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  refresh: () => Promise<void>;
  filteredFunds: Fund[];
}

const fetchFundList = async (): Promise<ListApiResponse> => {
  const response = await fetch('/api/fund/list');
  if (!response.ok) {
    throw new Error('Failed to fetch fund list');
  }
  return response.json();
};

const fetchFundReturns = async (codes: string): Promise<ReturnsApiResponse> => {
  const response = await fetch(`/api/fund/returns?codes=${codes}`);
  if (!response.ok) {
    throw new Error('Failed to fetch fund returns');
  }
  return response.json();
};

export const useFundData = (): UseFundDataReturn => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [returnsLoading, setReturnsLoading] = useState<boolean>(false);
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
        const cachedList = localStorage.getItem(CACHE_KEY);
        const cachedReturns = localStorage.getItem(RETURNS_CACHE_KEY);
        if (cachedList && cachedReturns) {
          const { data: listData, timestamp: listTimestamp } = JSON.parse(cachedList);
          const { data: returnsData, timestamp: returnsTimestamp } = JSON.parse(cachedReturns);
          if (Date.now() - listTimestamp < CACHE_DURATION && Date.now() - returnsTimestamp < CACHE_DURATION) {
            const mergedFunds = listData.funds.map((f: Fund) => ({
              ...f,
              oneYearReturn: returnsData.returns[f.code] || f.oneYearReturn,
            }));
            setFunds(mergedFunds);
            setLastUpdated(listData.lastUpdated);
            setLoading(false);
            return;
          }
        }
      }

      const listData = await fetchFundList();
      setFunds(listData.funds);
      setLastUpdated(listData.lastUpdated);
      setLoading(false);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: listData,
          timestamp: Date.now(),
        })
      );

      if (listData.codesForReturns) {
        setReturnsLoading(true);
        try {
          const returnsData = await fetchFundReturns(listData.codesForReturns);
          setFunds(prev => prev.map(f => ({
            ...f,
            oneYearReturn: returnsData.returns[f.code] || f.oneYearReturn,
          })));

          localStorage.setItem(
            RETURNS_CACHE_KEY,
            JSON.stringify({
              data: returnsData,
              timestamp: Date.now(),
            })
          );
        } catch (returnsErr) {
          console.error('Failed to fetch returns:', returnsErr);
        } finally {
          setReturnsLoading(false);
        }
      }
    } catch (err) {
      setError('数据加载失败，请稍后重试');
      console.error('Failed to fetch fund data:', err);
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
    returnsLoading,
    error,
    lastUpdated,
    filters,
    setFilters,
    refresh,
    filteredFunds,
  };
};
