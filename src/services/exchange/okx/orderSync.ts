/**
 * OKX Order Sync Service
 * 
 * Syncs order status from OKX exchange
 * Updates order status in database based on exchange response
 * 
 * Phase 6: Position Manager - Task 8: Order Sync
 */

import { OrderRef } from '@/core/models/OrderRef';

/**
 * OKX Order Status (from API)
 */
export interface OKXOrderStatus {
  instId: string;
  ordId: string;
  clOrdId: string;
  tag?: string;
  px?: string;
  sz: string;
  pnl?: string;
  ordType: string;
  side: 'buy' | 'sell';
  posSide?: 'net' | 'long' | 'short';
  tdMode: 'cash' | 'cross' | 'isolated';
  accFillSz: string;
  fillPx?: string;
  tradeId?: string;
  fillSz: string;
  fillTime?: string;
  state: 'canceled' | 'live' | 'partially_filled' | 'filled';
  avgPx?: string;
  lever?: string;
  tpTriggerPx?: string;
  tpOrdPx?: string;
  slTriggerPx?: string;
  slOrdPx?: string;
  feeCcy?: string;
  fee?: string;
  rebateCcy?: string;
  rebate?: string;
  tgtCcy?: string;
  cTime: string;
  uTime: string;
  reqId?: string;
  wTime?: string;
  code?: string;
  msg?: string;
}

/**
 * Map OKX order status to our OrderStatus
 */
export function mapOKXOrderStatus(okxState: OKXOrderStatus['state']): OrderRef['status'] {
  const statusMap: Record<string, OrderRef['status']> = {
    'live': 'NEW',
    'partially_filled': 'PARTIALLY_FILLED',
    'filled': 'FILLED',
    'canceled': 'CANCELED'
  };
  
  return statusMap[okxState] || 'PENDING';
}

/**
 * Normalize OKX order to OrderRef
 */
export function normalizeOKXOrder(
  okxOrder: OKXOrderStatus,
  exchange: 'okx' = 'okx',
  marketType: 'spot' | 'futures' = 'spot'
): OrderRef {
  const status = mapOKXOrderStatus(okxOrder.state);
  const filledQty = parseFloat(okxOrder.accFillSz || okxOrder.fillSz || '0');
  const totalQty = parseFloat(okxOrder.sz || '0');
  const remainingQty = Math.max(0, totalQty - filledQty);
  
  // Calculate average price
  let avgPrice: number | null = null;
  if (okxOrder.avgPx) {
    avgPrice = parseFloat(okxOrder.avgPx);
  } else if (okxOrder.fillPx && filledQty > 0) {
    avgPrice = parseFloat(okxOrder.fillPx);
  } else if (okxOrder.px) {
    avgPrice = parseFloat(okxOrder.px);
  }
  
  // Calculate commission (fee is negative for maker orders)
  let commission = 0;
  if (okxOrder.fee) {
    commission = Math.abs(parseFloat(okxOrder.fee));
  }
  const commissionAsset = okxOrder.feeCcy || null;
  
  // Map OKX order type to our order type
  let orderType: OrderRef['type'] = 'LIMIT';
  if (okxOrder.ordType === 'market') {
    orderType = 'MARKET';
  } else if (okxOrder.ordType === 'conditional') {
    if (okxOrder.slTriggerPx || okxOrder.slOrdPx) {
      orderType = 'STOP_LOSS';
    } else if (okxOrder.tpTriggerPx || okxOrder.tpOrdPx) {
      orderType = 'TAKE_PROFIT';
    }
  }
  
  return {
    id: '', // Will be set from database
    exchangeOrderId: okxOrder.ordId,
    exchange,
    marketType,
    symbol: okxOrder.instId,
    side: okxOrder.side.toUpperCase() as 'BUY' | 'SELL',
    type: orderType,
    status,
    price: okxOrder.px ? parseFloat(okxOrder.px) : null,
    quantity: totalQty,
    filledQuantity: filledQty,
    remainingQuantity: remainingQty,
    avgPrice,
    commission,
    commissionAsset,
    createdAt: okxOrder.cTime ? new Date(parseInt(okxOrder.cTime)).toISOString() : new Date().toISOString(),
    updatedAt: okxOrder.uTime ? new Date(parseInt(okxOrder.uTime)).toISOString() : new Date().toISOString(),
    filledAt: (status === 'FILLED' || filledQty > 0) && okxOrder.fillTime
      ? new Date(parseInt(okxOrder.fillTime)).toISOString()
      : (status === 'FILLED' && okxOrder.uTime)
      ? new Date(parseInt(okxOrder.uTime)).toISOString()
      : null,
    cancelledAt: status === 'CANCELED' && okxOrder.uTime
      ? new Date(parseInt(okxOrder.uTime)).toISOString()
      : null,
    metadata: {
      clOrdId: okxOrder.clOrdId,
      posSide: okxOrder.posSide,
      tdMode: okxOrder.tdMode,
      lever: okxOrder.lever
    }
  };
}

/**
 * Sync order status from OKX
 */
export async function syncOKXOrder(
  orderRef: OrderRef,
  okxOrderStatus: OKXOrderStatus
): Promise<OrderRef> {
  // Normalize OKX order to OrderRef
  // Note: We use 'okx' directly since this function is specifically for OKX orders
  const normalized = normalizeOKXOrder(
    okxOrderStatus,
    'okx',
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
    cancelledAt: normalized.cancelledAt,
    metadata: {
      ...orderRef.metadata,
      ...normalized.metadata
    }
  };
}

/**
 * Sync multiple orders from OKX
 */
export async function syncOKXOrders(
  orderRefs: OrderRef[],
  okxOrders: OKXOrderStatus[]
): Promise<OrderRef[]> {
  // Create a map of exchange order IDs to OKX orders
  const okxOrderMap = new Map<string, OKXOrderStatus>();
  for (const okxOrder of okxOrders) {
    okxOrderMap.set(okxOrder.ordId, okxOrder);
    okxOrderMap.set(okxOrder.clOrdId, okxOrder);
  }
  
  // Sync each order
  const syncedOrders: OrderRef[] = [];
  for (const orderRef of orderRefs) {
    const okxOrder = okxOrderMap.get(orderRef.exchangeOrderId) || 
                    okxOrderMap.get(orderRef.metadata?.clOrdId || '');
    
    if (okxOrder) {
      const synced = await syncOKXOrder(orderRef, okxOrder);
      syncedOrders.push(synced);
    } else {
      // Order not found - keep original
      syncedOrders.push(orderRef);
    }
  }
  
  return syncedOrders;
}

