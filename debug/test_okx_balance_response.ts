/**
 * Test OKX Balance Response Format
 * 
 * This script helps debug OKX balance fetching issues
 */

// Simulate OKX API response structure
const mockOKXResponse = {
  code: "0",
  msg: "",
  data: [
    {
      uTime: "1234567890",
      totalEq: "1000.0",
      isoEq: "0",
      adjEq: "1000.0",
      ordFroz: "0",
      imr: "0",
      mmr: "0",
      details: [
        {
          ccy: "USDT",
          bal: "1000.0",
          frozenBal: "0",
          availBal: "1000.0",
          eqUsd: "1000.0"
        }
      ]
    }
  ]
};

// Test parsing
function parseOKXBalance(response: any) {
  const balances: Array<{
    asset: string;
    total: number;
    available: number;
    inOrder: number;
  }> = [];
  
  if (response.data && Array.isArray(response.data) && response.data.length > 0) {
    for (const account of response.data) {
      if (account.details && Array.isArray(account.details) && account.details.length > 0) {
        for (const balance of account.details) {
          balances.push({
            asset: balance.ccy,
            total: parseFloat(balance.bal || '0'),
            available: parseFloat(balance.availBal || '0'),
            inOrder: parseFloat(balance.frozenBal || '0')
          });
        }
      }
    }
  }
  
  return balances;
}

// Test with mock data
const result = parseOKXBalance(mockOKXResponse);
console.log('Parsed balances:', result);

// Test with empty response
const emptyResponse = {
  code: "0",
  msg: "",
  data: []
};

const emptyResult = parseOKXBalance(emptyResponse);
console.log('Empty response result:', emptyResult);

// Test with account but no details
const noDetailsResponse = {
  code: "0",
  msg: "",
  data: [
    {
      uTime: "1234567890",
      totalEq: "0",
      details: []
    }
  ]
};

const noDetailsResult = parseOKXBalance(noDetailsResponse);
console.log('No details result:', noDetailsResult);

