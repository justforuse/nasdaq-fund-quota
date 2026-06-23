import { Building2, Calendar, PieChart, Shield, ExternalLink } from 'lucide-react';
import { Fund } from '../types/fund';
import { formatDate, formatFundSize } from '../utils/format';

interface FundDetailProps {
  fund: Fund;
}

export const FundDetail = ({ fund }: FundDetailProps) => {
  const details = [
    {
      icon: Building2,
      label: '基金公司',
      value: fund.company,
    },
    {
      icon: Calendar,
      label: '成立日期',
      value: formatDate(fund.establishDate),
    },
    {
      icon: PieChart,
      label: '基金规模',
      value: formatFundSize(fund.fundSize),
    },
    {
      icon: Shield,
      label: '风险等级',
      value: fund.riskLevel,
    },
  ];

  return (
    <div className="bg-dark-bg/50 rounded-xl p-4 md:p-6 animate-slide-down overflow-hidden">
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
      
      <div className="mt-4 pt-4 border-t border-dark-border flex items-center justify-between">
        <span className="text-xs text-gray-500">基金类型：{fund.fundType}</span>
        <a
          href={`https://fund.eastmoney.com/${fund.code}.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
        >
          查看详情
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
