
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

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client for checking user permissions
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin (Phase Admin F: RBAC)
    // Use admin client to bypass RLS for role checking
    const { data: roleAssignments, error: roleError } = await supabaseAdmin
      .from('user_role_assignments')
      .select(`
        role:roles(name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    
    if (roleError) {
      console.error('Error checking user roles:', roleError)
      // Fallback to old method
      const { data: isAdminData, error: isAdminError } = await supabaseAuth.rpc('is_admin', { _user_id: user.id })
      if (isAdminError || !isAdminData) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // Check if user has owner or admin role
      const roles = (roleAssignments || [])
        .map((assignment: any) => assignment.role?.name)
        .filter(Boolean)
      
      const hasAdminAccess = roles.includes('owner') || roles.includes('admin')
      
      if (!hasAdminAccess) {
        console.log('User does not have admin access. Roles:', roles)
        return new Response(
          JSON.stringify({ error: 'Access denied. Admin or Owner role required.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.log('User has admin access. Roles:', roles)
    }

    // Parse request body if it exists
    let requestBody = {}
    if (req.method === 'POST' && req.body) {
      try {
        requestBody = await req.json()
      } catch (e) {
        // Ignore parsing errors for backward compatibility
      }
    }

    const url = new URL(req.url)
    const action = requestBody.action || url.searchParams.get('action') || 'list'
    const userId = requestBody.userId || url.searchParams.get('userId')
    const query = requestBody.query || url.searchParams.get('query')

    console.log('Admin Users Edge Function - Action:', action, 'UserId:', userId, 'Query:', query)

    switch (action) {
      case 'list': {
        // Get all users from auth.users
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (authError) {
          console.error('Error fetching auth users:', authError)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch users', details: authError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const users = authUsers?.users || []
        if (users.length === 0) {
          return new Response(
            JSON.stringify({ users: [] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const userIds = users.map(user => user.id)

        // Get comprehensive user data in parallel
        const [profilesData, rolesData, tradesData, strategiesData, securityData, apiKeysData, portfolioData, botSettingsData] = await Promise.all([
          supabaseAdmin.from('profiles').select('user_id, full_name, username, created_at').in('user_id', userIds),
          supabaseAdmin.from('user_roles').select('user_id, role').in('user_id', userIds),
          supabaseAdmin.from('trades').select('user_id, status, realized_pnl, platform, created_at').in('user_id', userIds),
          supabaseAdmin.from('strategy_templates').select('user_id, name, type, is_active, created_at').in('user_id', userIds),
          supabaseAdmin.from('security_logs').select('user_id, action, created_at').in('user_id', userIds).eq('action', 'login').order('created_at', { ascending: false }),
          supabaseAdmin.from('api_keys').select('user_id, platform, is_active, testnet').in('user_id', userIds),
          supabaseAdmin.from('portfolio_balances').select('user_id, symbol, total_balance, usd_value, platform').in('user_id', userIds),
          supabaseAdmin.from('bot_settings').select('user_id, is_active, total_capital, risk_percentage, default_platform').in('user_id', userIds)
        ])

        const profiles = profilesData.data || []
        const roles = rolesData.data || []
        const trades = tradesData.data || []
        const strategies = strategiesData.data || []
        const securityLogs = securityData.data || []
        const apiKeys = apiKeysData.data || []
        const portfolioBalances = portfolioData.data || []
        const botSettings = botSettingsData.data || []

        // Process users data with comprehensive information
        const processedUsers = users.map(authUser => {
          const profile = profiles.find(p => p.user_id === authUser.id)
          const userRoles = roles.filter(r => r.user_id === authUser.id).map(r => r.role)
          const userTrades = trades.filter(t => t.user_id === authUser.id)
          const userStrategies = strategies.filter(s => s.user_id === authUser.id)
          const userApiKeys = apiKeys.filter(k => k.user_id === authUser.id)
          const userPortfolio = portfolioBalances.filter(b => b.user_id === authUser.id)
          const userBotSettings = botSettings.find(b => b.user_id === authUser.id)
          const lastLogin = securityLogs.find(l => l.user_id === authUser.id)

          // Calculate trading statistics
          const closedTrades = userTrades.filter(t => t.status === 'CLOSED')
          const totalProfit = closedTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0)
          const activeStrategies = userStrategies.filter(s => s.is_active).length
          
          // Calculate total portfolio value
          const totalPortfolioValue = userPortfolio.reduce((sum, b) => sum + (b.usd_value || 0), 0)
          
          // Get connected platforms
          const connectedPlatforms = [...new Set(userApiKeys.filter(k => k.is_active).map(k => k.platform))]

          return {
            id: authUser.id,
            email: authUser.email || profile?.username || 'غير محدد',
            full_name: profile?.full_name || authUser.user_metadata?.full_name || 'غير محدد',
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at || lastLogin?.created_at || '',
            roles: userRoles,
            is_active: !!authUser.last_sign_in_at && new Date(authUser.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            total_trades: closedTrades.length,
            total_strategies: userStrategies.length,
            active_strategies: activeStrategies,
            account_balance: totalPortfolioValue,
            total_profit: totalProfit,
            connected_platforms: connectedPlatforms,
            bot_active: userBotSettings?.is_active || false,
            risk_level: userBotSettings?.risk_percentage || 0,
            total_capital: userBotSettings?.total_capital || 0,
            api_keys_count: userApiKeys.length,
            testnet_keys: userApiKeys.filter(k => k.testnet).length,
            mainnet_keys: userApiKeys.filter(k => !k.testnet).length
          }
        })

        return new Response(
          JSON.stringify({ users: processedUsers }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId parameter' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Fetching comprehensive user details for:', userId)

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
        
        if (authError || !authUser?.user) {
          console.error('Error fetching auth user:', authError)
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get comprehensive user data
        const [profileData, rolesData, tradesData, strategiesData, securityData, apiKeysData, portfolioData, botSettingsData, dcaOrdersData, notificationsData] = await Promise.all([
          supabaseAdmin.from('profiles').select('*').eq('user_id', userId).single(),
          supabaseAdmin.from('user_roles').select('role, created_at').eq('user_id', userId),
          supabaseAdmin.from('trades').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabaseAdmin.from('strategy_templates').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabaseAdmin.from('security_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
          supabaseAdmin.from('api_keys').select('*').eq('user_id', userId),
          supabaseAdmin.from('portfolio_balances').select('*').eq('user_id', userId),
          supabaseAdmin.from('bot_settings').select('*').eq('user_id', userId).single(),
          supabaseAdmin.from('dca_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
          supabaseAdmin.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
        ])

        const profile = profileData.data
        const roles = rolesData.data?.map(r => r.role) || []
        const trades = tradesData.data || []
        const strategies = strategiesData.data || []
        const securityLogs = securityData.data || []
        const apiKeys = apiKeysData.data || []
        const portfolioBalances = portfolioData.data || []
        const botSettings = botSettingsData.data
        const dcaOrders = dcaOrdersData.data || []
        const notifications = notificationsData.data || []

        // Calculate detailed statistics
        const closedTrades = trades.filter(t => t.status === 'CLOSED')
        const activeTrades = trades.filter(t => t.status === 'ACTIVE')
        const totalProfit = closedTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0)
        const totalInvested = activeTrades.reduce((sum, t) => sum + (t.total_invested || 0), 0)
        const winningTrades = closedTrades.filter(t => (t.realized_pnl || 0) > 0).length
        const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0
        
        const activeStrategies = strategies.filter(s => s.is_active)
        const strategyTypes = [...new Set(strategies.map(s => s.type))]
        
        const connectedPlatforms = [...new Set(apiKeys.filter(k => k.is_active).map(k => k.platform))]
        const totalPortfolioValue = portfolioBalances.reduce((sum, b) => sum + (b.usd_value || 0), 0)
        
        const lastLogin = securityLogs.find(l => l.action === 'login')
        const loginCount = securityLogs.filter(l => l.action === 'login').length

        const userDetails = {
          id: authUser.user.id,
          email: authUser.user.email || profile?.username || 'غير محدد',
          full_name: profile?.full_name || authUser.user.user_metadata?.full_name || 'غير محدد',
          username: profile?.username || 'غير محدد',
          created_at: authUser.user.created_at,
          last_sign_in_at: authUser.user.last_sign_in_at || lastLogin?.created_at || '',
          roles: roles,
          is_active: !!authUser.user.last_sign_in_at && new Date(authUser.user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          
          // Trading Statistics
          total_trades: trades.length,
          closed_trades: closedTrades.length,
          active_trades: activeTrades.length,
          winning_trades: winningTrades,
          win_rate: winRate,
          total_profit: totalProfit,
          total_invested: totalInvested,
          
          // Strategy Information
          total_strategies: strategies.length,
          active_strategies: activeStrategies.length,
          strategy_types: strategyTypes,
          
          // Platform & Portfolio
          connected_platforms: connectedPlatforms,
          portfolio_balances: portfolioBalances,
          total_portfolio_value: totalPortfolioValue,
          
          // Bot Settings
          bot_settings: botSettings,
          bot_active: botSettings?.is_active || false,
          
          // API Keys
          api_keys: apiKeys.map(key => ({
            platform: key.platform,
            is_active: key.is_active,
            testnet: key.testnet,
            created_at: key.created_at
          })),
          
          // Recent Activity
          recent_trades: trades.slice(0, 10),
          recent_strategies: strategies.slice(0, 5),
          recent_dca_orders: dcaOrders,
          recent_notifications: notifications,
          recent_security_logs: securityLogs.slice(0, 10),
          login_count: loginCount,
          
          // Additional Stats
          account_balance: totalPortfolioValue
        }

        console.log('Comprehensive user details retrieved successfully:', userDetails.email)

        return new Response(
          JSON.stringify({ user: userDetails }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'search': {
        if (!query || query.trim() === '') {
          return new Response(
            JSON.stringify({ users: [] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Searching users with query:', query)

        // Search in profiles first
        const { data: profileMatches, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('user_id, full_name, username')
          .or(`full_name.ilike.%${query}%, username.ilike.%${query}%, user_id.eq.${query}`)

        if (profileError) {
          console.error('Profile search error:', profileError)
          return new Response(
            JSON.stringify({ error: 'Search failed', details: profileError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!profileMatches || profileMatches.length === 0) {
          return new Response(
            JSON.stringify({ users: [] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const userIds = profileMatches.map(profile => profile.user_id)

        // Get auth users data
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (authError || !authUsers?.users) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch auth users', details: authError?.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const matchingUsers = authUsers.users.filter(user => user && user.id && userIds.includes(user.id))

        if (matchingUsers.length === 0) {
          return new Response(
            JSON.stringify({ users: [] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const matchingUserIds = matchingUsers.map(user => user.id)

        // Get additional data for matching users
        const [rolesData, tradesData, strategiesData, apiKeysData, portfolioData, botSettingsData] = await Promise.all([
          supabaseAdmin.from('user_roles').select('user_id, role').in('user_id', matchingUserIds),
          supabaseAdmin.from('trades').select('user_id, status, realized_pnl').in('user_id', matchingUserIds),
          supabaseAdmin.from('strategy_templates').select('user_id, is_active').in('user_id', matchingUserIds),
          supabaseAdmin.from('api_keys').select('user_id, platform, is_active').in('user_id', matchingUserIds),
          supabaseAdmin.from('portfolio_balances').select('user_id, usd_value').in('user_id', matchingUserIds),
          supabaseAdmin.from('bot_settings').select('user_id, is_active, total_capital').in('user_id', matchingUserIds)
        ])

        const processedUsers = matchingUsers.map(user => {
          const profile = profileMatches.find(p => p.user_id === user.id)
          const userRoles = rolesData.data?.filter(r => r.user_id === user.id).map(r => r.role) || []
          const userTrades = tradesData.data?.filter(t => t.user_id === user.id) || []
          const userStrategies = strategiesData.data?.filter(s => s.user_id === user.id) || []
          const userApiKeys = apiKeysData.data?.filter(k => k.user_id === user.id) || []
          const userPortfolio = portfolioData.data?.filter(b => b.user_id === user.id) || []
          const userBotSettings = botSettingsData.data?.find(b => b.user_id === user.id)

          const closedTrades = userTrades.filter(t => t.status === 'CLOSED')
          const totalProfit = closedTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0)
          const activeStrategies = userStrategies.filter(s => s.is_active).length
          const totalPortfolioValue = userPortfolio.reduce((sum, b) => sum + (b.usd_value || 0), 0)
          const connectedPlatforms = [...new Set(userApiKeys.filter(k => k.is_active).map(k => k.platform))]

          return {
            id: user.id,
            email: user.email || profile?.username || 'غير محدد',
            full_name: profile?.full_name || user.user_metadata?.full_name || 'غير محدد',
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at || '',
            roles: userRoles,
            is_active: !!user.last_sign_in_at && new Date(user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            total_trades: closedTrades.length,
            total_strategies: userStrategies.length,
            active_strategies: activeStrategies,
            account_balance: totalPortfolioValue,
            total_profit: totalProfit,
            connected_platforms: connectedPlatforms,
            bot_active: userBotSettings?.is_active || false,
            total_capital: userBotSettings?.total_capital || 0
          }
        })

        return new Response(
          JSON.stringify({ users: processedUsers }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
