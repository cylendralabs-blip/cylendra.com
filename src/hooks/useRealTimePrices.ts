
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cacheManager } from '@/utils/cacheManager';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  lastUpdated: Date;
}

interface PriceSubscription {
  symbol: string;
  callbacks: Set<(price: PriceData) => void>;
  lastUpdate: number;
}

// نظام إدارة الأسعار الحقيقية المباشر من Binance
class RealTimePriceManager {
  private static instance: RealTimePriceManager;
  private prices: {[symbol: string]: PriceData} = {};
  private subscriptions: {[symbol: string]: PriceSubscription} = {};
  private isConnected = false;
  private failureCount = 0;
  private fetchInterval: NodeJS.Timeout | null = null;
  private toast: any = null;
  
  private readonly fetchIntervalMs = 3000; // 3 ثواني للحصول على أسعار حقيقية أسرع
  private lastFetchAttempt = 0;

  static getInstance(): RealTimePriceManager {
    if (!RealTimePriceManager.instance) {
      RealTimePriceManager.instance = new RealTimePriceManager();
    }
    return RealTimePriceManager.instance;
  }

  setToast(toast: any) {
    this.toast = toast;
  }

  private async fetchRealPrices(symbols: string[]) {
    if (symbols.length === 0) return;

    const now = Date.now();
    if (now - this.lastFetchAttempt < 1000) return; // منع الطلبات المتكررة
    this.lastFetchAttempt = now;

    try {
      console.log('🚀 Fetching REAL prices from Binance Public API...');
      
      // استخدام Binance Public API مباشرة
      const success = await this.fetchFromBinancePublic(symbols);
      
      if (!success) {
        // جرب 24hr ticker كبديل
        await this.fetchFromBinance24hr(symbols);
      }

    } catch (error) {
      console.error('❌ Failed to fetch real prices:', error);
      this.handleFetchError();
    }
  }

