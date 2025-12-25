# AI Assistant Edge Function

This Edge Function handles AI requests from the frontend.

## Environment Variables

Set in Supabase Dashboard → Settings → Edge Functions:

- `OPENAI_API_KEY`: Your OpenAI API key (optional - will use mock responses if not set)

## Usage

```typescript
const response = await supabase.functions.invoke('ai-assistant', {
  body: {
    prompt: 'Why was this trade executed?',
    mode: 'trade_explainer',
    context: {
      signalId: 'signal-id',
      tradeId: 'trade-id',
    },
  },
});
```

## Modes

- `trade_explainer`: Explain why a trade was executed
- `risk_advisor`: Provide risk assessment
- `settings_optimizer`: Suggest settings improvements
- `backtest_summarizer`: Summarize backtest results
- `user_support`: General user support

## Response Format

```json
{
  "content": "AI response text",
  "suggestions": [],
  "warnings": [],
  "confidence": 0.8
}
```

