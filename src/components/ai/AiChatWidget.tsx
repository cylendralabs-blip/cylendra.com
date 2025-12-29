/**
 * AI Chat Widget Component
 * 
 * Floating chat widget for AI Assistant interactions
 * Supports streaming, history, and multiple modes
 * 
 * Phase 11: AI Assistant Integration - Task 5
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Loader2,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Settings,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIMode } from '@/services/ai/types';
import { useAuth } from '@/hooks/useAuth';
import { buildAIContext } from '@/services/ai/contextBuilder';
import { aiClient } from '@/services/ai/aiClient';
import { buildPrompt } from '@/services/ai/prompts';
import { logAIInteraction } from '@/services/ai/aiLogger';
import { validateAIResponse, requiresRiskWarning, getRiskWarningMessage } from '@/services/ai/guardrails';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: AIMode;
  timestamp: Date;
  suggestions?: any[];
  warnings?: string[];
}

const MODES: Array<{ id: AIMode; label: string; icon: any; description: string }> = [
  {
    id: 'user_support',
    label: 'Support',
    icon: HelpCircle,
    description: 'Get help and answers',
  },
  {
    id: 'trade_explainer',
    label: 'Trade Explainer',
    icon: TrendingUp,
    description: 'Understand trades',
  },
  {
    id: 'risk_advisor',
    label: 'Risk Advisor',
    icon: AlertTriangle,
    description: 'Risk insights',
  },
  {
    id: 'settings_optimizer',
    label: 'Settings',
    icon: Settings,
    description: 'Optimize settings',
  },
  {
    id: 'backtest_summarizer',
    label: 'Backtest',
    icon: BarChart3,
    description: 'Summarize backtests',
  },
];

export const AiChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMode>('user_support');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, currentMode]);

  const handleSend = async () => {
    if (!input.trim() || !user || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      mode: currentMode,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    const startTime = Date.now();

    try {
      // Build context
      const context = await buildAIContext(user.id, currentMode);

      // Build prompt
      const prompt = buildPrompt(currentMode, userMessage.content, context);

      // Get AI response (with streaming)
      let fullResponse = '';
      const request = {
        prompt,
        context,
        mode: currentMode,
        userId: user.id,
        stream: true,
      };

      // Stream response
      for await (const chunk of aiClient.streamAI(request)) {
        if (chunk.done) {
          setIsStreaming(false);
          break;
        }
        fullResponse += chunk.chunk;
        setStreamingContent(fullResponse);
      }

      // Parse response
      const aiResponse = await aiClient.askAI({
        ...request,
        stream: false,
      });

      const responseTime = Date.now() - startTime;

      // Validate response with guardrails
      const validation = validateAIResponse(aiResponse, context.botSettings || {});
      
      // Check for risk warnings
      const hasRiskWarning = requiresRiskWarning(context);
      const riskWarning = hasRiskWarning ? getRiskWarningMessage(context) : undefined;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content || fullResponse,
        mode: currentMode,
        timestamp: new Date(),
        suggestions: validation.validatedSuggestions,
        warnings: [...(validation.warnings || []), ...(aiResponse.warnings || []), ...(riskWarning ? [riskWarning] : [])],
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');

      // Log interaction
      await logAIInteraction({
        userId: user.id,
        mode: currentMode,
        input: userMessage.content,
        output: assistantMessage.content,
        contextSummary: context,
        metadata: {
          confidence: aiResponse.confidence,
          responseTime,
          provider: 'openai', // TODO: Get from config
        },
      });

    } catch (error: any) {
      console.error('Error getting AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        mode: currentMode,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleModeChange = (mode: AIMode) => {
    setCurrentMode(mode);
    setMessages([]); // Clear chat when changing modes
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  const currentModeInfo = MODES.find(m => m.id === currentMode);

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-2xl h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {currentModeInfo?.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mode Selector */}
          <Tabs value={currentMode} onValueChange={(v) => handleModeChange(v as AIMode)} className="mt-2">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <TabsTrigger
                    key={mode.id}
                    value={mode.id}
                    className="flex flex-col gap-1 py-2 px-1 text-xs"
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    Hi! I'm your AI trading assistant. How can I help you?
                  </p>
                  <p className="text-xs mt-2">
                    Select a mode above to get started.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2 max-w-[80%]',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.warnings && message.warnings.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.warnings.map((warning, idx) => (
                          <div key={idx} className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="text-xs bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                            <Badge variant="outline" className="text-xs mb-1">
                              {suggestion.title}
                            </Badge>
                            <p>{suggestion.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">U</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {isStreaming && streamingContent && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted max-w-[80%]">
                    <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                    <Loader2 className="h-3 w-3 animate-spin mt-1" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

