
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',  /* #448AA6 */
					foreground: 'hsl(var(--primary-foreground))',
					50: '#e8f4f8',
					100: '#d1e9f1',
					200: '#a3d3e3',
					300: '#75bdd5',
					400: '#448AA6',  /* Primary */
					500: '#448AA6',  /* Primary */
					600: '#367085',
					700: '#285664',
					800: '#1a3c43',
					900: '#0c2222',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',  /* #84A9BF */
					foreground: 'hsl(var(--secondary-foreground))',
					50: '#f0f6f9',
					100: '#e1edf3',
					200: '#c3dbe7',
					300: '#a5c9db',
					400: '#84A9BF',  /* Secondary Blue */
					500: '#84A9BF',  /* Secondary Blue */
					600: '#6a8799',
					700: '#506573',
					800: '#36434d',
					900: '#1c2127',
				},
				pink: {
					DEFAULT: 'hsl(var(--pink))',  /* #F2BBB6 */
					foreground: 'hsl(var(--foreground))',
					50: '#fef5f4',
					100: '#fdebe9',
					200: '#fbd7d3',
					300: '#f9c3bd',
					400: '#F2BBB6',  /* Logo Pink */
					500: '#F2BBB6',  /* Logo Pink */
					600: '#c29692',
					700: '#92716e',
					800: '#614c4a',
					900: '#312726',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',  /* #6EE7D8 - Mint/Turquoise */
					foreground: 'hsl(var(--accent-foreground))',
					50: '#f0fdfc',
					100: '#ccfbf1',
					200: '#99f6e4',
					300: '#6EE7D8',  /* Mint/Turquoise */
					400: '#6EE7D8',  /* Mint/Turquoise */
					500: '#6EE7D8',  /* Mint/Turquoise */
					600: '#58b8ad',
					700: '#428982',
					800: '#2c5a57',
					900: '#162b2c',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				trading: {
					bg: '#F0F4F8',
					success: {
						DEFAULT: '#10B981',
						50: '#ecfdf5',
						100: '#d1fae5',
						200: '#a7f3d0',
						300: '#6ee7b7',
						400: '#34d399',
						500: '#10b981',
						600: '#059669',
						700: '#047857',
						800: '#065f46',
						900: '#064e3b',
					},
					danger: {
						DEFAULT: '#EF4444',
						50: '#fef2f2',
						100: '#fee2e2',
						200: '#fecaca',
						300: '#fca5a5',
						400: '#f87171',
						500: '#ef4444',
						600: '#dc2626',
						700: '#b91c1c',
						800: '#991b1b',
						900: '#7f1d1d',
					},
					warning: {
						DEFAULT: '#F59E0B',
						50: '#fffbeb',
						100: '#fef3c7',
						200: '#fde68a',
						300: '#fcd34d',
						400: '#fbbf24',
						500: '#f59e0b',
						600: '#d97706',
						700: '#b45309',
						800: '#92400e',
						900: '#78350f',
					},
					info: {
						DEFAULT: '#3B82F6',
						50: '#eff6ff',
						100: '#dbeafe',
						200: '#bfdbfe',
						300: '#93c5fd',
						400: '#60a5fa',
						500: '#3b82f6',
						600: '#2563eb',
						700: '#1d4ed8',
						800: '#1e40af',
						900: '#1e3a8a',
					}
				},
				chart: {
					1: '#0ea5e9',
					2: '#10b981',
					3: '#f59e0b',
					4: '#ef4444',
					5: '#8b5cf6',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'glow': '0 0 20px rgba(100, 255, 218, 0.3)',
				'glow-lg': '0 0 40px rgba(100, 255, 218, 0.4)',
				'glow-pink': '0 0 20px rgba(242, 187, 182, 0.4)',
				'glow-pink-lg': '0 0 40px rgba(242, 187, 182, 0.6)',
				'trading': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				'trading-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						boxShadow: '0 0 5px #64FFDA'
					},
					'50%': {
						boxShadow: '0 0 20px #64FFDA, 0 0 30px #64FFDA'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-in-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in': {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(0)'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'bounce-subtle': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-2px)'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-200% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-in-up': 'fade-in-up 0.6s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite'
			},
			backdropBlur: {
				xs: '2px',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-trading': 'linear-gradient(135deg, var(--tw-gradient-stops))',
				'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
