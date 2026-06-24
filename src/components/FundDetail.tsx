import { Building2, Calendar, PieChart, Shield, ExternalLink, TrendingUp, DollarSign } from 'lucide-react';
import { Fund } from '../types/fund';
import { formatDate, formatFundSize, formatReturn } from '../utils/format';
import { cn } from '../lib/utils';

interface FundDetailProps {
  fund: Fund;
}

export const FundDetail = ({ fund }: FundDetailProps) => {
  const realtimeDetails = [];

  if (fund.netValue !== undefined) {
    realtimeDetails.push({
      icon: DollarSign,
      label: '单位净值',
      value: fund.netValue.toFixed(4),
    });
  }

  if (fund.estimatedValue !== undefined) {
    realtimeDetails.push({
      icon: TrendingUp,
      label: '估算净值',
      value: fund.estimatedValue.toFixed(4),
    });
  }

  if (fund.estimatedChange !== undefined) {
    realtimeDetails.push({
      icon: TrendingUp,
      label: '估算涨幅',
      value: `${fund.estimatedChange >= 0 ? '+' : ''}${fund.estimatedChange.toFixed(2)}%`,
      highlight: true,
      isPositive: fund.estimatedChange >= 0,
    });
  }

  if (fund.rate !== undefined) {
    realtimeDetails.push({
      icon: DollarSign,
      label: '申购费率',
      value: `${fund.rate.toFixed(2)}%`,
    });
  }

  const details = [];
  if (fund.company) {
    details.push({ icon: Building2, label: '基金公司', value: fund.company });
  }
  if (fund.establishDate) {
    details.push({ icon: Calendar, label: '成立日期', value: formatDate(fund.establishDate) });
  }
  if (fund.fundSize) {
    details.push({ icon: PieChart, label: '基金规模', value: formatFundSize(fund.fundSize) });
  }
  if (fund.riskLevel) {
    details.push({ icon: Shield, label: '风险等级', value: fund.riskLevel });
  }

  return (
    <div className="bg-dark-bg/50 rounded-xl p-4 md:p-6 animate-slide-down overflow-hidden">
      {realtimeDetails.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {realtimeDetails.map(({ icon: Icon, label, value, highlight, isPositive }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </div>
                <div className={cn(
                  'text-sm font-medium',
                  highlight
                    ? isPositive ? 'text-success-500' : 'text-danger-500'
                    : 'text-gray-300'
                )}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-dark-border/50" />
        </>
      )}

      {details.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </div>
              <div className="text-sm text-gray-300 font-medium">{value}</div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-dark-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-xs text-gray-500">基金类型：{fund.fundType}</span>
        <div className="flex items-center gap-4">
          <a
            href={`http://fundf10.eastmoney.com/jjgg_${fund.code}.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-warning-500 hover:text-warning-400 transition-colors"
          >
            查看限额公告
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={`https://fund.eastmoney.com/${fund.code}.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            基金详情
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
