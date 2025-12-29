# Orbitra AI™ - AI-Powered Trading Platform

A comprehensive cryptocurrency trading platform powered by artificial intelligence, offering automated trading, copy trading, portfolio management, and advanced analytics.

## 🚀 Features

### Core Trading Features
- **AI-Powered Signals**: Advanced neural networks analyze market data in real-time to generate highly accurate trading signals
- **Automated Trading**: Deploy intelligent trading bots that execute strategies 24/7 with precision and consistency
- **Copy Trading System**: Follow successful traders and automatically copy their trades with customizable risk parameters
- **Smart Trade Execution**: Lightning-fast trade execution across multiple exchanges
- **Portfolio Management**: Comprehensive portfolio tracking and analysis with AI-driven insights

### Advanced Analytics
- **Real-Time Analytics**: Monitor performance with advanced charts, metrics, and predictive insights
- **Portfolio Insights**: AI-powered portfolio analysis with risk assessment and recommendations
- **Performance Tracking**: Detailed performance metrics and historical data analysis
- **Advanced Analytics Dashboard**: Deep market analysis and trading pattern recognition

### Risk Management
- **Advanced Risk Management**: Comprehensive risk assessment and portfolio protection
- **AI-Driven Stop-Loss Algorithms**: Intelligent stop-loss management
- **Risk Filters**: Multiple risk filtering mechanisms for copy trading
- **Position Sizing**: Smart position sizing based on risk tolerance

### Social & Community Features
- **Community Signals**: Share and discover trading signals from the community
- **Trader Rankings**: Leaderboard of top-performing traders
- **Influencer Network**: Connect with verified trading influencers
- **Social Trading**: Rate, comment, and favorite copy trading strategies

### Additional Features
- **Multi-Exchange Support**: Trade on Binance, OKX, Bybit, KuCoin, and more
- **TradingView Integration**: Seamless integration with TradingView webhooks
- **AI Live Center**: Real-time AI-powered market analysis and insights
- **Affiliate System**: Referral program with commission tracking
- **Subscription Plans**: Flexible subscription tiers with feature access control

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, Realtime)
- **State Management**: React Query, React Hooks
- **Charts**: Recharts
- **Authentication**: Supabase Auth
- **API Integration**: Binance API, TradingView Webhooks

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- API keys for supported exchanges (Binance, OKX, Bybit, KuCoin)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/cylendra-info/OrbitraAI.git
cd OrbitraAI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

4. Run database migrations:
```bash
# Using Supabase CLI
supabase migration up
```

5. Deploy Edge Functions:
```bash
supabase functions deploy
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── copy-trading/    # Copy trading UI components
│   │   ├── marketing/      # Marketing pages components
│   │   └── ui/             # shadcn/ui components
│   ├── core/               # Core business logic
│   │   ├── copy-trading/   # Copy trading engine
│   │   ├── plans/          # Subscription plan management
│   │   └── ai-live/        # AI live center logic
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── services/           # API services
│   └── integrations/       # Third-party integrations
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## 🗄️ Database Schema

The platform uses PostgreSQL with the following main tables:
- `users` - User accounts and profiles
- `bots` - Trading bot configurations
- `trades` - Trade history
- `copy_strategies` - Copy trading strategies
- `copy_followers` - Follower configurations
- `copy_trades_log` - Copy trade execution logs
- `portfolio_snapshots` - Portfolio tracking data
- `signals` - Trading signals
- `subscriptions` - User subscription plans

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy Edge Functions
```bash
supabase functions deploy <function-name>
```

### Environment Setup
Ensure all environment variables are configured in your deployment platform:
- Supabase URL and keys
- Exchange API credentials (stored securely in database)
- Any third-party service keys

## 🔐 Security

- Row Level Security (RLS) enabled on all database tables
- API keys encrypted and stored securely
- Rate limiting on sensitive endpoints
- HMAC verification for webhook endpoints
- Plan-based feature access control

## 📝 License

Copyright © 2025 Cylendra. All rights reserved.

## 👥 Contact

For support and inquiries, please contact: cylendralabs@gmail.com

## 🙏 Acknowledgments

Built with cutting-edge AI technology to revolutionize cryptocurrency trading.

