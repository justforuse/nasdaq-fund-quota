import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Fund, statusLabels } from '../types/fund';
import { formatCurrency, formatReturn, getReturnColor, getStatusColor } from '../utils/format';
import { FundDetail } from './FundDetail';
import { cn } from '../lib/utils';

interface FundCardProps {
  fund: Fund;
}

export const FundCard = ({ fund }: FundCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'md:hidden bg-dark-card/50 backdrop-blur-sm rounded-2xl border border-dark-border overflow-hidden transition-all duration-300',
        expanded && 'ring-2 ring-primary-500/30'
      )}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer active:bg-dark-border/30 transition-colors min-h-[60px] touch-manipulation"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-base leading-tight truncate">
              {fund.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <code className="text-gray-400 font-mono text-xs bg-dark-bg px-2 py-1 rounded">
                {fund.code}
              </code>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-lg border',
                  getStatusColor(fund.limitStatus)
                )}
              >
                {statusLabels[fund.limitStatus]}
              </span>
              {fund.estimatedChange != null && (
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-lg',
                  fund.estimatedChange >= 0 ? 'bg-success-500/20 text-success-500' : 'bg-danger-500/20 text-danger-500'
                )}>
                  估算 {fund.estimatedChange >= 0 ? '+' : ''}{fund.estimatedChange.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn('text-xl font-bold', getReturnColor(fund.oneYearReturn))}>
              {formatReturn(fund.oneYearReturn)}
            </span>
            <div className="text-xs text-gray-400">近一年</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-dark-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {fund.limitStatus === 'limited' ? (
                <span className="text-warning-500 font-medium">
                  单日限额 {formatCurrency(fund.limitAmount)}
                </span>
              ) : fund.limitStatus === 'unlimited' ? (
                <span className="text-success-500 font-medium">无限制</span>
              ) : (
                <span className="text-danger-500 font-medium">暂停申购</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>{expanded ? '收起' : '展开'}</span>
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <a
            href={`http://fundf10.eastmoney.com/jjgg_${fund.code}.html`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 text-xs font-medium transition-colors"
          >
            查看公告详情
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <FundDetail fund={fund} />
        </div>
      )}
    </div>
  );
};

export const FundCardList = ({ funds }: { funds: Fund[] }) => {
  if (funds.length === 0) {
    return (
      <div className="md:hidden py-16 text-center text-gray-500">
        暂无符合条件的基金数据
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-4">
      {funds.map(fund => (
        <FundCard key={fund.id} fund={fund} />
      ))}
    </div>
  );
};
