/**
 * Database Operations
 * 
 * Functions for saving trade data to database
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createTradeOrder, updateOrderStatus, createOrderEvent } from './order-lifecycle.ts';
import { generateClientOrderId } from './idempotency.ts';

/**
 * DCALevel interface
 */
interface DCALevel {
  level: number;
  targetPrice: number;
  amount: number;
}

/**
 * Order Response with metadata
 */
interface OrderWithMetadata {
  orderId?: number;
  orderType: string;
  level: number;
}

/**
 * Create trade record in database
 */
export async function createTradeRecord(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  tradeData: {
    symbol: string;
    trade_type: string;
    entry_price: number;
    stop_loss_price: number | null;
    take_profit_price: number | null;
    quantity: number;
    total_invested: number;
    leverage: number;
    status: string;
    side: string;
    platform: string;
    max_dca_level: number;
    dca_level: number;
    platform_order_id: string | null;
    client_order_id?: string;
    signal_id?: string;
    source_mode?: 'auto_bot' | 'manual_execute' | 'manual_smart_trade' | 'signal_execution';
    managed_by_bot?: boolean;
    management_profile_id?: string;
  }
): Promise<any> {
  console.log('Creating trade with data:', tradeData);
  
  // Generate client order ID if not provided
  const clientOrderId = tradeData.client_order_id || 
    generateClientOrderId(userId, tradeData.signal_id, tradeData.symbol);
  
  const { data: trade, error: tradeError } = await supabaseClient
    .from('trades')
    .insert({
      ...tradeData,
      user_id: userId,
      client_order_id: clientOrderId,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (tradeError) {
    console.error('Error creating trade:', tradeError);
    throw new Error(`Failed to create trade record: ${tradeError.message}`);
  }
  
  console.log('Trade created successfully:', trade.id);
  return trade;
}

/**
 * Create DCA orders records in database
 */
export async function createDCAOrderRecords(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  tradeId: string,
  entryPrice: number,
  entryQuantity: number,
  initialAmount: number,
  dcaLevels: DCALevel[],
  placedOrders: OrderWithMetadata[],
  autoExecute: boolean,
  platform: string,
  symbol: string,
  signalId?: string
): Promise<void> {
  // Create entry order tracking
  const entryOrder = placedOrders.find(o => o.orderType === 'ENTRY');
  if (entryOrder) {
    try {
      const clientOrderId = generateClientOrderId(userId, signalId, symbol);
      await createTradeOrder(supabaseClient, {
        tradeId,
        userId,
        orderType: 'ENTRY',
        orderLevel: 0,
        platform,
        platformOrderId: entryOrder.orderId,
        clientOrderId: `${clientOrderId}-ENTRY`,
        symbol,
        side: 'BUY' as const,
        orderSide: 'buy' as const,
        requestedPrice: entryPrice,
        requestedQuantity: entryQuantity,
        orderTypeExchange: entryOrder.orderType || 'LIMIT',
        exchangeResponse: entryOrder
      });

      // Update status if auto-executed
      if (autoExecute && entryOrder.orderId) {
        await updateOrderStatus(
          supabaseClient,
          tradeId, // This should be orderId, we'll fix it
          'FILLED',
          {
            filledPrice: entryPrice,
            filledQuantity: entryQuantity,
            filledAt: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('Error creating entry order tracking:', error);
      // Continue with DCA orders even if entry order tracking fails
    }
  }

  if (!dcaLevels || dcaLevels.length === 0) {
    return;
  }
  
  const dcaOrders = [];
  
  // Add initial entry order to dca_orders (legacy table)
  dcaOrders.push({
    user_id: userId,
    trade_id: tradeId,
    target_price: entryPrice,
    quantity: entryQuantity,
    amount: initialAmount,
    status: autoExecute && entryOrder ? 'EXECUTED' : 'PENDING',
    dca_level: 0,
    platform_order_id: entryOrder?.orderId?.toString(),
    created_at: new Date().toISOString()
  });
  
  // Add DCA levels
  for (const level of dcaLevels) {
    const dcaQuantity = level.amount / level.targetPrice;
    const dcaOrder = placedOrders.find(
      o => o.orderType === 'DCA' && o.level === level.level
    );
    
    // Add to legacy dca_orders table
    dcaOrders.push({
      user_id: userId,
      trade_id: tradeId,
      target_price: level.targetPrice,
      quantity: dcaQuantity,
      amount: level.amount,
      status: autoExecute && dcaOrder ? 'PENDING' : 'PENDING',
      dca_level: level.level,
      platform_order_id: dcaOrder?.orderId?.toString(),
      created_at: new Date().toISOString()
    });

    // Create trade_order tracking
    if (dcaOrder) {
      try {
        const clientOrderId = generateClientOrderId(userId, signalId, symbol);
        await createTradeOrder(supabaseClient, {
          tradeId,
          userId,
          orderType: 'DCA',
          orderLevel: level.level,
          platform,
          platformOrderId: dcaOrder.orderId,
          clientOrderId: `${clientOrderId}-DCA-${level.level}`,
          symbol,
          side: 'BUY' as const,
          orderSide: 'buy' as const,
          requestedPrice: level.targetPrice,
          requestedQuantity: dcaQuantity,
          orderTypeExchange: 'LIMIT',
          exchangeResponse: dcaOrder
        });
      } catch (error) {
        console.error(`Error creating DCA order tracking for level ${level.level}:`, error);
        // Continue with other orders
      }
    }
  }
  
  console.log('Creating DCA orders:', dcaOrders.length);
  
  const { error: ordersError } = await supabaseClient
    .from('dca_orders')
    .insert(dcaOrders);
  
  if (ordersError) {
    console.error('Error creating DCA orders:', ordersError);
    throw new Error(`Failed to create DCA orders: ${ordersError.message}`);
  }
  
  console.log(`Created ${dcaOrders.length} DCA orders successfully`);
}