  private async fetchFromBinancePublic(symbols: string[]): Promise<boolean> {
    try {
      console.log('📡 Using Binance Public Price API (No Auth Required)...');
      
      // استخدام API العام لجلب جميع الأسعار
      // Note: لا نرسل Cache-Control header لأنه يسبب مشكلة CORS مع Binance
      const response = await fetch('https://api.binance.com/api/v3/ticker/price', {
        headers: { 
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Binance Public API returned ${response.status}`);
        return false;
      }

      const allPrices = await response.json();
      
      if (!Array.isArray(allPrices)) {
        console.warn('Unexpected response format from Binance');
        return false;
      }

      console.log(`📊 Received ${allPrices.length} prices from Binance Public API`);

      const newPrices: {[symbol: string]: PriceData} = {};
      
      // تحويل أسماء الرموز وتصفية المطلوبة فقط
      allPrices.forEach((ticker: any) => {
        if (ticker.symbol && ticker.price) {
          const formattedSymbol = this.formatBinanceSymbol(ticker.symbol);
          
          // تحقق من أن الرمز في القائمة المطلوبة
          if (symbols.includes(formattedSymbol)) {
            const price = parseFloat(ticker.price);
            
            newPrices[formattedSymbol] = {
              symbol: formattedSymbol,
              price: price,
              change24h: 0, // سنحصل على هذا من API آخر
              volume: 0, // سنحصل على هذا من API آخر
              lastUpdated: new Date()
            };
            
            console.log(`✅ REAL LIVE price for ${formattedSymbol}: $${price.toFixed(4)}`);
          }
        }
      });

      if (Object.keys(newPrices).length > 0) {
        // جلب بيانات 24hr للحصول على التغيير والحجم
        await this.enrichWith24hrData(newPrices, symbols);
        
        this.prices = { ...this.prices, ...newPrices };
        this.isConnected = true;
        this.failureCount = 0;
        this.notifySubscribers(newPrices);
        
        console.log(`🎯 Successfully fetched ${Object.keys(newPrices).length} REAL LIVE prices from Binance`);
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Binance Public API failed:', error);
      return false;
    }
  }

  private async enrichWith24hrData(prices: {[symbol: string]: PriceData}, symbols: string[]) {
    try {
      const binanceSymbols = symbols.map(s => s.replace('/', '')).filter(Boolean);
      if (binanceSymbols.length === 0) return;

      const symbolsParam = JSON.stringify(binanceSymbols);
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          data.forEach((ticker: any) => {
            const formattedSymbol = this.formatBinanceSymbol(ticker.symbol);
            
            if (prices[formattedSymbol]) {
              prices[formattedSymbol].change24h = parseFloat(ticker.priceChangePercent) || 0;
              prices[formattedSymbol].volume = parseFloat(ticker.volume) || 0;
              
              console.log(`📈 Enriched ${formattedSymbol}: ${prices[formattedSymbol].change24h > 0 ? '+' : ''}${prices[formattedSymbol].change24h.toFixed(2)}%`);
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to enrich with 24hr data:', error);
    }
  }

  private async fetchFromBinance24hr(symbols: string[]) {
    try {
      console.log('📡 Trying Binance 24hr Ticker as fallback...');
      
      const binanceSymbols = symbols.map(s => s.replace('/', '')).filter(Boolean);
      if (binanceSymbols.length === 0) return;

      const symbolsParam = JSON.stringify(binanceSymbols);
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const newPrices: {[symbol: string]: PriceData} = {};
          
          data.forEach((ticker: any) => {
            if (ticker.symbol && ticker.lastPrice) {
              const formattedSymbol = this.formatBinanceSymbol(ticker.symbol);
              
              if (symbols.includes(formattedSymbol)) {
                newPrices[formattedSymbol] = {
                  symbol: formattedSymbol,
                  price: parseFloat(ticker.lastPrice),
                  change24h: parseFloat(ticker.priceChangePercent) || 0,
                  volume: parseFloat(ticker.volume) || 0,
                  lastUpdated: new Date()
                };
                
                console.log(`✅ REAL LIVE price for ${formattedSymbol}: $${newPrices[formattedSymbol].price.toFixed(4)} (${newPrices[formattedSymbol].change24h > 0 ? '+' : ''}${newPrices[formattedSymbol].change24h.toFixed(2)}%)`);
              }
            }
          });

          if (Object.keys(newPrices).length > 0) {
            this.prices = { ...this.prices, ...newPrices };
            this.isConnected = true;
            this.failureCount = 0;
            this.notifySubscribers(newPrices);
            
            console.log(`🎯 Successfully fetched ${Object.keys(newPrices).length} REAL LIVE prices from Binance 24hr`);
          }
        }
      }
    } catch (error) {
      console.error('Binance 24hr API failed:', error);
    }
  }

  private formatBinanceSymbol(binanceSymbol: string): string {
    // تحويل BTCUSDT إلى BTC/USDT
    const commonPairs = ['USDT', 'BUSD', 'BTC', 'ETH', 'BNB'];
    
    for (const quote of commonPairs) {
      if (binanceSymbol.endsWith(quote)) {
        const base = binanceSymbol.replace(quote, '');
        if (base.length > 0) {
          return `${base}/${quote}`;
        }
      }
    }
    
    return binanceSymbol;
  }

  private handleFetchError() {
    this.failureCount++;
    this.isConnected = false;
    
    if (this.toast && this.failureCount <= 3) {
      this.toast({
        title: '⚠️ مشكلة في جلب الأسعار',
        description: 'جاري المحاولة مرة أخرى لجلب الأسعار الحقيقية من Binance...',
        variant: 'default',
      });
    }
  }

  private notifySubscribers(prices: {[symbol: string]: PriceData}) {
    Object.keys(prices).forEach(symbol => {
      const subscription = this.subscriptions[symbol];
      if (subscription && subscription.callbacks.size > 0) {
        const now = Date.now();
        if (now - subscription.lastUpdate > 200) { // تحديث أسرع
          subscription.lastUpdate = now;
          subscription.callbacks.forEach(callback => {
            try {
              callback(prices[symbol]);
            } catch (error) {
              console.error('Error in price callback:', error);
            }
          });
        }
      }
    });
  }

  subscribe(symbol: string, callback: (price: PriceData) => void): () => void {
    if (!this.subscriptions[symbol]) {
      this.subscriptions[symbol] = {
        symbol,
        callbacks: new Set(),
        lastUpdate: 0
      };
    }

    this.subscriptions[symbol].callbacks.add(callback);

    // إرجاع السعر الحالي إذا كان متوفراً
    if (this.prices[symbol]) {
      try {
        callback(this.prices[symbol]);
      } catch (error) {
        console.error('Error in initial price callback:', error);
      }
    }

    this.startFetching();

    return () => {
      if (this.subscriptions[symbol]) {
        this.subscriptions[symbol].callbacks.delete(callback);
        
        if (this.subscriptions[symbol].callbacks.size === 0) {
          delete this.subscriptions[symbol];
          
          if (Object.keys(this.subscriptions).length === 0) {
            this.stopFetching();
          }
        }
      }
    };
  }

  private startFetching() {
    if (this.fetchInterval) return;

    const symbols = Object.keys(this.subscriptions);
    if (symbols.length === 0) return;

    // جلب فوري
    this.fetchRealPrices(symbols);

    // جلب دوري كل 3 ثواني
    this.fetchInterval = setInterval(() => {
      const currentSymbols = Object.keys(this.subscriptions);
      if (currentSymbols.length > 0) {
        this.fetchRealPrices(currentSymbols);
      } else {
        this.stopFetching();
      }
    }, this.fetchIntervalMs);
  }

  private stopFetching() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }
  }

  getPrice(symbol: string): PriceData | null {
    return this.prices[symbol] || null;
  }

  getAllPrices(): {[symbol: string]: PriceData} {
    return { ...this.prices };
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      pricesCount: Object.keys(this.prices).length,
      failureCount: this.failureCount,
      subscriptionsCount: Object.keys(this.subscriptions).length
    };
  }

  cleanup() {
    this.stopFetching();
    this.subscriptions = {};
    this.prices = {};
  }
}

export const useRealTimePrices = () => {
  const { toast } = useToast();
  const priceManager = RealTimePriceManager.getInstance();
  const [status, setStatus] = useState(priceManager.getConnectionStatus());

  useEffect(() => {
    priceManager.setToast(toast);
    
    // تحديث الحالة كل ثانيتين
    const statusInterval = setInterval(() => {
      setStatus(priceManager.getConnectionStatus());
    }, 2000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [toast]);

  const subscribeToSymbol = useCallback((symbol: string, callback: (price: PriceData) => void) => {
    return priceManager.subscribe(symbol, callback);
  }, []);

  const getPrice = useCallback((symbol: string): PriceData | null => {
    return priceManager.getPrice(symbol);
  }, []);

  const getAllPrices = useCallback(() => {
    return priceManager.getAllPrices();
  }, []);

  return {
    subscribeToSymbol,
    getPrice,
    getAllPrices,
    isConnected: status.isConnected,
    pricesCount: status.pricesCount,
    failureCount: status.failureCount
  };
};
