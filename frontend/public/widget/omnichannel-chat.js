(function () {
  const script = document.currentScript;
  if (!script) return;

  const publicKey = script.getAttribute("data-channel-key");
  const apiBase = script.getAttribute("data-api-url") || "http://localhost:8000";
  if (!publicKey) {
    console.error("[OmnichannelWidget] data-channel-key is required");
    return;
  }

  const storageKeys = {
    visitor: `oc-visitor-${publicKey}`,
    conversation: `oc-conversation-${publicKey}`,
    name: `oc-visitor-name-${publicKey}`,
    email: `oc-visitor-email-${publicKey}`,
  };

  const widgetRoot = document.createElement("div");
  widgetRoot.id = "omnichannel-widget-root";
  document.body.appendChild(widgetRoot);

  const shadow = widgetRoot.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    .oc-toggle { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 999px; border: none; cursor: pointer; color: #fff; font-size: 24px; box-shadow: 0 8px 24px rgba(0,0,0,.25); z-index: 99999; transition: transform .15s ease; }
    .oc-toggle:hover { transform: scale(1.05); }
    .oc-panel { position: fixed; bottom: 96px; right: 24px; width: 360px; max-width: calc(100vw - 32px); height: 520px; background: #111; color: #f5f5f5; border-radius: 16px; border: 1px solid rgba(255,255,255,.08); display: none; flex-direction: column; overflow: hidden; z-index: 99999; box-shadow: 0 16px 48px rgba(0,0,0,.35); font-family: system-ui, -apple-system, sans-serif; }
    .oc-panel.open { display: flex; }
    .oc-header { padding: 16px; border-bottom: 1px solid rgba(255,255,255,.08); font: 600 14px/1.4 system-ui, sans-serif; flex-shrink: 0; }
    .oc-body { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .oc-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; gap: 12px; }
    .oc-state.hidden { display: none; }
    .oc-spinner { width: 28px; height: 28px; border: 3px solid rgba(255,255,255,.12); border-top-color: #fff; border-radius: 50%; animation: oc-spin .7s linear infinite; }
    @keyframes oc-spin { to { transform: rotate(360deg); } }
    .oc-state-text { font-size: 13px; color: rgba(255,255,255,.6); line-height: 1.5; }
    .oc-retry { border: none; border-radius: 8px; padding: 8px 14px; color: #fff; cursor: pointer; font: 600 13px system-ui, sans-serif; }
    .oc-prechat { flex: 1; display: none; flex-direction: column; padding: 16px; overflow-y: auto; }
    .oc-prechat.visible { display: flex; }
    .oc-greeting { font-size: 14px; line-height: 1.5; color: rgba(255,255,255,.85); margin-bottom: 16px; }
    .oc-field { margin-bottom: 12px; }
    .oc-label { display: block; font-size: 12px; color: rgba(255,255,255,.55); margin-bottom: 4px; }
    .oc-field-input { width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); color: #fff; padding: 9px 10px; font: 13px system-ui, sans-serif; outline: none; }
    .oc-field-input:focus { border-color: rgba(255,255,255,.25); }
    .oc-field-error { font-size: 11px; color: #f87171; margin-top: 4px; }
    .oc-start-btn { width: 100%; border: none; border-radius: 8px; padding: 10px 14px; color: #fff; cursor: pointer; font: 600 13px system-ui, sans-serif; margin-top: 4px; }
    .oc-start-btn:disabled { opacity: .5; cursor: not-allowed; }
    .oc-chat { flex: 1; display: none; flex-direction: column; min-height: 0; }
    .oc-chat.visible { display: flex; }
    .oc-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .oc-msg { max-width: 85%; padding: 8px 12px; border-radius: 12px; font: 13px/1.4 system-ui, sans-serif; word-break: break-word; }
    .oc-msg.customer { align-self: flex-end; }
    .oc-msg.agent, .oc-msg.ai_assistant { align-self: flex-start; background: rgba(255,255,255,.08); }
    .oc-msg.system { align-self: center; max-width: 95%; background: rgba(255,255,255,.04); color: rgba(255,255,255,.55); font-size: 12px; text-align: center; }
    .oc-msg.greeting { align-self: flex-start; background: rgba(255,255,255,.08); }
    .oc-empty { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; font-size: 13px; color: rgba(255,255,255,.45); text-align: center; }
    .oc-handoff-banner { padding: 8px 12px; margin: 0 12px 8px; border-radius: 8px; background: rgba(251,191,36,.12); border: 1px solid rgba(251,191,36,.25); color: #fcd34d; font-size: 12px; line-height: 1.4; flex-shrink: 0; }
    .oc-handoff-banner.hidden { display: none; }
    .oc-footer { flex-shrink: 0; border-top: 1px solid rgba(255,255,255,.08); }
    .oc-actions { display: flex; justify-content: center; padding: 8px 12px 0; }
    .oc-handoff-btn { border: 1px solid rgba(255,255,255,.15); border-radius: 8px; padding: 6px 12px; background: transparent; color: rgba(255,255,255,.75); cursor: pointer; font: 500 12px system-ui, sans-serif; }
    .oc-handoff-btn:hover:not(:disabled) { background: rgba(255,255,255,.06); color: #fff; }
    .oc-handoff-btn:disabled { opacity: .45; cursor: not-allowed; }
    .oc-form { display: flex; gap: 8px; padding: 12px; }
    .oc-input { flex: 1; border-radius: 8px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); color: #fff; padding: 8px 10px; font: 13px system-ui, sans-serif; outline: none; }
    .oc-input:disabled { opacity: .5; }
    .oc-send { border: none; border-radius: 8px; padding: 8px 12px; color: #fff; cursor: pointer; font: 600 13px system-ui, sans-serif; }
    .oc-send:disabled { opacity: .5; cursor: not-allowed; }
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
    <div class="oc-body">
      <div class="oc-state oc-state-loading">
        <div class="oc-spinner"></div>
        <p class="oc-state-text">Loading chat…</p>
      </div>
      <div class="oc-state oc-state-error hidden">
        <p class="oc-state-text">Unable to connect. Please check your connection and try again.</p>
        <button type="button" class="oc-retry">Retry</button>
      </div>
      <div class="oc-prechat">
        <p class="oc-greeting"></p>
        <div class="oc-field">
          <label class="oc-label" for="oc-name">Your name</label>
          <input id="oc-name" class="oc-field-input" type="text" placeholder="Jane Doe" maxlength="200" autocomplete="name" />
          <p class="oc-field-error oc-name-error hidden"></p>
        </div>
        <div class="oc-field">
          <label class="oc-label" for="oc-email">Your email</label>
          <input id="oc-email" class="oc-field-input" type="email" placeholder="jane@example.com" maxlength="255" autocomplete="email" />
          <p class="oc-field-error oc-email-error hidden"></p>
        </div>
        <button type="button" class="oc-start-btn">Start chat</button>
      </div>
      <div class="oc-chat">
        <div class="oc-handoff-banner hidden">A team member will be with you shortly.</div>
        <div class="oc-messages"></div>
      </div>
    </div>
    <div class="oc-footer hidden">
      <div class="oc-actions">
        <button type="button" class="oc-handoff-btn">Talk to Human</button>
      </div>
      <form class="oc-form">
        <input class="oc-input" placeholder="Type a message…" maxlength="4000" />
        <button class="oc-send" type="submit">Send</button>
      </form>
    </div>
  `;

  shadow.appendChild(toggle);
  shadow.appendChild(panel);

  const header = panel.querySelector(".oc-header");
  const loadingEl = panel.querySelector(".oc-state-loading");
  const errorEl = panel.querySelector(".oc-state-error");
  const retryBtn = panel.querySelector(".oc-retry");
  const prechatEl = panel.querySelector(".oc-prechat");
  const greetingEl = panel.querySelector(".oc-greeting");
  const nameInput = panel.querySelector("#oc-name");
  const emailInput = panel.querySelector("#oc-email");
  const nameError = panel.querySelector(".oc-name-error");
  const emailError = panel.querySelector(".oc-email-error");
  const startBtn = panel.querySelector(".oc-start-btn");
  const chatEl = panel.querySelector(".oc-chat");
  const handoffBanner = panel.querySelector(".oc-handoff-banner");
  const messagesEl = panel.querySelector(".oc-messages");
  const footerEl = panel.querySelector(".oc-footer");
  const handoffBtn = panel.querySelector(".oc-handoff-btn");
  const form = panel.querySelector(".oc-form");
  const input = panel.querySelector(".oc-input");
  const sendBtn = panel.querySelector(".oc-send");

  let conversationId = null;
  let accentColor = "#7c3aed";
  let greetingText = "Hi! How can we help you today?";
  let pollTimer = null;
  let handoffStatus = "none";
  let configLoaded = false;
  let isSending = false;
  let showGreetingBubble = true;

  function visitorId() {
    let id = localStorage.getItem(storageKeys.visitor);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(storageKeys.visitor, id);
    }
    return id;
  }

  function storedContact() {
    return {
      name: (localStorage.getItem(storageKeys.name) || "").trim(),
      email: (localStorage.getItem(storageKeys.email) || "").trim(),
    };
  }

  function saveContact(name, email) {
    localStorage.setItem(storageKeys.name, name);
    localStorage.setItem(storageKeys.email, email);
  }

  function hasContactInfo() {
    const { name, email } = storedContact();
    return Boolean(name && email);
  }

  function setAccent() {
    toggle.style.background = accentColor;
    if (sendBtn) sendBtn.style.background = accentColor;
    if (startBtn) startBtn.style.background = accentColor;
    if (retryBtn) retryBtn.style.background = accentColor;
  }

  function showView(view) {
    loadingEl.classList.toggle("hidden", view !== "loading");
    errorEl.classList.toggle("hidden", view !== "error");
    prechatEl.classList.toggle("visible", view === "prechat");
    chatEl.classList.toggle("visible", view === "chat");
    footerEl.classList.toggle("hidden", view !== "chat");
  }

  async function api(path, options) {
    const response = await fetch(`${apiBase}/api/v1/omnichannel-widget/${publicKey}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!response.ok) {
      const err = new Error("Widget API error");
      err.status = response.status;
      throw err;
    }
    return response.json();
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePrechat() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    let valid = true;

    if (!name) {
      nameError.textContent = "Please enter your name.";
      nameError.classList.remove("hidden");
      valid = false;
    } else {
      nameError.classList.add("hidden");
    }

    if (!email || !validateEmail(email)) {
      emailError.textContent = "Please enter a valid email address.";
      emailError.classList.remove("hidden");
      valid = false;
    } else {
      emailError.classList.add("hidden");
    }

    return valid ? { name, email } : null;
  }

  function updateHandoffUi() {
    const handoffRequested = handoffStatus !== "none";
    handoffBanner.classList.toggle("hidden", !handoffRequested);
    handoffBtn.disabled = handoffRequested || !conversationId || isSending;
    handoffBtn.textContent = handoffRequested ? "Handoff requested" : "Talk to Human";
  }

  function renderMessages(messages) {
    if (!messagesEl) return;
    messagesEl.innerHTML = "";

    if (showGreetingBubble && greetingText) {
      const greetingBubble = document.createElement("div");
      greetingBubble.className = "oc-msg greeting";
      greetingBubble.textContent = greetingText;
      messagesEl.appendChild(greetingBubble);
    }

    if (!messages || messages.length === 0) {
      if (!showGreetingBubble) {
        const empty = document.createElement("div");
        empty.className = "oc-empty";
        empty.textContent = "Send a message to get started.";
        messagesEl.appendChild(empty);
      }
    } else {
      messages.forEach((message) => {
        const bubble = document.createElement("div");
        bubble.className = `oc-msg ${message.role}`;
        bubble.textContent = message.content;
        messagesEl.appendChild(bubble);
      });
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function syncConversationState() {
    if (!conversationId) return;
    const conversation = await api(`/conversations/${conversationId}`);
    handoffStatus = conversation.handoff_status || "none";
    updateHandoffUi();
  }

  async function refreshMessages() {
    if (!conversationId) return;
    const messages = await api(`/conversations/${conversationId}/messages`);
    renderMessages(messages);
    await syncConversationState();
  }

  async function ensureConversation(firstMessage) {
    const contact = storedContact();
    if (conversationId) {
      if (contact.name || contact.email) {
        await api(`/conversations/${conversationId}`, {
          method: "PATCH",
          body: JSON.stringify({
            visitor_name: contact.name || undefined,
            visitor_email: contact.email || undefined,
          }),
        });
      }
      return conversationId;
    }

    const stored = localStorage.getItem(storageKeys.conversation);
    if (stored) {
      conversationId = stored;
      await syncConversationState();
      if (contact.name || contact.email) {
        await api(`/conversations/${conversationId}`, {
          method: "PATCH",
          body: JSON.stringify({
            visitor_name: contact.name || undefined,
            visitor_email: contact.email || undefined,
          }),
        });
      }
      return conversationId;
    }

    const payload = {
      visitor_name: contact.name || undefined,
      visitor_email: contact.email || undefined,
      visitor_id: visitorId(),
    };
    if (firstMessage) {
      payload.initial_message = firstMessage;
    }

    const conversation = await api("/conversations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    conversationId = conversation.id;
    handoffStatus = conversation.handoff_status || "none";
    localStorage.setItem(storageKeys.conversation, conversationId);
    updateHandoffUi();
    return conversationId;
  }

  async function enterChatView() {
    showView("chat");
    const stored = localStorage.getItem(storageKeys.conversation);
    if (stored) {
      conversationId = stored;
      try {
        await refreshMessages();
      } catch {
        renderMessages([]);
      }
    } else {
      try {
        await ensureConversation(null);
        renderMessages([]);
      } catch {
        showView("error");
        return;
      }
    }
    updateHandoffUi();
  }

  async function loadConfig() {
    showView("loading");
    const config = await api("/config");
    if (header) header.textContent = config.channel_name || "Support Chat";
    greetingText = config.greeting || greetingText;
    accentColor = config.accent_color || accentColor;
    setAccent();
    if (greetingEl) greetingEl.textContent = greetingText;
    visitorId();
    configLoaded = true;

    if (hasContactInfo()) {
      const { name, email } = storedContact();
      if (nameInput) nameInput.value = name;
      if (emailInput) emailInput.value = email;
      if (panel.classList.contains("open")) {
        await enterChatView();
      } else {
        showView("prechat");
      }
    } else {
      showView("prechat");
    }
  }

  toggle.addEventListener("click", async () => {
    const wasOpen = panel.classList.contains("open");
    panel.classList.toggle("open");
    const isOpen = panel.classList.contains("open");

    if (isOpen && !wasOpen) {
      if (!configLoaded) {
        try {
          await loadConfig();
        } catch {
          showView("error");
          return;
        }
      } else if (hasContactInfo()) {
        await enterChatView();
      } else {
        showView("prechat");
      }

      if (!pollTimer) {
        pollTimer = setInterval(() => {
          if (panel.classList.contains("open") && conversationId) {
            void refreshMessages().catch(() => {});
          }
        }, 4000);
      }
    }
  });

  startBtn.addEventListener("click", async () => {
    const contact = validatePrechat();
    if (!contact) return;

    saveContact(contact.name, contact.email);
    startBtn.disabled = true;

    try {
      await ensureConversation(null);
      showGreetingBubble = true;
      await enterChatView();
    } catch {
      showView("error");
    } finally {
      startBtn.disabled = false;
    }
  });

  handoffBtn.addEventListener("click", async () => {
    if (!conversationId || handoffStatus !== "none") return;
    handoffBtn.disabled = true;
    try {
      const conversation = await api(`/conversations/${conversationId}/handoff`, {
        method: "POST",
      });
      handoffStatus = conversation.handoff_status || "requested";
      updateHandoffUi();
      await refreshMessages();
    } catch {
      handoffBtn.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content || isSending) return;

    isSending = true;
    input.disabled = true;
    sendBtn.disabled = true;

    try {
      const id = await ensureConversation(content);
      input.value = "";
      showGreetingBubble = false;
      await api(`/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      await refreshMessages();
    } catch {
      input.value = content;
    } finally {
      isSending = false;
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });

  retryBtn.addEventListener("click", () => {
    void loadConfig().catch(() => showView("error"));
  });

  setAccent();
  void loadConfig().catch(() => {
    if (!panel.classList.contains("open")) {
      configLoaded = false;
    }
  });
})();
