/**
 * Order Lifecycle Management
 * 
 * Functions for tracking order lifecycle events
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Order Type
 */
export type OrderType = 'ENTRY' | 'DCA' | 'STOP_LOSS' | 'TAKE_PROFIT';

/**
 * Order Status
 */
export type OrderStatus = 
  | 'PENDING'
  | 'FILLED'
  | 'PARTIALLY_FILLED'
  | 'CANCELLED'
  | 'FAILED'
  | 'EXPIRED';

/**
 * Order Event Type
 */
export type OrderEventType =
  | 'CREATED'
  | 'SUBMITTED'
  | 'FILLED'
  | 'PARTIALLY_FILLED'
  | 'CANCELLED'
  | 'FAILED'
  | 'EXPIRED'
  | 'UPDATED';

/**
 * Create trade order record
 */
export async function createTradeOrder(
  supabaseClient: ReturnType<typeof createClient>,
  params: {
    tradeId: string;
    userId: string;
    orderType: OrderType;
    orderLevel: number;
    platform: string;
    platformOrderId?: string | number;
    clientOrderId?: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    orderSide: 'buy' | 'sell';
    requestedPrice?: number;
    requestedQuantity: number;
    orderTypeExchange: string;
    timeInForce?: string;
    exchangeResponse?: any;
  }
): Promise<string> {
  try {
    const { data, error } = await supabaseClient
      .from('trade_orders')
      .insert({
        trade_id: params.tradeId,
        user_id: params.userId,
        order_type: params.orderType,
        order_level: params.orderLevel,
        platform: params.platform,
        platform_order_id: params.platformOrderId?.toString(),
        client_order_id: params.clientOrderId,
        symbol: params.symbol,
        side: params.side,
        order_side: params.orderSide,
        requested_price: params.requestedPrice,
        requested_quantity: params.requestedQuantity,
        order_type_exchange: params.orderTypeExchange,
        time_in_force: params.timeInForce || 'GTC',
        order_status: 'PENDING',
        exchange_response: params.exchangeResponse,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating trade order:', error);
      throw new Error(`Failed to create trade order: ${error.message}`);
    }

    // Log CREATED event
    await createOrderEvent(supabaseClient, {
      tradeOrderId: data.id,
      tradeId: params.tradeId,
      userId: params.userId,
      eventType: 'CREATED',
      eventStatus: 'SUCCESS',
      newStatus: 'PENDING',
      message: `Order ${params.orderType} created`,
      eventData: {
        platform: params.platform,
        platformOrderId: params.platformOrderId,
        clientOrderId: params.clientOrderId
      }
    });

    return data.id;
  } catch (error) {
    console.error('Error in createTradeOrder:', error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  supabaseClient: ReturnType<typeof createClient>,
  orderId: string,
  newStatus: OrderStatus,
  updates?: {
    filledPrice?: number;
    filledQuantity?: number;
    averageFillPrice?: number;
    fees?: number;
    feeAsset?: string;
    filledAt?: string;
    cancelledAt?: string;
    errorMessage?: string;
    exchangeResponse?: any;
  }
): Promise<void> {
  try {
    // Get current order
    const { data: currentOrder, error: fetchError } = await supabaseClient
      .from('trade_orders')
      .select('order_status, user_id, trade_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    const previousStatus = currentOrder.order_status;

    // Update order
    const updateData: any = {
      order_status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (updates?.filledPrice !== undefined) {
      updateData.filled_price = updates.filledPrice;
    }
    if (updates?.filledQuantity !== undefined) {
      updateData.filled_quantity = updates.filledQuantity;
    }
    if (updates?.averageFillPrice !== undefined) {
      updateData.average_fill_price = updates.averageFillPrice;
    }
    if (updates?.fees !== undefined) {
      updateData.fees = updates.fees;
    }
    if (updates?.feeAsset) {
      updateData.fee_asset = updates.feeAsset;
    }
    if (updates?.filledAt) {
      updateData.filled_at = updates.filledAt;
    } else if (newStatus === 'FILLED' || newStatus === 'PARTIALLY_FILLED') {
      updateData.filled_at = new Date().toISOString();
    }
    if (updates?.cancelledAt) {
      updateData.cancelled_at = updates.cancelledAt;
    } else if (newStatus === 'CANCELLED') {
      updateData.cancelled_at = new Date().toISOString();
    }
    if (updates?.errorMessage) {
      updateData.error_message = updates.errorMessage;
    }
    if (updates?.exchangeResponse) {
      updateData.exchange_response = updates.exchangeResponse;
    }

    const { error: updateError } = await supabaseClient
      .from('trade_orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // Determine event type
    let eventType: OrderEventType = 'UPDATED';
    if (newStatus === 'FILLED') {
      eventType = previousStatus === 'PARTIALLY_FILLED' ? 'FILLED' : 'FILLED';
    } else if (newStatus === 'PARTIALLY_FILLED') {
      eventType = 'PARTIALLY_FILLED';
    } else if (newStatus === 'CANCELLED') {
      eventType = 'CANCELLED';
    } else if (newStatus === 'FAILED') {
      eventType = 'FAILED';
    } else if (newStatus === 'EXPIRED') {
      eventType = 'EXPIRED';
    }

    // Log event
    await createOrderEvent(supabaseClient, {
      tradeOrderId: orderId,
      tradeId: currentOrder.trade_id,
      userId: currentOrder.user_id,
      eventType,
      eventStatus: newStatus === 'FAILED' ? 'FAILURE' : 'SUCCESS',
      previousStatus,
      newStatus,
      message: `Order status changed from ${previousStatus} to ${newStatus}`,
      errorMessage: updates?.errorMessage,
      eventData: updates
    });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
}

/**
 * Create order event
 */
export async function createOrderEvent(
  supabaseClient: ReturnType<typeof createClient>,
  params: {
    tradeOrderId?: string;
    tradeId?: string;
    userId: string;
    eventType: OrderEventType;
    eventStatus: 'SUCCESS' | 'FAILURE' | 'PENDING';
    previousStatus?: string;
    newStatus?: string;
    eventData?: any;
    priceAtEvent?: number;
    quantityAtEvent?: number;
    filledQuantityAtEvent?: number;
    message?: string;
    errorMessage?: string;
    source?: 'SYSTEM' | 'EXCHANGE' | 'USER' | 'RETRY' | 'MONITOR';
  }
): Promise<string> {
  try {
    const { data, error } = await supabaseClient
      .from('order_events')
      .insert({
        trade_order_id: params.tradeOrderId || null,
        trade_id: params.tradeId || null,
        user_id: params.userId,
        event_type: params.eventType,
        event_status: params.eventStatus,
        previous_status: params.previousStatus || null,
        new_status: params.newStatus || null,
        event_data: params.eventData || null,
        price_at_event: params.priceAtEvent || null,
        quantity_at_event: params.quantityAtEvent || null,
        filled_quantity_at_event: params.filledQuantityAtEvent || null,
        message: params.message || null,
        error_message: params.errorMessage || null,
        source: params.source || 'SYSTEM',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating order event:', error);
      // Don't throw, event logging is non-critical
      return '';
    }

    return data.id;
  } catch (error) {
    console.error('Error in createOrderEvent:', error);
    // Don't throw, event logging is non-critical
    return '';
  }
}

/**
 * Get order events
 */
export async function getOrderEvents(
  supabaseClient: ReturnType<typeof createClient>,
  orderId: string,
  userId: string
): Promise<any[]> {
  try {
    const { data, error } = await supabaseClient
      .from('order_events')
      .select('*')
      .eq('trade_order_id', orderId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get order events: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getOrderEvents:', error);
    throw error;
  }
}

/**
 * Handle partial fill
 */
export async function handlePartialFill(
  supabaseClient: ReturnType<typeof createClient>,
  orderId: string,
  filledQuantity: number,
  filledPrice: number,
  averageFillPrice?: number
): Promise<void> {
  try {
    // Get current order
    const { data: order, error: fetchError } = await supabaseClient
      .from('trade_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const totalFilled = (order.filled_quantity || 0) + filledQuantity;
    const isFullyFilled = totalFilled >= order.requested_quantity;

    // Update order
    await updateOrderStatus(supabaseClient, orderId, isFullyFilled ? 'FILLED' : 'PARTIALLY_FILLED', {
      filledQuantity: totalFilled,
      filledPrice: filledPrice,
      averageFillPrice: averageFillPrice || filledPrice,
      filledAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in handlePartialFill:', error);
    throw error;
  }
}


