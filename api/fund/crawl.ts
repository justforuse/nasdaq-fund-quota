import type { VercelRequest, VercelResponse } from '@vercel/node';

interface DiscoveredFund {
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

const UNLIMITED_THRESHOLD = 800000000;
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'http://fund.eastmoney.com/Fund_sgzt_bzdm.html',
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

const parseFundFromRow = (row: string[]): DiscoveredFund | null => {
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

const fetchAllFunds = async (): Promise<DiscoveredFund[]> => {
  try {
    const url = `http://fund.eastmoney.com/Data/Fund_JJJZ_Data.aspx?t=8&page=1,30000&js=var%20reData&sort=fcode,asc`;
    const response = await fetchWithTimeout(url, { headers: DEFAULT_HEADERS }, 20000);
    if (!response.ok) return [];

    const text = await response.text();
    const arrMatch = text.match(/datas:\s*(\[[\s\S]*?\]),\s*record/);
    if (!arrMatch) return [];

    const datas = JSON.parse(arrMatch[1]);
    return datas
      .filter((row: string[]) => isNasdaqFund(row[1] || ''))
      .map((row: string[]) => parseFundFromRow(row))
      .filter((f: DiscoveredFund | null): f is DiscoveredFund => f !== null);
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
    const allNasdaqFunds = await fetchAllFunds();

    const seen = new Set<string>();
    const deduped = allNasdaqFunds.filter(f => {
      if (seen.has(f.code)) return false;
      seen.add(f.code);
      return true;
    });

    const result: Record<string, DiscoveredFund> = {};
    for (const fund of deduped) {
      result[fund.code] = fund;
    }

    response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=7200');
    return response.status(200).json({
      total: deduped.length,
      funds: result,
    });
  } catch (error) {
    console.error('Crawl failed:', error);
    return response.status(500).json({ error: '爬取基金数据失败' });
  }
}
