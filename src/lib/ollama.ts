/**
 * Ollama Service — Chat com IA local
 * 
 * Requer Ollama rodando em http://localhost:11434
 * npm run dev com VITE_AI_PROVIDER=ollama
 */

const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen3.5';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

export interface OllamaChatResponse {
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
}

/**
 * Envia mensagem para Ollama
 */
export async function chatWithOllama(
  messages: OllamaMessage[],
  context?: string // contexto financeiro
): Promise<string> {
  // Monta prompt com contexto
  let systemMessage = `Você é um assistente financeiro pessoal chamado "Arthur". 
Você ajuda o usuário a gerenciar suas finanças, analisar gastos, criar metas e dar conselhos práticos.
Use dados reais do usuário quando disponíveis. Seja amigável, direto e útil.

${context || ''}`;

  // Substitui mensagem system do array
  const fullMessages: OllamaMessage[] = [
    { role: 'system', content: systemMessage },
    ...messages.filter(m => m.role !== 'system')
  ];

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: fullMessages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data: OllamaChatResponse = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Erro Ollama:', error);
    throw error;
  }
}

/**
 * Testa conexão com Ollama
 */
export async function testOllama(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Lista modelos disponíveis no Ollama
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.models || []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}
