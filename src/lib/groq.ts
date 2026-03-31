interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const GROQ_MODEL = "llama3-70b-8192";

export const GROQ_API_KEY =
  "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"; // default development key

export async function callGroq(messages: GroqMessage[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY ?? GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Chave da API Groq não configurada");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
      mode: "cors",
    });

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
