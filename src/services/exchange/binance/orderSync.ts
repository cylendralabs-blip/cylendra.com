/**
 * Binance Order Sync Service
 * 
 * Syncs order status from Binance exchange
 * Updates order status in database based on exchange response
 * 
 * Phase 6: Position Manager - Task 8: Order Sync
 */

import { OrderRef } from '@/core/models/OrderRef';

/**
 * Binance Order Status (from API)
 */
export interface BinanceOrderStatus {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'PENDING_CANCEL' | 'REJECTED' | 'EXPIRED';
  timeInForce: string;
  type: string;
  side: 'BUY' | 'SELL';
  stopPrice?: string;
  icebergQty?: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty?: string;
  fills?: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
    tradeId: number;
  }>;
}

/**
 * Map Binance order status to our OrderStatus
 */
export function mapBinanceOrderStatus(binanceStatus: BinanceOrderStatus['status']): OrderRef['status'] {
  const statusMap: Record<string, OrderRef['status']> = {
    'NEW': 'NEW',
    'PARTIALLY_FILLED': 'PARTIALLY_FILLED',
    'FILLED': 'FILLED',
    'CANCELED': 'CANCELED',
    'PENDING_CANCEL': 'PENDING',
    'REJECTED': 'REJECTED',
    'EXPIRED': 'EXPIRED'
  };
  
  return statusMap[binanceStatus] || 'PENDING';
}

/**
 * Normalize Binance order to OrderRef
 */
export function normalizeBinanceOrder(
  binanceOrder: BinanceOrderStatus,
  exchange: 'binance' = 'binance',
  marketType: 'spot' | 'futures' = 'spot'
): OrderRef {
  const status = mapBinanceOrderStatus(binanceOrder.status);
  const filledQty = parseFloat(binanceOrder.executedQty || '0');
  const totalQty = parseFloat(binanceOrder.origQty || '0');
  const remainingQty = totalQty - filledQty;
  
  // Calculate average price from fills or use price
  let avgPrice: number | null = null;
  if (binanceOrder.fills && binanceOrder.fills.length > 0) {
    const totalValue = binanceOrder.fills.reduce((sum, fill) => {
      return sum + (parseFloat(fill.price) * parseFloat(fill.qty));
    }, 0);
    avgPrice = filledQty > 0 ? totalValue / filledQty : parseFloat(binanceOrder.price || '0');
  } else if (filledQty > 0) {
    avgPrice = parseFloat(binanceOrder.cummulativeQuoteQty || '0') / filledQty;
  } else {
    avgPrice = binanceOrder.price ? parseFloat(binanceOrder.price) : null;
  }
  
  // Calculate commission
  let commission = 0;
  let commissionAsset: string | null = null;
  if (binanceOrder.fills && binanceOrder.fills.length > 0) {
    commission = binanceOrder.fills.reduce((sum, fill) => {
      return sum + parseFloat(fill.commission || '0');
    }, 0);
    commissionAsset = binanceOrder.fills[0]?.commissionAsset || null;
  }
  
  return {
    id: '', // Will be set from database
    exchangeOrderId: binanceOrder.orderId.toString(),
    exchange,
    marketType,
    symbol: binanceOrder.symbol,
    side: binanceOrder.side as 'BUY' | 'SELL',
    type: binanceOrder.type.toUpperCase() as OrderRef['type'],
    status,
    price: binanceOrder.price ? parseFloat(binanceOrder.price) : null,
    quantity: totalQty,
    filledQuantity: filledQty,
    remainingQuantity: remainingQty,
    avgPrice,
    commission,
    commissionAsset,
    timeInForce: binanceOrder.timeInForce,
    createdAt: new Date(binanceOrder.time).toISOString(),
    updatedAt: new Date(binanceOrder.updateTime || binanceOrder.time).toISOString(),
    filledAt: status === 'FILLED' || filledQty > 0 
      ? new Date(binanceOrder.updateTime || binanceOrder.time).toISOString() 
      : null,
    cancelledAt: status === 'CANCELED' 
      ? new Date(binanceOrder.updateTime || binanceOrder.time).toISOString() 
      : null
  };
}

/**
 * Sync order status from Binance
 * This should be called from Edge Function with API credentials
 */
export async function syncBinanceOrder(
  orderRef: OrderRef,
  binanceOrderStatus: BinanceOrderStatus
): Promise<OrderRef> {
  // Normalize Binance order to OrderRef
  // Use 'binance' directly since this function is specifically for Binance orders
  const normalized = normalizeBinanceOrder(
    binanceOrderStatus,
    'binance',
    orderRef.marketType
  );
  
  // Update OrderRef with new status
  return {
    ...orderRef,
    status: normalized.status,
    filledQuantity: normalized.filledQuantity,
    remainingQuantity: normalized.remainingQuantity,
    avgPrice: normalized.avgPrice,
    commission: normalized.commission,
    commissionAsset: normalized.commissionAsset,
    updatedAt: normalized.updatedAt,
    filledAt: normalized.filledAt,
    cancelledAt: normalized.cancelledAt
  };
}

/**
 * Sync multiple orders from Binance
 */
export async function syncBinanceOrders(
  orderRefs: OrderRef[],
  binanceOrders: BinanceOrderStatus[]
): Promise<OrderRef[]> {
  // Create a map of exchange order IDs to Binance orders
  const binanceOrderMap = new Map<string, BinanceOrderStatus>();
  for (const binanceOrder of binanceOrders) {
    binanceOrderMap.set(binanceOrder.orderId.toString(), binanceOrder);
    binanceOrderMap.set(binanceOrder.clientOrderId, binanceOrder);
  }
  
  // Sync each order
  const syncedOrders: OrderRef[] = [];
  for (const orderRef of orderRefs) {
    const binanceOrder = binanceOrderMap.get(orderRef.exchangeOrderId) || 
                        binanceOrderMap.get(orderRef.metadata?.clientOrderId || '');
    
    if (binanceOrder) {
      const synced = await syncBinanceOrder(orderRef, binanceOrder);
      syncedOrders.push(synced);
    } else {
      // Order not found - keep original
      syncedOrders.push(orderRef);
    }
  }
  
  return syncedOrders;
}

/**
 * Check if order status has changed
 */
export function hasOrderStatusChanged(
  oldOrder: OrderRef,
  newOrder: OrderRef
): boolean {
  return (
    oldOrder.status !== newOrder.status ||
    oldOrder.filledQuantity !== newOrder.filledQuantity ||
    oldOrder.remainingQuantity !== newOrder.remainingQuantity ||
    oldOrder.avgPrice !== newOrder.avgPrice
  );
}

