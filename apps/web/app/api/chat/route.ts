import { NextRequest } from "next/server";
import { ReadableStream } from "stream/web";

function getSupportedModelsCount(): number {
  return 4;
}

function getGatewayConfig() {
  const baseUrl = process.env.AI_GATEWAY_URL || process.env.OPENAI_BASE_URL;
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.AI_GATEWAY_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!baseUrl) throw new Error("Missing AI gateway base URL (AI_GATEWAY_URL)");
  if (!apiKey) throw new Error("Missing AI gateway API key (AI_GATEWAY_API_KEY or OPENAI_API_KEY)");
  return { baseUrl, apiKey, model };
}

function buildSystemPrompt() {
  const modelsCount = getSupportedModelsCount();
  return [
    "You are Space Exo Captain, a helpful assistant specialized in exoplanets.",
    "Answer questions about exoplanets clearly and cite known facts when relevant.",
    `Additional context from our app: We currently support ${modelsCount} ML models for exoplanet analysis.`,
    "If a question is out of scope, say so briefly and steer back to exoplanets or our model capabilities",
    "or say a random fact about exoplanets."
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, apiKey, model } = getGatewayConfig();
    const body = await req.json().catch(() => ({}));

    // Accept either a simple {messages} array or {prompt}
    const messages = Array.isArray(body?.messages) ? body.messages : undefined;
    const userPrompt = body?.prompt as string | undefined;

    const systemPrompt = buildSystemPrompt();

    const payload = messages
      ? {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }
      : {
          model,
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt || "Hello" },
          ],
          stream: true,
        };

    const endpointChat = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
    const endpointResponses = `${baseUrl.replace(/\/$/, "")}/responses`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    } as Record<string, string>;

    // Try chat/completions first, fallback to responses
    let res = await fetch(endpointChat, {
      method: "POST",
      headers,
      body: JSON.stringify(
        messages
          ? payload
          : {
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt || "Hello" },
              ],
              stream: true,
            }
      ),
    });

    if (!res.ok) {
      res = await fetch(endpointResponses, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: "Upstream error", detail: text || res.statusText }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = new ReadableStream({
      start(controller) {
        const reader = res.body!.getReader();
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            push();
          });
        }
        push();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Chat route failed", detail: err?.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
