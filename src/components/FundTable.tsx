import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Fund, statusLabels } from '../types/fund';
import { formatCurrency, formatReturn, getReturnColor, getStatusColor } from '../utils/format';
import { FundDetail } from './FundDetail';
import { cn } from '../lib/utils';

interface FundTableProps {
  funds: Fund[];
}

export const FundTable = ({ funds }: FundTableProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="hidden md:block bg-dark-card/50 backdrop-blur-sm rounded-2xl border border-dark-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-border/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                基金名称
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                基金代码
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                限额情况
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                近一年涨幅
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">
                详情
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {funds.map((fund, index) => (
              <>
                <tr
                  key={fund.id}
                  onClick={() => toggleExpand(fund.id)}
                  className={cn(
                    'transition-colors cursor-pointer hover:bg-dark-border/30',
                    index % 2 === 0 ? 'bg-dark-card/30' : 'bg-dark-card/10',
                    expandedId === fund.id && 'bg-dark-border/30'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="text-white font-medium">{fund.name}</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-lg border',
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
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-gray-300 font-mono text-sm bg-dark-bg px-2 py-1 rounded">
                      {fund.code}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {fund.limitStatus === 'limited' ? (
                        <span className="text-warning-500 font-medium text-sm">
                          单日限额 {formatCurrency(fund.limitAmount)}
                        </span>
                      ) : fund.limitStatus === 'unlimited' ? (
                        <span className="text-success-500 font-medium text-sm">无限制</span>
                      ) : (
                        <span className="text-danger-500 font-medium text-sm">暂停申购</span>
                      )}
                      <div>
                        <a
                          href={`http://fundf10.eastmoney.com/jjgg_${fund.code}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 text-xs font-medium transition-colors"
                        >
                          查看公告
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn('text-lg font-semibold', getReturnColor(fund.oneYearReturn))}>
                      {formatReturn(fund.oneYearReturn)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {expandedId === fund.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 mx-auto" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 mx-auto" />
                    )}
                  </td>
                </tr>
                {expandedId === fund.id && (
                  <tr className="animate-fade-in">
                    <td colSpan={5} className="px-6 py-0">
                      <FundDetail fund={fund} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      
      {funds.length === 0 && (
        <div className="py-16 text-center text-gray-500">
          暂无符合条件的基金数据
        </div>
      )}
    </div>
  );
};
