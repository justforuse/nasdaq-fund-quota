import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Fund, FundLimitStatus } from '../../src/types/fund';

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
    name: '招商纳斯达克100ETF',
    company: '招商基金管理有限公司',
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
};

const UNLIMITED_THRESHOLD = 800000000;
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const parseNumeric = (val: string | null): number | null => {
  if (!val || val.trim() === '' || val === '---') {
    return null;
  }
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

const determineLimitStatus = (
  purchaseStatus: string,
  dailyLimit: number | null,
  isUnlimited: boolean,
  isSuspended: boolean
): { status: FundLimitStatus; amount: number | undefined; note: string } => {
  if (isSuspended || purchaseStatus === '暂停申购' || purchaseStatus === '停止申购') {
    return { status: 'suspended', amount: undefined, note: '暂停申购' };
  }
  if (isUnlimited) {
    return { status: 'unlimited', amount: undefined, note: '无限制' };
  }
  if (dailyLimit !== null && dailyLimit > 0 && dailyLimit < UNLIMITED_THRESHOLD) {
    return { status: 'limited', amount: dailyLimit, note: `单日限额 ${dailyLimit.toLocaleString()} 元` };
  }
  return { status: 'unlimited', amount: undefined, note: '无限制' };
};

const fetchRealtimeData = async (code: string): Promise<any | null> => {
  try {
    const apiResponse = await fetchWithTimeout(
      `http://fundgz.1234567.com.cn/js/${code}.js`,
      {
        headers: {
          ...DEFAULT_HEADERS,
          Referer: 'http://fund.eastmoney.com/',
        },
      },
      8000
    );

    if (!apiResponse.ok) return null;
    const text = await apiResponse.text();
    
    const jsonMatch = text.match(/jsonpgz\((.*)\);/);
    if (!jsonMatch || !jsonMatch[1]) return null;

    const data = JSON.parse(jsonMatch[1]);
    return {
      code: data.fundcode,
      name: data.name,
      netValueDate: data.jzrq,
      netValue: parseFloat(data.dwjz),
      estimatedValue: parseFloat(data.gsz),
      estimatedChange: parseFloat(data.gszzl),
      updateTime: data.gztime,
    };
  } catch (error) {
    console.error(`获取实时数据失败 ${code}:`, error);
    return null;
  }
};

const fetchDetailData = async (code: string): Promise<any | null> => {
  try {
    const apiResponse = await fetchWithTimeout(
      `http://fund.eastmoney.com/pingzhongdata/${code}.js`,
      {
        headers: {
          ...DEFAULT_HEADERS,
          Referer: `http://fund.eastmoney.com/${code}.html`,
        },
      },
      8000
    );

    if (!apiResponse.ok) return null;
    const text = await apiResponse.text();

    const extractValue = (pattern: string): string => {
      const regex = new RegExp(`var ${pattern}\\s*=\\s*"([^"]*)"`, 'i');
      const match = text.match(regex);
      return match ? match[1] : '';
    };

    return {
      name: extractValue('fS_name'),
      code: extractValue('fS_code'),
      sourceRate: parseFloat(extractValue('fund_sourceRate')) || 0,
      rate: parseFloat(extractValue('fund_Rate')) || 0,
      minPurchase: parseFloat(extractValue('fund_minsg')) || 0,
      oneYearReturn: parseFloat(extractValue('syl_1n')) || 0,
    };
  } catch (error) {
    console.error(`获取详细数据失败 ${code}:`, error);
    return null;
  }
};

const fetchLimitData = async (codes: string[]): Promise<Record<string, any>> => {
  try {
    const apiUrl = `http://fund.eastmoney.com/Data/Fund_JJJZ_Data.aspx?t=8&page=1,500&js=var%20reData&sort=fcode,asc`;
    
    const apiResponse = await fetchWithTimeout(
      apiUrl,
      {
        headers: {
          ...DEFAULT_HEADERS,
          'Referer': 'http://fund.eastmoney.com/Fund_sgzt_bzdm.html',
        },
      },
      15000
    );

    if (!apiResponse.ok) {
      console.error('获取限额数据失败:', apiResponse.status);
      return {};
    }

    const text = await apiResponse.text();
    const jsonMatch = text.match(/var\s+reData\s*=\s*(\{[\s\S]*\})/);
    
    if (!jsonMatch) {
      console.error('解析限额数据失败');
      return {};
    }

    const data = JSON.parse(jsonMatch[1]);
    const results: Record<string, any> = {};

    for (const targetCode of codes) {
      const fundData = data.datas?.find((item: string[]) => item[0] === targetCode);

      if (fundData) {
        const dailyLimitRaw = fundData[9] || '';
        const isUnlimited = dailyLimitRaw.includes('无限额') || (parseNumeric(dailyLimitRaw) !== null && parseNumeric(dailyLimitRaw)! >= UNLIMITED_THRESHOLD);
        const isSuspended = dailyLimitRaw.trim() === '' || dailyLimitRaw === '---' || fundData[5] === '暂停申购' || fundData[5] === '停止申购';

        let dailyLimit: number | null = null;
        if (!isUnlimited && !isSuspended) {
          dailyLimit = parseNumeric(dailyLimitRaw);
        }

        results[targetCode] = {
          code: fundData[0] || targetCode,
          name: fundData[1] || '',
          fundType: fundData[2] || '',
          netValue: parseNumeric(fundData[3]),
          netValueDate: fundData[4] || null,
          purchaseStatus: fundData[5] || '',
          redeemStatus: fundData[6] || '',
          nextOpenDate: fundData[7] || '',
          minPurchase: parseNumeric(fundData[8]),
          dailyLimit,
          isUnlimited,
          isSuspended,
          rate: parseNumeric(fundData[12]),
          rateDiscount: parseNumeric(fundData[10]),
        };
      }
    }

    return results;
  } catch (error) {
    console.error('获取基金限额信息失败:', error);
    return {};
  }
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const [realtimeResults, detailResults, limitData] = await Promise.all([
      Promise.all(NASDAQ_FUND_CODES.map(code => fetchRealtimeData(code))),
      Promise.all(NASDAQ_FUND_CODES.map(code => fetchDetailData(code))),
      fetchLimitData(NASDAQ_FUND_CODES),
    ]);

    const funds: Fund[] = NASDAQ_FUND_CODES.map((code, index) => {
      const baseInfo = FUND_BASE_INFO[code];
      const realtime = realtimeResults[index];
      const detail = detailResults[index];
      const limit = limitData[code];

      const limitInfo = determineLimitStatus(
        limit?.purchaseStatus || '',
        limit?.dailyLimit ?? null,
        limit?.isUnlimited ?? false,
        limit?.isSuspended ?? false
      );

      return {
        id: code,
        code,
        name: detail?.name || limit?.name || baseInfo.name,
        limitStatus: limitInfo.status,
        limitAmount: limitInfo.amount,
        limitNote: limitInfo.note,
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
        rate: detail?.rate || limit?.rate,
      };
    });

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
