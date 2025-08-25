interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const GROQ_MODEL = "llama3-70b-8192";

export async function callGroq(messages: GroqMessage[]): Promise<string> {
  const apiKey =
    import.meta.env.VITE_GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    "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";

  if (!apiKey) {
    throw new Error("Chave da API Groq não configurada");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 800,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Erro da API Groq: ${response.status} ${message}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("Resposta vazia da IA");
    }
    return text;
  } catch (error: unknown) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Tempo de resposta da IA excedido");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export { GROQ_MODEL };
