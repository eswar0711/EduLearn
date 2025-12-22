// src/utils/openRouterService.ts

const API_URL = "/api/openrouter";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const MODEL = "openai/gpt-4o";

export const sendMessageToAI = async (
  messages: Message[],
  studentName: string
): Promise<string> => {
  try {
    const systemPrompt: Message = {
      role: "system",
      content: `You are an intelligent academic assistant helping ${studentName} on EduVerge learning platform. Answer questions clearly, provide study tips, and help with homework. Keep responses under 250 words unless detailed explanations are needed.`
    };

    console.log(`[AI] Sending request...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 800
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[AI] Error:', response.status, errorData);
      throw new Error(errorData.error?.message || `Request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data?.choices?.[0]?.message?.content;

    if (!aiMessage) {
      console.error('[AI] No content in response');
      throw new Error('No response generated');
    }

    console.log(`[AI] ✓ Success`);
    return aiMessage.trim();

  } catch (error: any) {
    console.error("[AI] Request failed:", error);

    if (error?.name === "AbortError") {
      return "Request timeout. Please try a shorter question.";
    }

    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
};

export const getGreeting = (studentName: string): string => {
  const hour = new Date().getHours();
  let greet = "Good evening";
  if (hour < 12) greet = "Good morning";
  else if (hour < 17) greet = "Good afternoon";
  return `${greet}, ${studentName}! 👋 I'm your AI assistant powered by ChatGPT-4o. How can I help you today?`;
};
