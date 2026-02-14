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

  // Default appearance settings
  const DEFAULT_APPEARANCE = {
    primaryColor: "#001F54",
    accentColor: "#3B82F6",
    animationEnabled: true,
    animationCycles: 6,
  };

  // Audio visualization constants for voice recording
  const AUDIO_VISUALIZATION = {
    // Frequency detection threshold in decibels
    FREQUENCY_THRESHOLD_DB: -100,
    // Scale factor for frequency calculation (derived from SiriWave algorithm)
    FREQUENCY_SCALE_FACTOR: 11.7185,
    // Divisor for normalizing frequency to sample rate
    FREQUENCY_DIVISOR: 24000,
    // Multiplier to control wave animation speed
    FREQUENCY_SPEED_MULTIPLIER: 0.5,
    // Scale factor for amplitude (maps audio range to wave range)
    AMPLITUDE_SCALE: 10,
  };

  // Action bar animation constants
  const ACTION_BAR_ANIMATION = {
    // Number of ripple cycles to play
    RIPPLE_CYCLES: 3,
    // Delay before starting animation (ms)
    INITIAL_DELAY: 1000,
    // Delay between each icon bounce (ms)
    STAGGER_DELAY: 150,
    // Pause between ripple cycles (ms)
    CYCLE_PAUSE: 500,
    // Animation duration for each bounce (ms)
    BOUNCE_DURATION: 500,
  };

  // Flag to track if animation styles have been injected
  let animationStylesInjected = false;

  /**
   * Inject CSS keyframes for pulse-bounce animation
   */
  function injectAnimationStyles() {
    if (animationStylesInjected) return;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes lbs-icon-bounce {
        0% { transform: translateY(0) scale(1); }
        20% { transform: translateY(-12px) scale(1.15); }
        40% { transform: translateY(-12px) scale(1.1); }
        60% { transform: translateY(0) scale(1.12); }
        80% { transform: translateY(-4px) scale(1.05); }
        100% { transform: translateY(0) scale(1); }
      }

      .lbs-icon-bouncing {
        animation: lbs-icon-bounce 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
      }
    `;
    document.head.appendChild(style);
    animationStylesInjected = true;
  }

  /**
   * Play ripple bounce animation on action bar items using CSS animations
   * @param {HTMLElement[]} items - Array of action bar item elements
   * @param {Object} config - Appearance config with animation settings
   */
  function playActionBarRippleAnimation(items, config) {
    // Check if animation is enabled in config
    const animationEnabled = config?.animationEnabled ?? DEFAULT_APPEARANCE.animationEnabled;
    if (!animationEnabled) {
      console.log("[Widget] Animation disabled in settings");
      return;
    }

    if (!items || items.length === 0) return;

    // Inject animation styles
    injectAnimationStyles();

    // Get the icon elements (SVGs) from each item
    const icons = items.map(item => item.querySelector("svg")).filter(Boolean);
    if (icons.length === 0) return;

    // Get number of cycles from config (default to 6)
    const totalCycles = config?.animationCycles ?? DEFAULT_APPEARANCE.animationCycles;
    let currentCycle = 0;

    console.log("[Widget] Starting animation with", totalCycles, "cycles");

    function playRippleCycle() {
      if (currentCycle >= totalCycles) return;

      // Animate each icon in sequence with stagger
      icons.forEach((icon, index) => {
        const delay = index * ACTION_BAR_ANIMATION.STAGGER_DELAY;

        setTimeout(() => {
          // Remove class first to allow re-animation
          icon.classList.remove("lbs-icon-bouncing");

          // Force reflow to restart animation
          void icon.offsetWidth;

          // Add bounce class
          icon.classList.add("lbs-icon-bouncing");

          // Remove class after animation completes
          setTimeout(() => {
            icon.classList.remove("lbs-icon-bouncing");
          }, ACTION_BAR_ANIMATION.BOUNCE_DURATION);
        }, delay);
      });

      // Schedule next cycle
      currentCycle++;
      if (currentCycle < totalCycles) {
        const cycleDuration = (icons.length * ACTION_BAR_ANIMATION.STAGGER_DELAY) + ACTION_BAR_ANIMATION.BOUNCE_DURATION;
        setTimeout(playRippleCycle, cycleDuration + ACTION_BAR_ANIMATION.CYCLE_PAUSE);
      }
    }

    // Start the animation after initial delay
    setTimeout(playRippleCycle, ACTION_BAR_ANIMATION.INITIAL_DELAY);
  }

  /**
   * Play bounce animation on single chat button
   * @param {HTMLElement} button - The chat button element
   * @param {Object} config - Appearance config with animation settings
   */
  function playSingleButtonAnimation(button, config) {
    // Check if animation is enabled in config
    const animationEnabled = config?.animationEnabled ?? DEFAULT_APPEARANCE.animationEnabled;
    if (!animationEnabled) {
      console.log("[Widget] Single button animation disabled in settings");
      return;
    }

    if (!button) return;

    // Inject animation styles
    injectAnimationStyles();

    // Get number of cycles from config (default to 6)
    const totalCycles = config?.animationCycles ?? DEFAULT_APPEARANCE.animationCycles;
    let currentCycle = 0;

    console.log("[Widget] Starting single button animation with", totalCycles, "cycles");

    function playBounceCycle() {
      if (currentCycle >= totalCycles) return;

      // Remove class first to allow re-animation
      button.classList.remove("lbs-icon-bouncing");

      // Force reflow to restart animation
      void button.offsetWidth;

      // Add bounce class
      button.classList.add("lbs-icon-bouncing");

      // Remove class after animation completes
      setTimeout(() => {
        button.classList.remove("lbs-icon-bouncing");
      }, ACTION_BAR_ANIMATION.BOUNCE_DURATION);

      // Schedule next cycle
      currentCycle++;
      if (currentCycle < totalCycles) {
        setTimeout(playBounceCycle, ACTION_BAR_ANIMATION.BOUNCE_DURATION + ACTION_BAR_ANIMATION.CYCLE_PAUSE);
      }
    }

    // Start the animation after initial delay
    setTimeout(playBounceCycle, ACTION_BAR_ANIMATION.INITIAL_DELAY);
  }

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
   * Show toast notification (shadcn-style)
   * @param {string} message - Toast message
   * @param {('error'|'success'|'warning'|'info')} variant - Toast variant
   * @param {number} duration - Duration in ms (default 5000)
   */
  function showToast(message, variant = "error", duration = 5000) {
    let container = document.getElementById("lbs-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "lbs-toast-container";
      container.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 24px;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `lbs-toast lbs-toast-${variant}`;

    const iconSvg = getToastIcon(variant);
    toast.innerHTML = `
      <div class="lbs-toast-icon">${iconSvg}</div>
      <div class="lbs-toast-content">
        <p class="lbs-toast-message">${escapeHtml(message)}</p>
      </div>
      <button class="lbs-toast-close" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const closeBtn = toast.querySelector(".lbs-toast-close");
    closeBtn.onclick = () => dismissToast(toast);

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("lbs-toast-visible");
    });

    if (duration > 0) {
      setTimeout(() => dismissToast(toast), duration);
    }

    return toast;
  }

  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove("lbs-toast-visible");
    toast.classList.add("lbs-toast-hiding");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }

  function getToastIcon(variant) {
    switch (variant) {
      case "error":
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`;
      case "success":
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`;
      case "warning":
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`;
      default:
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
    }
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
      this.currentView = "profile"; // 'profile', 'chat', 'booking', or 'text'
      this.activeBarItem = null; // Active action bar item: 'book', 'text', or 'chat'
      this.chatbot = null;
      this.isLoading = false;
      this.appearance = DEFAULT_APPEARANCE;

      // Booking wizard state
      this.bookingConfig = null;
      this.bookingStep = 1; // 1=category, 2=subcategory, 3=description, 4=contact, 5=location, 6=datetime, 7=confirm
      this.bookingData = {
        categoryId: null,
        categoryName: null,
        subCategoryId: null,
        subCategoryName: null,
        caseDescription: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        locationId: null,
        locationName: null,
        locationAddress: null,
        appointmentDate: null,
        appointmentTime: null,
      };

      // Text request state
      this.textConfig = null;
      this.textData = {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      };

      // File upload state
      this.pendingFiles = [];
      this.dragCounter = 0;
      this.fileError = null;

      // Voice recording state
      this.isRecording = false;
      this.deepgramSocket = null;
      this.mediaRecorder = null;
      this.mediaStream = null;
      this.finalTranscript = "";
      this.interimTranscript = "";
      this.audioContext = null;
      this.siriWave = null;

      // Conversation history state
      this.isSidebarOpen = false;

      // Load or create conversation manager
      this.initializeConversations();

      this.init();
    }

    /**
     * Initialize conversation system with migration from old format
     */
    initializeConversations() {
      const key = `lbs_widget_${this.config.chatbotId}`;
      const oldKey = `lbs_chat_${this.config.chatbotId}`;

      try {
        // Try new format first
        const stored = localStorage.getItem(key);

        if (stored) {
          const data = JSON.parse(stored);

          // Validate structure
          if (
            data.deviceId &&
            data.conversations &&
            data.currentConversationId
          ) {
            this.deviceId = data.deviceId;
            this.conversations = data.conversations;
            this.currentConversationId = data.currentConversationId;

            // Remove expired conversations
            this.cleanupExpiredConversations();

            // Load current conversation
            const currentConv = this.getCurrentConversation();
            if (currentConv) {
              this.sessionId = currentConv.sessionId;
              this.messages = currentConv.messages || [];
              this.isNewSession = false;
              return;
            }
          }
        }

        // Try migration from old format
        const oldStored = localStorage.getItem(oldKey);
        if (oldStored) {
          const oldSession = JSON.parse(oldStored);

          if (oldSession.sessionId && Date.now() < oldSession.expiresAt) {
            // Migrate to new format
            const sessionId = oldSession.sessionId;
            const title = this.generateTitleFromMessages(
              oldSession.messages || [],
            );

            this.deviceId = this.generateId();
            this.conversations = {
              [sessionId]: {
                sessionId,
                title,
                createdAt: oldSession.createdAt || Date.now(),
                lastMessageAt: Date.now(),
                expiresAt: oldSession.expiresAt,
                messages: oldSession.messages || [],
              },
            };
            this.currentConversationId = sessionId;

            // Save migrated data
            this.saveConversations();

            // Remove old key
            localStorage.removeItem(oldKey);

            // Load migrated conversation
            this.sessionId = sessionId;
            this.messages = oldSession.messages || [];
            this.isNewSession = false;
            return;
          } else {
            // Remove expired old session
            localStorage.removeItem(oldKey);
          }
        }

        // Create new conversation
        this.createNewConversation();
      } catch (e) {
        console.error("Error initializing conversations:", e);
        localStorage.removeItem(key);
        localStorage.removeItem(oldKey);
        this.createNewConversation();
      }
    }

    /**
     * Get current conversation object
     */
    getCurrentConversation() {
      if (!this.currentConversationId || !this.conversations) {
        return null;
      }

      const conv = this.conversations[this.currentConversationId];
      if (!conv) {
        return null;
      }

      // Check expiry
      if (Date.now() >= conv.expiresAt) {
        this.deleteConversation(this.currentConversationId);
        return null;
      }

      return conv;
    }

    /**
     * Create new conversation
     */
    createNewConversation() {
      const sessionId = this.generateId();

      if (!this.deviceId) {
        this.deviceId = this.generateId();
      }

      if (!this.conversations) {
        this.conversations = {};
      }

      this.conversations[sessionId] = {
        sessionId,
        title: "New Chat",
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY_MS,
        messages: [],
      };

      this.currentConversationId = sessionId;
      this.sessionId = sessionId;
      this.messages = [];
      this.isNewSession = true;

      this.saveConversations();
    }

    /**
     * Switch to a different conversation
     */
    switchConversation(conversationId) {
      const conv = this.conversations[conversationId];
      if (!conv) {
        console.error("Conversation not found:", conversationId);
        return;
      }

      // Check expiry
      if (Date.now() >= conv.expiresAt) {
        this.deleteConversation(conversationId);
        return;
      }

      this.currentConversationId = conversationId;
      this.sessionId = conv.sessionId;
      this.messages = conv.messages || [];
      this.isNewSession = false;

      this.saveConversations();

      // Update UI
      this.currentView = "chat";
      this.renderCurrentView();

      // Close sidebar after switching
      if (this.isSidebarOpen) {
        this.toggleSidebar();
      }
    }

    /**
     * Delete a conversation
     */
    /**
     * Show confirmation modal for deleting a conversation
     */
    showDeleteConfirmationModal(conversationId) {
      // Get the widget container
      const chatWindow = document.getElementById("lbs-chat-window");
      if (!chatWindow) return;

      // Create modal overlay
      const overlay = document.createElement("div");
      overlay.id = "lbs-delete-modal-overlay";
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-out;
        border-radius: 16px;
      `;

      // Create modal dialog
      const modal = document.createElement("div");
      modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        animation: slideIn 0.2s ease-out;
      `;

      modal.innerHTML = `
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">
            Delete conversation?
          </h3>
          <p style="font-size: 14px; color: #6b7280; margin: 0; line-height: 1.5;">
            This action cannot be undone. This will permanently delete the conversation and all its messages.
          </p>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="lbs-delete-cancel" style="
            padding: 8px 16px;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s;
          ">
            Cancel
          </button>
          <button id="lbs-delete-confirm" style="
            padding: 8px 16px;
            background: #ef4444;
            border: 1px solid #ef4444;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
          ">
            Delete
          </button>
        </div>
      `;

      overlay.appendChild(modal);
      chatWindow.appendChild(overlay);

      // Close modal function
      const closeModal = () => {
        overlay.style.animation = "fadeOut 0.2s ease-out";
        setTimeout(() => overlay.remove(), 200);
      };

      // Cancel button
      const cancelBtn = modal.querySelector("#lbs-delete-cancel");
      cancelBtn.onclick = closeModal;
      cancelBtn.onmouseover = () => {
        cancelBtn.style.background = "#f9fafb";
      };
      cancelBtn.onmouseout = () => {
        cancelBtn.style.background = "white";
      };

      // Confirm button
      const confirmBtn = modal.querySelector("#lbs-delete-confirm");
      confirmBtn.onclick = () => {
        this.deleteConversation(conversationId);
        this.renderSidebar();
        closeModal();
      };
      confirmBtn.onmouseover = () => {
        confirmBtn.style.background = "#dc2626";
      };
      confirmBtn.onmouseout = () => {
        confirmBtn.style.background = "#ef4444";
      };

      // Close on overlay click
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          closeModal();
        }
      };
    }

    deleteConversation(conversationId) {
      delete this.conversations[conversationId];

      // If we deleted the current conversation, create a new one
      if (this.currentConversationId === conversationId) {
        const remainingIds = Object.keys(this.conversations);
        if (remainingIds.length > 0) {
          // Switch to most recent conversation
          const sorted = remainingIds.sort(
            (a, b) =>
              this.conversations[b].lastMessageAt -
              this.conversations[a].lastMessageAt,
          );
          this.switchConversation(sorted[0]);
        } else {
          // No conversations left, create new one
          this.createNewConversation();
          this.currentView = "profile";
          this.renderCurrentView();
        }
      }

      this.saveConversations();
    }

    /**
     * Update title of a conversation
     */
    updateConversationTitle(conversationId, title) {
      const conv = this.conversations[conversationId];
      if (conv) {
        conv.title = title;
        this.saveConversations();
      }
    }

    /**
     * Save all conversations to localStorage
     */
    saveConversations() {
      const key = `lbs_widget_${this.config.chatbotId}`;

      try {
        const data = {
          deviceId: this.deviceId,
          conversations: this.conversations,
          currentConversationId: this.currentConversationId,
        };

        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error("Error saving conversations:", e);

        // Handle quota exceeded - keep only current conversation
        if (e.name === "QuotaExceededError") {
          const data = {
            deviceId: this.deviceId,
            conversations: {
              [this.currentConversationId]:
                this.conversations[this.currentConversationId],
            },
            currentConversationId: this.currentConversationId,
          };
          localStorage.setItem(key, JSON.stringify(data));
        }
      }
    }

    /**
     * Update current conversation with new message
     */
    updateCurrentConversation() {
      const conv = this.conversations[this.currentConversationId];
      if (conv) {
        conv.messages = this.messages;
        conv.lastMessageAt = Date.now();

        // Update title if still "New Chat" and we have messages
        if (conv.title === "New Chat" && this.messages.length > 0) {
          const firstUserMessage = this.messages.find((m) => m.role === "user");
          if (firstUserMessage) {
            conv.title = this.generateTitleFromMessage(
              firstUserMessage.content,
            );
          }
        }

        this.saveConversations();
      }
    }

    /**
     * Generate title from first user message
     */
    generateTitleFromMessage(message) {
      if (!message) return "New Chat";

      // Clean up message
      const cleaned = message.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

      // Truncate to 50 chars
      if (cleaned.length <= 50) {
        return cleaned;
      }

      return cleaned.slice(0, 47) + "...";
    }

    /**
     * Generate title from message array (for migration)
     */
    generateTitleFromMessages(messages) {
      const firstUserMessage = messages.find((m) => m.role === "user");
      if (firstUserMessage) {
        return this.generateTitleFromMessage(firstUserMessage.content);
      }
      return "New Chat";
    }

    /**
     * Clean up expired conversations
     */
    cleanupExpiredConversations() {
      const now = Date.now();
      let hasChanges = false;

      for (const [id, conv] of Object.entries(this.conversations)) {
        if (now >= conv.expiresAt) {
          delete this.conversations[id];
          hasChanges = true;

          // If current conversation expired, need to switch
          if (id === this.currentConversationId) {
            const remainingIds = Object.keys(this.conversations);
            if (remainingIds.length > 0) {
              this.currentConversationId = remainingIds[0];
            } else {
              this.currentConversationId = null;
            }
          }
        }
      }

      if (hasChanges) {
        this.saveConversations();
      }
    }

    /**
     * Get sorted list of conversations
     */
    getConversationsList() {
      return Object.values(this.conversations).sort(
        (a, b) => b.lastMessageAt - a.lastMessageAt,
      );
    }

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
      this.renderSidebar();
    }

    /**
     * Render sidebar with conversation list
     */
    renderSidebar() {
      const sidebar = document.getElementById("lbs-sidebar");
      const overlay = document.getElementById("lbs-sidebar-overlay");

      if (!sidebar || !overlay) return;

      if (this.isSidebarOpen) {
        sidebar.style.left = "0";
        overlay.style.display = "block";
      } else {
        sidebar.style.left = "-320px";
        overlay.style.display = "none";
      }

      // Render sidebar content
      const conversations = this.getConversationsList();

      sidebar.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
          <!-- Sidebar Header -->
          <div style="padding: 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">Chat History</h3>
            <button id="lbs-sidebar-close" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- New Conversation Button -->
          <div style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <button id="lbs-sidebar-new-btn" style="
              width: 100%;
              padding: 10px 16px;
              background: ${this.appearance.accentColor};
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              transition: opacity 0.2s;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
              </svg>
              New Conversation
            </button>
          </div>

          <!-- Conversation List -->
          <div style="flex: 1; overflow-y: auto; padding: 8px;">
            ${
              conversations.length > 0
                ? this.renderConversationGroups(conversations)
                : `
              <div style="padding: 32px 16px; text-align: center; color: #9ca3af;">
                <p style="margin: 0; font-size: 14px;">No conversations yet</p>
              </div>
            `
            }
          </div>
        </div>
      `;

      // Attach event listeners
      const closeBtn = document.getElementById("lbs-sidebar-close");
      const newBtn = document.getElementById("lbs-sidebar-new-btn");

      if (closeBtn) {
        closeBtn.onclick = () => this.toggleSidebar();
      }

      if (newBtn) {
        newBtn.onclick = () => {
          this.startNewConversation();
        };
        newBtn.onmouseover = () => {
          newBtn.style.opacity = "0.9";
        };
        newBtn.onmouseout = () => {
          newBtn.style.opacity = "1";
        };
      }

      // Attach conversation item listeners
      const convItems = sidebar.querySelectorAll("[data-conversation-id]");
      convItems.forEach((item) => {
        const convId = item.getAttribute("data-conversation-id");
        if (convId) {
          item.onclick = () => this.switchConversation(convId);
          item.onmouseover = () => {
            if (convId !== this.currentConversationId) {
              item.style.background = "#f9fafb";
            }
          };
          item.onmouseout = () => {
            if (convId !== this.currentConversationId) {
              item.style.background = "white";
            }
          };
        }
      });

      // Attach delete button listeners
      const deleteButtons = sidebar.querySelectorAll(
        "[data-delete-conversation]",
      );
      deleteButtons.forEach((btn) => {
        const convId = btn.getAttribute("data-delete-conversation");
        if (convId) {
          btn.onclick = (e) => {
            e.stopPropagation();
            this.showDeleteConfirmationModal(convId);
          };
        }
      });
    }

    /**
     * Render conversation groups (Today, Yesterday, etc.)
     */
    renderConversationGroups(conversations) {
      const now = Date.now();
      const groups = {
        Today: [],
        Yesterday: [],
        "Last 7 days": [],
        Older: [],
      };

      // Group conversations by time
      for (const conv of conversations) {
        const age = now - conv.lastMessageAt;
        const days = age / (24 * 60 * 60 * 1000);

        if (days < 1) {
          groups.Today.push(conv);
        } else if (days < 2) {
          groups.Yesterday.push(conv);
        } else if (days < 7) {
          groups["Last 7 days"].push(conv);
        } else {
          groups.Older.push(conv);
        }
      }

      // Render groups
      let html = "";

      for (const [groupName, groupConvs] of Object.entries(groups)) {
        if (groupConvs.length > 0) {
          html += `
            <div style="margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 8px; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase;">
                ${groupName}
              </h4>
              ${groupConvs.map((conv) => this.renderConversationItem(conv)).join("")}
            </div>
          `;
        }
      }

      return html;
    }

    /**
     * Render single conversation item
     */
    renderConversationItem(conv) {
      const isCurrent = conv.sessionId === this.currentConversationId;

      return `
        <div
          data-conversation-id="${conv.sessionId}"
          style="
            padding: 12px;
            margin-bottom: 4px;
            background: ${isCurrent ? "#f0f9ff" : "white"};
            border: 1px solid ${isCurrent ? this.appearance.accentColor : "#e5e7eb"};
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: flex-start;
            gap: 8px;
          "
        >
          <div style="flex-shrink: 0; margin-top: 2px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isCurrent ? this.appearance.accentColor : "#9ca3af"}" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="
                font-size: 14px;
                font-weight: ${isCurrent ? "600" : "500"};
                color: ${isCurrent ? this.appearance.accentColor : "#374151"};
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              ">
                ${escapeHtml(conv.title)}
              </span>
              ${
                isCurrent
                  ? `<span style="padding: 2px 8px; background: ${this.appearance.accentColor}; color: white; font-size: 11px; font-weight: 500; border-radius: 12px; flex-shrink: 0;">Current</span>`
                  : `<button
                      data-delete-conversation="${conv.sessionId}"
                      title="Delete conversation"
                      style="
                        flex-shrink: 0;
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #9ca3af;
                        padding: 2px;
                        display: flex;
                        align-items: center;
                        opacity: 0.7;
                        transition: opacity 0.2s, color 0.2s;
                      "
                      onmouseover="this.style.opacity='1'; this.style.color='#ef4444';"
                      onmouseout="this.style.opacity='0.7'; this.style.color='#9ca3af';"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>`
              }
            </div>
          </div>
        </div>
      `;
    }

    /**
     * Format relative time (e.g., "2h ago", "Yesterday")
     */
    formatRelativeTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) {
        return "Just now";
      } else if (minutes < 60) {
        return `${minutes}m ago`;
      } else if (hours < 24) {
        return `${hours}h ago`;
      } else if (days === 1) {
        return "Yesterday";
      } else if (days < 7) {
        return `${days}d ago`;
      } else {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      }
    }

    /**
     * Start a new conversation (replaces old startNewConversation)
     */
    startNewConversation() {
      // Save current conversation before creating new one
      this.updateCurrentConversation();

      // Create new conversation
      this.createNewConversation();

      // Switch to profile view
      this.currentView = "profile";
      this.renderCurrentView();

      // Close sidebar if open
      if (this.isSidebarOpen) {
        this.toggleSidebar();
      }
    }

    /**
     * Backwards compatibility: saveSession now updates current conversation
     */
    saveSession() {
      this.updateCurrentConversation();
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

      // Parse booking config
      if (this.chatbot.bookingConfig) {
        try {
          this.bookingConfig =
            typeof this.chatbot.bookingConfig === "string"
              ? JSON.parse(this.chatbot.bookingConfig)
              : this.chatbot.bookingConfig;
        } catch (e) {
          console.warn("Failed to parse booking config:", e);
          this.bookingConfig = null;
        }
      }

      // Parse text config
      if (this.chatbot.textConfig) {
        try {
          this.textConfig =
            typeof this.chatbot.textConfig === "string"
              ? JSON.parse(this.chatbot.textConfig)
              : this.chatbot.textConfig;
        } catch (e) {
          console.warn("Failed to parse text config:", e);
          this.textConfig = null;
        }
      }
    }

    /**
     * Check if booking is enabled and properly configured
     */
    isBookingEnabled() {
      return (
        this.bookingConfig &&
        this.bookingConfig.enabled === true &&
        Array.isArray(this.bookingConfig.categories) &&
        this.bookingConfig.categories.length > 0 &&
        Array.isArray(this.bookingConfig.locations) &&
        this.bookingConfig.locations.length > 0
      );
    }

    /**
     * Check if text request is enabled
     */
    isTextEnabled() {
      return this.textConfig && this.textConfig.enabled === true;
    }

    /**
     * Check if we should show the action bar (multiple actions available)
     */
    hasMultipleActions() {
      return this.isBookingEnabled() || this.isTextEnabled();
    }

    createWidget() {
      // Create container
      const container = document.createElement("div");
      container.id = "lbs-chat-widget";
      container.style.cssText = `
        position: fixed;
        ${this.config.position.includes("right") ? "right: 20px;" : "left: 20px;"}
        bottom: 0;
        z-index: ${this.config.zIndex};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      `;

      // Create action bar or single chat button based on enabled features
      if (this.hasMultipleActions()) {
        const actionBar = this.createActionBar();
        container.appendChild(actionBar);
      } else {
        const button = this.createChatButton();
        container.appendChild(button);
      }

      // Create chat window (hidden by default)
      const chatWindow = this.createChatWindow();
      container.appendChild(chatWindow);

      document.body.appendChild(container);
    }

    createActionBar() {
      const actionBar = document.createElement("div");
      actionBar.id = "lbs-action-bar";
      actionBar.style.cssText = `
        display: flex;
        background: ${this.appearance.primaryColor};
        border-radius: 12px 12px 0 0;
        overflow: visible;
        box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
      `;

      // Collect action bar items for animation
      const actionBarItems = [];

      // Book button (if booking enabled)
      if (this.isBookingEnabled()) {
        const bookBtn = this.createActionBarItem("book", "Book", `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        `);
        actionBar.appendChild(bookBtn);
        actionBarItems.push(bookBtn);
      }

      // Text button (if text enabled)
      if (this.isTextEnabled()) {
        const textBtn = this.createActionBarItem("text", "Text", `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        `);
        actionBar.appendChild(textBtn);
        actionBarItems.push(textBtn);
      }

      // Chat button (always shown)
      const chatBtn = this.createActionBarItem("chat", "Chat", `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `);
      actionBar.appendChild(chatBtn);
      actionBarItems.push(chatBtn);

      // Trigger ripple animation after the action bar is added to DOM
      console.log("[Widget] Scheduling animation for", actionBarItems.length, "items");
      const appearanceConfig = this.appearance;
      setTimeout(() => {
        console.log("[Widget] Triggering animation now with config:", appearanceConfig);
        playActionBarRippleAnimation(actionBarItems, appearanceConfig);
      }, 100);

      return actionBar;
    }

    createActionBarItem(action, label, iconSvg) {
      const item = document.createElement("button");
      item.className = "lbs-action-bar-item";
      item.dataset.action = action;
      item.innerHTML = `
        ${iconSvg}
        <span style="font-size: 12px; font-weight: 500;">${label}</span>
      `;
      item.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px 24px;
        color: white;
        background: transparent;
        border: none;
        cursor: pointer;
        gap: 4px;
        transition: background 0.2s;
      `;

      item.onmouseover = () => {
        item.style.background = "rgba(255, 255, 255, 0.1)";
      };

      item.onmouseout = () => {
        if (this.activeBarItem !== action) {
          item.style.background = "transparent";
        }
      };

      item.onclick = () => this.handleActionBarClick(action);

      return item;
    }

    handleActionBarClick(action) {
      this.activeBarItem = action;
      this.updateActionBarActiveState();

      // Set the view based on action
      if (action === "book") {
        this.currentView = "booking";
      } else if (action === "text") {
        this.currentView = "text";
      } else {
        this.currentView = "chat";
      }

      // Open the widget if not already open
      if (!this.isOpen) {
        this.isOpen = true;
        const chatWindow = document.getElementById("lbs-chat-window");
        if (chatWindow) {
          chatWindow.style.display = "flex";
        }
      }

      this.renderCurrentView();

      // Show initial greeting if opening chat view with no messages
      if (action === "chat" && this.messages.length === 0 && this.chatbot?.chatGreeting) {
        setTimeout(() => {
          this.renderMessage("assistant", this.chatbot.chatGreeting);
        }, 300);
      }
    }

    updateActionBarActiveState() {
      const items = document.querySelectorAll(".lbs-action-bar-item");
      items.forEach((item) => {
        if (item.dataset.action === this.activeBarItem) {
          item.style.background = "rgba(255, 255, 255, 0.2)";
        } else {
          item.style.background = "transparent";
        }
      });
    }

    createChatButton() {
      const button = document.createElement("button");
      button.id = "lbs-chat-button";
      // Filled chat bubble icon for fallback mode
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
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
        margin-bottom: 20px;
      `;

      button.onmouseover = () => {
        button.style.transform = "scale(1.1)";
      };

      button.onmouseout = () => {
        button.style.transform = "scale(1)";
      };

      button.onclick = () => this.toggleChat();

      // Trigger bounce animation for single chat button
      const appearanceConfig = this.appearance;
      setTimeout(() => {
        playSingleButtonAnimation(button, appearanceConfig);
      }, 100);

      return button;
    }

    createChatWindow() {
      const chatWindow = document.createElement("div");
      chatWindow.id = "lbs-chat-window";
      const isRight = this.config.position.includes("right");
      const hasMultipleActions = this.hasMultipleActions();

      // Adjust bottom position based on whether action bar is showing
      const actionBarHeight = hasMultipleActions ? 64 : 0;
      const bottomPos = hasMultipleActions ? `${actionBarHeight + 8}px` : "100px";
      const topPos = `calc(100vh - 650px - ${bottomPos})`;
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

    /**
     * Attach global event listeners for the widget.
     * View-specific listeners are attached in attachProfileEventListeners() and attachChatEventListeners().
     */
    attachEventListeners() {
      // The chat button click handler is already set in createChatButton().
      // View-specific event listeners are attached when renderCurrentView() is called
      // (which happens when toggleChat() opens the widget).
      // This method exists for the init() flow to complete without error.
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
        } else if (this.currentView === "booking") {
          content.innerHTML = this.createBookingView();
          this.attachBookingEventListeners();
        } else if (this.currentView === "text") {
          content.innerHTML = this.createTextView();
          this.attachTextEventListeners();
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

            ${
              this.isBookingEnabled()
                ? `
            <!-- Schedule Appointment Button -->
            <button id="lbs-start-booking-btn" style="
              width: 100%;
              padding: 12px 24px;
              background: ${this.appearance.primaryColor};
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
              margin-bottom: 12px;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Schedule Appointment
            </button>
            `
                : ""
            }

            ${
              this.isTextEnabled()
                ? `
            <!-- Send us a Text Button -->
            <button id="lbs-start-text-btn" style="
              width: 100%;
              padding: 12px 24px;
              background: ${this.isBookingEnabled() ? "white" : this.appearance.primaryColor};
              color: ${this.isBookingEnabled() ? this.appearance.primaryColor : "white"};
              border: ${this.isBookingEnabled() ? "1px solid " + this.appearance.primaryColor : "none"};
              border-radius: 8px;
              font-size: 15px;
              font-weight: 500;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              transition: background 0.2s;
              margin-bottom: 12px;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Send us a Text
            </button>
            `
                : ""
            }

            <!-- Chat Button -->
            <button id="lbs-start-chat-btn" style="
              width: 100%;
              padding: 12px 24px;
              background: ${this.isBookingEnabled() || this.isTextEnabled() ? "white" : this.appearance.accentColor};
              color: ${this.isBookingEnabled() || this.isTextEnabled() ? this.appearance.primaryColor : "white"};
              border: ${this.isBookingEnabled() || this.isTextEnabled() ? "1px solid " + this.appearance.primaryColor : "none"};
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
        <div style="display: flex; flex-direction: column; height: 100%; position: relative;">
          <!-- Sidebar Overlay -->
          <div id="lbs-sidebar-overlay" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000;"></div>

          <!-- Sidebar -->
          <div id="lbs-sidebar" style="
            position: absolute;
            top: 0;
            left: -320px;
            width: 320px;
            height: 100%;
            background: white;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
            transition: left 0.3s ease-in-out;
            z-index: 1001;
            display: flex;
            flex-direction: column;
          ">
            <!-- Sidebar content will be rendered here -->
          </div>

          <!-- Header -->
          <div style="background: white; padding: 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <button id="lbs-back-btn" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: flex; align-items: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button id="lbs-history-btn" title="Chat History" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: flex; align-items: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </button>
            </div>
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
            padding: 16px;
          ">
            <div id="lbs-pending-files" style="display: none;"></div>
            <div id="lbs-file-error" style="display: none;"></div>
            <!-- Unified Input Bar -->
            <div style="display: flex; gap: 12px; padding: 8px 16px; align-items: flex-end; background: white; border: 1px solid #d1d5db; border-radius: 12px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: box-shadow 0.2s;">
              <input type="file" id="lbs-file-input" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.md,.csv,.docx,.xlsx" style="display: none;" />
              <button id="lbs-file-button" title="Attach files" style="
                padding: 8px;
                background: none;
                border: none;
                border-radius: 9999px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                transition: background 0.2s;
                flex-shrink: 0;
                margin-bottom: 4px;
              ">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              <textarea
                id="lbs-chat-input"
                placeholder="Type..."
                rows="1"
                style="
                  width: 100%;
                  flex: 1;
                  padding: 8px 0;
                  border: none;
                  background: transparent;
                  font-size: 14px;
                  font-family: inherit;
                  resize: none;
                  min-height: ${TEXTAREA_MIN_HEIGHT}px;
                  max-height: ${TEXTAREA_MAX_HEIGHT}px;
                  overflow-y: auto;
                  line-height: 1.5;
                  box-sizing: border-box;
                  outline: none;
                "
              ></textarea>
              <button
                id="lbs-chat-send-mic"
                title="Send message"
                style="
                  padding: 8px;
                  background: none;
                  border: none;
                  border-radius: 9999px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #6b7280;
                  transition: all 0.2s;
                  flex-shrink: 0;
                  margin-bottom: 4px;
                "
              >
                <svg id="lbs-mic-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <svg id="lbs-send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
              <button id="lbs-menu-button" title="More options" style="
                padding: 8px;
                background: none;
                border: none;
                border-radius: 9999px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                transition: background 0.2s;
                flex-shrink: 0;
                margin-bottom: 4px;
              ">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
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
      const fullscreenMinimizeBtn = document.getElementById(
        "lbs-fullscreen-minimize-btn",
      );
      const startChatBtn = document.getElementById("lbs-start-chat-btn");
      const startBookingBtn = document.getElementById("lbs-start-booking-btn");
      const startTextBtn = document.getElementById("lbs-start-text-btn");
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

      // Booking button handler
      if (startBookingBtn) {
        startBookingBtn.onclick = () => {
          // Reset booking data
          this.bookingStep = 1;
          this.bookingData = {
            categoryId: null,
            categoryName: null,
            subCategoryId: null,
            subCategoryName: null,
            caseDescription: "",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            locationId: null,
            locationName: null,
            locationAddress: null,
            appointmentDate: null,
            appointmentTime: null,
          };
          this.currentView = "booking";
          this.renderCurrentView();
        };
        startBookingBtn.onmouseover = () => {
          startBookingBtn.style.background = this.lightenColor(
            this.appearance.primaryColor,
            10,
          );
        };
        startBookingBtn.onmouseout = () => {
          startBookingBtn.style.background = this.appearance.primaryColor;
        };
      }

      // Text request button handler
      if (startTextBtn) {
        startTextBtn.onclick = () => {
          // Reset text data
          this.textData = {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            message: "",
          };
          this.currentView = "text";
          this.renderCurrentView();
        };
        const bookingEnabled = this.isBookingEnabled();
        startTextBtn.onmouseover = () => {
          if (bookingEnabled) {
            startTextBtn.style.background = "#f9fafb";
          } else {
            startTextBtn.style.background = this.lightenColor(
              this.appearance.primaryColor,
              10,
            );
          }
        };
        startTextBtn.onmouseout = () => {
          if (bookingEnabled) {
            startTextBtn.style.background = "white";
          } else {
            startTextBtn.style.background = this.appearance.primaryColor;
          }
        };
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
        // Adjust hover based on whether booking or text is enabled (different button style)
        const hasOtherButtons = this.isBookingEnabled() || this.isTextEnabled();
        startChatBtn.onmouseover = () => {
          if (hasOtherButtons) {
            startChatBtn.style.background = "#f9fafb";
          } else {
            startChatBtn.style.background = this.lightenColor(
              this.appearance.accentColor,
              10,
            );
          }
        };
        startChatBtn.onmouseout = () => {
          if (hasOtherButtons) {
            startChatBtn.style.background = "white";
          } else {
            startChatBtn.style.background = this.appearance.accentColor;
          }
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

    /**
     * Create the booking wizard view
     */
    createBookingView() {
      const stepTitles = {
        1: "What can we help you with?",
        2: "Select a specific service",
        3: "Tell us about your case",
        4: "Your contact information",
        5: "Select a location",
        6: "Choose date and time",
        7: "Confirm your appointment",
      };

      const currentTitle = stepTitles[this.bookingStep] || "Schedule Appointment";
      const totalSteps = this.bookingConfig?.requireCaseDescription !== false ? 7 : 6;

      // Build step content based on current step
      let stepContent = "";

      if (this.bookingStep === 1) {
        // Category selection
        stepContent = this.bookingConfig.categories
          .map(
            (cat) => `
          <button class="booking-category-btn" data-category-id="${escapeHtml(cat.id)}" data-category-name="${escapeHtml(cat.name)}" data-has-subcategories="${(cat.subCategories && cat.subCategories.length > 0) ? "true" : "false"}" style="
            width: 100%;
            padding: 16px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 15px;
            color: #374151;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <span>${escapeHtml(cat.name)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #9ca3af;">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        `,
          )
          .join("");
      } else if (this.bookingStep === 2) {
        // Subcategory selection
        const category = this.bookingConfig.categories.find(
          (c) => c.id === this.bookingData.categoryId,
        );
        const subCategories = category?.subCategories || [];
        stepContent = subCategories
          .map(
            (sub) => `
          <button class="booking-subcategory-btn" data-subcategory-id="${escapeHtml(sub.id)}" data-subcategory-name="${escapeHtml(sub.name)}" style="
            width: 100%;
            padding: 16px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 15px;
            color: #374151;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <span>${escapeHtml(sub.name)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #9ca3af;">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        `,
          )
          .join("");
      } else if (this.bookingStep === 3) {
        // Case description
        stepContent = `
          <div style="space-y: 4;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
              Please describe your situation (optional)
            </label>
            <textarea id="booking-case-description" rows="4" placeholder="Briefly describe what brings you in today..." style="
              width: 100%;
              padding: 12px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              resize: none;
              box-sizing: border-box;
            ">${escapeHtml(this.bookingData.caseDescription)}</textarea>
          </div>
        `;
      } else if (this.bookingStep === 4) {
        // Contact information
        stepContent = `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; gap: 12px;">
              <div style="flex: 1;">
                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">First Name *</label>
                <input type="text" id="booking-first-name" value="${escapeHtml(this.bookingData.firstName)}" placeholder="John" style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                  font-size: 14px;
                  box-sizing: border-box;
                " />
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">Last Name *</label>
                <input type="text" id="booking-last-name" value="${escapeHtml(this.bookingData.lastName)}" placeholder="Doe" style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                  font-size: 14px;
                  box-sizing: border-box;
                " />
              </div>
            </div>
            <div>
              <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">Email *</label>
              <input type="email" id="booking-email" value="${escapeHtml(this.bookingData.email)}" placeholder="john@example.com" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                box-sizing: border-box;
              " />
            </div>
            <div>
              <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">Phone *</label>
              <input type="tel" id="booking-phone" value="${escapeHtml(this.bookingData.phone)}" placeholder="(555) 123-4567" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                box-sizing: border-box;
              " />
            </div>
          </div>
        `;
      } else if (this.bookingStep === 5) {
        // Location selection
        stepContent = this.bookingConfig.locations
          .map(
            (loc) => `
          <button class="booking-location-btn" data-location-id="${escapeHtml(loc.id)}" data-location-name="${escapeHtml(loc.name)}" data-location-address="${escapeHtml(loc.address)}" style="
            width: 100%;
            padding: 16px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <div style="font-size: 15px; font-weight: 500; color: #374151;">${escapeHtml(loc.name)}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${escapeHtml(loc.address)}</div>
          </button>
        `,
          )
          .join("");
      } else if (this.bookingStep === 6) {
        // Date and time selection
        const location = this.bookingConfig.locations.find(
          (l) => l.id === this.bookingData.locationId,
        );
        const availableDays = location?.availableDays || [];
        const timeSlots = location?.timeSlots || [];

        // Generate next 14 days that match available days
        const dates = [];
        const today = new Date();
        for (let i = 1; i <= 30 && dates.length < 14; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
          if (availableDays.includes(dayName)) {
            dates.push(date);
          }
        }

        stepContent = `
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Select Date *</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${dates
                .map((d) => {
                  const dateStr = d.toISOString().split("T")[0];
                  const isSelected = this.bookingData.appointmentDate === dateStr;
                  return `
                    <button class="booking-date-btn" data-date="${dateStr}" style="
                      padding: 10px 14px;
                      background: ${isSelected ? this.appearance.primaryColor : "white"};
                      color: ${isSelected ? "white" : "#374151"};
                      border: 1px solid ${isSelected ? this.appearance.primaryColor : "#e5e7eb"};
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 13px;
                      transition: all 0.2s;
                    ">
                      <div style="font-weight: 500;">${d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                      <div>${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    </button>
                  `;
                })
                .join("")}
            </div>
          </div>
          ${
            this.bookingData.appointmentDate
              ? `
          <div>
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">Select Time *</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${timeSlots
                .map((slot) => {
                  const isSelected = this.bookingData.appointmentTime === slot.start;
                  return `
                    <button class="booking-time-btn" data-time="${escapeHtml(slot.start)}" style="
                      padding: 10px 16px;
                      background: ${isSelected ? this.appearance.primaryColor : "white"};
                      color: ${isSelected ? "white" : "#374151"};
                      border: 1px solid ${isSelected ? this.appearance.primaryColor : "#e5e7eb"};
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 14px;
                      transition: all 0.2s;
                    ">
                      ${escapeHtml(slot.start)}
                    </button>
                  `;
                })
                .join("")}
            </div>
          </div>
          `
              : ""
          }
        `;
      } else if (this.bookingStep === 7) {
        // Confirmation
        const appointmentDate = this.bookingData.appointmentDate
          ? new Date(this.bookingData.appointmentDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";

        stepContent = `
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
            <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Appointment Details</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 14px;">Service:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${escapeHtml(this.bookingData.categoryName)}${this.bookingData.subCategoryName ? " - " + escapeHtml(this.bookingData.subCategoryName) : ""}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 14px;">Location:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${escapeHtml(this.bookingData.locationName)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 14px;">Date:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${appointmentDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 14px;">Time:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${escapeHtml(this.bookingData.appointmentTime)}</span>
              </div>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 4px;">
                <span style="color: #6b7280; font-size: 14px;">Contact:</span>
                <div style="color: #111827; font-size: 14px; margin-top: 4px;">
                  ${escapeHtml(this.bookingData.firstName)} ${escapeHtml(this.bookingData.lastName)}<br/>
                  ${escapeHtml(this.bookingData.email)}<br/>
                  ${escapeHtml(this.bookingData.phone)}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Progress indicator
      const progressDots = Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === this.bookingStep;
        const isCompleted = stepNum < this.bookingStep;
        return `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${isActive || isCompleted ? this.appearance.primaryColor : "#e5e7eb"};"></div>`;
      }).join("");

      return `
        <div style="display: flex; flex-direction: column; height: 100%; background: white;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <button id="booking-back-btn" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span style="font-weight: 600; color: #111827; font-size: 15px;">Schedule Appointment</span>
            <button id="booking-close-btn" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Progress -->
          <div style="display: flex; justify-content: center; gap: 6px; padding: 12px;">
            ${progressDots}
          </div>

          <!-- Step Title -->
          <div style="padding: 0 24px 16px;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">${currentTitle}</h3>
          </div>

          <!-- Step Content -->
          <div id="booking-step-content" style="flex: 1; overflow-y: auto; padding: 0 24px 24px;">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${stepContent}
            </div>
          </div>

          <!-- Footer with Next button (for steps that need it) -->
          ${
            [3, 4, 6, 7].includes(this.bookingStep)
              ? `
          <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb;">
            <button id="booking-next-btn" style="
              width: 100%;
              padding: 14px 24px;
              background: ${this.appearance.primaryColor};
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            ">
              ${this.bookingStep === 7 ? "Confirm Booking" : "Continue"}
            </button>
            <div id="booking-error" style="display: none; color: #dc2626; font-size: 13px; text-align: center; margin-top: 8px;"></div>
          </div>
          `
              : ""
          }
        </div>
      `;
    }

    /**
     * Attach event listeners for booking wizard
     */
    attachBookingEventListeners() {
      const backBtn = document.getElementById("booking-back-btn");
      const closeBtn = document.getElementById("booking-close-btn");
      const nextBtn = document.getElementById("booking-next-btn");

      if (backBtn) {
        backBtn.onclick = () => {
          if (this.bookingStep === 1) {
            this.currentView = "profile";
            this.renderCurrentView();
          } else {
            // Go back one step (skip subcategory if no subcategories)
            if (this.bookingStep === 3 && !this.bookingData.subCategoryId) {
              const category = this.bookingConfig.categories.find(
                (c) => c.id === this.bookingData.categoryId,
              );
              if (!category?.subCategories?.length) {
                this.bookingStep = 1;
              } else {
                this.bookingStep = 2;
              }
            } else if (this.bookingStep === 4 && this.bookingConfig?.requireCaseDescription === false) {
              // Skip description step on back if disabled
              const category = this.bookingConfig.categories.find(
                (c) => c.id === this.bookingData.categoryId,
              );
              if (!category?.subCategories?.length) {
                this.bookingStep = 1;
              } else {
                this.bookingStep = 2;
              }
            } else {
              this.bookingStep--;
            }
            this.renderCurrentView();
          }
        };
      }

      if (closeBtn) {
        closeBtn.onclick = () => {
          this.currentView = "profile";
          this.renderCurrentView();
        };
      }

      // Category buttons
      document.querySelectorAll(".booking-category-btn").forEach((btn) => {
        btn.onclick = () => {
          this.bookingData.categoryId = btn.getAttribute("data-category-id");
          this.bookingData.categoryName = btn.getAttribute("data-category-name");
          const hasSubcategories = btn.getAttribute("data-has-subcategories") === "true";

          if (hasSubcategories) {
            this.bookingStep = 2;
          } else {
            // Skip subcategory step
            this.bookingData.subCategoryId = null;
            this.bookingData.subCategoryName = null;
            this.bookingStep = this.bookingConfig?.requireCaseDescription !== false ? 3 : 4;
          }
          this.renderCurrentView();
        };
        btn.onmouseover = () => {
          btn.style.borderColor = this.appearance.primaryColor;
          btn.style.background = "#f9fafb";
        };
        btn.onmouseout = () => {
          btn.style.borderColor = "#e5e7eb";
          btn.style.background = "white";
        };
      });

      // Subcategory buttons
      document.querySelectorAll(".booking-subcategory-btn").forEach((btn) => {
        btn.onclick = () => {
          this.bookingData.subCategoryId = btn.getAttribute("data-subcategory-id");
          this.bookingData.subCategoryName = btn.getAttribute("data-subcategory-name");
          this.bookingStep = this.bookingConfig?.requireCaseDescription !== false ? 3 : 4;
          this.renderCurrentView();
        };
        btn.onmouseover = () => {
          btn.style.borderColor = this.appearance.primaryColor;
          btn.style.background = "#f9fafb";
        };
        btn.onmouseout = () => {
          btn.style.borderColor = "#e5e7eb";
          btn.style.background = "white";
        };
      });

      // Location buttons
      document.querySelectorAll(".booking-location-btn").forEach((btn) => {
        btn.onclick = () => {
          this.bookingData.locationId = btn.getAttribute("data-location-id");
          this.bookingData.locationName = btn.getAttribute("data-location-name");
          this.bookingData.locationAddress = btn.getAttribute("data-location-address");
          this.bookingStep = 6;
          this.renderCurrentView();
        };
        btn.onmouseover = () => {
          btn.style.borderColor = this.appearance.primaryColor;
          btn.style.background = "#f9fafb";
        };
        btn.onmouseout = () => {
          btn.style.borderColor = "#e5e7eb";
          btn.style.background = "white";
        };
      });

      // Date buttons
      document.querySelectorAll(".booking-date-btn").forEach((btn) => {
        btn.onclick = () => {
          this.bookingData.appointmentDate = btn.getAttribute("data-date");
          this.bookingData.appointmentTime = null; // Reset time when date changes
          this.renderCurrentView();
        };
      });

      // Time buttons
      document.querySelectorAll(".booking-time-btn").forEach((btn) => {
        btn.onclick = () => {
          this.bookingData.appointmentTime = btn.getAttribute("data-time");
          this.renderCurrentView();
        };
      });

      // Next button handling
      if (nextBtn) {
        nextBtn.onclick = async () => {
          const errorDiv = document.getElementById("booking-error");
          if (errorDiv) errorDiv.style.display = "none";

          if (this.bookingStep === 3) {
            // Case description - optional, just proceed
            const textarea = document.getElementById("booking-case-description");
            if (textarea) {
              this.bookingData.caseDescription = textarea.value;
            }
            this.bookingStep = 4;
            this.renderCurrentView();
          } else if (this.bookingStep === 4) {
            // Contact info validation
            const firstName = document.getElementById("booking-first-name")?.value?.trim();
            const lastName = document.getElementById("booking-last-name")?.value?.trim();
            const email = document.getElementById("booking-email")?.value?.trim();
            const phone = document.getElementById("booking-phone")?.value?.trim();

            if (!firstName || !lastName || !email || !phone) {
              if (errorDiv) {
                errorDiv.textContent = "Please fill in all required fields.";
                errorDiv.style.display = "block";
              }
              return;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              if (errorDiv) {
                errorDiv.textContent = "Please enter a valid email address.";
                errorDiv.style.display = "block";
              }
              return;
            }

            this.bookingData.firstName = firstName;
            this.bookingData.lastName = lastName;
            this.bookingData.email = email;
            this.bookingData.phone = phone;
            this.bookingStep = 5;
            this.renderCurrentView();
          } else if (this.bookingStep === 6) {
            // Date/time validation
            if (!this.bookingData.appointmentDate || !this.bookingData.appointmentTime) {
              if (errorDiv) {
                errorDiv.textContent = "Please select both date and time.";
                errorDiv.style.display = "block";
              }
              return;
            }
            this.bookingStep = 7;
            this.renderCurrentView();
          } else if (this.bookingStep === 7) {
            // Submit booking
            await this.submitBooking();
          }
        };

        nextBtn.onmouseover = () => {
          nextBtn.style.background = this.lightenColor(this.appearance.primaryColor, 10);
        };
        nextBtn.onmouseout = () => {
          nextBtn.style.background = this.appearance.primaryColor;
        };
      }
    }

    /**
     * Submit the booking to the API
     */
    async submitBooking() {
      const nextBtn = document.getElementById("booking-next-btn");
      const errorDiv = document.getElementById("booking-error");

      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.textContent = "Submitting...";
      }

      try {
        const response = await fetch(
          `${this.config.apiUrl}/api/public/chatbots/${this.config.chatbotId}/bookings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              sessionId: this.sessionId || this.generateId(),
              categoryId: this.bookingData.categoryId,
              categoryName: this.bookingData.categoryName,
              subCategoryId: this.bookingData.subCategoryId,
              subCategoryName: this.bookingData.subCategoryName,
              caseDescription: this.bookingData.caseDescription,
              firstName: this.bookingData.firstName,
              lastName: this.bookingData.lastName,
              email: this.bookingData.email,
              phone: this.bookingData.phone,
              locationId: this.bookingData.locationId,
              locationName: this.bookingData.locationName,
              locationAddress: this.bookingData.locationAddress,
              appointmentDate: this.bookingData.appointmentDate,
              appointmentTime: this.bookingData.appointmentTime,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to submit booking");
        }

        // Show success view
        this.showBookingSuccess();
      } catch (error) {
        console.error("Booking submission error:", error);
        if (errorDiv) {
          errorDiv.textContent = "Failed to submit booking. Please try again.";
          errorDiv.style.display = "block";
        }
        if (nextBtn) {
          nextBtn.disabled = false;
          nextBtn.textContent = "Confirm Booking";
        }
      }
    }

    /**
     * Show booking success screen
     */
    showBookingSuccess() {
      const content = document.getElementById("lbs-chat-content");
      if (!content) return;

      const appointmentDate = this.bookingData.appointmentDate
        ? new Date(this.bookingData.appointmentDate + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "";

      content.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; background: white; align-items: center; justify-content: center; padding: 24px; text-align: center;">
          <div style="width: 80px; height: 80px; background: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #111827;">Appointment Booked!</h2>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #6b7280; line-height: 1.5;">
            Your appointment has been scheduled. You'll receive a confirmation email shortly.
          </p>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; width: 100%; max-width: 300px; text-align: left;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
              <strong style="color: #111827;">${appointmentDate}</strong> at <strong style="color: #111827;">${escapeHtml(this.bookingData.appointmentTime)}</strong>
            </div>
            <div style="font-size: 14px; color: #6b7280;">
              ${escapeHtml(this.bookingData.locationName)}
            </div>
          </div>
          <button id="booking-done-btn" style="
            margin-top: 24px;
            padding: 12px 32px;
            background: ${this.appearance.primaryColor};
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
          ">
            Done
          </button>
        </div>
      `;

      const doneBtn = document.getElementById("booking-done-btn");
      if (doneBtn) {
        doneBtn.onclick = () => {
          this.currentView = "profile";
          this.renderCurrentView();
        };
      }
    }

    /**
     * Create the text request view
     */
    createTextView() {
      const fields = this.textConfig?.fields || {};
      const consentText = this.textConfig?.consentText || "By submitting this form, you consent to receive text messages from us. Message and data rates may apply.";

      // Determine which fields to show and their required status
      const firstNameRequired = fields.firstName?.required !== false;
      const lastNameRequired = fields.lastName?.required !== false;
      const phoneRequired = fields.phone?.required !== false;
      const emailEnabled = fields.email?.enabled !== false;
      const emailRequired = fields.email?.required === true;
      const messageRequired = fields.message?.required !== false;

      return `
        <div style="display: flex; flex-direction: column; height: 100%; background: white;">
          <!-- Header -->
          <div style="padding: 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <button id="text-back-btn" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span style="font-weight: 600; color: #111827; font-size: 15px;">Send us a Text</span>
            <button id="text-close-btn" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Form Content -->
          <div style="flex: 1; overflow-y: auto; padding: 24px;">
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <!-- First Name and Last Name -->
              <div style="display: flex; gap: 12px;">
                <div style="flex: 1;">
                  <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">First Name${firstNameRequired ? " *" : ""}</label>
                  <input type="text" id="text-first-name" value="${escapeHtml(this.textData.firstName)}" placeholder="John" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 14px;
                    box-sizing: border-box;
                  " />
                </div>
                <div style="flex: 1;">
                  <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">Last Name${lastNameRequired ? " *" : ""}</label>
                  <input type="text" id="text-last-name" value="${escapeHtml(this.textData.lastName)}" placeholder="Doe" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 14px;
                    box-sizing: border-box;
                  " />
                </div>
              </div>

              <!-- Phone -->
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">Phone Number${phoneRequired ? " *" : ""}</label>
                <input type="tel" id="text-phone" value="${escapeHtml(this.textData.phone)}" placeholder="(555) 123-4567" style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                  font-size: 14px;
                  box-sizing: border-box;
                " />
              </div>

              ${emailEnabled ? `
              <!-- Email -->
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">Email${emailRequired ? " *" : ""}</label>
                <input type="email" id="text-email" value="${escapeHtml(this.textData.email)}" placeholder="john@example.com" style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                  font-size: 14px;
                  box-sizing: border-box;
                " />
              </div>
              ` : ""}

              <!-- Message -->
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">Message${messageRequired ? " *" : ""}</label>
                <textarea id="text-message" rows="4" placeholder="How can we help you?" style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                  font-size: 14px;
                  resize: none;
                  box-sizing: border-box;
                ">${escapeHtml(this.textData.message)}</textarea>
              </div>

              <!-- Consent Text -->
              <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin: 0;">
                ${escapeHtml(consentText)}
              </p>

              <!-- Error Message -->
              <div id="text-error" style="display: none; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 14px;"></div>
            </div>
          </div>

          <!-- Submit Button -->
          <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
            <button id="text-submit-btn" style="
              width: 100%;
              padding: 12px 24px;
              background: ${this.appearance.primaryColor};
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            ">
              Send Message
            </button>
          </div>
        </div>
      `;
    }

    /**
     * Attach event listeners for text request form
     */
    attachTextEventListeners() {
      const backBtn = document.getElementById("text-back-btn");
      const closeBtn = document.getElementById("text-close-btn");
      const submitBtn = document.getElementById("text-submit-btn");

      if (backBtn) {
        backBtn.onclick = () => {
          this.currentView = "profile";
          this.renderCurrentView();
        };
      }

      if (closeBtn) {
        closeBtn.onclick = () => {
          this.currentView = "profile";
          this.renderCurrentView();
        };
      }

      if (submitBtn) {
        submitBtn.onclick = async () => {
          await this.submitTextRequest();
        };

        submitBtn.onmouseover = () => {
          submitBtn.style.background = this.lightenColor(this.appearance.primaryColor, 10);
        };
        submitBtn.onmouseout = () => {
          submitBtn.style.background = this.appearance.primaryColor;
        };
      }
    }

    /**
     * Submit the text request to the API
     */
    async submitTextRequest() {
      const submitBtn = document.getElementById("text-submit-btn");
      const errorDiv = document.getElementById("text-error");

      // Get form values
      const firstName = document.getElementById("text-first-name")?.value?.trim();
      const lastName = document.getElementById("text-last-name")?.value?.trim();
      const phone = document.getElementById("text-phone")?.value?.trim();
      const emailInput = document.getElementById("text-email");
      const email = emailInput?.value?.trim() || "";
      const message = document.getElementById("text-message")?.value?.trim();

      // Get field requirements from config
      const fields = this.textConfig?.fields || {};
      const firstNameRequired = fields.firstName?.required !== false;
      const lastNameRequired = fields.lastName?.required !== false;
      const phoneRequired = fields.phone?.required !== false;
      const emailEnabled = fields.email?.enabled !== false;
      const emailRequired = fields.email?.required === true;
      const messageRequired = fields.message?.required !== false;

      // Validation
      const errors = [];

      if (firstNameRequired && !firstName) {
        errors.push("First name is required");
      }
      if (lastNameRequired && !lastName) {
        errors.push("Last name is required");
      }
      if (phoneRequired && !phone) {
        errors.push("Phone number is required");
      }
      if (emailEnabled && emailRequired && !email) {
        errors.push("Email is required");
      }
      if (emailEnabled && email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push("Please enter a valid email address");
        }
      }
      if (messageRequired && !message) {
        errors.push("Message is required");
      }

      if (errors.length > 0) {
        if (errorDiv) {
          errorDiv.textContent = errors[0];
          errorDiv.style.display = "block";
        }
        return;
      }

      // Update textData
      this.textData = { firstName, lastName, email, phone, message };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      try {
        const response = await fetch(
          `${this.config.apiUrl}/api/public/chatbots/${this.config.chatbotId}/text-requests`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              sessionId: this.sessionId || this.generateId(),
              firstName,
              lastName,
              email: email || undefined,
              phone,
              message,
            }),
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to submit text request");
        }

        // Show success view
        this.showTextSuccess();
      } catch (error) {
        console.error("Text request submission error:", error);
        if (errorDiv) {
          errorDiv.textContent = error.message || "Failed to send message. Please try again.";
          errorDiv.style.display = "block";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send Message";
        }
      }
    }

    /**
     * Show text request success screen
     */
    showTextSuccess() {
      const content = document.getElementById("lbs-chat-content");
      if (!content) return;

      content.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; background: white; align-items: center; justify-content: center; padding: 24px; text-align: center;">
          <div style="width: 80px; height: 80px; background: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #111827;">Message Sent!</h2>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #6b7280; line-height: 1.5;">
            Thank you for reaching out. We'll get back to you as soon as possible.
          </p>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; width: 100%; max-width: 300px; text-align: left;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
              <strong style="color: #111827;">${escapeHtml(this.textData.firstName)} ${escapeHtml(this.textData.lastName)}</strong>
            </div>
            <div style="font-size: 14px; color: #6b7280;">
              ${escapeHtml(this.textData.phone)}
            </div>
          </div>
          <button id="text-done-btn" style="
            margin-top: 24px;
            padding: 12px 32px;
            background: ${this.appearance.primaryColor};
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
          ">
            Done
          </button>
        </div>
      `;

      const doneBtn = document.getElementById("text-done-btn");
      if (doneBtn) {
        doneBtn.onclick = () => {
          this.currentView = "profile";
          this.renderCurrentView();
        };
      }
    }

    attachChatEventListeners() {
      const backBtn = document.getElementById("lbs-back-btn");
      const historyBtn = document.getElementById("lbs-history-btn");
      const expandBtn = document.getElementById("lbs-expand-btn");
      const fullscreenMinimizeBtn = document.getElementById(
        "lbs-fullscreen-minimize-btn",
      );
      const newBtn = document.getElementById("lbs-chat-new");
      const sendMicButton = document.getElementById("lbs-chat-send-mic");
      const input = document.getElementById("lbs-chat-input");
      const fileButton = document.getElementById("lbs-file-button");
      const fileInput = document.getElementById("lbs-file-input");
      const chatWindow = document.getElementById("lbs-chat-window");
      const menuButton = document.getElementById("lbs-menu-button");
      const sidebarOverlay = document.getElementById(
        "lbs-sidebar-overlay",
      );

      if (backBtn) {
        backBtn.onclick = () => {
          this.currentView = "profile";
          this.renderCurrentView();
        };
      }

      if (historyBtn) {
        historyBtn.onclick = () => this.toggleSidebar();
      }

      if (sidebarOverlay) {
        sidebarOverlay.onclick = () => this.toggleSidebar();
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

      if (sendMicButton) {
        sendMicButton.onclick = () => {
          const input = document.getElementById("lbs-chat-input");
          const hasContent =
            input && (input.value.trim() || this.pendingFiles.length > 0);

          if (this.isRecording) {
            this.stopVoiceRecording();
          } else if (!hasContent) {
            this.startVoiceRecording();
          } else {
            this.sendMessage();
          }
        };
      }

      if (input) {
        input.oninput = () => {
          this.autoResizeTextarea();
          this.updateSendMicIcon();
        };

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

      // Send/Mic button hover
      if (sendMicButton) {
        sendMicButton.onmouseover = () => {
          const hasContent = input.value.trim() || this.pendingFiles.length > 0;
          if (hasContent) {
            // When in send mode, darken the accent color slightly on hover
            sendMicButton.style.opacity = "0.9";
          } else {
            // When in mic mode, show light gray background
            sendMicButton.style.background = "#f3f4f6";
          }
        };
        sendMicButton.onmouseout = () => {
          const hasContent = input.value.trim() || this.pendingFiles.length > 0;
          if (hasContent) {
            // Reset opacity when in send mode
            sendMicButton.style.opacity = "1";
          } else {
            // Reset background when in mic mode
            sendMicButton.style.background = "none";
          }
        };
      }

      // Menu button click
      if (menuButton) {
        menuButton.onclick = () => this.showActionCenter();
      }

      // Menu button hover
      if (menuButton) {
        menuButton.onmouseover = () => {
          menuButton.style.background = "#f3f4f6";
        };
        menuButton.onmouseout = () => {
          menuButton.style.background = "none";
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
      const hasMultipleActions = this.hasMultipleActions();

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

        // Calculate bottom position from viewport (adjusted for action bar)
        const actionBarHeight = hasMultipleActions ? 64 : 0;
        const bottomPos = hasMultipleActions ? `${actionBarHeight + 8}px` : "100px";

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
      const minimizeIcon = document.getElementById(
        "lbs-fullscreen-minimize-btn",
      );

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
          // Render user messages with file attachments using existing method
          if (
            msg.role === "user" &&
            msg.attachments &&
            msg.attachments.length > 0
          ) {
            this.renderUserMessageWithFiles(msg.content, msg.attachments);
          } else {
            this.renderMessage(msg.role, msg.content);
          }
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
      this.updateSendMicIcon();
    }

    removeFile(index) {
      this.pendingFiles.splice(index, 1);
      this.clearFileError();
      this.renderPendingFiles();
      this.updateSendMicIcon();
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
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
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

    updateSendMicIcon() {
      const input = document.getElementById("lbs-chat-input");
      const micIcon = document.getElementById("lbs-mic-icon");
      const sendIcon = document.getElementById("lbs-send-icon");
      const sendMicButton = document.getElementById("lbs-chat-send-mic");

      if (!input || !micIcon || !sendIcon || !sendMicButton) return;

      const hasContent = input.value.trim() || this.pendingFiles.length > 0;

      if (hasContent) {
        // Show send icon with filled background
        micIcon.style.display = "none";
        sendIcon.style.display = "block";
        sendMicButton.style.background = this.appearance.accentColor;
        sendMicButton.style.color = "white";
      } else {
        // Show mic icon without background
        micIcon.style.display = "block";
        sendIcon.style.display = "none";
        sendMicButton.style.background = "none";
        sendMicButton.style.color = "#6b7280";
      }
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

      // For assistant messages, create a wrapper container for hover effects
      if (role === "assistant") {
        const messageWrapper = document.createElement("div");
        messageWrapper.className = "widget-message-wrapper";
        messageWrapper.style.cssText = `
          position: relative;
          max-width: 80%;
        `;

        const bubble = document.createElement("div");
        bubble.className = `widget-bubble widget-bubble-${role}`;
        bubble.style.cssText = `
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.6;
          background: white;
          color: #1f2937;
          border: 1px solid #e5e7eb;
        `;
        bubble.innerHTML = parseMarkdown(content);

        // Create copy button
        const copyButton = document.createElement("button");
        copyButton.className = "widget-copy-button";
        copyButton.setAttribute("aria-label", "Copy message");
        copyButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        `;
        copyButton.onclick = () => {
          // Copy the text content (strip HTML)
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = bubble.innerHTML;
          const textContent = tempDiv.textContent || tempDiv.innerText || "";

          navigator.clipboard
            .writeText(textContent)
            .then(() => {
              // Show success feedback
              const originalHTML = copyButton.innerHTML;
              copyButton.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            `;
              setTimeout(() => {
                copyButton.innerHTML = originalHTML;
              }, 2000);
            })
            .catch((err) => {
              console.error("Failed to copy text:", err);
            });
        };

        messageWrapper.appendChild(bubble);
        messageWrapper.appendChild(copyButton);
        messageDiv.appendChild(messageWrapper);
      } else {
        // User messages - keep original structure
        const bubble = document.createElement("div");
        bubble.className = `widget-bubble widget-bubble-${role}`;
        bubble.style.cssText = `
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.6;
          background: ${this.appearance.accentColor};
          color: white;
          white-space: pre-wrap;
          word-wrap: break-word;
        `;
        bubble.textContent = content;
        messageDiv.appendChild(bubble);
      }

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
      this.updateSendMicIcon();

      // Render user message with attachments
      if (filesToSend.length > 0) {
        this.renderUserMessageWithFiles(message, filesToSend);
      } else {
        this.renderMessage("user", message);
      }

      // Add to messages array with file metadata (name, type, size)
      const historyContent =
        message ||
        (filesToSend.length > 0
          ? `[Attached: ${filesToSend.map((f) => f.name).join(", ")}]`
          : "");

      const messageObj = {
        role: "user",
        content: historyContent,
      };

      // Store file metadata for display on reload (not base64 to save space)
      if (filesToSend.length > 0) {
        messageObj.attachments = filesToSend.map((f) => ({
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
        }));
      }

      this.messages.push(messageObj);
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
        white-space: pre-wrap;
        word-wrap: break-word;
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

      // Message text (skip if it's the auto-generated "[Attached: ...]" pattern)
      if (content && !content.startsWith("[Attached:")) {
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
                      this.showLeadForm(event.toolCall.parameters, event.toolCall.isContactCapture);
                    } else if (event.toolCall?.name === "show_booking_trigger") {
                      receivedToolCall = event.toolCall;
                      if (event.toolCall.calendlyLink) {
                        // Open Calendly link
                        console.log("[Widget] Opening Calendly:", event.toolCall.calendlyLink);
                        window.open(event.toolCall.calendlyLink, "_blank");
                      } else if (event.toolCall.isContactCapture) {
                        // Fallback to contact capture form (3 fields only)
                        if (streamingBubble?.parentElement) {
                          streamingBubble.parentElement.remove();
                          streamingBubble = null;
                        }
                        this.showLeadForm(event.toolCall.parameters, true);
                      }
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
     * @param {object} parameters - Form parameters with extractedData
     * @param {boolean} isContactCapture - If true, show only 3 fields (name, email, phone)
     */
    showLeadForm(parameters, isContactCapture = false) {
      const messagesContainer = document.getElementById(
        "lbs-chat-messages",
      );
      if (!messagesContainer) return;

      if (document.getElementById("widget-lead-form")) return;

      // Store contact capture mode for form submission source tracking
      this.isContactCaptureMode = isContactCapture;

      const extractedData = parameters.extractedData || {};
      const primaryColor = this.appearance.primaryColor;

      // Header text based on form type
      const headerTitle = isContactCapture ? "Schedule a Call" : "Connect with an Attorney";
      const headerDesc = isContactCapture
        ? "Please provide your contact information and we'll reach out to schedule a time."
        : "Please provide your contact information and we'll connect you with an experienced attorney.";

      // Additional fields only shown for full lead form
      const additionalFields = isContactCapture ? "" : `
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
            </div>`;

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
              ${headerTitle}
            </h3>
            <p style="font-size: 12px; color: #4b5563; margin: 0;">
              ${headerDesc}
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
                Phone <span style="color: #ef4444;">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value="${escapeHtml(extractedData.phone || "")}"
                placeholder="(555) 123-4567"
                required
                style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;"
              />
            </div>
${additionalFields}
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

      // Create conversation snapshot with messages exchanged before form submission
      const conversationSnapshot =
        Array.isArray(this.messages) && this.messages.length > 0
          ? {
              messages: this.messages
                .filter((msg) => msg && msg.role && msg.content)
                .map((msg) => ({
                  role: msg.role.toUpperCase(),
                  content: msg.content,
                  createdAt: msg.createdAt || new Date().toISOString(),
                  localId: msg.localId,
                })),
              capturedAt: new Date().toISOString(),
              sessionId: this.sessionId,
            }
          : null;

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
              source: this.isContactCaptureMode ? "BOOKING_FALLBACK" : "LEAD_FORM",
              ...(conversationSnapshot && { conversationSnapshot }),
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

    /**
     * Show action center modal
     */
    showActionCenter() {
      // Remove existing modal if present
      const existing = document.getElementById("widget-action-center");
      if (existing) {
        const overlay = document.getElementById("widget-action-center-overlay");
        if (overlay) overlay.remove();
        return;
      }

      // Get the chat window to append modal inside it
      const chatWindow = document.getElementById("lbs-chat-window");
      if (!chatWindow) return;

      // Create overlay positioned within chat window
      const overlay = document.createElement("div");
      overlay.id = "widget-action-center-overlay";
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
      `;

      const modal = document.createElement("div");
      modal.id = "widget-action-center";
      modal.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 340px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      `;

      modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0;">Action Center</h2>
          <button id="widget-action-center-close" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <h3 style="font-size: 14px; font-weight: 500; color: #6b7280; margin: 0 0 12px 0;">Actions</h3>

        <button id="widget-feedback-btn" style="
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          margin-bottom: 12px;
          transition: all 0.2s;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: #9ca3af;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </div>
            <span style="font-size: 16px; color: #374151; font-weight: 500;">Give feedback</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      `;

      overlay.appendChild(modal);
      chatWindow.appendChild(overlay);

      // Event listeners
      const closeBtn = document.getElementById("widget-action-center-close");
      const feedbackBtn = document.getElementById("widget-feedback-btn");

      if (closeBtn) {
        closeBtn.onclick = () => overlay.remove();
      }

      if (feedbackBtn) {
        feedbackBtn.onclick = () => {
          overlay.remove();
          this.showFeedbackForm();
        };
        feedbackBtn.onmouseover = () => {
          feedbackBtn.style.background = "#f9fafb";
          feedbackBtn.style.borderColor = this.appearance.accentColor;
        };
        feedbackBtn.onmouseout = () => {
          feedbackBtn.style.background = "white";
          feedbackBtn.style.borderColor = "#e5e7eb";
        };
      }

      // Close on overlay click
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      };
    }

    /**
     * Show feedback form modal
     */
    showFeedbackForm() {
      // Remove existing if present
      const existing = document.getElementById("widget-feedback-form-overlay");
      if (existing) {
        existing.remove();
        return;
      }

      // Get the chat window to append modal inside it
      const chatWindow = document.getElementById("lbs-chat-window");
      if (!chatWindow) return;

      // Create overlay positioned within chat window
      const overlay = document.createElement("div");
      overlay.id = "widget-feedback-form-overlay";
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
      `;

      const modal = document.createElement("div");
      modal.id = "widget-feedback-form";
      modal.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 340px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      `;

      modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0;">User Feedback</h2>
          <button id="widget-feedback-close" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
          If you're experiencing any problems or have suggestions for improvement,
          please share your thoughts with us. The more specific information you provide,
          the better we can help.
        </p>

        <form id="widget-feedback-form-element">
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">
              Subject
            </label>
            <input
              type="text"
              id="feedback-subject"
              name="subject"
              required
              style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
            />
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">
              Content
            </label>
            <textarea
              id="feedback-content"
              name="content"
              required
              maxlength="1000"
              rows="6"
              style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; resize: vertical; box-sizing: border-box;"
            ></textarea>
            <div style="text-align: right; margin-top: 4px; font-size: 12px; color: #6b7280;">
              <span id="feedback-char-count">0</span>/1000
            </div>
          </div>

          <div id="feedback-error" style="display: none; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #991b1b; font-size: 14px;"></div>

          <div style="display: flex; justify-content: flex-end;">
            <button
              type="submit"
              id="feedback-submit-btn"
              style="
                padding: 10px 24px;
                background: ${this.appearance.accentColor};
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: opacity 0.2s;
              "
            >
              Confirm
            </button>
          </div>
        </form>
      `;

      overlay.appendChild(modal);
      chatWindow.appendChild(overlay);

      // Character counter
      const contentTextarea = document.getElementById("feedback-content");
      const charCount = document.getElementById("feedback-char-count");

      if (contentTextarea && charCount) {
        contentTextarea.oninput = () => {
          charCount.textContent = contentTextarea.value.length;
        };
      }

      // Form submission
      const form = document.getElementById("widget-feedback-form-element");
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          this.submitFeedback(form);
        };
      }

      // Close button
      const closeBtn = document.getElementById("widget-feedback-close");
      if (closeBtn) {
        closeBtn.onclick = () => overlay.remove();
      }

      // Close on overlay click
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      };
    }

    /**
     * Submit feedback form
     */
    async submitFeedback(form) {
      const formData = new FormData(form);
      const submitBtn = document.getElementById("feedback-submit-btn");
      const errorDiv = document.getElementById("feedback-error");

      const subject = formData.get("subject")?.toString().trim();
      const content = formData.get("content")?.toString().trim();

      if (!subject || !content) {
        if (errorDiv) {
          errorDiv.textContent = "Please fill in all fields.";
          errorDiv.style.display = "block";
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }

      try {
        const response = await fetch(
          `${this.config.apiUrl}/api/public/chat/${this.config.chatbotId}/feedback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              sessionId: this.sessionId,
              subject,
              content,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to submit feedback");
        }

        // Remove overlay
        const overlay = document.getElementById("widget-feedback-form-overlay");
        if (overlay) {
          overlay.remove();
        }

        // Show success message
        this.renderMessage(
          "assistant",
          "Thank you for your feedback! We appreciate you taking the time to help us improve.",
        );
      } catch (error) {
        console.error("[Widget] Feedback submission error:", error);
        if (errorDiv) {
          errorDiv.textContent = "Failed to submit feedback. Please try again.";
          errorDiv.style.display = "block";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Confirm";
        }
      }
    }

    /**
     * Start voice recording with Deepgram
     */
    async startVoiceRecording() {
      try {
        const input = document.getElementById("lbs-chat-input");
        if (input) {
          this.finalTranscript = input.value;
        }

        // Fetch Deepgram token using apiUrl (captured at widget initialization)
        const tokenResponse = await fetch(
          `${this.config.apiUrl}/api/public/deepgram/token`,
        );
        if (!tokenResponse.ok) {
          throw new Error("Failed to get voice service token");
        }

        const { token } = await tokenResponse.json();

        // Request microphone access
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Show voice modal
        this.showVoiceModal();

        // Connect to Deepgram
        await this.connectToDeepgram(token);

        // Update recording state
        this.isRecording = true;
        this.updateSendMicIcon();
      } catch (error) {
        console.error("Error starting voice recording:", error);
        this.cleanupVoiceRecording();

        if (error.name === "NotAllowedError") {
          showToast(
            "Microphone access was denied. Please allow microphone access to use voice recording.",
            "error",
          );
        } else {
          showToast(
            "Failed to start voice recording. Please try again.",
            "error",
          );
        }
      }
    }

    /**
     * Stop voice recording
     */
    stopVoiceRecording() {
      this.isRecording = false;

      // Update input with final transcript
      const input = document.getElementById("lbs-chat-input");
      if (input && this.finalTranscript) {
        input.value = this.finalTranscript;
        this.autoResizeTextarea();
      }

      this.cleanupVoiceRecording();
      this.closeVoiceModal();
      this.updateSendMicIcon();
    }

    /**
     * Connect to Deepgram WebSocket
     */
    async connectToDeepgram(token) {
      return new Promise((resolve, reject) => {
        const wsUrl = new URL("wss://api.deepgram.com/v1/listen");
        wsUrl.searchParams.append("model", "nova-2");
        wsUrl.searchParams.append("smart_format", "true");
        wsUrl.searchParams.append("interim_results", "true");
        wsUrl.searchParams.append("punctuate", "true");
        wsUrl.searchParams.append("vad_events", "true");

        this.deepgramSocket = new WebSocket(wsUrl.toString(), ["token", token]);

        this.deepgramSocket.onopen = () => {
          console.log("[Widget] Deepgram WebSocket connected");

          // Determine audio format
          let mimeType = "audio/webm;codecs=opus";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "audio/webm";
          }

          // Create MediaRecorder
          this.mediaRecorder = new MediaRecorder(this.mediaStream, {
            mimeType,
          });

          this.mediaRecorder.ondataavailable = (event) => {
            if (
              event.data.size > 0 &&
              this.deepgramSocket &&
              this.deepgramSocket.readyState === WebSocket.OPEN
            ) {
              this.deepgramSocket.send(event.data);
            }
          };

          this.mediaRecorder.start(250); // Send chunks every 250ms

          // Initialize audio visualizer
          this.initAudioVisualizer();

          resolve();
        };

        this.deepgramSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "Results") {
              const transcript =
                data.channel?.alternatives?.[0]?.transcript || "";
              const isFinal = data.is_final || false;

              if (transcript) {
                if (isFinal) {
                  // Append to final transcript
                  this.finalTranscript = this.finalTranscript
                    ? `${this.finalTranscript} ${transcript}`
                    : transcript;
                  this.interimTranscript = "";
                } else {
                  // Update interim transcript
                  this.interimTranscript = transcript;
                }

                // Update modal display
                this.updateVoiceModalTranscript();
              }
            }
          } catch (err) {
            console.error("[Widget] Error parsing Deepgram message:", err);
          }
        };

        this.deepgramSocket.onerror = (event) => {
          console.error("[Widget] Deepgram WebSocket error:", event);
          reject(new Error("WebSocket connection error"));
        };

        this.deepgramSocket.onclose = (event) => {
          if (event.code !== 1000) {
            console.error(
              "[Widget] Deepgram WebSocket closed abnormally:",
              event,
            );
          }
        };
      });
    }

    /**
     * Initialize audio visualizer with SiriWave
     */
    initAudioVisualizer() {
      const container = document.getElementById("lbs-voice-visualizer");
      if (!container || !this.mediaStream || typeof SiriWave === "undefined") {
        return;
      }

      const containerWidth = container.offsetWidth;

      // Initialize SiriWave
      this.siriWave = new SiriWave({
        container: container,
        width: containerWidth,
        height: 120,
        speed: 0.0,
        amplitude: 0.0,
        autostart: true,
        style: "ios",
        cover: true,
        curveDefinition: [
          {
            attenuation: -2,
            lineWidth: 1,
            opacity: 0.15,
            color: "rgb(200, 200, 200)",
          },
          {
            attenuation: -6,
            lineWidth: 1,
            opacity: 0.25,
            color: "rgb(170, 170, 170)",
          },
          {
            attenuation: 4,
            lineWidth: 1.5,
            opacity: 0.4,
            color: "rgb(140, 140, 140)",
          },
          {
            attenuation: 2,
            lineWidth: 1.5,
            opacity: 0.6,
            color: "rgb(110, 110, 110)",
          },
          {
            attenuation: 1,
            lineWidth: 2,
            opacity: 0.8,
            color: "rgb(80, 80, 80)",
          },
        ],
      });

      // Set up Web Audio API for real-time analysis
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(
        this.mediaStream,
      );
      const processor = this.audioContext.createScriptProcessor(1024, 1, 1);
      const analyser = this.audioContext.createAnalyser();

      analyser.fftSize = 4096;
      const myDataArray = new Float32Array(analyser.frequencyBinCount);

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(this.audioContext.destination);

      this.siriWave.start();

      processor.onaudioprocess = (e) => {
        let amplitude = 0;
        let frequency = 0;

        // Get frequency data
        analyser.getFloatFrequencyData(myDataArray);

        // Find max frequency above threshold
        myDataArray.forEach((item, index) => {
          if (item > AUDIO_VISUALIZATION.FREQUENCY_THRESHOLD_DB) {
            frequency = Math.max(index, frequency);
          }
        });

        // Scale frequency for wave speed
        frequency =
          ((1 + frequency) * AUDIO_VISUALIZATION.FREQUENCY_SCALE_FACTOR) /
          AUDIO_VISUALIZATION.FREQUENCY_DIVISOR;
        frequency = frequency * AUDIO_VISUALIZATION.FREQUENCY_SPEED_MULTIPLIER;
        this.siriWave.setSpeed(frequency);

        // Calculate amplitude from audio buffer
        e.inputBuffer.getChannelData(0).forEach((item) => {
          amplitude = Math.max(amplitude, Math.abs(item));
        });

        // Scale amplitude to wave range
        amplitude = Math.abs(amplitude * AUDIO_VISUALIZATION.AMPLITUDE_SCALE);

        // amplitude is always >= 0 after Math.abs()
        this.siriWave.setAmplitude(amplitude);
      };
    }

    /**
     * Show voice recording modal
     */
    showVoiceModal() {
      const chatWindow = document.getElementById("lbs-chat-window");
      if (!chatWindow) return;

      // Load SiriWave library if not already loaded
      if (typeof SiriWave === "undefined") {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/siriwave@2.4.0/dist/siriwave.umd.min.js";
        script.onload = () => {
          this._createVoiceModal();
        };
        script.onerror = () => {
          console.error("[Widget] Failed to load SiriWave library");
          this._createVoiceModal(); // Continue without visualizer
        };
        document.head.appendChild(script);
      } else {
        this._createVoiceModal();
      }
    }

    /**
     * Create voice modal DOM
     */
    _createVoiceModal() {
      const chatWindow = document.getElementById("lbs-chat-window");
      if (!chatWindow) return;

      // Create modal overlay
      const overlay = document.createElement("div");
      overlay.id = "lbs-voice-modal-overlay";
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      `;

      // Create modal
      const modal = document.createElement("div");
      modal.id = "lbs-voice-modal";
      modal.style.cssText = `
        background: white;
        border-radius: 16px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      `;

      modal.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Recording</h2>
          <button id="lbs-voice-done-btn" style="
            padding: 8px 16px;
            background: #111827;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          ">Done</button>
        </div>
        <div style="padding: 32px 24px; display: flex; flex-direction: column; align-items: center;">
          <div id="lbs-voice-visualizer" style="width: 100%; height: 120px; margin-bottom: 32px;"></div>
          <div id="lbs-voice-transcript" style="
            width: 100%;
            min-height: 100px;
            text-align: center;
            font-size: 16px;
            line-height: 1.6;
            color: #111827;
          ">
            <p style="color: #9ca3af; font-style: italic; margin: 0;">Start speaking...</p>
          </div>
        </div>
      `;

      overlay.appendChild(modal);
      chatWindow.appendChild(overlay);

      // Done button handler
      const doneBtn = document.getElementById("lbs-voice-done-btn");
      if (doneBtn) {
        doneBtn.onclick = () => this.stopVoiceRecording();
        doneBtn.onmouseover = () => {
          doneBtn.style.background = "#1f2937";
        };
        doneBtn.onmouseout = () => {
          doneBtn.style.background = "#111827";
        };
      }

      // Close on overlay click
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          this.stopVoiceRecording();
        }
      };

      // ESC key handler
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          this.stopVoiceRecording();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
    }

    /**
     * Update voice modal transcript display
     */
    updateVoiceModalTranscript() {
      const transcriptDiv = document.getElementById(
        "lbs-voice-transcript",
      );
      if (!transcriptDiv) return;

      const displayText = this.interimTranscript
        ? this.finalTranscript
          ? `${this.finalTranscript} ${this.interimTranscript}`
          : this.interimTranscript
        : this.finalTranscript;

      if (displayText) {
        // Limit display to last 500 characters
        const displayContent =
          displayText.length > 500
            ? "..." + displayText.slice(-500)
            : displayText;

        transcriptDiv.innerHTML = `<p style="margin: 0;">${displayContent}</p>`;
      } else {
        transcriptDiv.innerHTML =
          '<p style="color: #9ca3af; font-style: italic; margin: 0;">Start speaking...</p>';
      }
    }

    /**
     * Close voice recording modal
     */
    closeVoiceModal() {
      const overlay = document.getElementById("lbs-voice-modal-overlay");
      if (overlay) {
        overlay.remove();
      }
    }

    /**
     * Cleanup voice recording resources
     */
    cleanupVoiceRecording() {
      // Stop media recorder
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;

      // Close WebSocket
      if (this.deepgramSocket) {
        if (this.deepgramSocket.readyState === WebSocket.OPEN) {
          this.deepgramSocket.send(JSON.stringify({ type: "CloseStream" }));
        }
        this.deepgramSocket.close();
        this.deepgramSocket = null;
      }

      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }

      // Cleanup audio visualizer
      if (this.siriWave) {
        this.siriWave.setAmplitude(0);
        this.siriWave.setSpeed(0);
        this.siriWave.dispose();
        this.siriWave = null;
      }

      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      // Reset transcript state
      this.interimTranscript = "";
      // Keep finalTranscript as it's already set in input
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

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
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
      margin: 0 0 0.5rem 0;
    }
    .widget-bubble p:last-child {
      margin-bottom: 0;
    }
    /* Reduce gap between paragraph and following list */
    .widget-bubble p + .widget-list,
    .widget-bubble p + .widget-list-ordered {
      margin-top: 0.25rem;
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
    .widget-list,
    .widget-list-ordered {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }
    .widget-list-item,
    .widget-list-item-ordered {
      margin: 0.125rem 0;
      line-height: 1.5;
    }
    .widget-list-item > p,
    .widget-list-item-ordered > p {
      margin: 0;
    }

    /* Message hover effects and copy button */
    .widget-message-wrapper {
      position: relative;
    }

    .widget-copy-button {
      position: absolute;
      bottom: -8px;
      left: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: white;
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 0;
      outline: none;
    }

    .widget-copy-button:hover {
      background: #f9fafb;
      border-color: #3B82F6;
    }

    .widget-copy-button:active {
      transform: translateY(4px) scale(0.95);
    }

    .widget-message-wrapper:hover .widget-copy-button {
      opacity: 1;
      transform: translateY(0);
    }

    .widget-copy-button svg {
      color: #6b7280;
      transition: color 0.2s ease;
    }

    .widget-copy-button:hover svg {
      color: #3B82F6;
    }

    /* Toast notifications (shadcn-style) */
    .lbs-toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
      pointer-events: auto;
      max-width: 420px;
      min-width: 300px;
      opacity: 0;
      transform: translateX(100%);
      transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .lbs-toast-visible {
      opacity: 1;
      transform: translateX(0);
    }

    .lbs-toast-hiding {
      opacity: 0;
      transform: translateX(100%);
    }

    .lbs-toast-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .lbs-toast-error .lbs-toast-icon {
      color: #ef4444;
    }

    .lbs-toast-success .lbs-toast-icon {
      color: #22c55e;
    }

    .lbs-toast-warning .lbs-toast-icon {
      color: #f59e0b;
    }

    .lbs-toast-info .lbs-toast-icon {
      color: #3b82f6;
    }

    .lbs-toast-content {
      flex: 1;
      min-width: 0;
    }

    .lbs-toast-message {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: #1f2937;
      word-wrap: break-word;
    }

    .lbs-toast-close {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      margin: -4px -4px -4px 0;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: #9ca3af;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .lbs-toast-close:hover {
      background: #f3f4f6;
      color: #4b5563;
    }

    .lbs-toast-close:active {
      background: #e5e7eb;
    }
  `;
  document.head.appendChild(style);
})();
