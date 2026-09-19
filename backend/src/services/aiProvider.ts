// Single seam for every call out to an LLM. Two implementations share one
// interface: ClaudeProvider (real) and MockProvider (offline fallback).
// The prototype called api.anthropic.com directly from the browser with no
// key — that both wouldn't work (no auth header) and would leak the key to
// every visitor if it did. Here the key lives only in backend/.env and the
// browser only ever talks to our own /api/* routes.

export interface ReviewInput {
  storeName: string;
  stars: number;
  text: string;
}

export interface AiProvider {
  translateReview(text: string, targetLang: string): Promise<string>;
  draftReply(review: ReviewInput, targetLang: string): Promise<string>;
}

export const REPLY_GUIDELINE = `1. Open with empathy (acknowledge the inconvenience).
2. Accept the facts without directly blaming the store or a specific staff member.
3. State one concrete next step or commitment to look into it.
4. Where relevant, invite the customer to continue offline (store phone line, support center).
5. Keep it to roughly 2-3 sentences, polite tone, no emoji.
6. Don't just repeat the review back — respond to the substance of it.`;

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ko: "Korean",
  ja: "Japanese",
  zh: "Chinese",
  es: "Spanish",
  vi: "Vietnamese",
};

function langName(code: string): string {
  return LANG_NAMES[code] ?? code;
}

class ClaudeProvider implements AiProvider {
  private apiKey: string;
  private model = "claude-sonnet-5";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callClaude(system: string, userMessage: string, maxTokens = 400): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
    }
    const data = (await response.json()) as { content: { type: string; text?: string }[] };
    const textBlock = data.content.find((b) => b.type === "text");
    if (!textBlock?.text) throw new Error("Anthropic API returned no text block");
    return textBlock.text.trim();
  }

  async translateReview(text: string, targetLang: string): Promise<string> {
    return this.callClaude(
      `Translate the given customer review into ${langName(targetLang)}. Output only the translated text, no notes or quotation marks.`,
      text,
      300
    );
  }

  async draftReply(review: ReviewInput, targetLang: string): Promise<string> {
    return this.callClaude(
      `You are the customer review response owner for a retail brand. Follow these guidelines exactly, and write the reply in ${langName(targetLang)}:\n${REPLY_GUIDELINE}\n\nOutput only the reply text, no other commentary.`,
      `Store: ${review.storeName}\nReview rating: ${review.stars}/5\nReview text: "${review.text}"\n\nDraft a reply to this review.`,
      400
    );
  }
}

class MockProvider implements AiProvider {
  async translateReview(text: string, targetLang: string): Promise<string> {
    return `[mock ${langName(targetLang)} translation — set ANTHROPIC_API_KEY in backend/.env for real output]\n${text}`;
  }

  async draftReply(review: ReviewInput, targetLang: string): Promise<string> {
    return `[mock ${langName(targetLang)} reply draft — set ANTHROPIC_API_KEY in backend/.env for real output]\nThank you for the feedback about ${review.storeName}. We're sorry to hear about your experience and are looking into it.`;
  }
}

export const aiProvider: AiProvider = process.env.ANTHROPIC_API_KEY
  ? new ClaudeProvider(process.env.ANTHROPIC_API_KEY)
  : new MockProvider();
