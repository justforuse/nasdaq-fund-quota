import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Fund } from '../../src/types/fund';

const KNOWN_FUNDS: { code: string; name: string }[] = [
  { code: '270042', name: '广发纳斯达克100ETF联接人民币A' },
  { code: '160213', name: '国泰纳斯达克100指数' },
  { code: '040046', name: '华安纳斯达克100ETF联接A' },
  { code: '000834', name: '大成纳斯达克100指数A' },
  { code: '003722', name: '国泰纳斯达克100ETF联接A' },
  { code: '006479', name: '华夏纳斯达克100ETF联接A' },
  { code: '513100', name: '纳斯达克100ETF' },
  { code: '159659', name: '纳斯达克100ETF' },
  { code: '007280', name: '华夏纳斯达克100ETF联接C' },
  { code: '011417', name: '华安纳斯达克100ETF联接C' },
  { code: '008766', name: '国泰纳斯达克100ETF联接C' },
  { code: '004903', name: '广发纳斯达克100ETF联接人民币C' },
  { code: '007800', name: '大成纳斯达克100指数C' },
  { code: '013308', name: '国泰纳斯达克100指数C' },
];

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const funds: Fund[] = KNOWN_FUNDS.map(f => ({
    id: f.code,
    code: f.code,
    name: f.name,
    limitStatus: 'unlimited' as const,
    limitAmount: undefined,
    limitNote: '无限制',
    oneYearReturn: 0,
    fundType: 'QDII指数型',
    lastUpdated: new Date().toISOString(),
    netValue: undefined,
    estimatedChange: undefined,
    rate: undefined,
  }));

  const codes = KNOWN_FUNDS.map(f => f.code);

  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  return response.status(200).json({
    funds,
    lastUpdated: new Date().toISOString(),
    discoveredCount: KNOWN_FUNDS.length,
    source: 'static',
    codesForReturns: codes.join(','),
  });
}
