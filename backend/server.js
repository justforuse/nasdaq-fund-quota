const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const UNLIMITED_THRESHOLD = 800000000;
const NASDAQ_KEYWORDS = ['纳斯达克', '纳指'];
const EXCLUDE_KEYWORDS = ['标普', '道琼斯', '德国', '法国', '英国', '日本', '日经', '恒生', '越南', '印度'];

const KNOWN_FUNDS = [
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

const parseNumeric = (val) => {
  if (!val || val.trim() === '' || val === '---') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const fetchWithTimeout = async (url, options, timeout = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const isNasdaqFund = (name) => {
  if (!NASDAQ_KEYWORDS.some(kw => name.includes(kw))) return false;
  if (EXCLUDE_KEYWORDS.some(kw => name.includes(kw))) return false;
  return true;
};

const determineLimitStatus = (purchaseStatus, dailyLimit, isUnlimited, isSuspended) => {
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

const parseFundFromRow = (row) => {
  if (!row || row.length < 10) return null;
  const code = row[0] || '';
  const name = row[1] || '';
  if (!code || !name) return null;

  const dailyLimitRaw = row[9] || '';
  const isUnlimited = dailyLimitRaw.includes('无限额') ||
    (parseNumeric(dailyLimitRaw) !== null && parseNumeric(dailyLimitRaw) >= UNLIMITED_THRESHOLD);
  const isSuspended = dailyLimitRaw.trim() === '' || dailyLimitRaw === '---' ||
    row[5] === '暂停申购' || row[5] === '停止申购';

  let dailyLimit = null;
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

let cachedFunds = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

const crawlNasdaqFunds = async () => {
  const headers = {
    ...DEFAULT_HEADERS,
    'Referer': 'http://fund.eastmoney.com/Fund_sgzt_bzdm.html',
  };

  const url = `http://fund.eastmoney.com/Data/Fund_JJJZ_Data.aspx?t=8&page=1,30000&js=var%20reData&sort=fcode,asc`;
  const res = await fetchWithTimeout(url, { headers }, 20000);
  if (!res.ok) throw new Error(`Crawl HTTP ${res.status}`);

  const text = await res.text();
  const arrMatch = text.match(/datas:\s*(\[[\s\S]*?\]),\s*record/);
  if (!arrMatch) throw new Error('Cannot parse crawl response');

  const datas = JSON.parse(arrMatch[1]);
  const nasdaqFunds = datas
    .filter(row => isNasdaqFund(row[1] || ''))
    .map(row => parseFundFromRow(row))
    .filter(f => f !== null);

  const seen = new Set();
  return nasdaqFunds.filter(f => {
    if (seen.has(f.code)) return false;
    seen.add(f.code);
    return true;
  });
};

const fetchOneYearReturn = async (code) => {
  try {
    const res = await fetchWithTimeout(
      `http://fund.eastmoney.com/pingzhongdata/${code}.js`,
      { headers: { ...DEFAULT_HEADERS, Referer: `http://fund.eastmoney.com/${code}.html` } },
      10000
    );
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/var\s+syl_1n\s*=\s*"([^"]*)"/i);
    if (!match) return null;
    return { code, oneYearReturn: parseFloat(match[1]) || 0 };
  } catch {
    return null;
  }
};

const fetchRealtimeData = async (code) => {
  try {
    const res = await fetchWithTimeout(
      `http://fundgz.1234567.com.cn/js/${code}.js`,
      { headers: { ...DEFAULT_HEADERS, Referer: 'http://fund.eastmoney.com/' } },
      8000
    );
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/jsonpgz\((.*)\);/);
    if (!match || !match[1]) return null;
    const data = JSON.parse(match[1]);
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

app.get('/api/fund/list', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedFunds && (now - cachedAt) < CACHE_TTL) {
      return res.json({ ...cachedFunds, cached: true });
    }

    const crawledFunds = await crawlNasdaqFunds();

    let fundList;
    if (crawledFunds.length > 0) {
      fundList = crawledFunds;
    } else {
      fundList = KNOWN_FUNDS.map(f => ({
        code: f.code,
        name: f.name,
        fundType: 'QDII指数型',
        netValue: null,
        purchaseStatus: '',
        dailyLimit: null,
        isUnlimited: true,
        isSuspended: false,
        rate: null,
      }));
    }

    const codes = fundList.map(f => f.code);

    const [realtimeResults, returnResults] = await Promise.all([
      Promise.all(codes.map(code => fetchRealtimeData(code))),
      Promise.all(codes.map(code => fetchOneYearReturn(code))),
    ]);

    const realtimeMap = {};
    for (const rt of realtimeResults) {
      if (rt) realtimeMap[rt.code] = rt;
    }

    const returnMap = {};
    for (const r of returnResults) {
      if (r) returnMap[r.code] = r.oneYearReturn;
    }

    const funds = fundList.map(crawled => {
      const limitInfo = determineLimitStatus(
        crawled.purchaseStatus,
        crawled.dailyLimit,
        crawled.isUnlimited,
        crawled.isSuspended
      );

      const knownFund = KNOWN_FUNDS.find(kf => kf.code === crawled.code);
      const rt = realtimeMap[crawled.code];

      return {
        id: crawled.code,
        code: crawled.code,
        name: crawled.name || rt?.name || knownFund?.name || '',
        limitStatus: limitInfo.status,
        limitAmount: limitInfo.amount,
        limitNote: limitInfo.note,
        oneYearReturn: returnMap[crawled.code] || 0,
        fundType: crawled.fundType || 'QDII指数型',
        lastUpdated: rt?.updateTime || new Date().toISOString(),
        netValue: rt?.netValue || crawled.netValue,
        estimatedValue: rt?.estimatedValue,
        estimatedChange: rt?.estimatedChange || crawled.rate,
        rate: rt?.estimatedChange || crawled.rate,
      };
    });

    const result = {
      funds,
      lastUpdated: new Date().toISOString(),
      discoveredCount: fundList.length,
      source: crawledFunds.length > 0 ? 'crawl' : 'fallback',
    };

    cachedFunds = result;
    cachedAt = Date.now();

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

app.get('/api/fund/returns', async (req, res) => {
  try {
    const { codes } = req.query;
    if (!codes) return res.status(400).json({ error: 'Missing codes parameter' });

    const codeList = codes.split(',').filter(Boolean);
    const returnResults = await Promise.all(codeList.map(code => fetchOneYearReturn(code)));

    const returnMap = {};
    for (const r of returnResults) {
      if (r) returnMap[r.code] = r.oneYearReturn;
    }

    res.json({ returns: returnMap, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('Returns error:', error);
    res.status(500).json({ error: '获取收益率失败' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Nasdaq Fund Backend running on port ${PORT}`);
});
