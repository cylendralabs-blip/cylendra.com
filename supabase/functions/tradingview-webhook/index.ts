
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  strategy: string;
  symbol: string;
  timeframe: string;
  action: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  price: number;
  stop_loss?: number;
  take_profit?: number;
  confidence?: number;
  indicators?: Record<string, any>;
  conditions?: Record<string, any>;
  message?: string;
  timestamp?: number;
  secret?: string;
  user_id?: string;
}

function parseTextMessage(message: string): Partial<WebhookPayload> | null {
  console.log('📝 تحليل الرسالة النصية:', message);
  
  // التحقق من أنها رسالة من استراتيجية TradingView
  if (!message.includes('strategy') && !message.includes('order') && !message.includes('alert')) {
    console.log('⚠️ الرسالة لا تحتوي على كلمات مفتاحية للتداول');
    return null;
  }

  try {
    const result: Partial<WebhookPayload> = {
      strategy: 'Unknown Strategy',
      timeframe: '5m'
    };

    // استخراج الرمز - محاولات متعددة
    const symbolPatterns = [
      /symbol["\s]*[:=]["\s]*([A-Z]+[\/]?[A-Z]*)/i,
      /ticker["\s]*[:=]["\s]*([A-Z]+[\/]?[A-Z]*)/i,
      /on\s+([A-Z]+)/i,
      /([A-Z]{2,}USDT?)/i,
      /([A-Z]{2,}\/[A-Z]{2,})/i
    ];

    for (const pattern of symbolPatterns) {
      const match = message.match(pattern);
      if (match) {
        let symbol = match[1].toUpperCase();
        if (!symbol.includes('/') && !symbol.includes('USDT')) {
          symbol = symbol + '/USDT';
        }
        result.symbol = symbol;
        console.log('✅ تم استخراج الرمز:', symbol);
        break;
      }
    }

    if (!result.symbol) {
      result.symbol = 'BTC/USDT'; // افتراضي
      console.log('⚠️ لم يتم العثور على رمز، استخدام BTC/USDT كافتراضي');
    }

    // استخراج نوع الأمر - محاولات متعددة
    const actionPatterns = [
      /action["\s]*[:=]["\s]*["']?(BUY|SELL|LONG|SHORT)["']?/i,
      /order["\s]+([A-Z]+)/i,
      /(BUY|SELL|LONG|SHORT)/i
    ];

    for (const pattern of actionPatterns) {
      const match = message.match(pattern);
      if (match) {
        const action = match[1].toUpperCase();
        result.action = (action === 'LONG' || action === 'BUY') ? 'BUY' : 'SELL';
        console.log('✅ تم استخراج نوع الأمر:', result.action);
        break;
      }
    }

    if (!result.action) {
      result.action = 'BUY'; // افتراضي
      console.log('⚠️ لم يتم العثور على نوع أمر، استخدام BUY كافتراضي');
    }

    // استخراج السعر - محاولات متعددة
    const pricePatterns = [
      /price["\s]*[:=]["\s]*(\d+\.?\d*)/i,
      /close["\s]*[:=]["\s]*(\d+\.?\d*)/i,
      /@\s*(\d+\.?\d*)/,
      /(\d+\.\d{2,})/
    ];

    for (const pattern of pricePatterns) {
      const match = message.match(pattern);
      if (match) {
        result.price = parseFloat(match[1]);
        console.log('✅ تم استخراج السعر:', result.price);
        break;
      }
    }

    if (!result.price) {
      result.price = 0; // سيتم تحديده لاحقاً
      console.log('⚠️ لم يتم العثور على سعر');
    }

    // استخراج الاستراتيجية
    const strategyPatterns = [
      /strategy["\s]*[:=]["\s]*["']?([^"'\n]+)["']?/i,
      /([A-Za-z\s]+strategy[A-Za-z\s]*)/i
    ];

    for (const pattern of strategyPatterns) {
      const match = message.match(pattern);
      if (match) {
        result.strategy = match[1].trim();
        console.log('✅ تم استخراج الاستراتيجية:', result.strategy);
        break;
      }
    }

    // إضافة معلومات افتراضية
    result.confidence = 75;
    result.message = message;
    result.timestamp = Date.now();

    console.log('✅ تم تحليل الرسالة النصية بنجاح:', result);
    return result;
  } catch (error) {
    console.error('❌ خطأ في تحليل الرسالة النصية:', error);
    return null;
  }
}

serve(async (req) => {
  const startTime = Date.now();
  console.log('🔔 تم استلام طلب webhook من TradingView');
  console.log('📊 تفاصيل الطلب:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ معالجة طلب CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      console.log('❌ طريقة غير مسموحة:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed', received_method: req.method }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Phase X.15: HMAC Verification
    const webhookSecret = Deno.env.get('TRADINGVIEW_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature = req.headers.get('x-signature') || req.headers.get('x-tradingview-signature');
      if (signature) {
        const { verifyHMAC } = await import('../_shared/hmac.ts');
        const rawBody = await req.clone().text();
        const isValid = await verifyHMAC(rawBody, signature, webhookSecret);
        
        if (!isValid) {
          console.error('❌ HMAC verification failed');
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        console.log('✅ HMAC verification passed');
      }
    }

    // قراءة البيانات
    const rawBody = await req.text();
    console.log('📦 محتوى الطلب الخام:', rawBody);
    console.log('📏 حجم البيانات:', rawBody.length, 'أحرف');

    if (!rawBody || rawBody.trim().length === 0) {
      console.log('❌ لا توجد بيانات في الطلب');
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let payload: Partial<WebhookPayload> = {};
    let dataSource = 'unknown';
    
    // محاولة تحليل JSON أولاً
    try {
      payload = JSON.parse(rawBody);
      dataSource = 'json';
      console.log('✅ تم تحليل البيانات كـ JSON بنجاح');
      console.log('📋 بيانات JSON:', JSON.stringify(payload, null, 2));
    } catch (jsonError) {
      console.log('⚠️ فشل تحليل JSON، محاولة تحليل كنص...');
      console.log('🔍 خطأ JSON:', jsonError.message);
      
      // محاولة تحليل النص
      const parsedText = parseTextMessage(rawBody);
      if (parsedText) {
        payload = parsedText;
        dataSource = 'text';
        console.log('✅ تم تحليل البيانات كنص بنجاح');
      } else {
        console.error('❌ فشل في تحليل البيانات كـ JSON أو نص');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid message format', 
            received_data: rawBody.substring(0, 200),
            json_error: jsonError.message
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // تطبيق القيم الافتراضية
    const processedPayload = {
      strategy: payload.strategy || 'TradingView Strategy',
      symbol: payload.symbol || 'BTC/USDT',
      action: payload.action || 'BUY',
      timeframe: payload.timeframe || '5m',
      price: payload.price || 0,
      stop_loss: payload.stop_loss,
      take_profit: payload.take_profit,
      confidence: payload.confidence || 75,
      indicators: payload.indicators || {},
      conditions: payload.conditions || {},
      message: payload.message || rawBody.substring(0, 500),
      timestamp: payload.timestamp || Date.now(),
      secret: payload.secret,
      user_id: payload.user_id
    };

    console.log('📋 البيانات النهائية المعالجة:', JSON.stringify(processedPayload, null, 2));

    // إنشاء عميل Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔗 تم إنشاء عميل Supabase');

    // البحث عن المستخدم المفعل
    let userId = processedPayload.user_id;
    
    if (!userId) {
      console.log('🔍 البحث عن المستخدمين المفعلين...');
      const { data: users, error: usersError } = await supabase
        .from('tradingview_settings')
        .select('user_id, is_enabled')
        .eq('is_enabled', true)
        .limit(1);
      
      if (usersError) {
        console.error('❌ خطأ في جلب المستخدمين:', usersError);
        return new Response(
          JSON.stringify({ error: 'Database error fetching users', details: usersError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!users || users.length === 0) {
        console.log('❌ لا توجد مستخدمين مفعلين لـ TradingView');
        return new Response(
          JSON.stringify({ 
            error: 'No enabled TradingView users found',
            suggestion: 'Please enable TradingView signals in settings'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      userId = users[0].user_id;
      console.log('✅ تم العثور على مستخدم مفعل:', userId);
    }

    // جلب إعدادات المستخدم
    console.log('📋 جلب إعدادات المستخدم:', userId);
    const { data: settings, error: settingsError } = await supabase
      .from('tradingview_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.error('❌ خطأ في جلب الإعدادات:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Settings fetch error', details: settingsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings || !settings.is_enabled) {
      console.log('❌ إشارات TradingView معطلة للمستخدم:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'TradingView signals disabled for user',
          user_id: userId
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ إعدادات المستخدم:', settings);

    // التحقق من السر إذا كان مطلوباً
    if (settings.webhook_secret && processedPayload.secret && processedPayload.secret !== settings.webhook_secret) {
      console.log('❌ مفتاح webhook غير صحيح');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من الرمز المسموح
    if (settings.allowed_symbols && settings.allowed_symbols.length > 0 && !settings.allowed_symbols.includes(processedPayload.symbol)) {
      console.log('❌ الرمز غير مسموح:', processedPayload.symbol, 'المسموح:', settings.allowed_symbols);
      return new Response(
        JSON.stringify({ 
          error: 'Symbol not allowed', 
          symbol: processedPayload.symbol,
          allowed_symbols: settings.allowed_symbols
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من الاستراتيجية المسموحة
    if (settings.allowed_strategies && settings.allowed_strategies.length > 0 && !settings.allowed_strategies.includes(processedPayload.strategy)) {
      console.log('❌ الاستراتيجية غير مسموحة:', processedPayload.strategy, 'المسموح:', settings.allowed_strategies);
      return new Response(
        JSON.stringify({ 
          error: 'Strategy not allowed',
          strategy: processedPayload.strategy,
          allowed_strategies: settings.allowed_strategies
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من عدد الإشارات اليومية
    const today = new Date().toISOString().split('T')[0];
    console.log('📊 فحص حد الإشارات اليومية لتاريخ:', today);
    
    const { count, error: countError } = await supabase
      .from('tradingview_signals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (countError) {
      console.error('❌ خطأ في فحص عدد الإشارات:', countError);
    } else {
      console.log('📈 عدد الإشارات اليوم:', count, 'من أصل', settings.max_daily_signals);
      
      if (count && count >= settings.max_daily_signals) {
        console.log('❌ تم تجاوز حد الإشارات اليومية:', count);
        return new Response(
          JSON.stringify({ 
            error: 'Daily signal limit exceeded',
            current_count: count,
            max_allowed: settings.max_daily_signals
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // تحديد قوة الإشارة
    let signalStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' | 'EXCEPTIONAL' = 'MODERATE';
    if (processedPayload.action?.includes('STRONG')) {
      signalStrength = 'STRONG';
    } else if (processedPayload.confidence && processedPayload.confidence >= 90) {
      signalStrength = 'VERY_STRONG';
    } else if (processedPayload.confidence && processedPayload.confidence >= 80) {
      signalStrength = 'STRONG';
    } else if (processedPayload.confidence && processedPayload.confidence < 60) {
      signalStrength = 'WEAK';
    }

    // حساب نسبة المخاطرة إلى الربح
    let riskRewardRatio = 2.0;
    if (processedPayload.stop_loss && processedPayload.take_profit && processedPayload.price && processedPayload.price > 0) {
      const risk = Math.abs(processedPayload.price - processedPayload.stop_loss);
      const reward = Math.abs(processedPayload.take_profit - processedPayload.price);
      if (risk > 0) {
        riskRewardRatio = reward / risk;
      }
    }

    // إنشاء بيانات الإشارة
    const signalData = {
      user_id: userId,
      symbol: processedPayload.symbol,
      timeframe: processedPayload.timeframe,
      signal_type: processedPayload.action,
      signal_strength: signalStrength,
      confidence_score: processedPayload.confidence,
      entry_price: processedPayload.price || 0,
      stop_loss_price: processedPayload.stop_loss,
      take_profit_price: processedPayload.take_profit,
      risk_reward_ratio: riskRewardRatio,
      strategy_name: processedPayload.strategy,
      alert_message: processedPayload.message,
      webhook_data: { 
        original_message: rawBody, 
        parsed_payload: processedPayload,
        data_source: dataSource,
        processing_time: Date.now() - startTime
      },
      technical_indicators: processedPayload.indicators,
      market_conditions: processedPayload.conditions,
      status: 'ACTIVE',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    console.log('💾 إنشاء الإشارة في قاعدة البيانات...');
    console.log('📋 بيانات الإشارة:', JSON.stringify(signalData, null, 2));

    const { data: signal, error: insertError } = await supabase
      .from('tradingview_signals')
      .insert(signalData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ خطأ في إدراج الإشارة:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Database insertion error', 
          details: insertError.message,
          signal_data: signalData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log('✅ تم إنشاء إشارة TradingView بنجاح!');
    console.log('🆔 معرف الإشارة:', signal.id);
    console.log('⏱️ وقت المعالجة:', processingTime, 'مللي ثانية');

    // التحقق من التداول التلقائي
    if (settings.auto_trade_enabled && signal.confidence_score >= settings.min_confidence_score) {
      console.log('🤖 التداول التلقائي مفعل، سيتم تنفيذ الصفقة...');
      // هنا يمكن إضافة منطق التداول التلقائي
    }

    const response = {
      success: true,
      signal_id: signal.id,
      message: 'تم استلام ومعالجة الإشارة بنجاح',
      details: {
        data_source: dataSource,
        symbol: processedPayload.symbol,
        action: processedPayload.action,
        strategy: processedPayload.strategy,
        processing_time_ms: processingTime,
        user_id: userId
      }
    };

    console.log('📤 إرسال الرد:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ خطأ عام في webhook:', error);
    console.error('📊 تفاصيل الخطأ:', {
      message: error.message,
      stack: error.stack,
      processing_time_ms: processingTime
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
