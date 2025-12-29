import { LucideIcon, Rocket, Calendar } from "lucide-react";

export type EventStatus = "UPCOMING" | "LIVE" | "COMPLETED";

export interface Event {
  id: string;
  title: string;
  slug: string;
  author: string;
  date: string;
  status: EventStatus;
  icon: LucideIcon;
  image?: string;  // URL للصورة الواحدة التي تُستخدم في كل المكان
  shortDescription: string;
  content: string;
  highlights: string[];
  tags: string[];
  readTime: number;
}

export const events: Event[] = [
  {
    id: "cryptopulse-launch",
    title: "CryptoPulse — Smart Market Signals",
    slug: "cryptopulse-smart-market-signals",
    author: "Cylendra",
    date: "2025-12-30",
    status: "LIVE",
    icon: Rocket,
    image: "/images/events/cryptopulse-hero.jpg",  // صورة واحدة تُستخدم في كل مكان
    shortDescription: "Your intelligent companion for real-time crypto market insights — built to help traders make smarter, data-driven decisions.",
    content: `# CryptoPulse — Smart Market Signals

CryptoPulse is an intelligent crypto market analysis bot designed to deliver clean, real-time insights without noise or overhyped signals.

Built for traders who value precision, clarity, and timing.

## 🔍 What CryptoPulse Does

• Real-time crypto market monitoring
• Smart signal detection based on market behavior
• Trend & momentum analysis
• Volatility and liquidity awareness
• Noise-free alerts focused on quality, not quantity
• Multiple analysis modes for different trading styles

## 🧠 Why CryptoPulse?

Most tools flood you with alerts.
CryptoPulse filters the market and highlights what actually matters.

No random calls.
No signal spam.
Just structured, data-driven market intelligence.

## ⚡ Built for Serious Traders

Whether you trade momentum, trends, or wait patiently for high-quality setups, CryptoPulse helps you stay ahead with confidence.

### 📊 Smart insights. Real-time signals. Precision trading.

Powered by advanced analytics
Built by Cylendra

## Key Features

- **Real-time market analysis** - Get instant market data and analysis
- **Smart signal detection** - Intelligent algorithms identify quality opportunities
- **Trend & momentum insights** - Understand market direction and strength
- **Noise-free alerts** - Only relevant signals that matter
- **Multiple analysis modes** - Choose the strategy that fits your style

## Who Should Use CryptoPulse?

- Day traders looking for quick opportunities
- Swing traders seeking trend confirmation
- Long-term investors wanting market insights
- Risk-conscious traders preferring precision over volume

Join thousands of traders already using CryptoPulse to make better decisions.`,
    highlights: [
      "Real-time crypto market monitoring",
      "Smart signal detection based on market behavior",
      "Trend & momentum analysis",
      "Volatility and liquidity awareness",
      "Noise-free alerts focused on quality, not quantity",
      "Multiple analysis modes for different trading styles"
    ],
    tags: ["#CryptoPulse", "#CryptoTrading", "#CryptoSignals", "#TradingBot", "#CryptoAnalysis", "#FinTech", "#AI", "#Web3"],
    readTime: 5
  }
];
