/**
 * Order Sync for Position Monitor Worker
 * 
 * Syncs order status from exchanges (Binance/OKX)
 * Updates order status in database
 * 
 * Phase 6: Position Manager - Task 8: Order Sync
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Type definitions (inlined for Deno Edge Function)
interface OrderRef {
  id: string;
  exchangeOrderId: string;
  exchange: 'binance' | 'okx';
  marketType: 'spot' | 'futures';
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  status: 'NEW' | 'PENDING' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
  price: number | null;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  avgPrice: number | null;
  commission: number;
  commissionAsset: string | null;
  createdAt: string;
  updatedAt: string;
  filledAt: string | null;
  cancelledAt: string | null;
}

interface TradeOrder {
  id: string;
  trade_id: string;
  user_id: string;
  platform: string;
  platform_order_id: string;
  client_order_id: string;
  order_type: string;
  order_status: string;
  symbol: string;
  side: string;
  requested_price: number;
  requested_quantity: number;
  filled_price: number | null;
  filled_quantity: number;
  average_fill_price: number | null;
  fees: number;
  created_at: string;
  updated_at: string;
  filled_at: string | null;
  cancelled_at: string | null;
}

/**
 * Sync order status from exchange
 * In real implementation, this would fetch order status from Binance/OKX API
 * For now, we'll update from database records
 */
export async function syncOrderFromExchange(
  supabaseClient: ReturnType<typeof createClient>,
  orderId: string,
  exchange: 'binance' | 'okx',
  exchangeOrderId: string
): Promise<OrderRef | null> {
  try {
    // TODO: In real implementation, fetch order status from exchange API
    // For now, we'll sync from trade_orders table which should be updated by execute-trade function
    
    const { data, error } = await supabaseClient
      .from('trade_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !data) {
      console.error(`Failed to fetch order ${orderId}:`, error);
      return null;
    }
    
    const order = data as TradeOrder;
    
    // Map database order to OrderRef
    const orderRef: OrderRef = {
      id: order.id,
      exchangeOrderId: order.platform_order_id || exchangeOrderId,
      exchange,
      marketType: 'spot', // TODO: Get from trade
      symbol: order.symbol,
      side: order.side.toUpperCase() as 'BUY' | 'SELL',
      type: order.order_type || 'LIMIT',
      status: mapOrderStatus(order.order_status),
      price: order.requested_price ? Number(order.requested_price) : null,
      quantity: Number(order.requested_quantity),
      filledQuantity: Number(order.filled_quantity || 0),
      remainingQuantity: Number(order.requested_quantity) - Number(order.filled_quantity || 0),
      avgPrice: order.average_fill_price ? Number(order.average_fill_price) : null,
      commission: Number(order.fees || 0),
      commissionAsset: null,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      filledAt: order.filled_at,
      cancelledAt: order.cancelled_at
    };
    
    return orderRef;
    
  } catch (error: any) {
    console.error(`Error syncing order ${orderId}:`, error);
    return null;
  }
}

/**
 * Map database order status to OrderRef status
 */
function mapOrderStatus(dbStatus: string): OrderRef['status'] {
  const statusMap: Record<string, OrderRef['status']> = {
    'PENDING': 'PENDING',
    'FILLED': 'FILLED',
    'PARTIALLY_FILLED': 'PARTIALLY_FILLED',
    'CANCELLED': 'CANCELED',
    'FAILED': 'REJECTED',
    'EXPIRED': 'EXPIRED'
  };
  
  return statusMap[dbStatus] || 'PENDING';
}

/**
 * Sync all active orders for a position
 */
export async function syncPositionOrders(
  supabaseClient: ReturnType<typeof createClient>,
  positionId: string,
  userId: string
): Promise<OrderRef[]> {
  try {
    // Fetch all orders for this position
    const { data, error } = await supabaseClient
      .from('trade_orders')
      .select('*')
      .eq('trade_id', positionId)
      .eq('user_id', userId)
      .in('order_status', ['PENDING', 'PARTIALLY_FILLED'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Failed to fetch orders for position ${positionId}:`, error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Convert to OrderRef format
    const orders: OrderRef[] = [];
    for (const order of data as TradeOrder[]) {
      // Sync each order (in real implementation, fetch from exchange)
      const syncedOrder = await syncOrderFromExchange(
        supabaseClient,
        order.id,
        order.platform.toLowerCase() as 'binance' | 'okx',
        order.platform_order_id || ''
      );
      
      if (syncedOrder) {
        orders.push(syncedOrder);
      }
    }
    
    return orders;
    
  } catch (error: any) {
    console.error(`Error syncing orders for position ${positionId}:`, error);
    return [];
  }
}

/**
 * Update order status in database
 */
export async function updateOrderStatus(
  supabaseClient: ReturnType<typeof createClient>,
  orderRef: OrderRef,
  positionId: string
): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('trade_orders')
      .update({
        order_status: mapOrderStatusToDb(orderRef.status),
        filled_price: orderRef.avgPrice,
        filled_quantity: orderRef.filledQuantity,
        average_fill_price: orderRef.avgPrice,
        fees: orderRef.commission,
        updated_at: new Date().toISOString(),
        filled_at: orderRef.filledAt,
        cancelled_at: orderRef.cancelledAt
      })
      .eq('id', orderRef.id);
    
    if (error) {
      console.error(`Failed to update order ${orderRef.id}:`, error);
      return false;
    }
    
    // Log order event
    await supabaseClient
      .from('order_events')
      .insert({
        trade_order_id: orderRef.id,
        trade_id: positionId,
        user_id: '', // TODO: Get from order
        event_type: orderRef.status === 'FILLED' ? 'FILLED' : 'UPDATED',
        event_status: 'SUCCESS',
        previous_status: 'PENDING',
        new_status: mapOrderStatusToDb(orderRef.status),
        event_data: {
          filled_quantity: orderRef.filledQuantity,
          avg_price: orderRef.avgPrice
        },
        price_at_event: orderRef.avgPrice || orderRef.price,
        quantity_at_event: orderRef.quantity,
        filled_quantity_at_event: orderRef.filledQuantity,
        source: 'ORDER_SYNC',
        created_at: new Date().toISOString()
      });
    
    return true;
    
  } catch (error: any) {
    console.error(`Error updating order status:`, error);
    return false;
  }
}

/**
 * Map OrderRef status to database order status
 */
function mapOrderStatusToDb(status: OrderRef['status']): string {
  const statusMap: Record<OrderRef['status'], string> = {
    'NEW': 'PENDING',
    'PENDING': 'PENDING',
    'PARTIALLY_FILLED': 'PARTIALLY_FILLED',
    'FILLED': 'FILLED',
    'CANCELED': 'CANCELLED',
    'REJECTED': 'FAILED',
    'EXPIRED': 'EXPIRED'
  };
  
  return statusMap[status] || 'PENDING';
}

