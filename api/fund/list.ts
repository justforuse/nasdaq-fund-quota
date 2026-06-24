import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Fund, FundLimitStatus } from '../../src/types/fund';

const UNLIMITED_THRESHOLD = 800000000;
const PAGE_SIZE = 5000;
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const NASDAQ_KEYWORDS = ['纳斯达克', '纳指', 'NSDAQ', 'NASDAQ'];
const EXCLUDE_KEYWORDS = ['标普', 'SPI', 'S&P', '道琼斯', 'Dow Jones', '德国', '法国', '英国', '日本', '日经', '恒生', '越南', '印度'];

const parseNumeric = (val: string | null): number | null => {
  if (!val || val.trim() === '' || val === '---') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000): Promise<Response> => {
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
    console.error(`Realtime fetch failed ${code}:`, error);
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
    console.error(`Detail fetch failed ${code}:`, error);
    return null;
  }
};

interface CrawledFund {
  code: string;
  name: string;
  fundType: string;
  netValue: number | null;
  netValueDate: string | null;
  purchaseStatus: string;
  redeemStatus: string;
  nextOpenDate: string;
  minPurchase: number | null;
  dailyLimit: number | null;
  isUnlimited: boolean;
  isSuspended: boolean;
  rate: number | null;
  rateDiscount: number | null;
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
    netValueDate: row[4] || null,
    purchaseStatus: row[5] || '',
    redeemStatus: row[6] || '',
    nextOpenDate: row[7] || '',
    minPurchase: parseNumeric(row[8]),
    dailyLimit,
    isUnlimited,
    isSuspended,
    rate: parseNumeric(row[12]),
    rateDiscount: parseNumeric(row[10]),
  };
};

const crawlNasdaqFunds = async (): Promise<CrawledFund[]> => {
  const headers = {
    ...DEFAULT_HEADERS,
    'Referer': 'http://fund.eastmoney.com/Fund_sgzt_bzdm.html',
  };

  const firstPageUrl = `http://fund.eastmoney.com/Data/Fund_JJJZ_Data.aspx?t=8&page=1,${PAGE_SIZE}&js=var%20reData&sort=fcode,asc`;
  const firstPageRes = await fetchWithTimeout(firstPageUrl, { headers }, 12000);
  if (!firstPageRes.ok) return [];

  const firstPageText = await firstPageRes.text();
  const totalPagesMatch = firstPageText.match(/pages:"(\d+)"/);
  const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 1;

  const parsePageNasdaq = (text: string): CrawledFund[] => {
    const arrMatch = text.match(/datas:\s*(\[[\s\S]*?\]),\s*record/);
    if (!arrMatch) return [];
    const datas = JSON.parse(arrMatch[1]);
    return datas
      .filter((row: string[]) => isNasdaqFund(row[1] || ''))
      .map((row: string[]) => parseFundFromRow(row))
      .filter((f: CrawledFund | null): f is CrawledFund => f !== null);
  };

  let allNasdaq = parsePageNasdaq(firstPageText);

  if (totalPages > 1) {
    const otherPagesText = await Promise.all(
      Array.from({ length: totalPages - 1 }, async (_, i) => {
        try {
          const url = `http://fund.eastmoney.com/Data/Fund_JJJZ_Data.aspx?t=8&page=${i + 2},${PAGE_SIZE}&js=var%20reData&sort=fcode,asc`;
          const res = await fetchWithTimeout(url, { headers }, 12000);
          return res.ok ? await res.text() : '';
        } catch {
          return '';
        }
      })
    );
    for (const pageText of otherPagesText) {
      if (pageText) {
        allNasdaq = allNasdaq.concat(parsePageNasdaq(pageText));
      }
    }
  }

  const seen = new Set<string>();
  return allNasdaq.filter(f => {
    if (seen.has(f.code)) return false;
    seen.add(f.code);
    return true;
  });
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const nasdaqFunds = await crawlNasdaqFunds();

    if (nasdaqFunds.length === 0) {
      return response.status(500).json({ error: '未发现纳斯达克基金数据' });
    }

    const fundCodes = nasdaqFunds.map(f => f.code);

    const [realtimeResults, detailResults] = await Promise.all([
      Promise.all(fundCodes.map(code => fetchRealtimeData(code))),
      Promise.all(fundCodes.map(code => fetchDetailData(code))),
    ]);

    const funds: Fund[] = nasdaqFunds.map((crawled, index) => {
      const realtime = realtimeResults[index];
      const detail = detailResults[index];

      const limitInfo = determineLimitStatus(
        crawled.purchaseStatus,
        crawled.dailyLimit,
        crawled.isUnlimited,
        crawled.isSuspended
      );

      return {
        id: crawled.code,
        code: crawled.code,
        name: detail?.name || crawled.name,
        limitStatus: limitInfo.status,
        limitAmount: limitInfo.amount,
        limitNote: limitInfo.note,
        oneYearReturn: detail?.oneYearReturn || 0,
        company: '',
        establishDate: '',
        fundSize: 0,
        fundType: crawled.fundType,
        riskLevel: '',
        lastUpdated: realtime?.updateTime || crawled.netValueDate || new Date().toISOString(),
        netValue: realtime?.netValue || crawled.netValue,
        estimatedValue: realtime?.estimatedValue,
        estimatedChange: realtime?.estimatedChange,
        sourceRate: detail?.sourceRate || crawled.rate,
        rate: detail?.rate || crawled.rate,
      };
    });

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');

    return response.status(200).json({
      funds,
      lastUpdated: new Date().toISOString(),
      discoveredCount: nasdaqFunds.length,
    });
  } catch (error) {
    console.error('获取基金列表失败:', error);
    return response.status(500).json({ error: '获取数据失败' });
  }
}
