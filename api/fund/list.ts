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
    rate: parseNumeric(row[12]),
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

const fetchRealtimeData = async (code: string): Promise<any | null> => {
  try {
    const apiResponse = await fetchWithTimeout(
      `http://fundgz.1234567.com.cn/js/${code}.js`,
      { headers: { ...DEFAULT_HEADERS, Referer: 'http://fund.eastmoney.com/' } },
      5000
    );
    if (!apiResponse.ok) return null;
    const text = await apiResponse.text();
    const jsonMatch = text.match(/jsonpgz\((.*)\);/);
    if (!jsonMatch || !jsonMatch[1]) return null;
    const data = JSON.parse(jsonMatch[1]);
    return {
      code: data.fundcode,
      name: data.name,
      netValue: parseFloat(data.dwjz),
      estimatedValue: parseFloat(data.gsz),
      estimatedChange: parseFloat(data.gszzl),
      updateTime: data.gztime,
    };
  } catch {
    return null;
  }
};

const fetchDetailData = async (code: string): Promise<any | null> => {
  try {
    const apiResponse = await fetchWithTimeout(
      `http://fund.eastmoney.com/pingzhongdata/${code}.js`,
      { headers: { ...DEFAULT_HEADERS, Referer: `http://fund.eastmoney.com/${code}.html` } },
      5000
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
      oneYearReturn: parseFloat(extractValue('syl_1n')) || 0,
      sourceRate: parseFloat(extractValue('fund_sourceRate')) || 0,
      rate: parseFloat(extractValue('fund_Rate')) || 0,
    };
  } catch {
    return null;
  }
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const crawledFunds = await crawlNasdaqFunds(6000);

    let fundCodes: string[];
    let crawledMap: Record<string, CrawledFund> = {};

    if (crawledFunds.length > 0) {
      fundCodes = crawledFunds.map(f => f.code);
      for (const f of crawledFunds) {
        crawledMap[f.code] = f;
      }
    } else {
      fundCodes = FALLBACK_CODES;
    }

    const batchSize = 8;
    const allRealtime: (any | null)[] = [];
    const allDetail: (any | null)[] = [];

    for (let i = 0; i < fundCodes.length; i += batchSize) {
      const batch = fundCodes.slice(i, i + batchSize);
      const [realtimeBatch, detailBatch] = await Promise.all([
        Promise.all(batch.map(code => fetchRealtimeData(code))),
        Promise.all(batch.map(code => fetchDetailData(code))),
      ]);
      allRealtime.push(...realtimeBatch);
      allDetail.push(...detailBatch);
    }

    const funds: Fund[] = fundCodes.map((code, index) => {
      const crawled = crawledMap[code];
      const realtime = allRealtime[index];
      const detail = allDetail[index];

      let limitInfo: { status: FundLimitStatus; amount: number | undefined; note: string };

      if (crawled) {
        limitInfo = determineLimitStatus(
          crawled.purchaseStatus,
          crawled.dailyLimit,
          crawled.isUnlimited,
          crawled.isSuspended
        );
      } else {
        limitInfo = { status: 'unlimited', amount: undefined, note: '无限制' };
      }

      return {
        id: code,
        code,
        name: detail?.name || crawled?.name || realtime?.name || '',
        limitStatus: limitInfo.status,
        limitAmount: limitInfo.amount,
        limitNote: limitInfo.note,
        oneYearReturn: detail?.oneYearReturn || 0,
        fundType: crawled?.fundType || 'QDII指数型',
        lastUpdated: realtime?.updateTime || new Date().toISOString(),
        netValue: realtime?.netValue || crawled?.netValue,
        estimatedValue: realtime?.estimatedValue,
        estimatedChange: realtime?.estimatedChange,
        sourceRate: detail?.sourceRate || crawled?.rate,
        rate: detail?.rate || crawled?.rate,
      };
    });

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');

    return response.status(200).json({
      funds,
      lastUpdated: new Date().toISOString(),
      discoveredCount: crawledFunds.length || fundCodes.length,
      source: crawledFunds.length > 0 ? 'crawl' : 'fallback',
    });
  } catch (error) {
    console.error('获取基金列表失败:', error);
    return response.status(500).json({ error: '获取数据失败' });
  }
}
