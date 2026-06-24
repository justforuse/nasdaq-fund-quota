import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Fund, FundLimitStatus } from '../../src/types/fund';

const UNLIMITED_THRESHOLD = 800000000;
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const NASDAQ_KEYWORDS = ['纳斯达克', '纳指'];
const EXCLUDE_KEYWORDS = ['标普', '道琼斯', '德国', '法国', '英国', '日本', '日经', '恒生', '越南', '印度'];

const FALLBACK_CODES = [
  '270042', '160213', '040046', '000834', '003722',
  '006479', '513100', '159659', '007280', '011417',
  '008766', '004903', '007800', '013308',
];

const parseNumeric = (val: string | null): number | null => {
  if (!val || val.trim() === '' || val === '---') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 8000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const isNasdaqFund = (name: string): boolean => {
  if (!NASDAQ_KEYWORDS.some(kw => name.includes(kw))) return false;
  if (EXCLUDE_KEYWORDS.some(kw => name.includes(kw))) return false;
  return true;
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

interface CrawledFund {
  code: string;
  name: string;
  fundType: string;
  netValue: number | null;
  purchaseStatus: string;
  dailyLimit: number | null;
  isUnlimited: boolean;
  isSuspended: boolean;
  rate: number | null;
}

const parseFundFromRow = (row: string[]): CrawledFund | null => {
  if (!row || row.length < 10) return null;
  const code = row[0] || '';
  const name = row[1] || '';
  if (!code || !name) return null;

  const dailyLimitRaw = row[9] || '';
  const isUnlimited = dailyLimitRaw.includes('无限额') ||
    (parseNumeric(dailyLimitRaw) !== null && parseNumeric(dailyLimitRaw)! >= UNLIMITED_THRESHOLD);
  const isSuspended = dailyLimitRaw.trim() === '' || dailyLimitRaw === '---' ||
    row[5] === '暂停申购' || row[5] === '停止申购';

  let dailyLimit: number | null = null;
  if (!isUnlimited && !isSuspended) {
    dailyLimit = parseNumeric(dailyLimitRaw);
  }

  return {
    code,
    name,
    fundType: row[2] || '',
    netValue: parseNumeric(row[3]),
    purchaseStatus: row[5] || '',
    dailyLimit,
    isUnlimited,
    isSuspended,
    rate: parseNumeric(row[6]),
  };
};

const crawlNasdaqFunds = async (timeoutMs: number): Promise<CrawledFund[]> => {
  const headers = {
    ...DEFAULT_HEADERS,
    'Referer': 'http://fund.eastmoney.com/Fund_sgzt_bzdm.html',
  };

  try {
    const url = `http://fund.eastmoney.com/Data/Fund_JJJZ_Data.aspx?t=8&page=1,30000&js=var%20reData&sort=fcode,asc`;
    const res = await fetchWithTimeout(url, { headers }, timeoutMs);
    if (!res.ok) return [];

    const text = await res.text();
    const arrMatch = text.match(/datas:\s*(\[[\s\S]*?\]),\s*record/);
    if (!arrMatch) return [];

    const datas = JSON.parse(arrMatch[1]);
    const nasdaqFunds = datas
      .filter((row: string[]) => isNasdaqFund(row[1] || ''))
      .map((row: string[]) => parseFundFromRow(row))
      .filter((f: CrawledFund | null): f is CrawledFund => f !== null);

    const seen = new Set<string>();
    return nasdaqFunds.filter(f => {
      if (seen.has(f.code)) return false;
      seen.add(f.code);
      return true;
    });
  } catch (error) {
    console.error('Crawl failed:', error);
    return [];
  }
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const crawledFunds = await crawlNasdaqFunds(8000);

    let fundList: CrawledFund[];
    if (crawledFunds.length > 0) {
      fundList = crawledFunds;
    } else {
      fundList = FALLBACK_CODES.map(code => ({
        code,
        name: '',
        fundType: 'QDII指数型',
        netValue: null,
        purchaseStatus: '',
        dailyLimit: null,
        isUnlimited: true,
        isSuspended: false,
        rate: null,
      }));
    }

    const funds: Fund[] = fundList.map(crawled => {
      const limitInfo = determineLimitStatus(
        crawled.purchaseStatus,
        crawled.dailyLimit,
        crawled.isUnlimited,
        crawled.isSuspended
      );

      return {
        id: crawled.code,
        code: crawled.code,
        name: crawled.name,
        limitStatus: limitInfo.status,
        limitAmount: limitInfo.amount,
        limitNote: limitInfo.note,
        oneYearReturn: 0,
        fundType: crawled.fundType || 'QDII指数型',
        lastUpdated: new Date().toISOString(),
        netValue: crawled.netValue,
        estimatedChange: crawled.rate,
        rate: crawled.rate,
      };
    });

    const codes = fundList.map(f => f.code);

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');

    return response.status(200).json({
      funds,
      lastUpdated: new Date().toISOString(),
      discoveredCount: fundList.length,
      source: crawledFunds.length > 0 ? 'crawl' : 'fallback',
      codesForReturns: codes.join(','),
    });
  } catch (error) {
    console.error('获取基金列表失败:', error);
    return response.status(500).json({ error: '获取数据失败' });
  }
}
