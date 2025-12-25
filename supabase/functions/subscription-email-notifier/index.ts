/**
 * Subscription Email Notifier Edge Function
 * 
 * Phase Admin Billing: Send email notifications for expiring subscriptions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get pending notifications
    // Handle case where table might not exist yet
    let notifications: any[] = []
    let notificationsError: any = null
    
    try {
      const result = await supabaseAdmin
        .from('subscription_notifications')
        .select('*')
        .eq('email_sent', false)
        .is('sent_at', null)
        .order('created_at', { ascending: true })
        .limit(50) // Process 50 at a time
      
      notifications = result.data || []
      notificationsError = result.error
    } catch (error) {
      // Table might not exist yet - this is OK
      console.log('Table subscription_notifications might not exist yet:', error)
      return new Response(
        JSON.stringify({ 
          message: 'No pending notifications (table may not exist yet)', 
          processed: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      // Don't fail completely - just return success with 0 processed
      return new Response(
        JSON.stringify({ 
          message: 'Error fetching notifications', 
          error: notificationsError.message,
          processed: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processed = 0
    let failed = 0

    for (const notification of notifications) {
      try {
        // Get user email
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(notification.user_id)
        
        if (userError || !user?.email) {
          console.error('Error fetching user:', userError)
          failed++
          continue
        }

        // Generate email content based on notification type
        const emailContent = generateEmailContent(notification, user.email)

        // For now, we'll use a placeholder email service
        // In production, integrate with SendGrid, Resend, or similar
        const emailSent = await sendEmailNotification(
          user.email,
          emailContent.subject,
          emailContent.html,
          emailContent.text
        )

        if (emailSent) {
          // Update notification as sent
          await supabaseAdmin
            .from('subscription_notifications')
            .update({
              email_sent: true,
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id)

          processed++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Error processing notification:', notification.id, error)
        failed++
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications processed',
        processed,
        failed,
        total: notifications.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in subscription-email-notifier:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Generate email content based on notification type
 */
function generateEmailContent(notification: any, userEmail: string): {
  subject: string
  html: string
  text: string
} {
  const planName = notification.metadata?.plan_name || notification.plan_code || 'الاشتراك'
  const daysRemaining = notification.metadata?.days_remaining || 0
  const expiresAt = notification.expires_at ? new Date(notification.expires_at).toLocaleDateString('ar-SA') : 'قريباً'

  let subject = ''
  let message = ''

  switch (notification.notification_type) {
    case 'expiring_7_days':
      subject = `تنبيه: اشتراكك سينتهي خلال ${daysRemaining} أيام - Orbitra AI`
      message = `
        <p>مرحباً،</p>
        <p>نود إعلامك أن اشتراكك في خطة <strong>${planName}</strong> سينتهي خلال <strong>${daysRemaining} أيام</strong>.</p>
        <p>تاريخ الانتهاء: <strong>${expiresAt}</strong></p>
        <p>لتجنب انقطاع الخدمة، يرجى تجديد اشتراكك قبل تاريخ الانتهاء.</p>
        <p><a href="https://orbitra.ai/dashboard/subscription" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">تجديد الاشتراك</a></p>
        <p>شكراً لاستخدام Orbitra AI™</p>
      `
      break

    case 'expiring_3_days':
      subject = `تنبيه عاجل: اشتراكك سينتهي خلال ${daysRemaining} أيام - Orbitra AI`
      message = `
        <p>مرحباً،</p>
        <p><strong>تنبيه عاجل:</strong> اشتراكك في خطة <strong>${planName}</strong> سينتهي خلال <strong>${daysRemaining} أيام</strong> فقط!</p>
        <p>تاريخ الانتهاء: <strong>${expiresAt}</strong></p>
        <p>يرجى تجديد اشتراكك الآن لتجنب انقطاع الخدمة.</p>
        <p><a href="https://orbitra.ai/dashboard/subscription" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">تجديد الاشتراك الآن</a></p>
        <p>شكراً لاستخدام Orbitra AI™</p>
      `
      break

    case 'expiring_today':
      subject = `⚠️ اشتراكك ينتهي اليوم! - Orbitra AI`
      message = `
        <p>مرحباً،</p>
        <p><strong>تنبيه مهم:</strong> اشتراكك في خطة <strong>${planName}</strong> ينتهي <strong>اليوم</strong>!</p>
        <p>تاريخ الانتهاء: <strong>${expiresAt}</strong></p>
        <p>يرجى تجديد اشتراكك فوراً لتجنب انقطاع الخدمة.</p>
        <p><a href="https://orbitra.ai/dashboard/subscription" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold;">تجديد الاشتراك الآن</a></p>
        <p>شكراً لاستخدام Orbitra AI™</p>
      `
      break

    case 'expired':
      subject = `اشتراكك قد انتهى - Orbitra AI`
      message = `
        <p>مرحباً،</p>
        <p>نود إعلامك أن اشتراكك في خطة <strong>${planName}</strong> قد انتهى.</p>
        <p>تاريخ الانتهاء: <strong>${expiresAt}</strong></p>
        <p>للاستمرار في استخدام جميع الميزات، يرجى تجديد اشتراكك.</p>
        <p><a href="https://orbitra.ai/dashboard/subscription" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">تجديد الاشتراك</a></p>
        <p>شكراً لاستخدام Orbitra AI™</p>
      `
      break

    default:
      subject = `إشعار من Orbitra AI`
      message = `<p>مرحباً،</p><p>لديك إشعار جديد من Orbitra AI.</p>`
  }

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Orbitra AI™</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        ${message}
      </div>
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Orbitra AI. جميع الحقوق محفوظة.</p>
      </div>
    </body>
    </html>
  `

  const text = message.replace(/<[^>]*>/g, '').trim()

  return { subject, html, text }
}

/**
 * Send email notification
 * 
 * Note: This is a placeholder. In production, integrate with:
 * - SendGrid (https://sendgrid.com)
 * - Resend (https://resend.com)
 * - AWS SES
 * - Or use Supabase's built-in email (if available)
 */
async function sendEmailNotification(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  try {
    // TODO: Replace with actual email service integration
    // Example with Resend:
    /*
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Orbitra AI <noreply@orbitra.ai>',
        to: [to],
        subject,
        html,
        text,
      }),
    })
    
    return response.ok
    */

    // For now, just log (in production, this should actually send emails)
    console.log('📧 Email notification:', {
      to,
      subject,
      html: html.substring(0, 100) + '...',
    })

    // Simulate email sending (remove in production)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

