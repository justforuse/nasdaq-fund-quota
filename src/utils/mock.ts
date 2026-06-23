import { Fund } from '../types/fund';

const generateRandomReturn = (): number => {
  return Math.round((Math.random() * 60 - 20) * 100) / 100;
};

const generateLimitAmount = (): number | undefined => {
  const rand = Math.random();
  if (rand < 0.3) return undefined;
  if (rand < 0.6) return 1000;
  if (rand < 0.8) return 5000;
  if (rand < 0.9) return 10000;
  return 50000;
};

const generateLimitStatus = (amount?: number): 'unlimited' | 'limited' | 'suspended' => {
  if (amount === undefined) {
    const rand = Math.random();
    if (rand < 0.1) return 'suspended';
    return 'unlimited';
  }
  return 'limited';
};

export const mockFunds: Fund[] = [
  {
    id: '1',
    code: '270042',
    name: '广发纳斯达克100指数(QDII)',
    company: '广发基金管理有限公司',
    establishDate: '2012-08-15',
    fundSize: 85.62,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 28.45,
    limitAmount: 5000,
    limitStatus: 'limited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    code: '160213',
    name: '国泰纳斯达克100指数(QDII)',
    company: '国泰基金管理有限公司',
    establishDate: '2010-04-29',
    fundSize: 72.31,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 26.83,
    limitAmount: 3000,
    limitStatus: 'limited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    code: '040046',
    name: '华安纳斯达克100指数(QDII)',
    company: '华安基金管理有限公司',
    establishDate: '2013-08-02',
    fundSize: 63.45,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 30.12,
    limitAmount: undefined,
    limitStatus: 'unlimited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '4',
    code: '000834',
    name: '大成纳斯达克100指数(QDII)',
    company: '大成基金管理有限公司',
    establishDate: '2014-11-14',
    fundSize: 28.76,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 27.56,
    limitAmount: 2000,
    limitStatus: 'limited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '5',
    code: '003722',
    name: '易方达纳斯达克100指数(QDII)',
    company: '易方达基金管理有限公司',
    establishDate: '2016-12-02',
    fundSize: 56.89,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 29.34,
    limitAmount: 1000,
    limitStatus: 'limited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '6',
    code: '006479',
    name: '华夏纳斯达克100ETF联接(QDII)',
    company: '华夏基金管理有限公司',
    establishDate: '2018-10-18',
    fundSize: 42.18,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 25.78,
    limitAmount: 50000,
    limitStatus: 'limited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '7',
    code: '050025',
    name: '博时标普500指数(QDII)',
    company: '博时基金管理有限公司',
    establishDate: '2012-06-14',
    fundSize: 38.92,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 21.45,
    limitAmount: undefined,
    limitStatus: 'suspended',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '8',
    code: '513100',
    name: '国泰纳斯达克100ETF',
    company: '国泰基金管理有限公司',
    establishDate: '2013-05-15',
    fundSize: 125.34,
    fundType: 'ETF-场内',
    riskLevel: 'R4中高风险',
    oneYearReturn: 28.92,
    limitAmount: undefined,
    limitStatus: 'unlimited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '9',
    code: '159659',
    name: '华夏纳斯达克100ETF',
    company: '华夏基金管理有限公司',
    establishDate: '2022-07-20',
    fundSize: 98.56,
    fundType: 'ETF-场内',
    riskLevel: 'R4中高风险',
    oneYearReturn: 29.15,
    limitAmount: undefined,
    limitStatus: 'unlimited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '10',
    code: '007280',
    name: '上投摩根纳斯达克100指数(QDII)',
    company: '上投摩根基金管理有限公司',
    establishDate: '2019-09-18',
    fundSize: 15.67,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 24.89,
    limitAmount: 10000,
    limitStatus: 'limited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '11',
    code: '011417',
    name: '工银瑞信纳斯达克100指数(QDII)',
    company: '工银瑞信基金管理有限公司',
    establishDate: '2021-03-17',
    fundSize: 8.23,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 27.11,
    limitAmount: 5000,
    limitStatus: 'limited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '12',
    code: '008766',
    name: '嘉实纳斯达克100指数(QDII)',
    company: '嘉实基金管理有限公司',
    establishDate: '2019-12-24',
    fundSize: 22.45,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 26.34,
    limitAmount: undefined,
    limitStatus: 'suspended',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '13',
    code: '004903',
    name: '南方纳斯达克100指数(QDII)',
    company: '南方基金管理股份有限公司',
    establishDate: '2017-07-26',
    fundSize: 31.78,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 25.67,
    limitAmount: 3000,
    limitStatus: 'limited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '14',
    code: '007800',
    name: '招商纳斯达克100指数(QDII)',
    company: '招商基金管理有限公司',
    establishDate: '2019-08-28',
    fundSize: 18.92,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 26.01,
    limitAmount: undefined,
    limitStatus: 'unlimited',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '15',
    code: '013308',
    name: '汇添富纳斯达克100指数(QDII)',
    company: '汇添富基金管理股份有限公司',
    establishDate: '2021-10-26',
    fundSize: 45.23,
    fundType: 'QDII指数型',
    riskLevel: 'R4中高风险',
    oneYearReturn: 28.76,
    limitAmount: 2000,
    limitStatus: 'limited',
    lastUpdated: new Date().toISOString(),
  },
];

export const generateMockData = (): Fund[] => {
  return mockFunds.map(fund => {
    const limitAmount = generateLimitAmount();
    return {
      ...fund,
      oneYearReturn: generateRandomReturn(),
      limitAmount,
      limitStatus: generateLimitStatus(limitAmount),
      lastUpdated: new Date().toISOString(),
    };
  });
};

export const fetchFundData = async (): Promise<Fund[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return generateMockData();
};
