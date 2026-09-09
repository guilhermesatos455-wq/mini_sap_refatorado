
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIConfig {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

class AIService {
  private config: AIConfig = {
    endpoint: 'http://localhost:8080', // Llamafile base URL
    model: 'llamafile',
    temperature: 0.7,
    maxTokens: 1024,
  };

  updateConfig(newConfig: Partial<AIConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  async chat(messages: Message[], onStream?: (text: string) => void): Promise<string> {
    try {
      if (onStream) {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, stream: true }),
        });

        if (!response.ok) {
          throw new Error(`AI Service Error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') break;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    fullText = parsed.text;
                    onStream(fullText);
                  }
                } catch (e) {}
              }
            }
          }
        }
        return fullText;
      } else {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI Service Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.content;
      }
    } catch (error) {
      console.error('AI chat failed:', error);
      throw error;
    }
  }

  // Helper to analyze audit data
  async analyzeAuditItem(item: any): Promise<string> {
    const prompt = `Analise a seguinte divergência de auditoria fiscal SAP:
    Material: ${item.materialDesc} (${item.material})
    Fornecedor: ${item.vendorName}
    Preço SAP: ${item.sapPrice}
    Preço NF: ${item.invoicePrice}
    Divergência: ${item.priceDiff} (${item.diffPercentage}%)
    CFOP: ${item.cfop}
    
    Explique brevemente por que isso pode ter ocorrido e sugira uma ação.`;

    return this.chat([{ role: 'user', content: prompt }]);
  }
}

export const aiService = new AIService();
