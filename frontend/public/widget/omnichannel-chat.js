(function () {
  const script = document.currentScript;
  if (!script) return;

  const publicKey = script.getAttribute("data-channel-key");
  const apiBase = script.getAttribute("data-api-url") || "http://localhost:8000";
  if (!publicKey) {
    console.error("[OmnichannelWidget] data-channel-key is required");
    return;
  }

  const widgetRoot = document.createElement("div");
  widgetRoot.id = "omnichannel-widget-root";
  document.body.appendChild(widgetRoot);

  const shadow = widgetRoot.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    .oc-toggle { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 999px; border: none; cursor: pointer; color: #fff; font-size: 24px; box-shadow: 0 8px 24px rgba(0,0,0,.25); z-index: 99999; }
    .oc-panel { position: fixed; bottom: 96px; right: 24px; width: 360px; max-width: calc(100vw - 32px); height: 480px; background: #111; color: #f5f5f5; border-radius: 16px; border: 1px solid rgba(255,255,255,.08); display: none; flex-direction: column; overflow: hidden; z-index: 99999; box-shadow: 0 16px 48px rgba(0,0,0,.35); }
    .oc-panel.open { display: flex; }
    .oc-header { padding: 16px; border-bottom: 1px solid rgba(255,255,255,.08); font: 600 14px/1.4 system-ui, sans-serif; }
    .oc-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .oc-msg { max-width: 85%; padding: 8px 12px; border-radius: 12px; font: 13px/1.4 system-ui, sans-serif; }
    .oc-msg.customer { align-self: flex-end; background: #7c3aed; }
    .oc-msg.agent, .oc-msg.ai_assistant { align-self: flex-start; background: rgba(255,255,255,.08); }
    .oc-form { display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(255,255,255,.08); }
    .oc-input { flex: 1; border-radius: 8px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); color: #fff; padding: 8px 10px; font: 13px system-ui, sans-serif; }
    .oc-send { border: none; border-radius: 8px; padding: 8px 12px; color: #fff; cursor: pointer; font: 600 13px system-ui, sans-serif; }
  `;
  shadow.appendChild(style);

  const toggle = document.createElement("button");
  toggle.className = "oc-toggle";
  toggle.textContent = "💬";
  toggle.setAttribute("aria-label", "Open chat");

  const panel = document.createElement("div");
  panel.className = "oc-panel";
  panel.innerHTML = `
    <div class="oc-header">Support Chat</div>
    <div class="oc-messages"></div>
    <form class="oc-form">
      <input class="oc-input" placeholder="Type a message..." required />
      <button class="oc-send" type="submit">Send</button>
    </form>
  `;

  shadow.appendChild(toggle);
  shadow.appendChild(panel);

  const header = panel.querySelector(".oc-header");
  const messagesEl = panel.querySelector(".oc-messages");
  const form = panel.querySelector(".oc-form");
  const input = panel.querySelector(".oc-input");

  let conversationId = null;
  let accentColor = "#7c3aed";
  let pollTimer = null;

  async function api(path, options) {
    const response = await fetch(`${apiBase}/api/v1/omnichannel-widget/${publicKey}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!response.ok) throw new Error("Widget API error");
    return response.json();
  }

  function renderMessages(messages) {
    if (!messagesEl) return;
    messagesEl.innerHTML = "";
    messages.forEach((message) => {
      const bubble = document.createElement("div");
      bubble.className = `oc-msg ${message.role}`;
      bubble.textContent = message.content;
      messagesEl.appendChild(bubble);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function refreshMessages() {
    if (!conversationId) return;
    const messages = await api(`/conversations/${conversationId}/messages`);
    renderMessages(messages);
  }

  async function ensureConversation(firstMessage) {
    if (conversationId) return conversationId;
    const stored = localStorage.getItem(`oc-conversation-${publicKey}`);
    if (stored) {
      conversationId = stored;
      return conversationId;
    }
    const conversation = await api("/conversations", {
      method: "POST",
      body: JSON.stringify({
        visitor_name: "Website Visitor",
        initial_message: firstMessage,
        visitor_id: localStorage.getItem(`oc-visitor-${publicKey}`) || undefined,
      }),
    });
    conversationId = conversation.id;
    localStorage.setItem(`oc-conversation-${publicKey}`, conversationId);
    return conversationId;
  }

  toggle.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && !pollTimer) {
      pollTimer = setInterval(() => void refreshMessages().catch(() => {}), 4000);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    input.value = "";
    const id = await ensureConversation(content);
    await api(`/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    await refreshMessages();
  });

  api("/config")
    .then((config) => {
      if (header) header.textContent = config.channel_name || "Support Chat";
      accentColor = config.accent_color || accentColor;
      toggle.style.background = accentColor;
      const sendBtn = panel.querySelector(".oc-send");
      if (sendBtn) sendBtn.style.background = accentColor;
      if (!localStorage.getItem(`oc-visitor-${publicKey}`)) {
        localStorage.setItem(`oc-visitor-${publicKey}`, crypto.randomUUID());
      }
    })
    .catch(() => {});
})();
