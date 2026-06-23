import { AlertTriangle, Info } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-12 pb-8">
      <div className="container">
        <div className="bg-dark-card/30 rounded-2xl p-6 border border-dark-border">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400">
                <p className="font-medium text-gray-300 mb-1">风险提示</p>
                <p>
                  基金有风险，投资需谨慎。本网站数据仅供参考，不构成任何投资建议。
                  投资者应根据自身风险承受能力谨慎决策。QDII基金投资海外市场，
                  面临汇率风险、市场风险等特有风险。
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400">
                <p className="font-medium text-gray-300 mb-1">数据说明</p>
                <p>
                  本网站展示的基金限额数据每日更新，实际限额以基金公司官方公告为准。
                  近一年涨幅数据为历史业绩，不代表未来表现。
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-dark-border text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} 纳斯达克基金限额查询 | 数据仅供参考
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
