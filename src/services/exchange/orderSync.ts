/**
 * Unified Order Sync Service
 * 
 * Main service for syncing orders from all exchanges
 * Routes to appropriate exchange-specific sync service
 * 
 * Phase 6: Position Manager - Task 8: Order Sync
 */

import { OrderRef } from '@/core/models/OrderRef';
import { 
  syncBinanceOrder, 
  syncBinanceOrders,
  BinanceOrderStatus,
  hasOrderStatusChanged
} from './binance/orderSync';
import {
  syncOKXOrder,
  syncOKXOrders,
  OKXOrderStatus
} from './okx/orderSync';

/**
 * Exchange Order Status (union type)
 */
export type ExchangeOrderStatus = 
  | { exchange: 'binance'; data: BinanceOrderStatus }
  | { exchange: 'okx'; data: OKXOrderStatus };

/**
 * Sync order from exchange
 */
export async function syncOrder(
  orderRef: OrderRef,
  exchangeOrder: ExchangeOrderStatus
): Promise<OrderRef> {
  if (exchangeOrder.exchange === 'binance') {
    return syncBinanceOrder(orderRef, exchangeOrder.data);
  } else if (exchangeOrder.exchange === 'okx') {
    return syncOKXOrder(orderRef, exchangeOrder.data);
  }
  
  // TypeScript exhaustiveness check - this should never be reached
  // but we keep it for runtime safety
  const _exhaustive: never = exchangeOrder;
  throw new Error(`Unsupported exchange: ${(_exhaustive as any).exchange}`);
}

/**
 * Sync multiple orders from exchange
 */
export async function syncOrders(
  orderRefs: OrderRef[],
  exchangeOrders: ExchangeOrderStatus[]
): Promise<OrderRef[]> {
  // Group orders by exchange
  const binanceOrders: Array<{ orderRef: OrderRef; data: BinanceOrderStatus }> = [];
  const okxOrders: Array<{ orderRef: OrderRef; data: OKXOrderStatus }> = [];
  
  for (const exchangeOrder of exchangeOrders) {
    // Find matching OrderRef
    const orderRef = orderRefs.find(ref => 
      ref.exchange === exchangeOrder.exchange &&
      (ref.exchangeOrderId === (exchangeOrder.exchange === 'binance' 
        ? exchangeOrder.data.orderId.toString()
        : exchangeOrder.data.ordId) ||
      ref.metadata?.clientOrderId === (exchangeOrder.exchange === 'binance'
        ? exchangeOrder.data.clientOrderId
        : exchangeOrder.data.clOrdId))
    );
    
    if (orderRef) {
      if (exchangeOrder.exchange === 'binance') {
        binanceOrders.push({ orderRef, data: exchangeOrder.data });
      } else if (exchangeOrder.exchange === 'okx') {
        okxOrders.push({ orderRef, data: exchangeOrder.data });
      }
    }
  }
  
  // Sync orders for each exchange
  const syncedOrders: OrderRef[] = [];
  
  // Sync Binance orders
  if (binanceOrders.length > 0) {
    const binanceOrderRefs = binanceOrders.map(o => o.orderRef);
    const binanceOrderData = binanceOrders.map(o => o.data);
    const synced = await syncBinanceOrders(binanceOrderRefs, binanceOrderData);
    syncedOrders.push(...synced);
  }
  
  // Sync OKX orders
  if (okxOrders.length > 0) {
    const okxOrderRefs = okxOrders.map(o => o.orderRef);
    const okxOrderData = okxOrders.map(o => o.data);
    const synced = await syncOKXOrders(okxOrderRefs, okxOrderData);
    syncedOrders.push(...synced);
  }
  
  // Add orders that weren't found in exchange responses (keep original status)
  const syncedOrderIds = new Set(syncedOrders.map(o => o.id));
  for (const orderRef of orderRefs) {
    if (!syncedOrderIds.has(orderRef.id)) {
      syncedOrders.push(orderRef);
    }
  }
  
  return syncedOrders;
}

/**
 * Check if order needs sync (status changed or filled quantity changed)
 */
export function orderNeedsSync(oldOrder: OrderRef, newOrder: OrderRef): boolean {
  return hasOrderStatusChanged(oldOrder, newOrder);
}

/**
 * Filter orders that need sync (active/pending orders)
 */
export function filterOrdersNeedingSync(orders: OrderRef[]): OrderRef[] {
  return orders.filter(order => 
    order.status === 'NEW' || 
    order.status === 'PENDING' || 
    order.status === 'PARTIALLY_FILLED'
  );
}

