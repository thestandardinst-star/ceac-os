export function safeNotificationText({ label, occurredAt }) {
  const title = String(label || "CEAC OS update").trim() || "CEAC OS update";
  const when = occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString();
  return [
    "CEAC OS",
    title,
    new Date(when).toLocaleString("en-GB", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" }),
    "Open CEAC OS for details.",
  ].join("\n");
}

export function classifyTelegramFailure(status, payload = null) {
  const description = String(payload?.description || "").toLowerCase();
  if (status === 401 || status === 403 || description.includes("unauthorized")) {
    return { category: "auth", retryable: false, safeMessage: "Telegram rejected the bot credential." };
  }
  if (status === 429) {
    return { category: "rate_limit", retryable: true, safeMessage: "Telegram rate-limited this delivery." };
  }
  if (status >= 500) {
    return { category: "provider_unavailable", retryable: true, safeMessage: "Telegram is temporarily unavailable." };
  }
  if (status === 400 && (description.includes("chat not found") || description.includes("chat_id"))) {
    return { category: "destination", retryable: false, safeMessage: "Telegram could not use the configured chat destination." };
  }
  if (status >= 400) {
    return { category: "provider_request", retryable: false, safeMessage: "Telegram rejected the provider request." };
  }
  return { category: "network", retryable: true, safeMessage: "Telegram could not be reached." };
}

async function telegramRequest({ token, method, body, fetchImpl = fetch, baseUrl = "https://api.telegram.org" }) {
  const url = `${baseUrl.replace(/\/$/, "")}/bot${token}/${method}`;
  let response;
  try {
    response = await fetchImpl(url, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      payload: null,
      ...classifyTelegramFailure(0, null),
    };
  }

  let payload = null;
  try { payload = await response.json(); } catch {}

  if (!response.ok || payload?.ok === false) {
    return {
      ok: false,
      status: response.status,
      payload,
      ...classifyTelegramFailure(response.status, payload),
    };
  }
  return { ok: true, status: response.status, payload };
}

export async function telegramGetMe({ token, fetchImpl = fetch, baseUrl }) {
  const result = await telegramRequest({ token, method: "getMe", fetchImpl, baseUrl });
  if (!result.ok) return result;
  return {
    ...result,
    bot: {
      id: result.payload?.result?.id ? String(result.payload.result.id) : null,
      username: result.payload?.result?.username || null,
      displayName: result.payload?.result?.first_name || result.payload?.result?.username || "Telegram bot",
    },
  };
}

export async function telegramSendMessage({ token, chatId, text, fetchImpl = fetch, baseUrl }) {
  return telegramRequest({
    token,
    method: "sendMessage",
    body: {
      chat_id: String(chatId),
      text: String(text),
      disable_web_page_preview: true,
    },
    fetchImpl,
    baseUrl,
  });
}
