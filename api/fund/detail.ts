import type { VercelRequest, VercelResponse } from '@vercel/node';

interface FundDetailData {
  name: string;
  code: string;
  sourceRate: string;
  rate: string;
  minPurchase: string;
  syl_1n: string;
  syl_6y: string;
  syl_3y: string;
  syl_1y: string;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const { code } = request.query;

  if (!code || typeof code !== 'string') {
    return response.status(400).json({ error: '基金代码不能为空' });
  }

  try {
    const apiResponse = await fetch(
      `http://fund.eastmoney.com/pingzhongdata/${code}.js`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: `http://fund.eastmoney.com/${code}.html`,
        },
      }
    );

    const text = await apiResponse.text();

    const extractValue = (pattern: string): string => {
      const regex = new RegExp(`var ${pattern}\\s*=\\s*"([^"]*)"`, 'i');
      const match = text.match(regex);
      return match ? match[1] : '';
    };

    const data: FundDetailData = {
      name: extractValue('fS_name'),
      code: extractValue('fS_code'),
      sourceRate: extractValue('fund_sourceRate'),
      rate: extractValue('fund_Rate'),
      minPurchase: extractValue('fund_minsg'),
      syl_1n: extractValue('syl_1n'),
      syl_6y: extractValue('syl_6y'),
      syl_3y: extractValue('syl_3y'),
      syl_1y: extractValue('syl_1y'),
    };

    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

    return response.status(200).json({
      name: data.name,
      code: data.code,
      sourceRate: parseFloat(data.sourceRate) || 0,
      rate: parseFloat(data.rate) || 0,
      minPurchase: parseFloat(data.minPurchase) || 0,
      oneYearReturn: parseFloat(data.syl_1n) || 0,
      sixMonthReturn: parseFloat(data.syl_6y) || 0,
      threeMonthReturn: parseFloat(data.syl_3y) || 0,
      oneMonthReturn: parseFloat(data.syl_1y) || 0,
    });
  } catch (error) {
    console.error('获取详细数据失败:', error);
    return response.status(500).json({ error: '获取数据失败' });
  }
}
