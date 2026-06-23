import type { VercelRequest, VercelResponse } from '@vercel/node';

interface FundLimitInfo {
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

const parseNumeric = (val: string | null): number | null => {
  if (!val || val.trim() === '' || val === '---') {
    return null;
  }
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const { code } = request.query;

  if (!code) {
    return response.status(400).json({ error: '请提供基金代码' });
  }

  const codeStr = Array.isArray(code) ? code.join(',') : code;
  const targetCodes = codeStr.split(',').map((c) => c.trim()).filter((c) => c.length > 0);

  if (targetCodes.length === 0) {
    return response.status(400).json({ error: '请提供有效的基金代码' });
  }

  try {
    const results: Record<string, FundLimitInfo> = {};

    const apiUrl = `http://fund.eastmoney.com/Data/Fund_JJJZ_Data.aspx?t=8&page=1,500&js=var%20reData&sort=fcode,asc`;
    
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'Referer': 'http://fund.eastmoney.com/Fund_sgzt_bzdm.html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!apiResponse.ok) {
      return response.status(502).json({ error: '获取限额数据失败' });
    }

    const text = await apiResponse.text();
    const jsonMatch = text.match(/var\s+reData\s*=\s*(\{[\s\S]*\})/);
    
    if (!jsonMatch) {
      return response.status(502).json({ error: '解析限额数据失败' });
    }

    const data = JSON.parse(jsonMatch[1]);

    for (const targetCode of targetCodes) {
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

    response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=7200');
    return response.status(200).json(results);
  } catch (error) {
    console.error('获取基金限额信息失败:', error);
    return response.status(500).json({ error: '获取基金限额信息失败' });
  }
}
