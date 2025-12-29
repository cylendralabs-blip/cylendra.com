
export async function fetchCryptoPrices(symbols: string[]): Promise<{[key: string]: number}> {
  try {
    // Convert symbols to CoinGecko format
    const coinGeckoIds = symbols.map(symbol => {
      const symbolMap: {[key: string]: string} = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'USDT': 'tether',
        'USDC': 'usd-coin',
        'BNB': 'binancecoin',
        'SOL': 'solana',
        'ADA': 'cardano',
        'DOT': 'polkadot',
        'MATIC': 'polygon',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'LTC': 'litecoin',
        'BCH': 'bitcoin-cash',
        'XRP': 'ripple',
        'DOGE': 'dogecoin',
        'AVAX': 'avalanche-2',
        'ATOM': 'cosmos',
        'FTM': 'fantom',
        'NEAR': 'near',
        'ALGO': 'algorand',
        'VET': 'vechain',
        'ICP': 'internet-computer',
        'THETA': 'theta-token',
        'FIL': 'filecoin',
        'TRX': 'tron',
        'ETC': 'ethereum-classic',
        'XLM': 'stellar',
        'MANA': 'decentraland',
        'SAND': 'the-sandbox',
        'CRV': 'curve-dao-token',
        'SUSHI': 'sushi',
        'COMP': 'compound-governance-token',
        'YFI': 'yearn-finance',
        'SNX': 'havven',
        'MKR': 'maker',
        'AAVE': 'aave',
        'UMA': 'uma',
        'BAL': 'balancer',
        'REN': 'republic-protocol',
        'ZRX': '0x',
        'KNC': 'kyber-network-crystal',
        'LRC': 'loopring',
        'BAT': 'basic-attention-token',
        'REP': 'augur',
        'ZEC': 'zcash',
        'DASH': 'dash',
        'XMR': 'monero',
        'NEO': 'neo',
        'QTUM': 'qtum',
        'ONT': 'ontology',
        'ZIL': 'zilliqa',
        'ICX': 'icon',
        'OMG': 'omisego',
        'LSK': 'lisk',
        'NANO': 'nano',
        'STEEM': 'steem',
        'XTZ': 'tezos',
        'DCR': 'decred',
        'REQ': 'request-network',
        'DATA': 'streamr',
        'OGN': 'origin-protocol'
      }
      return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase()
    }).filter(Boolean)

    if (coinGeckoIds.length === 0) {
      return {}
    }

    const ids = coinGeckoIds.join(',')
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status)
      return {}
    }

    const data = await response.json()
    
    // Convert back to symbol-based mapping
    const prices: {[key: string]: number} = {}
    symbols.forEach(symbol => {
      const symbolMap: {[key: string]: string} = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'USDT': 'tether',
        'USDC': 'usd-coin',
        'BNB': 'binancecoin',
        'SOL': 'solana',
        'ADA': 'cardano',
        'DOT': 'polkadot',
        'MATIC': 'polygon',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'LTC': 'litecoin',
        'BCH': 'bitcoin-cash',
        'XRP': 'ripple',
        'DOGE': 'dogecoin',
        'AVAX': 'avalanche-2',
        'ATOM': 'cosmos',
        'FTM': 'fantom',
        'NEAR': 'near',
        'ALGO': 'algorand',
        'VET': 'vechain',
        'ICP': 'internet-computer',
        'THETA': 'theta-token',
        'FIL': 'filecoin',
        'TRX': 'tron',
        'ETC': 'ethereum-classic',
        'XLM': 'stellar',
        'MANA': 'decentraland',
        'SAND': 'the-sandbox',
        'CRV': 'curve-dao-token',
        'SUSHI': 'sushi',
        'COMP': 'compound-governance-token',
        'YFI': 'yearn-finance',
        'SNX': 'havven',
        'MKR': 'maker',
        'AAVE': 'aave',
        'UMA': 'uma',
        'BAL': 'balancer',
        'REN': 'republic-protocol',
        'ZRX': '0x',
        'KNC': 'kyber-network-crystal',
        'LRC': 'loopring',
        'BAT': 'basic-attention-token',
        'REP': 'augur',
        'ZEC': 'zcash',
        'DASH': 'dash',
        'XMR': 'monero',
        'NEO': 'neo',
        'QTUM': 'qtum',
        'ONT': 'ontology',
        'ZIL': 'zilliqa',
        'ICX': 'icon',
        'OMG': 'omisego',
        'LSK': 'lisk',
        'NANO': 'nano',
        'STEEM': 'steem',
        'XTZ': 'tezos',
        'DCR': 'decred',
        'REQ': 'request-network',
        'DATA': 'streamr',
        'OGN': 'origin-protocol'
      }
      const coinGeckoId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase()
      if (data[coinGeckoId] && data[coinGeckoId].usd) {
        prices[symbol.toLowerCase()] = data[coinGeckoId].usd
      }
    })

    console.log(`Fetched prices for ${Object.keys(prices).length} symbols`)
    return prices

  } catch (error) {
    console.error('Error fetching crypto prices:', error)
    return {}
  }
}
