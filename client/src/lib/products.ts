import { LucideIcon, LayoutDashboard, Bot, LineChart, Calculator, Bell, Wallet, Coins, Layers } from "lucide-react";

export type ProductStatus = "LIVE" | "BETA" | "COMING_SOON";

export interface Product {
  id: string;
  name: string;
  slug: string;
  oneLiner: string;
  description: string;
  status: ProductStatus;
  icon: LucideIcon;
  externalLink?: string;
  features: string[];
  valueProp: string;
  whoIsItFor: string[];
  integration: string;
  faq: { question: string; answer: string }[];
}

export const products: Product[] = [
  {
    id: "cylendra-portal",
    name: "Cylendra Portal",
    slug: "cylendra-portal",
    oneLiner: "Your central command center for the entire ecosystem.",
    description: "Connect the ecosystem, manage your tools, and navigate everything from one place.",
    status: "LIVE",
    icon: LayoutDashboard,
    externalLink: "https://portal.cylendra.com",
    valueProp: "The central hub for managing Cylendra products and your trading workflows.",
    features: [
      "Unified access to all Cylendra tools",
      "Centralized dashboard for ecosystem management",
      "Seamless navigation between products",
      "User profile and settings management",
      "Integrated notification center",
      "Future subscription management"
    ],
    whoIsItFor: [
      "All Cylendra ecosystem users",
      "Traders managing multiple tools",
      "Users who want a unified experience"
    ],
    integration: "Acts as the central nervous system, connecting your identity and preferences across all other Cylendra applications.",
    faq: [
      {
        question: "Do I need an account to use the Portal?",
        answer: "Yes, the Portal is your gateway to the ecosystem and requires a Cylendra account."
      },
      {
        question: "Is the Portal free to use?",
        answer: "Accessing the Portal is free, though specific tools within it may have their own tiers."
      },
      {
        question: "Can I customize my dashboard?",
        answer: "Yes, you can configure which widgets and tools appear on your main overview."
      }
    ]
  },
  {
    id: "orbitra-ai",
    name: "Orbitra AI By Cylendra",
    slug: "orbitra-ai",
    oneLiner: "Smart portfolio analysis across exchanges.",
    description: "Track performance, exposure, and risk with clear, explainable analytics—per exchange or combined.",
    status: "BETA",
    icon: LineChart,
    externalLink: "https://orbitraai.netlify.app",
    valueProp: "Portfolio analytics that turns multi-exchange data into explainable insights.",
    features: [
      "Multi-exchange performance tracking",
      "Real-time risk exposure snapshots",
      "Combined portfolio view",
      "Per-exchange detailed breakdown",
      "Export-ready performance summaries",
      "AI-driven insight generation"
    ],
    whoIsItFor: [
      "Active traders with multiple exchange accounts",
      "Portfolio managers needing consolidated views",
      "Risk-conscious investors"
    ],
    integration: "Connects directly to your exchange APIs (read-only) to pull data into your secure Cylendra dashboard.",
    faq: [
      {
        question: "Is my API key safe?",
        answer: "Yes, Orbitra AI only requires read-only permissions and uses industry-standard encryption."
      },
      {
        question: "Which exchanges are supported?",
        answer: "We currently support major exchanges like Binance, Bybit, and OKX, with more coming soon."
      },
      {
        question: "Is it free during Beta?",
        answer: "Yes, Orbitra AI is currently free to use while in Beta."
      }
    ]
  },
  {
    id: "cylendra-alerts",
    name: "Crypto Pulse By Cylendra",
    slug: "cylendra-alerts",
    oneLiner: "Telegram alerts that respect your strategy.",
    description: "Real-time crypto signals with structured context, filtering, and configurable alerting.",
    status: "LIVE",
    icon: Bell,
    externalLink: "https://t.me/CylendraPulseBot",
    valueProp: "Telegram alerts with context, filtering, and configurable delivery.",
    features: [
      "Real-time market signals",
      "Structured context for every alert",
      "Customizable filtering rules",
      "Configurable delivery channels",
      "Risk level indicators",
      "Multi-timeframe analysis"
    ],
    whoIsItFor: [
      "Day traders looking for opportunities",
      "Swing traders needing timely updates",
      "Anyone who can't stare at charts 24/7"
    ],
    integration: "Delivers insights directly to your Telegram, fully integrated with your Cylendra notification settings.",
    faq: [
      {
        question: "Are these financial advice?",
        answer: "No, these are market signals based on technical analysis. Always do your own research."
      },
      {
        question: "How fast are the alerts?",
        answer: "Alerts are generated and delivered in real-time as market conditions are met."
      },
      {
        question: "Can I filter which coins I see?",
        answer: "Yes, you can customize your feed based on pairs, volume, and other metrics."
      }
    ]
  },
  {
    id: "cyle-learn-bot",
    name: "Cyle Learn Bot",
    slug: "cyle-learn-bot",
    oneLiner: "Learn trading like a system.",
    description: "Interactive lessons, examples, and guided practice—built to reduce randomness and build skill.",
    status: "BETA",
    icon: Bot,
    externalLink: "https://t.me/CyleLearnBot",
    valueProp: "Interactive trading education with structured lessons and practice prompts.",
    features: [
      "Structured interactive lessons",
      "Real-world trading examples",
      "Guided practice prompts",
      "Trading glossary and definitions",
      "Progress tracking (coming soon)",
      "Quiz-based knowledge checks"
    ],
    whoIsItFor: [
      "Beginner traders starting their journey",
      "Intermediate traders refining their edge",
      "Anyone wanting to systematize their trading"
    ],
    integration: "Accessible via Telegram for on-the-go learning, syncing progress with your Cylendra profile.",
    faq: [
      {
        question: "Is this suitable for complete beginners?",
        answer: "Yes, we start from the fundamentals and build up to advanced concepts."
      },
      {
        question: "Is it free?",
        answer: "The core lessons are currently free during the Beta period."
      },
      {
        question: "Can I ask it specific questions?",
        answer: "Yes, the bot is designed to answer trading-related queries in context."
      }
    ]
  },
  {
    id: "cylendra-calculator",
    name: "Cylendra Calculator",
    slug: "cylendra-calculator",
    oneLiner: "Trading math, made effortless.",
    description: "Position sizing, risk/reward, leverage scenarios, liquidation estimates, and compounding—fast and reliable.",
    status: "LIVE",
    icon: Calculator,
    externalLink: "https://calc.cylendra.com/",
    valueProp: "Fast trading calculations for risk, leverage, liquidation, and scenarios.",
    features: [
      "Instant position sizing",
      "Risk/Reward ratio calculator",
      "Leverage scenario modeling",
      "Liquidation price estimation",
      "Compounding growth projector",
      "Multi-currency support"
    ],
    whoIsItFor: [
      "Risk-disciplined traders",
      "Scalpers needing quick math",
      "Planners modeling future growth"
    ],
    integration: "Standalone web tool that complements your trading workflow, accessible from the Portal.",
    faq: [
      {
        question: "Does it support different exchange formulas?",
        answer: "It uses standard formulas applicable to most major derivatives exchanges."
      },
      {
        question: "Can I save my calculations?",
        answer: "Currently calculations are session-based, but save functionality is planned."
      },
      {
        question: "Is it mobile friendly?",
        answer: "Yes, the calculator is fully responsive for mobile use."
      }
    ]
  },
  {
    id: "cylendra-hedge-fund",
    name: "Cylendra Hedge Fund",
    slug: "cylendra-hedge-fund",
    oneLiner: "A managed strategy layer.",
    description: "A future product designed around disciplined execution and risk controls—details will be shared when available.",
    status: "COMING_SOON",
    icon: Layers,
    valueProp: "A future managed strategy layer—details to be announced.",
    features: [
      "Disciplined execution strategies",
      "Strict risk management controls",
      "Professional portfolio management",
      "Transparent reporting",
      "Regulatory compliance focus",
      "Institutional-grade infrastructure"
    ],
    whoIsItFor: [
      "Accredited investors",
      "Institutions",
      "High net worth individuals"
    ],
    integration: "Will be integrated into the Cylendra ecosystem for qualified users.",
    faq: [
      {
        question: "When will this launch?",
        answer: "We are currently in the regulatory planning phase. Join the waitlist for updates."
      },
      {
        question: "Is this available to everyone?",
        answer: "Availability will depend on your jurisdiction and accreditation status."
      },
      {
        question: "What strategies will be used?",
        answer: "Details on specific strategies will be disclosed in the offering memorandum."
      }
    ]
  },
  {
    id: "cylendra-dex",
    name: "Cylendra DEX",
    slug: "cylendra-dex",
    oneLiner: "Decentralized trading layer.",
    description: "A decentralized trading layer under construction—built for transparency and AI-enhanced execution.",
    status: "COMING_SOON",
    icon: Wallet,
    externalLink: "https://dex.cylendra.com",
    valueProp: "Decentralized trading layer under construction.",
    features: [
      "Non-custodial trading",
      "AI-enhanced execution routing",
      "Transparent on-chain settlement",
      "Deep liquidity aggregation",
      "MEV protection",
      "Cross-chain compatibility"
    ],
    whoIsItFor: [
      "DeFi natives",
      "Traders preferring self-custody",
      "Privacy-focused users"
    ],
    integration: "Will connect seamlessly with Orbitra AI for analytics and the Portal for management.",
    faq: [
      {
        question: "Which chains will be supported?",
        answer: "We are targeting major EVM-compatible chains initially."
      },
      {
        question: "Will there be a token?",
        answer: "Please refer to the Cylee Token Platform for tokenomics information."
      },
      {
        question: "Is it an AMM or Orderbook?",
        answer: "We are exploring hybrid models to offer the best of both worlds."
      }
    ]
  },
  {
    id: "cylee-token",
    name: "Cylee Token Platform",
    slug: "cylee-token",
    oneLiner: "Unified token utility.",
    description: "A unified token layer to power access, rewards, and utilities across Cylendra products.",
    status: "COMING_SOON",
    icon: Coins,
    externalLink: "https://cylee.cylendra.com",
    valueProp: "Unified token utilities across Cylendra products (coming soon).",
    features: [
      "Ecosystem-wide utility",
      "Access to premium features",
      "Reward distribution mechanism",
      "Fee discounts",
      "Governance participation",
      "Staking opportunities"
    ],
    whoIsItFor: [
      "Cylendra ecosystem participants",
      "Long-term community members",
      "Governance contributors"
    ],
    integration: "The native utility token woven into the fabric of all Cylendra applications.",
    faq: [
      {
        question: "What is the token ticker?",
        answer: "The ticker symbol will be announced closer to the TGE."
      },
      {
        question: "How can I earn tokens?",
        answer: "Tokens will be earnable through ecosystem participation and rewards."
      },
      {
        question: "Is there a presale?",
        answer: "Information regarding distribution will be released via official channels only."
      }
    ]
  }
];
