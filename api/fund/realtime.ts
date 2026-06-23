import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RealtimeFundData {
  fundcode: string;
  name: string;
  jzrq: string;
  dwjz: string;
  gsz: string;
  gszzl: string;
  gztime: string;
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
      `http://fundgz.1234567.com.cn/js/${code}.js`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'http://fund.eastmoney.com/',
        },
      }
    );

    const text = await apiResponse.text();
    
    const jsonMatch = text.match(/jsonpgz\((.*)\);/);
    if (!jsonMatch || !jsonMatch[1]) {
      return response.status(500).json({ error: '解析数据失败' });
    }

    const data: RealtimeFundData = JSON.parse(jsonMatch[1]);

    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    
    return response.status(200).json({
      code: data.fundcode,
      name: data.name,
      netValueDate: data.jzrq,
      netValue: parseFloat(data.dwjz),
      estimatedValue: parseFloat(data.gsz),
      estimatedChange: parseFloat(data.gszzl),
      updateTime: data.gztime,
    });
  } catch (error) {
    console.error('获取实时数据失败:', error);
    return response.status(500).json({ error: '获取数据失败' });
  }
}
