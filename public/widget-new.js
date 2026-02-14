/**
 * LeadBotStudio Chatbot Widget - Redesigned
 * Modern profile-based chatbot with smooth transitions
 */
(function () {
  "use strict";

  // Session expiry: 24 hours
  const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

  // File upload constraints
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_FILES = 5;

  // Textarea height constraints
  const TEXTAREA_MIN_HEIGHT = 40;
  const TEXTAREA_MAX_HEIGHT = 112;
  const SUPPORTED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  // Default appearance colors
  const DEFAULT_APPEARANCE = {
    primaryColor: "#001F54",
    accentColor: "#3B82F6",
  };

  /**
   * Validate a file for upload
   */
  function validateFile(file) {
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.name}. Supported: PDF, images, text, DOCX, XLSX`,
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large: ${file.name}. Maximum size is 50MB`,
      };
    }
    return { valid: true };
  }

  /**
   * Convert File to base64 string
   */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Format file size for display
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get emoji icon for file type
   */
  function getFileIcon(mimeType) {
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("text/")) return "📝";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
      return "📊";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📃";
    return "📎";
  }

  // Thinking message synonyms
  const THINKING_SYNONYMS = [
    "Thinking...",
    "Processing...",
    "Analyzing...",
    "Considering...",
    "Evaluating...",
    "Pondering...",
    "Contemplating...",
    "Reflecting...",
    "Reasoning...",
    "Deliberating...",
    "Examining...",
    "Assessing...",
    "Reviewing...",
    "Calculating...",
    "Formulating...",
  ];

  function getRandomThinkingText() {
    const randomIndex = Math.floor(Math.random() * THINKING_SYNONYMS.length);
    return THINKING_SYNONYMS[randomIndex];
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Infer API URL from the script src or fall back to current origin
   */
  function getApiUrl() {
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src;
      if (src && /widget(\.min)?\.js(\?|$)/.test(src)) {
        try {
          const url = new URL(src);
          return url.origin;
        } catch (e) {
          // Invalid URL, continue
        }
      }
    }
    return window.location.origin;
  }

  // Widget configuration
  const DEFAULT_CONFIG = {
    apiUrl: getApiUrl(),
    position: "bottom-right",
    zIndex: 9999,
  };

  /**
   * Lightweight markdown parser for chat messages
   */
  function parseMarkdown(text) {
    if (!text) return "";

    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /```(\w*)\n?([\s\S]*?)```/g,
        '<pre class="widget-code-block"><code>$2</code></pre>',
      )
      .replace(/`([^`]+)`/g, '<code class="widget-inline-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="widget-link">$1</a>',
      )
      .replace(/^[\s]*[-*]\s+(.+)$/gm, '<li class="widget-list-item">$1</li>')
      .replace(
        /^[\s]*\d+\.\s+(.+)$/gm,
        '<li class="widget-list-item-ordered">$1</li>',
      )
      .replace(
        /^>\s*(.+)$/gm,
        '<blockquote class="widget-blockquote">$1</blockquote>',
      )
      .replace(/^######\s+(.+)$/gm, '<h6 class="widget-heading">$1</h6>')
      .replace(/^#####\s+(.+)$/gm, '<h5 class="widget-heading">$1</h5>')
      .replace(/^####\s+(.+)$/gm, '<h4 class="widget-heading">$1</h4>')
      .replace(/^###\s+(.+)$/gm, '<h3 class="widget-heading">$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2 class="widget-heading">$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1 class="widget-heading">$1</h1>')
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    html = html.replace(
      /(<li class="widget-list-item">.*?<\/li>)+/g,
      '<ul class="widget-list">$&</ul>',
    );
    html = html.replace(
      /(<li class="widget-list-item-ordered">.*?<\/li>)+/g,
      '<ol class="widget-list-ordered">$&</ol>',
    );

    if (!/^<(h[1-6]|ul|ol|pre|blockquote)/.test(html)) {
      html = "<p>" + html + "</p>";
    }

    return html;
  }

  /**
   * Get initials from name for avatar fallback
   */
  function getInitials(name) {
    if (!name) return "AI";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Widget class
  class LeadBotStudioWidget {
    constructor(config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.isOpen = false;
      this.isFullscreen = false; // Fullscreen mode state
      this.currentView = "profile"; // 'profile' or 'chat'
      this.chatbot = null;
      this.isLoading = false;
      this.appearance = DEFAULT_APPEARANCE;

      // File upload state
      this.pendingFiles = [];
      this.dragCounter = 0;
      this.fileError = null;

      // Load or create session with messages
      const sessionData = this.getOrCreateSession();
      this.sessionId = sessionData.sessionId;
      this.messages = sessionData.messages;
      this.isNewSession = sessionData.isNew;

      this.init();
    }

    /**
     * Get or create session from localStorage with expiry check
     */
    getOrCreateSession() {
      const key = `lbs_chat_${this.config.chatbotId}`;

      try {
        const stored = localStorage.getItem(key);

        if (stored) {
          const session = JSON.parse(stored);

          if (Date.now() < session.expiresAt) {
            return {
              sessionId: session.sessionId,
              messages: session.messages || [],
              isNew: false,
            };
          }

          localStorage.removeItem(key);
        }
      } catch (e) {
        localStorage.removeItem(key);
      }

      const newSession = {
        sessionId: this.generateId(),
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY_MS,
        messages: [],
      };

      localStorage.setItem(key, JSON.stringify(newSession));

      return {
        sessionId: newSession.sessionId,
        messages: [],
        isNew: true,
      };
    }

    /**
     * Save current session state to localStorage
     */
    saveSession() {
      const key = `lbs_chat_${this.config.chatbotId}`;
      const session = {
        sessionId: this.sessionId,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY_MS,
        messages: this.messages,
      };
      localStorage.setItem(key, JSON.stringify(session));
    }

    /**
     * Start a new conversation (return to profile view)
     */
    startNewConversation() {
      const key = `lbs_chat_${this.config.chatbotId}`;
      localStorage.removeItem(key);

      this.sessionId = this.generateId();
      this.messages = [];
      this.isNewSession = true;
      this.saveSession();

      // Switch back to profile view
      this.currentView = "profile";
      this.renderCurrentView();
    }

    generateId() {
      return (
        Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
      );
    }

    async init() {
      try {
        await this.loadChatbotConfig();
        this.createWidget();
        this.attachEventListeners();
      } catch (error) {
        console.error("Failed to initialize chatbot:", error);
      }
    }

    async loadChatbotConfig() {
      const response = await fetch(
        `${this.config.apiUrl}/api/public/chat/${this.config.chatbotId}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load chatbot configuration");
      }

      const result = await response.json();
      this.chatbot = result.data;

      // Parse appearance config
      if (this.chatbot.appearance) {
        try {
          this.appearance =
            typeof this.chatbot.appearance === "string"
              ? JSON.parse(this.chatbot.appearance)
              : this.chatbot.appearance;
        } catch (e) {
          console.warn("Failed to parse appearance config:", e);
          this.appearance = DEFAULT_APPEARANCE;
        }
      }
    }

    createWidget() {
      // Create container
      const container = document.createElement("div");
      container.id = "lbs-chat-widget";
      container.style.cssText = `
        position: fixed;
        ${this.config.position.includes("right") ? "right: 20px;" : "left: 20px;"}
        bottom: 20px;
        z-index: ${this.config.zIndex};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      `;

      // Create chat button
      const button = this.createChatButton();
      container.appendChild(button);

      // Create chat window (hidden by default)
      const chatWindow = this.createChatWindow();
      container.appendChild(chatWindow);

      document.body.appendChild(container);
    }

    createChatButton() {
      const button = document.createElement("button");
      button.id = "lbs-chat-button";
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      button.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.appearance.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      `;

      button.onmouseover = () => {
        button.style.transform = "scale(1.1)";
      };

      button.onmouseout = () => {
        button.style.transform = "scale(1)";
      };

      button.onclick = () => this.toggleChat();

      return button;
    }

    createChatWindow() {
      const chatWindow = document.createElement("div");
      chatWindow.id = "lbs-chat-window";
      const isRight = this.config.position.includes("right");

      // Set all four positioning values to enable smooth transitions
      const topPos = "calc(100vh - 650px - 100px)";
      const bottomPos = "100px";
      const leftPos = isRight ? "calc(100vw - 400px - 20px)" : "20px";
      const rightPos = isRight ? "20px" : "calc(100vw - 400px - 20px)";

      chatWindow.style.cssText = `
        display: none;
        position: fixed;
        top: ${topPos};
        bottom: ${bottomPos};
        left: ${leftPos};
        right: ${rightPos};
        width: 400px;
        height: 650px;
        max-height: calc(100vh - 140px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease-in-out;
      `;

      // Create content container
      const content = document.createElement("div");
      content.id = "lbs-chat-content";
      content.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
      `;

      chatWindow.appendChild(content);
      return chatWindow;
    }

    renderCurrentView() {
      const content = document.getElementById("lbs-chat-content");
      if (!content) return;

      // Fade out
      content.style.opacity = "0";
      content.style.transition = "opacity 0.2s ease-in-out";

      setTimeout(() => {
        if (this.currentView === "profile") {
          content.innerHTML = this.createProfileView();
          this.attachProfileEventListeners();
        } else {
          content.innerHTML = this.createChatView();
          this.attachChatEventListeners();
          this.renderStoredMessages();
        }

        // Fade in
        setTimeout(() => {
          content.style.opacity = "1";
        }, 50);
      }, 200);
    }

    createProfileView() {
      const initials = getInitials(this.chatbot?.name);
      const avatarUrl = this.chatbot?.thumbnail;
      const suggestedQuestions = this.chatbot?.suggestedQuestions || [];

      return `
        <div style="display: flex; flex-direction: column; height: 100%; background: white; align-items: center;">
          <!-- Content container with max-width for fullscreen -->
          <div style="width: 100%; max-width: 600px; display: flex; flex-direction: column; height: 100%;">
            <!-- Header with expand and minimize buttons -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px;">
              <div style="width: 24px;"></div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <!-- Expand button (shown in normal mode) -->
                <button id="lbs-expand-btn" title="Expand" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: block;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                  </svg>
                </button>
                <!-- Minimize fullscreen button (shown in fullscreen mode) -->
                <button id="lbs-fullscreen-minimize-btn" title="Exit fullscreen" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: none;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                  </svg>
                </button>
                <!-- Close/minimize widget button -->
                <button id="lbs-minimize-btn" title="Minimize" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Profile Section -->
            <div style="display: flex; flex-direction: column; align-items: center; padding: 0 24px 24px;">
            <!-- Avatar -->
            <div style="position: relative; margin-bottom: 16px;">
              ${
                avatarUrl
                  ? `<img src="${avatarUrl}" alt="${escapeHtml(this.chatbot.name)}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; filter: grayscale(100%);" />`
                  : `<div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, ${this.appearance.primaryColor} 0%, ${this.appearance.accentColor} 100%); display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 600; color: white;">${initials}</div>`
              }
              <div style="position: absolute; bottom: 8px; right: 8px; width: 20px; height: 20px; background: #10b981; border: 3px solid white; border-radius: 50%;"></div>
            </div>

            <!-- Name and Description -->
            <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 600; color: #111827; text-align: center;">
              ${escapeHtml(this.chatbot?.name || "AI Assistant")}
            </h2>
            ${
              this.chatbot?.description
                ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; text-align: center; line-height: 1.5;">${escapeHtml(this.chatbot.description)}</p>`
                : ""
            }

            <!-- Chat Button -->
            <button id="lbs-start-chat-btn" style="
              width: 100%;
              padding: 12px 24px;
              background: ${this.appearance.accentColor};
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 500;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              transition: background 0.2s;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Chat
            </button>
          </div>

          ${
            suggestedQuestions.length > 0
              ? `
            <!-- Suggested Questions -->
            <div style="flex: 1; overflow-y: auto; padding: 0 24px 24px; min-height: 0;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">
                Suggested Questions
              </h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${suggestedQuestions
                  .map(
                    (q, i) => `
                  <button class="suggested-question-btn" data-question="${escapeHtml(q)}" style="
                    padding: 12px 16px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    font-size: 14px;
                    color: #374151;
                  ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 2px; color: #9ca3af;">
                      <path d="M12 3v18m0 0l-6-6m6 6l6-6"></path>
                    </svg>
                    ${escapeHtml(q)}
                  </button>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
          </div>
        </div>
      `;
    }

    createChatView() {
      return `
        <div style="display: flex; flex-direction: column; height: 100%;">
          <!-- Header -->
          <div style="background: white; padding: 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <button id="lbs-back-btn" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: flex; align-items: center; gap: 4px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span style="font-weight: 600; color: #111827; font-size: 15px;">${escapeHtml(this.chatbot?.name || "Chat")}</span>
            <div style="display: flex; gap: 8px; align-items: center;">
              <!-- Expand button (shown in normal mode) -->
              <button id="lbs-expand-btn" title="Expand" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: block;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                </svg>
              </button>
              <!-- Minimize fullscreen button (shown in fullscreen mode) -->
              <button id="lbs-fullscreen-minimize-btn" title="Exit fullscreen" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: none;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              </button>
              <!-- New conversation button -->
              <button id="lbs-chat-new" title="New Conversation" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages area -->
          <div id="lbs-chat-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #f9fafb;
          "></div>

          <!-- Drag overlay -->
          <div id="lbs-drag-overlay" style="display: none;"></div>

          <!-- Input area -->
          <div id="lbs-input-area" style="
            border-top: 1px solid #e5e7eb;
            background: white;
          ">
            <div id="lbs-pending-files" style="display: none;"></div>
            <div id="lbs-file-error" style="display: none;"></div>
            <div style="display: flex; gap: 8px; padding: 16px; align-items: flex-end;">
              <input type="file" id="lbs-file-input" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.md,.csv,.docx,.xlsx" style="display: none;" />
              <button id="lbs-file-button" title="Attach files" style="
                padding: 8px;
                background: none;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                transition: background 0.2s;
              ">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              <div style="position: relative; flex: 1;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none;">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <textarea
                  id="lbs-chat-input"
                  placeholder="Ask a question..."
                  rows="1"
                  style="
                    width: 100%;
                    padding: 8px 12px 8px 38px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: inherit;
                    resize: none;
                    min-height: ${TEXTAREA_MIN_HEIGHT}px;
                    max-height: ${TEXTAREA_MAX_HEIGHT}px;
                    overflow-y: auto;
                    line-height: 1.5;
                    box-sizing: border-box;
                  "
                ></textarea>
              </div>
              <button
                id="lbs-chat-send"
                style="
                  padding: 8px;
                  background: ${this.appearance.accentColor};
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: opacity 0.2s;
                "
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    attachProfileEventListeners() {
      const minimizeBtn = document.getElementById("lbs-minimize-btn");
      const expandBtn = document.getElementById("lbs-expand-btn");
      const fullscreenMinimizeBtn = document.getElementById("lbs-fullscreen-minimize-btn");
      const startChatBtn = document.getElementById("lbs-start-chat-btn");
      const questionBtns = document.querySelectorAll(".suggested-question-btn");

      if (minimizeBtn) {
        minimizeBtn.onclick = () => this.toggleChat();
      }

      if (expandBtn) {
        expandBtn.onclick = () => this.toggleFullscreen();
      }

      if (fullscreenMinimizeBtn) {
        fullscreenMinimizeBtn.onclick = () => this.toggleFullscreen();
      }

      if (startChatBtn) {
        startChatBtn.onclick = () => {
          this.currentView = "chat";
          this.renderCurrentView();

          // Show initial greeting if no messages
          if (this.messages.length === 0 && this.chatbot?.chatGreeting) {
            setTimeout(() => {
              this.renderMessage("assistant", this.chatbot.chatGreeting);
            }, 300);
          }
        };
        startChatBtn.onmouseover = () => {
          startChatBtn.style.background = this.lightenColor(
            this.appearance.accentColor,
            10,
          );
        };
        startChatBtn.onmouseout = () => {
          startChatBtn.style.background = this.appearance.accentColor;
        };
      }

      questionBtns.forEach((btn) => {
        btn.onclick = () => {
          const question = btn.getAttribute("data-question");
          this.currentView = "chat";
          this.renderCurrentView();

          setTimeout(() => {
            // Show greeting if no messages
            if (this.messages.length === 0 && this.chatbot?.chatGreeting) {
              this.renderMessage("assistant", this.chatbot.chatGreeting);
            }

            // Auto-fill the question in input
            const input = document.getElementById("lbs-chat-input");
            if (input) {
              input.value = question;
              input.focus();
            }
          }, 300);
        };
        btn.onmouseover = () => {
          btn.style.background = "#f9fafb";
          btn.style.borderColor = this.appearance.accentColor;
        };
        btn.onmouseout = () => {
          btn.style.background = "white";
          btn.style.borderColor = "#e5e7eb";
        };
      });
    }

    attachChatEventListeners() {
      const backBtn = document.getElementById("lbs-back-btn");
      const expandBtn = document.getElementById("lbs-expand-btn");
      const fullscreenMinimizeBtn = document.getElementById("lbs-fullscreen-minimize-btn");
      const newBtn = document.getElementById("lbs-chat-new");
      const sendButton = document.getElementById("lbs-chat-send");
      const input = document.getElementById("lbs-chat-input");
      const fileButton = document.getElementById("lbs-file-button");
      const fileInput = document.getElementById("lbs-file-input");
      const chatWindow = document.getElementById("lbs-chat-window");

      if (backBtn) {
        backBtn.onclick = () => {
          this.currentView = "profile";
          this.renderCurrentView();
        };
      }

      if (expandBtn) {
        expandBtn.onclick = () => this.toggleFullscreen();
      }

      if (fullscreenMinimizeBtn) {
        fullscreenMinimizeBtn.onclick = () => this.toggleFullscreen();
      }

      if (newBtn) {
        newBtn.onclick = () => this.startNewConversation();
      }

      if (sendButton) {
        sendButton.onclick = () => this.sendMessage();
      }

      if (input) {
        input.oninput = () => this.autoResizeTextarea();

        const isMobile =
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
          ("ontouchstart" in window && window.innerWidth < 768);

        input.onkeydown = (e) => {
          if (e.key === "Enter") {
            if (isMobile || e.shiftKey) {
              setTimeout(() => this.autoResizeTextarea(), 0);
              return;
            }
            e.preventDefault();
            this.sendMessage();
          }
        };
      }

      // File upload handlers
      if (fileButton && fileInput) {
        fileButton.onclick = () => {
          if (this.pendingFiles.length < MAX_FILES) {
            fileInput.click();
          }
        };
        fileButton.onmouseover = () => {
          fileButton.style.background = "#f3f4f6";
        };
        fileButton.onmouseout = () => {
          fileButton.style.background = "none";
        };

        fileInput.onchange = (e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            this.handleFilesSelected(Array.from(files));
          }
          fileInput.value = "";
        };
      }

      // Drag and drop
      if (chatWindow) {
        chatWindow.ondragenter = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dragCounter++;
          if (this.dragCounter === 1) {
            this.showDragOverlay();
          }
        };

        chatWindow.ondragleave = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dragCounter--;
          if (this.dragCounter === 0) {
            this.hideDragOverlay();
          }
        };

        chatWindow.ondragover = (e) => {
          e.preventDefault();
          e.stopPropagation();
        };

        chatWindow.ondrop = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dragCounter = 0;
          this.hideDragOverlay();

          const files = e.dataTransfer?.files;
          if (files && files.length > 0) {
            this.handleFilesSelected(Array.from(files));
          }
        };
      }
    }

    /**
     * Lighten a hex color by a percentage
     */
    lightenColor(hex, percent) {
      const num = parseInt(hex.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = ((num >> 8) & 0x00ff) + amt;
      const B = (num & 0x0000ff) + amt;
      return (
        "#" +
        (
          0x1000000 +
          (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
          (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
          (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1)
      );
    }

    toggleChat() {
      this.isOpen = !this.isOpen;
      const chatWindow = document.getElementById("lbs-chat-window");

      if (chatWindow) {
        chatWindow.style.display = this.isOpen ? "flex" : "none";
      }

      if (this.isOpen) {
        // Render the current view when opening
        this.renderCurrentView();

        // If we have messages, go directly to chat view
        if (this.messages.length > 0) {
          this.currentView = "chat";
          this.renderCurrentView();
        }
      }
    }

    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
      const chatWindow = document.getElementById("lbs-chat-window");

      if (!chatWindow) return;

      const isRight = this.config.position.includes("right");

      if (this.isFullscreen) {
        // Fullscreen mode - expand to fill entire viewport
        chatWindow.style.width = "100vw";
        chatWindow.style.height = "100vh";
        chatWindow.style.maxHeight = "100vh";
        chatWindow.style.top = "0px";
        chatWindow.style.bottom = "0px";
        chatWindow.style.left = "0px";
        chatWindow.style.right = "0px";
        chatWindow.style.borderRadius = "0";
      } else {
        // Normal mode - restore original dimensions and corner position
        chatWindow.style.width = "400px";
        chatWindow.style.height = "650px";
        chatWindow.style.maxHeight = "calc(100vh - 140px)";

        // Calculate bottom position from viewport
        const bottomPos = "100px";

        if (isRight) {
          chatWindow.style.top = `calc(100vh - 650px - ${bottomPos})`;
          chatWindow.style.left = "calc(100vw - 400px - 20px)";
          chatWindow.style.right = "20px";
          chatWindow.style.bottom = bottomPos;
        } else {
          chatWindow.style.top = `calc(100vh - 650px - ${bottomPos})`;
          chatWindow.style.left = "20px";
          chatWindow.style.right = "calc(100vw - 400px - 20px)";
          chatWindow.style.bottom = bottomPos;
        }

        chatWindow.style.borderRadius = "16px";
      }

      // Update the icons in both views
      this.updateFullscreenIcons();
    }

    updateFullscreenIcons() {
      const expandIcon = document.getElementById("lbs-expand-btn");
      const minimizeIcon = document.getElementById("lbs-fullscreen-minimize-btn");

      if (expandIcon) {
        expandIcon.style.display = this.isFullscreen ? "none" : "block";
      }

      if (minimizeIcon) {
        minimizeIcon.style.display = this.isFullscreen ? "block" : "none";
      }
    }

    renderStoredMessages() {
      if (this.messages.length > 0) {
        for (const msg of this.messages) {
          this.renderMessage(msg.role, msg.content);
        }
      }
    }

    async handleFilesSelected(files) {
      this.clearFileError();

      // Check max files limit
      const availableSlots = MAX_FILES - this.pendingFiles.length;
      const filesToProcess =
        files.length > availableSlots ? files.slice(0, availableSlots) : files;

      if (files.length > availableSlots) {
        this.showFileError(
          `Maximum ${MAX_FILES} files allowed. You can add ${availableSlots} more.`,
        );
      }

      for (const file of filesToProcess) {
        const validation = validateFile(file);
        if (!validation.valid) {
          this.showFileError(validation.error);
          continue;
        }

        try {
          const base64 = await fileToBase64(file);
          this.pendingFiles.push({
            name: file.name,
            mimeType: file.type,
            size: file.size,
            base64,
          });
        } catch (err) {
          this.showFileError(`Failed to read file: ${file.name}`);
        }
      }

      this.renderPendingFiles();
    }

    removeFile(index) {
      this.pendingFiles.splice(index, 1);
      this.clearFileError();
      this.renderPendingFiles();
    }

    renderPendingFiles() {
      const container = document.getElementById("lbs-pending-files");
      if (!container) return;

      if (this.pendingFiles.length === 0) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
      }

      container.style.display = "block";
      container.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${this.pendingFiles
            .map(
              (file, index) => `
            <div style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px 8px; font-size: 12px;">
              <span>${getFileIcon(file.mimeType)}</span>
              <div style="display: flex; flex-direction: column; min-width: 0;">
                <span style="font-weight: 500; color: #374151; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(file.name)}</span>
                <span style="color: #9ca3af; font-size: 10px;">${formatFileSize(file.size)}</span>
              </div>
              <button
                data-file-index="${index}"
                style="background: none; border: none; cursor: pointer; color: #9ca3af; padding: 2px; display: flex; align-items: center;"
                title="Remove file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          `,
            )
            .join("")}
        </div>
      `;

      // Attach remove handlers
      container.querySelectorAll("[data-file-index]").forEach((btn) => {
        btn.onclick = () => {
          const index = parseInt(btn.getAttribute("data-file-index"), 10);
          this.removeFile(index);
        };
        btn.onmouseover = () => {
          btn.style.color = "#ef4444";
        };
        btn.onmouseout = () => {
          btn.style.color = "#9ca3af";
        };
      });

      // Update file button state
      const fileButton = document.getElementById("lbs-file-button");
      if (fileButton) {
        if (this.pendingFiles.length >= MAX_FILES) {
          fileButton.style.opacity = "0.5";
          fileButton.style.cursor = "not-allowed";
        } else {
          fileButton.style.opacity = "1";
          fileButton.style.cursor = "pointer";
        }
      }
    }

    showFileError(message) {
      this.fileError = message;
      const errorDiv = document.getElementById("lbs-file-error");
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
      }
    }

    clearFileError() {
      this.fileError = null;
      const errorDiv = document.getElementById("lbs-file-error");
      if (errorDiv) {
        errorDiv.style.display = "none";
        errorDiv.textContent = "";
      }
    }

    autoResizeTextarea() {
      const textarea = document.getElementById("lbs-chat-input");
      if (!textarea) return;

      textarea.style.height = "auto";
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, TEXTAREA_MIN_HEIGHT),
        TEXTAREA_MAX_HEIGHT,
      );
      textarea.style.height = newHeight + "px";
    }

    resetTextareaHeight() {
      const textarea = document.getElementById("lbs-chat-input");
      if (!textarea) return;
      textarea.style.height = TEXTAREA_MIN_HEIGHT + "px";
    }

    showDragOverlay() {
      const overlay = document.getElementById("lbs-drag-overlay");
      if (overlay) {
        overlay.style.display = "flex";
      }
    }

    hideDragOverlay() {
      const overlay = document.getElementById("lbs-drag-overlay");
      if (overlay) {
        overlay.style.display = "none";
      }
    }

    renderMessage(role, content) {
      const messagesContainer = document.getElementById(
        "lbs-chat-messages",
      );
      if (!messagesContainer) return;

      const messageDiv = document.createElement("div");
      messageDiv.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        ${role === "user" ? "justify-content: flex-end;" : "justify-content: flex-start;"}
      `;

      const bubble = document.createElement("div");
      bubble.className = `widget-bubble widget-bubble-${role}`;
      bubble.style.cssText = `
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.6;
        ${
          role === "user"
            ? `background: ${this.appearance.accentColor}; color: white;`
            : "background: white; color: #1f2937; border: 1px solid #e5e7eb;"
        }
      `;

      if (role === "assistant") {
        bubble.innerHTML = parseMarkdown(content);
      } else {
        bubble.textContent = content;
      }

      messageDiv.appendChild(bubble);
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendMessage() {
      const input = document.getElementById("lbs-chat-input");
      const hasMessage = input && input.value.trim();
      const hasFiles = this.pendingFiles.length > 0;

      // Must have either message or files
      if ((!hasMessage && !hasFiles) || this.isLoading) return;

      const message = input ? input.value.trim() : "";
      if (input) {
        input.value = "";
        this.resetTextareaHeight();
      }

      // Capture files and clear pending
      const filesToSend = [...this.pendingFiles];
      this.pendingFiles = [];
      this.renderPendingFiles();
      this.clearFileError();

      // Render user message with attachments
      if (filesToSend.length > 0) {
        this.renderUserMessageWithFiles(message, filesToSend);
      } else {
        this.renderMessage("user", message);
      }

      // Add to messages array - include file names if no message text
      const historyContent =
        message ||
        (filesToSend.length > 0
          ? `[Attached: ${filesToSend.map((f) => f.name).join(", ")}]`
          : "");
      this.messages.push({ role: "user", content: historyContent });
      this.saveSession();

      // Show thinking message immediately
      this.isLoading = true;
      const thinkingText = getRandomThinkingText();
      const thinkingBubble = this.createThinkingMessage(thinkingText);

      // Determine if this is a new session (first message)
      const isNewSession = this.isNewSession && this.messages.length === 1;

      // Prepare files for API
      const filesPayload =
        filesToSend.length > 0
          ? filesToSend.map((f) => ({
              name: f.name,
              mimeType: f.mimeType,
              size: f.size,
              base64: f.base64,
            }))
          : undefined;

      try {
        const response = await fetch(
          `${this.config.apiUrl}/api/public/chat/${this.config.chatbotId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              message,
              sessionId: this.sessionId,
              isNewSession,
              conversationHistory: this.getConversationHistory().slice(0, -1), // Exclude current message
              files: filesPayload,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        // Mark session as no longer new after first successful message
        if (isNewSession) {
          this.isNewSession = false;
        }

        // Check if response is SSE stream
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("text/event-stream")) {
          // Parse SSE stream - pass thinking bubble to reuse it
          await this.handleSSEStream(response, thinkingBubble);
        } else {
          // Fallback: Handle JSON response (legacy)
          const result = await response.json();
          if (result.success && result.data?.message) {
            // Remove thinking bubble
            if (thinkingBubble?.parentElement) {
              thinkingBubble.parentElement.remove();
            }
            this.addMessage("assistant", result.data.message);
          } else if (result.error) {
            throw new Error(result.error);
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error);

        // Remove thinking bubble if still present
        if (thinkingBubble?.parentElement) {
          thinkingBubble.parentElement.remove();
        }

        this.addMessage(
          "assistant",
          "Sorry, I'm having trouble responding right now. Please try again.",
        );
      } finally {
        this.isLoading = false;
      }
    }

    /**
     * Render user message with file attachments
     */
    renderUserMessageWithFiles(content, files) {
      const messagesContainer = document.getElementById(
        "lbs-chat-messages",
      );
      if (!messagesContainer) return;

      const messageDiv = document.createElement("div");
      messageDiv.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        justify-content: flex-end;
      `;

      const bubble = document.createElement("div");
      bubble.className = "widget-bubble widget-bubble-user";
      bubble.style.cssText = `
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.6;
        background: ${this.appearance.accentColor};
        color: white;
      `;

      // Build content with files
      let innerHtml = "";

      // File attachments first
      if (files && files.length > 0) {
        innerHtml += `<div style="margin-bottom: ${content ? "8px" : "0"}; display: flex; flex-direction: column; gap: 4px;">`;
        for (const file of files) {
          innerHtml += `
            <div style="display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.2); border-radius: 6px; padding: 4px 8px; font-size: 12px;">
              <span>${getFileIcon(file.mimeType)}</span>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${escapeHtml(file.name)}</span>
              <span style="opacity: 0.8; font-size: 10px;">(${formatFileSize(file.size)})</span>
            </div>
          `;
        }
        innerHtml += "</div>";
      }

      // Message text
      if (content) {
        innerHtml += escapeHtml(content);
      }

      bubble.innerHTML = innerHtml;
      messageDiv.appendChild(bubble);
      messagesContainer.appendChild(messageDiv);

      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Add message to storage and render it
     */
    addMessage(role, content) {
      this.messages.push({ role, content });
      this.saveSession();
      this.renderMessage(role, content);
    }

    /**
     * Build conversation history for API request (excludes current message)
     */
    getConversationHistory() {
      return this.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    async handleSSEStream(response, thinkingBubble) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";
      let receivedToolCall = null;
      let streamingBubble = thinkingBubble;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));

                switch (event.type) {
                  case "start":
                    break;

                  case "content":
                    if (event.content) {
                      accumulatedContent += event.content;
                      if (streamingBubble) {
                        streamingBubble.classList.remove("widget-thinking");
                        streamingBubble.style.color = "#1f2937";
                        streamingBubble.style.fontStyle = "normal";
                      }
                      this.updateStreamingMessage(
                        streamingBubble,
                        accumulatedContent,
                      );
                    }
                    break;

                  case "tool_call":
                    console.log("[Widget] Tool call received:", event.toolCall);
                    if (event.toolCall?.name === "show_lead_form") {
                      receivedToolCall = event.toolCall;
                      if (streamingBubble?.parentElement) {
                        streamingBubble.parentElement.remove();
                        streamingBubble = null;
                      }
                      this.showLeadForm(event.toolCall.parameters);
                    }
                    break;

                  case "complete":
                    const finalContent = event.content || accumulatedContent;
                    this.updateStreamingMessage(streamingBubble, finalContent);
                    this.messages.push({
                      role: "assistant",
                      content: finalContent,
                    });
                    this.saveSession();
                    break;

                  case "error":
                    const errorMsg =
                      event.error?.message ||
                      "An error occurred. Please try again.";
                    if (streamingBubble) {
                      this.updateStreamingMessage(streamingBubble, errorMsg);
                    } else {
                      this.renderMessage("assistant", errorMsg);
                    }
                    this.messages.push({
                      role: "assistant",
                      content: errorMsg,
                    });
                    this.saveSession();
                    break;
                }
              } catch {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }

        if (streamingBubble && !accumulatedContent && !receivedToolCall) {
          const errorMsg =
            "Sorry, I'm having trouble responding right now. Please try again.";
          this.updateStreamingMessage(streamingBubble, errorMsg);
          this.messages.push({
            role: "assistant",
            content: errorMsg,
          });
          this.saveSession();
        }
      } finally {
        reader.releaseLock();
      }
    }

    updateStreamingMessage(bubble, content) {
      if (!bubble) return;
      bubble.innerHTML = parseMarkdown(content);

      const messagesContainer = document.getElementById(
        "lbs-chat-messages",
      );
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }

    createThinkingMessage(thinkingText) {
      const messagesContainer = document.getElementById(
        "lbs-chat-messages",
      );
      if (!messagesContainer) return null;

      const messageDiv = document.createElement("div");
      messageDiv.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        justify-content: flex-start;
      `;

      const bubble = document.createElement("div");
      bubble.className =
        "widget-bubble widget-bubble-assistant widget-thinking";
      bubble.style.cssText = `
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.6;
        background: white;
        color: #6b7280;
        border: 1px solid #e5e7eb;
        font-style: italic;
      `;
      bubble.textContent = thinkingText;

      messageDiv.appendChild(bubble);
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      return bubble;
    }

    /**
     * Show lead capture form in the chat
     */
    showLeadForm(parameters) {
      const messagesContainer = document.getElementById(
        "lbs-chat-messages",
      );
      if (!messagesContainer) return;

      if (document.getElementById("widget-lead-form")) return;

      const extractedData = parameters.extractedData || {};
      const primaryColor = this.appearance.primaryColor;

      const formDiv = document.createElement("div");
      formDiv.id = "widget-lead-form";
      formDiv.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        justify-content: flex-start;
      `;

      formDiv.innerHTML = `
        <div style="max-width: 90%; background: #f0fdf4; border: 1px solid ${primaryColor}; border-radius: 12px; padding: 16px;">
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #166534; margin: 0 0 4px 0;">
              Connect with an Attorney
            </h3>
            <p style="font-size: 12px; color: #4b5563; margin: 0;">
              Please provide your contact information and we'll connect you with an experienced attorney.
            </p>
          </div>

          <form id="widget-lead-form-element" style="display: flex; flex-direction: column; gap: 10px;">
            <div>
              <label style="display: block; font-size: 11px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">
                Name <span style="color: #ef4444;">*</span>
              </label>
              <input
                type="text"
                name="name"
                value="${escapeHtml(extractedData.name || "")}"
                placeholder="Your full name"
                required
                style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;"
              />
            </div>

            <div>
              <label style="display: block; font-size: 11px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">
                Email <span style="color: #ef4444;">*</span>
              </label>
              <input
                type="email"
                name="email"
                value="${escapeHtml(extractedData.email || "")}"
                placeholder="your@email.com"
                required
                style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;"
              />
            </div>

            <div>
              <label style="display: block; font-size: 11px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">
                Phone <span style="color: #9ca3af;">(optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value="${escapeHtml(extractedData.phone || "")}"
                placeholder="(555) 123-4567"
                style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;"
              />
            </div>

            <div>
              <label style="display: block; font-size: 11px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">
                Type of Legal Matter <span style="color: #9ca3af;">(optional)</span>
              </label>
              <input
                type="text"
                name="caseType"
                value="${escapeHtml(extractedData.caseType || "")}"
                placeholder="e.g., Family Law, Custody, etc."
                style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;"
              />
            </div>

            <div>
              <label style="display: block; font-size: 11px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">
                How soon do you need assistance? <span style="color: #9ca3af;">(optional)</span>
              </label>
              <select
                name="urgency"
                style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #d1d5db; border-radius: 6px; background: white; box-sizing: border-box;"
              >
                <option value="">Select urgency</option>
                <option value="IMMEDIATE" ${extractedData.urgency === "IMMEDIATE" ? "selected" : ""}>Immediate</option>
                <option value="THIS_WEEK" ${extractedData.urgency === "THIS_WEEK" ? "selected" : ""}>This Week</option>
                <option value="THIS_MONTH" ${extractedData.urgency === "THIS_MONTH" ? "selected" : ""}>This Month</option>
                <option value="EXPLORING" ${extractedData.urgency === "EXPLORING" ? "selected" : ""}>Just Exploring</option>
              </select>
            </div>

            <div id="widget-lead-form-error" style="display: none; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px; font-size: 12px; color: #991b1b;"></div>

            <div style="display: flex; gap: 8px; margin-top: 4px;">
              <button
                type="submit"
                id="widget-lead-submit-btn"
                style="flex: 1; padding: 10px 16px; background: ${primaryColor}; color: white; font-size: 13px; font-weight: 500; border: none; border-radius: 6px; cursor: pointer;"
              >
                Submit
              </button>
              <button
                type="button"
                id="widget-lead-cancel-btn"
                style="padding: 10px 16px; background: #e5e7eb; color: #374151; font-size: 13px; font-weight: 500; border: none; border-radius: 6px; cursor: pointer;"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      `;

      messagesContainer.appendChild(formDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      const form = document.getElementById("widget-lead-form-element");
      const cancelBtn = document.getElementById("widget-lead-cancel-btn");

      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          this.submitLeadForm(form);
        };
      }

      if (cancelBtn) {
        cancelBtn.onclick = () => {
          formDiv.remove();
          this.renderMessage(
            "assistant",
            "No problem! Let me know if you'd like to connect with an attorney later.",
          );
        };
      }
    }

    /**
     * Submit lead form data
     */
    async submitLeadForm(form) {
      const formData = new FormData(form);
      const submitBtn = document.getElementById("widget-lead-submit-btn");
      const errorDiv = document.getElementById("widget-lead-form-error");
      const formDiv = document.getElementById("widget-lead-form");

      const name = formData.get("name")?.toString().trim();
      const email = formData.get("email")?.toString().trim();

      if (!name || !email) {
        if (errorDiv) {
          errorDiv.textContent = "Please fill in all required fields.";
          errorDiv.style.display = "block";
        }
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (errorDiv) {
          errorDiv.textContent = "Please enter a valid email address.";
          errorDiv.style.display = "block";
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }

      const leadData = {
        name,
        email,
        phone: formData.get("phone")?.toString().trim() || undefined,
        caseType: formData.get("caseType")?.toString().trim() || undefined,
        urgency: formData.get("urgency")?.toString() || undefined,
      };

      try {
        const response = await fetch(
          `${this.config.apiUrl}/api/public/chat/${this.config.chatbotId}/lead`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              ...leadData,
              sessionId: this.sessionId,
              source: "widget",
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to submit lead");
        }

        if (formDiv) {
          formDiv.remove();
        }

        this.renderMessage(
          "assistant",
          "Thank you! Your information has been submitted. An attorney will reach out to you soon.",
        );

        this.messages.push({
          role: "assistant",
          content:
            "Thank you! Your information has been submitted. An attorney will reach out to you soon.",
        });
        this.saveSession();
      } catch (error) {
        console.error("[Widget] Lead submission error:", error);
        if (errorDiv) {
          errorDiv.textContent =
            "Failed to submit your information. Please try again.";
          errorDiv.style.display = "block";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit";
        }
      }
    }
  }

  // Global API
  window.LeadBotStudio = {
    init: function (config) {
      if (!config.chatbotId) {
        console.error("chatbotId is required");
        return;
      }

      new LeadBotStudioWidget(config);
    },
  };

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    /* Animations */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .widget-thinking {
      animation: pulse 1.5s ease-in-out infinite;
    }

    /* Smooth transitions */
    #lbs-chat-content {
      transition: opacity 0.2s ease-in-out;
    }

    /* Suggested question hover effects */
    .suggested-question-btn:hover {
      background: #f9fafb;
      border-color: #3B82F6;
      transform: translateX(4px);
    }

    /* Scrollbar styling */
    #lbs-chat-messages::-webkit-scrollbar {
      width: 6px;
    }

    #lbs-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }

    #lbs-chat-messages::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    #lbs-chat-messages::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    /* Markdown styles */
    .widget-bubble p {
      margin: 0 0 0.75rem 0;
    }
    .widget-bubble p:last-child {
      margin-bottom: 0;
    }
    .widget-bubble strong {
      font-weight: 700;
    }
    .widget-bubble em {
      font-style: italic;
    }
    .widget-inline-code {
      font-family: ui-monospace, 'Courier New', monospace;
      font-size: 0.875em;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      background-color: rgba(0, 0, 0, 0.05);
    }
    .widget-code-block {
      margin: 0.75rem 0;
      padding: 0.75rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      font-family: ui-monospace, 'Courier New', monospace;
      font-size: 0.8125rem;
      line-height: 1.4;
    }
    .widget-link {
      color: #3B82F6;
      text-decoration: underline;
    }
  `;
  document.head.appendChild(style);
})();
