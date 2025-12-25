
// ضغط البيانات JSON
export const compressJSON = (data: any): string => {
  const jsonString = JSON.stringify(data);
  
  // إزالة المساحات الزائدة والخصائص الفارغة
  const cleaned = jsonString.replace(/\s+/g, ' ').trim();
  
  // ضغط بسيط عبر إزالة القيم null/undefined
  const parsed = JSON.parse(cleaned);
  const compressed = removeEmptyValues(parsed);
  
  return JSON.stringify(compressed);
};

// إزالة القيم الفارغة لتقليل حجم البيانات
const removeEmptyValues = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyValues).filter(item => item !== null && item !== undefined);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = removeEmptyValues(obj[key]);
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && Object.keys(value).length === 0)) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return obj;
};

// ضغط بيانات الصفقات
export const compressTradeData = (trades: any[]): any[] => {
  return trades.map(trade => ({
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    entry_price: Number(trade.entry_price),
    quantity: Number(trade.quantity),
    status: trade.status,
    pnl: Number(trade.realized_pnl || trade.unrealized_pnl || 0),
    created_at: trade.created_at
  }));
};

// ضغط بيانات الأسعار
export const compressPriceData = (prices: any): any => {
  const compressed: any = {};
  Object.keys(prices).forEach(symbol => {
    const price = prices[symbol];
    compressed[symbol] = {
      p: Math.round(price.price * 100) / 100, // تقريب لرقمين عشريين
      c: Math.round(price.change24h * 100) / 100,
      t: Math.floor(new Date(price.lastUpdated).getTime() / 1000) // timestamp بدلاً من التاريخ الكامل
    };
  });
  return compressed;
};

// إلغاء ضغط بيانات الأسعار
export const decompressPriceData = (compressed: any): any => {
  const decompressed: any = {};
  Object.keys(compressed).forEach(symbol => {
    const data = compressed[symbol];
    decompressed[symbol] = {
      symbol,
      price: data.p,
      change24h: data.c,
      lastUpdated: new Date(data.t * 1000)
    };
  });
  return decompressed;
};
