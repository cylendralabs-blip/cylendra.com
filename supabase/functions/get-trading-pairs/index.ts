import { corsHeaders } from '../_shared/cors.ts';

console.log("get-trading-pairs function initialized");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { platform, marketType = 'spot' } = await req.json();
    console.log('Fetching trading pairs for:', { platform, marketType });

    if (!platform) {
      return new Response(
        JSON.stringify({ error: 'Platform is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let pairs: string[] = [];

    // جلب الأزواج حسب المنصة
    switch (platform) {
      case 'binance':
      case 'binance-futures-testnet':
        pairs = await getBinancePairs(marketType);
        break;
      case 'okx':
        pairs = await getOKXPairs(marketType);
        break;
      case 'bybit':
        pairs = await getBybitPairs(marketType);
        break;
      case 'kucoin':
        pairs = await getKucoinPairs(marketType);
        break;
      default:
        // الأزواج الافتراضية الموسعة إذا لم نتمكن من جلب البيانات
        pairs = getExpandedDefaultPairs();
        break;
    }

    console.log(`Found ${pairs.length} pairs for ${platform} ${marketType}`);

    return new Response(
      JSON.stringify({ pairs }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in get-trading-pairs:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch trading pairs',
        pairs: getExpandedDefaultPairs() // إرجاع أزواج افتراضية موسعة في حالة الخطأ
      }),
      { 
        status: 200, // نرجع 200 مع أزواج افتراضية بدلاً من خطأ
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getBinancePairs(marketType: string): Promise<string[]> {
  try {
    let baseUrl: string;
    
    if (marketType === 'futures') {
      baseUrl = 'https://fapi.binance.com/fapi/v1/exchangeInfo';
    } else {
      baseUrl = 'https://api.binance.com/api/v3/exchangeInfo';
    }
    
    console.log('Calling Binance API:', baseUrl);
    const response = await fetch(baseUrl);
    
    if (!response.ok) {
      console.error('Binance API response not ok:', response.status, response.statusText);
      return getBasicDefaultPairs();
    }
    
    const data = await response.json();
    console.log(`Binance returned ${data.symbols?.length || 0} symbols`);
    
    if (!data.symbols || !Array.isArray(data.symbols)) {
      console.error('Invalid symbols data from Binance:', data);
      return getBasicDefaultPairs();
    }
    
    // جلب جميع أزواج USDT المتداولة بدون فلترة مفرطة
    const filteredSymbols = data.symbols
      .filter((symbol: any) => {
        if (!symbol.symbol || !symbol.baseAsset || !symbol.quoteAsset) {
          return false;
        }
        
        // فقط الأزواج المتداولة مع USDT
        const isTrading = symbol.status === 'TRADING';
        const isUSDT = symbol.symbol.endsWith('USDT');
        
        return isTrading && isUSDT;
      })
      .map((symbol: any) => `${symbol.baseAsset}/USDT`)
      .sort(); // ترتيب أبجدي
    
    console.log(`Filtered to ${filteredSymbols.length} USDT pairs`);
    return filteredSymbols.length > 0 ? filteredSymbols : getBasicDefaultPairs();
    
  } catch (error) {
    console.error('Error fetching Binance pairs:', error);
    return getBasicDefaultPairs();
  }
}

async function getOKXPairs(marketType: string): Promise<string[]> {
  try {
    const instType = marketType === 'futures' ? 'FUTURES' : 'SPOT';
    const url = `https://www.okx.com/api/v5/public/instruments?instType=${instType}`;
    
    console.log('Calling OKX API:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('OKX API response not ok:', response.status);
      return getBasicDefaultPairs();
    }
    
    const data = await response.json();
    
    if (data.code === '0' && data.data && Array.isArray(data.data)) {
      const pairs = data.data
        .filter((inst: any) => inst.quoteCcy === 'USDT' && inst.state === 'live')
        .map((inst: any) => `${inst.baseCcy}/USDT`)
        .sort();
      
      console.log(`OKX returned ${pairs.length} USDT pairs`);
      return pairs.length > 0 ? pairs : getBasicDefaultPairs();
    }
    
    return getBasicDefaultPairs();
  } catch (error) {
    console.error('Error fetching OKX pairs:', error);
    return getBasicDefaultPairs();
  }
}

async function getBybitPairs(marketType: string): Promise<string[]> {
  try {
    const category = marketType === 'futures' ? 'linear' : 'spot';
    const url = `https://api.bybit.com/v5/market/instruments-info?category=${category}`;
    
    console.log('Calling Bybit API:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Bybit API response not ok:', response.status);
      return getBasicDefaultPairs();
    }
    
    const data = await response.json();
    
    if (data.retCode === 0 && data.result?.list && Array.isArray(data.result.list)) {
      const pairs = data.result.list
        .filter((inst: any) => 
          inst.quoteCoin === 'USDT' && 
          inst.status === 'Trading'
        )
        .map((inst: any) => `${inst.baseCoin}/USDT`)
        .sort();
      
      console.log(`Bybit returned ${pairs.length} USDT pairs`);
      return pairs.length > 0 ? pairs : getBasicDefaultPairs();
    }
    
    return getBasicDefaultPairs();
  } catch (error) {
    console.error('Error fetching Bybit pairs:', error);
    return getBasicDefaultPairs();
  }
}

async function getKucoinPairs(marketType: string): Promise<string[]> {
  try {
    let url: string;
    
    if (marketType === 'futures') {
      url = 'https://api-futures.kucoin.com/api/v1/contracts/active';
    } else {
      url = 'https://api.kucoin.com/api/v1/symbols';
    }
    
    console.log('Calling KuCoin API:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('KuCoin API response not ok:', response.status);
      return getBasicDefaultPairs();
    }
    
    const data = await response.json();
    
    if (data.code === '200000' && data.data && Array.isArray(data.data)) {
      let pairs: string[];
      
      if (marketType === 'futures') {
        pairs = data.data
          .filter((contract: any) => contract.quoteCurrency === 'USDT')
          .map((contract: any) => `${contract.baseCurrency}/USDT`);
      } else {
        pairs = data.data
          .filter((symbol: any) => 
            symbol.quoteCurrency === 'USDT' && 
            symbol.enableTrading
          )
          .map((symbol: any) => `${symbol.baseCurrency}/USDT`);
      }
      
      pairs = pairs.sort();
      console.log(`KuCoin returned ${pairs.length} USDT pairs`);
      return pairs.length > 0 ? pairs : getBasicDefaultPairs();
    }
    
    return getBasicDefaultPairs();
  } catch (error) {
    console.error('Error fetching KuCoin pairs:', error);
    return getBasicDefaultPairs();
  }
}

function getBasicDefaultPairs(): string[] {
  return [
    // الأزواج الرئيسية والأكثر شعبية
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT',
    'SOL/USDT', 'DOGE/USDT', 'MATIC/USDT', 'DOT/USDT', 'LTC/USDT',
    'LINK/USDT', 'UNI/USDT', 'AVAX/USDT', 'ATOM/USDT', 'NEAR/USDT',
    'ALGO/USDT', 'VET/USDT', 'SHIB/USDT', 'MANA/USDT', 'SAND/USDT',
    'PEOPLE/USDT', 'FTM/USDT', 'GALA/USDT', 'APE/USDT', 'GMT/USDT'
  ];
}

function getExpandedDefaultPairs(): string[] {
  return [
    // الأزواج الرئيسية والأكثر شعبية
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT',
    'SOL/USDT', 'DOT/USDT', 'MATIC/USDT', 'LINK/USDT', 'UNI/USDT',
    'LTC/USDT', 'BCH/USDT', 'AVAX/USDT', 'ATOM/USDT', 'NEAR/USDT',
    
    // أزواج شائعة إضافية
    'ALGO/USDT', 'VET/USDT', 'MANA/USDT', 'SAND/USDT', 'SHIB/USDT',
    'DOGE/USDT', 'FTM/USDT', 'GALA/USDT', 'APE/USDT', 'GMT/USDT',
    'PEOPLE/USDT', 'LRC/USDT', 'ENS/USDT', 'ICP/USDT', 'THETA/USDT',
    
    // DeFi tokens
    'AAVE/USDT', 'COMP/USDT', 'MKR/USDT', 'SNX/USDT', 'YFI/USDT',
    '1INCH/USDT', 'CRV/USDT', 'SUSHI/USDT', 'BAL/USDT', 'REN/USDT',
    
    // أزواج إضافية متنوعة
    'FIL/USDT', 'TRX/USDT', 'EOS/USDT', 'XLM/USDT', 'XTZ/USDT',
    'ZRX/USDT', 'KNC/USDT', 'BAND/USDT', 'RSR/USDT', 'OXT/USDT',
    
    // العملات الناشئة والألعاب
    'AR/USDT', 'WAVES/USDT', 'ROSE/USDT', 'CHZ/USDT', 'ENJ/USDT',
    'AUDIO/USDT', 'MASK/USDT', 'ALPHA/USDT', 'TLM/USDT', 'SLP/USDT',
    
    // عملات Metaverse و NFT
    'AXS/USDT', 'SLP/USDT', 'MBOX/USDT', 'ALICE/USDT', 'TLM/USDT',
    'BETA/USDT', 'RACA/USDT', 'MOVR/USDT', 'GLMR/USDT', 'KAVA/USDT',
    
    // Layer 2 و scaling solutions
    'MATIC/USDT', 'LRC/USDT', 'IMX/USDT', 'STRK/USDT', 'ARB/USDT',
    'OP/USDT', 'METIS/USDT', 'BOBA/USDT', 'CELO/USDT', 'CTSI/USDT',
    
    // أزواج إضافية متنوعة
    'HBAR/USDT', 'FLOW/USDT', 'STX/USDT', 'EGLD/USDT', 'LUNA/USDT',
    'LUNC/USDT', 'USTC/USDT', 'KLAY/USDT', 'XEC/USDT', 'NEXO/USDT'
  ];
}
