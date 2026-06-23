import type { VercelRequest, VercelResponse } from '@vercel/node';

const NASDAQ_FUND_CODES = [
  '270042',
  '160213',
  '040046',
  '000834',
  '003722',
  '006479',
  '513100',
  '159659',
  '007280',
  '011417',
  '008766',
  '004903',
  '007800',
  '013308',
  '050025',
];

interface FundBaseInfo {
  code: string;
  name: string;
  company: string;
  establishDate: string;
  fundSize: number;
  fundType: string;
  riskLevel: string;
}

const FUND_BASE_INFO: Record<string, FundBaseInfo> = {
  '270042': {
    code: '270042',
    name: '广发纳斯达克100ETF联接人民币(QDII)A',
    company: '广发基金管理有限公司',
    establishDate: '2012-08-15',
    fundSize: 85.62,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '160213': {
    code: '160213',
    name: '国泰纳斯达克100指数(QDII)',
    company: '国泰基金管理有限公司',
    establishDate: '2010-04-29',
    fundSize: 72.31,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '040046': {
    code: '040046',
    name: '华安纳斯达克100指数(QDII)',
    company: '华安基金管理有限公司',
    establishDate: '2013-08-02',
    fundSize: 63.45,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '000834': {
    code: '000834',
    name: '大成纳斯达克100指数(QDII)',
    company: '大成基金管理有限公司',
    establishDate: '2014-11-14',
    fundSize: 28.76,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '003722': {
    code: '003722',
    name: '易方达纳斯达克100指数(QDII)',
    company: '易方达基金管理有限公司',
    establishDate: '2016-12-02',
    fundSize: 56.89,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '006479': {
    code: '006479',
    name: '华夏纳斯达克100ETF联接(QDII)',
    company: '华夏基金管理有限公司',
    establishDate: '2018-10-18',
    fundSize: 42.18,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '513100': {
    code: '513100',
    name: '国泰纳斯达克100ETF',
    company: '国泰基金管理有限公司',
    establishDate: '2013-05-15',
    fundSize: 125.34,
    fundType: 'ETF-场内',
    riskLevel: 'R4中高风险',
  },
  '159659': {
    code: '159659',
    name: '华夏纳斯达克100ETF',
    company: '华夏基金管理有限公司',
    establishDate: '2022-07-20',
    fundSize: 98.56,
    fundType: 'ETF-场内',
    riskLevel: 'R4中高风险',
  },
  '007280': {
    code: '007280',
    name: '上投摩根纳斯达克100指数(QDII)',
    company: '上投摩根基金管理有限公司',
    establishDate: '2019-09-18',
    fundSize: 15.67,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '011417': {
    code: '011417',
    name: '工银瑞信纳斯达克100指数(QDII)',
    company: '工银瑞信基金管理有限公司',
    establishDate: '2021-03-17',
    fundSize: 8.23,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '008766': {
    code: '008766',
    name: '嘉实纳斯达克100指数(QDII)',
    company: '嘉实基金管理有限公司',
    establishDate: '2019-12-24',
    fundSize: 22.45,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '004903': {
    code: '004903',
    name: '南方纳斯达克100指数(QDII)',
    company: '南方基金管理股份有限公司',
    establishDate: '2017-07-26',
    fundSize: 31.78,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '007800': {
    code: '007800',
    name: '招商纳斯达克100指数(QDII)',
    company: '招商基金管理有限公司',
    establishDate: '2019-08-28',
    fundSize: 18.92,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '013308': {
    code: '013308',
    name: '汇添富纳斯达克100指数(QDII)',
    company: '汇添富基金管理股份有限公司',
    establishDate: '2021-10-26',
    fundSize: 45.23,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
  '050025': {
    code: '050025',
    name: '博时标普500指数(QDII)',
    company: '博时基金管理有限公司',
    establishDate: '2012-06-14',
    fundSize: 38.92,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
  },
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const funds = await Promise.all(
      NASDAQ_FUND_CODES.map(async (code) => {
        const baseInfo = FUND_BASE_INFO[code];
        
        try {
          const [realtimeRes, detailRes] = await Promise.all([
            fetch(
              `${request.headers['x-forwarded-proto'] || 'https'}://${request.headers.host}/api/fund/realtime?code=${code}`
            ),
            fetch(
              `${request.headers['x-forwarded-proto'] || 'https'}://${request.headers.host}/api/fund/detail?code=${code}`
            ),
          ]);

          const realtime = realtimeRes.ok ? await realtimeRes.json() : null;
          const detail = detailRes.ok ? await detailRes.json() : null;

          return {
            id: code,
            code,
            name: detail?.name || baseInfo.name,
            limitStatus: 'unlimited' as const,
            limitAmount: undefined,
            limitNote: '限额以基金公司公告为准',
            oneYearReturn: detail?.oneYearReturn || 0,
            company: baseInfo.company,
            establishDate: baseInfo.establishDate,
            fundSize: baseInfo.fundSize,
            fundType: baseInfo.fundType,
            riskLevel: baseInfo.riskLevel,
            lastUpdated: realtime?.updateTime || new Date().toISOString(),
            netValue: realtime?.netValue,
            estimatedValue: realtime?.estimatedValue,
            estimatedChange: realtime?.estimatedChange,
            sourceRate: detail?.sourceRate,
            rate: detail?.rate,
          };
        } catch (err) {
          console.error(`获取基金 ${code} 数据失败:`, err);
          return {
            id: code,
            code,
            name: baseInfo.name,
            limitStatus: 'unlimited' as const,
            limitAmount: undefined,
            limitNote: '限额以基金公司公告为准',
            oneYearReturn: 0,
            company: baseInfo.company,
            establishDate: baseInfo.establishDate,
            fundSize: baseInfo.fundSize,
            fundType: baseInfo.fundType,
            riskLevel: baseInfo.riskLevel,
            lastUpdated: new Date().toISOString(),
          };
        }
      })
    );

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');

    return response.status(200).json({
      funds,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取基金列表失败:', error);
    return response.status(500).json({ error: '获取数据失败' });
  }
}
