import { RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { formatDateTime } from '../utils/format';

interface HeaderProps {
  lastUpdated: string | null;
  onRefresh: () => void;
  loading: boolean;
  returnsLoading?: boolean;
}

export const Header = ({ lastUpdated, onRefresh, loading, returnsLoading }: HeaderProps) => {
  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-900 to-dark-bg" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative container py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/20 rounded-xl">
                <TrendingUp className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-tight">
                  纳斯达克基金限额查询
                </h1>
              </div>
            </div>
            <p className="text-gray-400 text-sm md:text-base max-w-xl">
              实时查询国内QDII纳斯达克指数基金的限购情况，助力您的海外投资决策
            </p>
            {lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>数据更新时间：{formatDateTime(lastUpdated)}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={onRefresh}
            disabled={loading || returnsLoading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading || returnsLoading ? 'animate-spin' : ''}`} />
            <span>{loading ? '加载中...' : returnsLoading ? '获取收益率...' : '刷新数据'}</span>
          </button>
        </div>
        
        <div className="mt-8 h-1 w-full bg-gradient-to-r from-transparent via-primary-500/50 to-transparent rounded-full" />
      </div>
    </header>
  );
};
