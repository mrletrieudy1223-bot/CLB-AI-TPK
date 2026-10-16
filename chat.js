// Cloudflare Pages Function: POST /api/chat
// NVIDIA NIM OpenAI-compatible endpoint. Store NVIDIA_API_KEY as an encrypted Pages Secret.
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "deepseek-ai/deepseek-v4.1-flash";
const MAX_BODY_CHARS = 2_500_000;
const MAX_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 1_200;
const MAX_IMAGE_DATA_URL_CHARS = 2_100_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function onRequestPost({ request, env }) {
  // Same-origin browser calls only. Configure Cloudflare rate limiting/Turnstile too.
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) return json({ error: "Cross-origin request blocked." }, 403);
    } catch {
      return json({ error: "Invalid Origin header." }, 403);
    }
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Expected application/json." }, 415);
  }
  if (!env.NVIDIA_API_KEY) return json({ error: "NVIDIA_API_KEY secret is not configured in Cloudflare Pages." }, 503);

  let raw;
  try { raw = await request.text(); } catch { return json({ error: "Could not read request." }, 400); }
  if (raw.length > MAX_BODY_CHARS) return json({ error: "Request is too large. Use a smaller image." }, 413);

  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON." }, 400); }
  if (!Array.isArray(body.messages)) return json({ error: "messages must be an array." }, 400);

  const messages = body.messages
    .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .slice(-MAX_MESSAGES)
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, MAX_MESSAGE_CHARS) }))
    .filter((item) => item.content.length > 0);
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "Send a user message to continue." }, 400);

  const image = body.image;
  if (image !== undefined && image !== null) {
    if (typeof image !== "string" || image.length > MAX_IMAGE_DATA_URL_CHARS ||
        !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) {
      return json({ error: "Image must be JPEG, PNG, or WebP and within the size limit." }, 400);
    }
  }

  const system = `You are an educational assistant for the AI Club at Tan Phuoc Khanh High School. Reply in Vietnamese, clearly and warmly, suitable for high-school students. Explain concepts step by step and help students learn rather than doing schoolwork dishonestly. When code is requested, explain how to run and test it. Do not invent official school schedules, recruitment status, teachers, policies, or contact details; say you do not know and direct users to the official Notices page. Remind users to verify important claims. Never ask for or repeat passwords, OTPs, API keys, home addresses, student records, or sensitive data. If a user shares a secret, advise revoking it. Do not give medical, legal, or financial advice or make decisions about people. If an image is attached, describe visible content only; do not identify people or infer sensitive personal traits. Keep answers concise (about 450 words maximum), and state uncertainty honestly.`;

  const nvidiaMessages = [{ role: "system", content: system }, ...messages];
  if (image) {
    const last = nvidiaMessages[nvidiaMessages.length - 1];
    last.content = [
      { type: "text", text: last.content || "Mô tả nội dung nhìn thấy trong ảnh." },
      { type: "image_url", image_url: { url: image } },
    ];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const upstream = await fetch(NVIDIA_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "authorization": `Bearer ${env.NVIDIA_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: nvidiaMessages,
        temperature: 0.35,
        top_p: 0.95,
        max_tokens: 700,
        stream: false,
      }),
    });
    if (!upstream.ok) {
      if (upstream.status === 429) return json({ error: "NVIDIA endpoint đang giới hạn yêu cầu hoặc hết quota. Hãy thử lại sau." }, 429);
      if (upstream.status === 401 || upstream.status === 403) return json({ error: "NVIDIA API key chưa hợp lệ hoặc chưa có quyền dùng model." }, 503);
      return json({ error: "NVIDIA AI đang bận hoặc từ chối yêu cầu. Hãy thử lại sau." }, 502);
    }
    const result = await upstream.json();
    const answer = result?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) return json({ error: "Model returned an empty response." }, 502);
    return json({ answer: answer.trim(), model: MODEL });
  } catch (error) {
    const message = error?.name === "AbortError" ? "NVIDIA AI hết thời gian chờ. Hãy thử lại." : "Không kết nối được NVIDIA AI.";
    return json({ error: message }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
