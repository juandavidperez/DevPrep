import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock all providers before importing the factory.
// vi.fn() without an arrow function so Vitest can use them as constructors with `new`.
vi.mock('../providers/ollama', () => ({ OllamaProvider: vi.fn() }))
vi.mock('../providers/anthropic', () => ({ AnthropicProvider: vi.fn() }))
vi.mock('../providers/openai', () => ({ OpenAIProvider: vi.fn() }))
vi.mock('../providers/gemini', () => ({ GeminiProvider: vi.fn() }))

import { getAIProvider } from '../index'
import { OllamaProvider } from '../providers/ollama'
import { AnthropicProvider } from '../providers/anthropic'
import { OpenAIProvider } from '../providers/openai'
import { GeminiProvider } from '../providers/gemini'

describe('getAIProvider — static routing', () => {
  const original = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.AI_ROUTING
  })

  afterEach(() => {
    process.env = { ...original }
  })

  it('returns OllamaProvider when AI_PROVIDER is unset', () => {
    delete process.env.AI_PROVIDER
    getAIProvider()
    expect(OllamaProvider).toHaveBeenCalledOnce()
  })

  it('returns OllamaProvider when AI_PROVIDER=ollama', () => {
    process.env.AI_PROVIDER = 'ollama'
    getAIProvider()
    expect(OllamaProvider).toHaveBeenCalledOnce()
  })

  it('returns AnthropicProvider when AI_PROVIDER=anthropic', () => {
    process.env.AI_PROVIDER = 'anthropic'
    getAIProvider()
    expect(AnthropicProvider).toHaveBeenCalledOnce()
  })

  it('returns OpenAIProvider when AI_PROVIDER=openai', () => {
    process.env.AI_PROVIDER = 'openai'
    getAIProvider()
    expect(OpenAIProvider).toHaveBeenCalledOnce()
  })

  it('returns GeminiProvider when AI_PROVIDER=gemini', () => {
    process.env.AI_PROVIDER = 'gemini'
    getAIProvider()
    expect(GeminiProvider).toHaveBeenCalledOnce()
  })

  it('falls back to Ollama for unknown AI_PROVIDER value', () => {
    process.env.AI_PROVIDER = 'unknown_provider'
    getAIProvider()
    expect(OllamaProvider).toHaveBeenCalledOnce()
  })
})

describe('getAIProvider — smart routing (AI_ROUTING=smart)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AI_ROUTING = 'smart'
  })

  afterEach(() => {
    delete process.env.AI_ROUTING
  })

  it('routes coding to AnthropicProvider', () => {
    getAIProvider('coding')
    expect(AnthropicProvider).toHaveBeenCalledOnce()
  })

  it('routes system_design to AnthropicProvider', () => {
    getAIProvider('system_design')
    expect(AnthropicProvider).toHaveBeenCalledOnce()
  })

  it('routes technical to GeminiProvider', () => {
    getAIProvider('technical')
    expect(GeminiProvider).toHaveBeenCalledOnce()
  })

  it('routes behavioral to OpenAIProvider', () => {
    getAIProvider('behavioral')
    expect(OpenAIProvider).toHaveBeenCalledOnce()
  })

  it('falls back to static provider when no category provided', () => {
    delete process.env.AI_PROVIDER
    getAIProvider() // no category → skip smart route
    expect(OllamaProvider).toHaveBeenCalledOnce()
  })

  it('falls back to static provider when smart route throws', () => {
    vi.mocked(AnthropicProvider).mockImplementationOnce(() => {
      throw new Error('Missing API key')
    })
    delete process.env.AI_PROVIDER
    // Should not throw and should fall back gracefully
    expect(() => getAIProvider('coding')).not.toThrow()
    expect(OllamaProvider).toHaveBeenCalledOnce()
  })
})
