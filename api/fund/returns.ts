import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchOneYearReturn = async (code: string): Promise<{ code: string; oneYearReturn: number } | null> => {
  try {
    const apiResponse = await fetchWithTimeout(
      `http://fund.eastmoney.com/pingzhongdata/${code}.js`,
      { headers: { ...DEFAULT_HEADERS, Referer: `http://fund.eastmoney.com/${code}.html` } },
      5000
    );
    if (!apiResponse.ok) return null;
    const text = await apiResponse.text();
    const regex = /var\s+syl_1n\s*=\s*"([^"]*)"/i;
    const match = text.match(regex);
    if (!match) return null;
    return { code, oneYearReturn: parseFloat(match[1]) || 0 };
  } catch {
    return null;
  }
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const { codes } = request.query;
    if (!codes || typeof codes !== 'string') {
      return response.status(400).json({ error: 'Missing codes parameter' });
    }

    const codeList = codes.split(',').filter(Boolean);
    if (codeList.length === 0) {
      return response.status(400).json({ error: 'No valid codes provided' });
    }

    const returnPromises = codeList.map(code => fetchOneYearReturn(code));
    const returnResults = await Promise.all(returnPromises);

    const returnMap: Record<string, number> = {};
    for (const r of returnResults) {
      if (r) returnMap[r.code] = r.oneYearReturn;
    }

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');

    return response.status(200).json({
      returns: returnMap,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取收益率失败:', error);
    return response.status(500).json({ error: '获取收益率失败' });
  }
}
