/**
 * AI Chat Widget Tests
 * 
 * Component tests for AI Chat Widget
 * 
 * Phase 11: AI Assistant Integration - Task 12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AiChatWidget } from '../AiChatWidget';
import { AuthContext } from '@/contexts/authContext';

// Mock dependencies
vi.mock('@/services/ai/aiClient', () => ({
  aiClient: {
    askAI: vi.fn(),
    streamAI: vi.fn(),
  },
}));

vi.mock('@/services/ai/contextBuilder', () => ({
  buildAIContext: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@/services/ai/prompts', () => ({
  buildPrompt: vi.fn(() => 'test prompt'),
}));

vi.mock('@/services/ai/aiLogger', () => ({
  logAIInteraction: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/services/ai/guardrails', () => ({
  validateAIResponse: vi.fn(() => ({
    validatedSuggestions: [],
    warnings: [],
    errors: [],
  })),
  requiresRiskWarning: vi.fn(() => false),
  getRiskWarningMessage: vi.fn(() => ''),
}));

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

describe('AI Chat Widget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render floating button when closed', () => {
    render(
      <AuthContext.Provider value={{ user: mockUser } as any}>
        <AiChatWidget />
      </AuthContext.Provider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should open chat window when button is clicked', async () => {
    render(
      <AuthContext.Provider value={{ user: mockUser } as any}>
        <AiChatWidget />
      </AuthContext.Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });
  });

  it('should display mode selector tabs', async () => {
    render(
      <AuthContext.Provider value={{ user: mockUser } as any}>
        <AiChatWidget />
      </AuthContext.Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('Trade Explainer')).toBeInTheDocument();
    });
  });

  it('should send message when input is submitted', async () => {
    const { aiClient } = await import('@/services/ai/aiClient');
    (aiClient.askAI as any).mockResolvedValue({
      content: 'Test response',
      suggestions: [],
      confidence: 0.8,
    });

    render(
      <AuthContext.Provider value={{ user: mockUser } as any}>
        <AiChatWidget />
      </AuthContext.Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Ask me anything...');
      fireEvent.change(input, { target: { value: 'Test question' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    });

    await waitFor(() => {
      expect(aiClient.askAI).toHaveBeenCalled();
    });
  });
});

