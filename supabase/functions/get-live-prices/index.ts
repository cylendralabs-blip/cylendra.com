
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface PriceData {
  symbol: string;
  price: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbols } = await req.json()
    console.log('📊 Fetching live prices for symbols:', symbols)

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // تحويل الرموز إلى تنسيق Binance
    const binanceSymbols = symbols.map(symbol => {
      // تحويل من BTC/USDT إلى BTCUSDT
      return symbol.replace('/', '')
    })

    console.log('🔄 Converted symbols for Binance:', binanceSymbols)

    // جلب الأسعار من Binance API
    const binanceUrl = `https://api.binance.com/api/v3/ticker/price`
    const response = await fetch(binanceUrl)
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }

    const allPrices: PriceData[] = await response.json()
    console.log('📈 Received', allPrices.length, 'prices from Binance')

    // فلترة الأسعار للرموز المطلوبة فقط
    const filteredPrices: Record<string, number> = {}
    
    for (const symbol of symbols) {
      const binanceSymbol = symbol.replace('/', '')
      const priceData = allPrices.find(p => p.symbol === binanceSymbol)
      
      if (priceData) {
        filteredPrices[symbol] = parseFloat(priceData.price)
        console.log(`💰 ${symbol}: $${priceData.price}`)
      } else {
        console.warn(`⚠️ Price not found for ${symbol}`)
      }
    }

    console.log('✅ Successfully fetched prices for', Object.keys(filteredPrices).length, 'symbols')

    return new Response(
      JSON.stringify({ 
        success: true,
        prices: filteredPrices,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error fetching live prices:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch live prices',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
