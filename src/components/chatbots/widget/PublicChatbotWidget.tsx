"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Check, CalendarCheck, Phone } from "lucide-react";
import WidgetHome from "./WidgetHome";
import BookingWizard from "./BookingWizard";
import TextRequestForm from "./TextRequestForm";
import { PublicChatbotInterface } from "../PublicChatbotInterface";
import type { BookingConfig } from "@/lib/validation/chatbot-booking";
import type { TextConfig } from "@/lib/validation/chatbot-text";

type WidgetView =
  | "home"
  | "chat"
  | "booking"
  | "booking-success"
  | "text"
  | "text-success";

type ActionBarItem = "book" | "text" | "chat";

type ChatbotData = {
  id: string;
  name: string;
  thumbnail?: string | null;
  welcomeMessage?: string | null;
  chatGreeting?: string | null;
  suggestedQuestions?: string[];
  bookingConfig?: BookingConfig | null;
  textConfig?: TextConfig | null;
  appearance?: {
    primaryColor?: string;
    accentColor?: string;
    animationEnabled?: boolean;
    animationCycles?: number;
  } | null;
};

type PublicChatbotWidgetProps = {
  chatbot: ChatbotData;
  isEmbedded?: boolean;
};

export default function PublicChatbotWidget({
  chatbot,
  isEmbedded = false,
}: PublicChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(!isEmbedded);
  const [view, setView] = useState<WidgetView>("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<
    string | undefined
  >();
  const [activeBarItem, setActiveBarItem] = useState<ActionBarItem | null>(
    null,
  );

  const primaryColor = chatbot.appearance?.primaryColor || "#001F54";
  const accentColor = chatbot.appearance?.accentColor || "#3B82F6";
  const animationEnabled = chatbot.appearance?.animationEnabled ?? true;
  const animationCycles = chatbot.appearance?.animationCycles ?? 6;

  // Refs for animation
  const actionBarRef = useRef<HTMLDivElement>(null);
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const animationPlayedRef = useRef(false);

  // Parse bookingConfig if it's a string
  const bookingConfig: BookingConfig | null = (() => {
    if (!chatbot.bookingConfig) return null;
    if (typeof chatbot.bookingConfig === "string") {
      try {
        return JSON.parse(chatbot.bookingConfig);
      } catch {
        return null;
      }
    }
    return chatbot.bookingConfig;
  })();

  // Parse textConfig if it's a string
  const textConfig: TextConfig | null = (() => {
    if (!chatbot.textConfig) return null;
    if (typeof chatbot.textConfig === "string") {
      try {
        return JSON.parse(chatbot.textConfig);
      } catch {
        return null;
      }
    }
    return chatbot.textConfig as TextConfig;
  })();

  // Feature detection
  const bookingEnabled =
    bookingConfig?.enabled &&
    (bookingConfig.categories?.length ?? 0) > 0 &&
    (bookingConfig.locations?.length ?? 0) > 0;

  const textEnabled = textConfig?.enabled === true;

  // Show action bar if booking OR text is enabled (i.e., more than just chat)
  const hasMultipleActions = bookingEnabled || textEnabled;

  // Animation effect for action bar icons
  useEffect(() => {
    if (!isEmbedded || !hasMultipleActions || !animationEnabled) return;
    if (animationPlayedRef.current) return;

    const STAGGER_DELAY = 150;
    const CYCLE_PAUSE = 500;
    const BOUNCE_DURATION = 500;
    const INITIAL_DELAY = 1000;

    const timer = setTimeout(() => {
      if (!actionBarRef.current) return;
      animationPlayedRef.current = true;

      const icons = actionBarRef.current.querySelectorAll("svg");
      if (icons.length === 0) return;

      let currentCycle = 0;

      const playRippleCycle = () => {
        if (currentCycle >= animationCycles) return;

        icons.forEach((icon, index) => {
          const delay = index * STAGGER_DELAY;
          setTimeout(() => {
            icon.style.animation = "none";
            void icon.offsetWidth;
            icon.style.animation = `widget-icon-bounce ${BOUNCE_DURATION}ms cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards`;
            setTimeout(() => {
              icon.style.animation = "";
            }, BOUNCE_DURATION);
          }, delay);
        });

        currentCycle++;
        if (currentCycle < animationCycles) {
          const cycleDuration = icons.length * STAGGER_DELAY + BOUNCE_DURATION;
          setTimeout(playRippleCycle, cycleDuration + CYCLE_PAUSE);
        }
      };

      playRippleCycle();
    }, INITIAL_DELAY);

    return () => clearTimeout(timer);
  }, [isEmbedded, hasMultipleActions, animationEnabled, animationCycles]);

  // Animation effect for single chat button (when no action bar)
  useEffect(() => {
    if (!isEmbedded || hasMultipleActions || !animationEnabled || isOpen) return;
    if (animationPlayedRef.current) return;

    const CYCLE_PAUSE = 500;
    const BOUNCE_DURATION = 500;
    const INITIAL_DELAY = 1000;

    const timer = setTimeout(() => {
      if (!chatButtonRef.current) return;
      animationPlayedRef.current = true;

      const button = chatButtonRef.current;
      let currentCycle = 0;

      const playBounceCycle = () => {
        if (currentCycle >= animationCycles) return;

        button.style.animation = "none";
        void button.offsetWidth;
        button.style.animation = `widget-icon-bounce ${BOUNCE_DURATION}ms cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards`;

        setTimeout(() => {
          button.style.animation = "";
        }, BOUNCE_DURATION);

        currentCycle++;
        if (currentCycle < animationCycles) {
          setTimeout(playBounceCycle, BOUNCE_DURATION + CYCLE_PAUSE);
        }
      };

      playBounceCycle();
    }, INITIAL_DELAY);

    return () => clearTimeout(timer);
  }, [isEmbedded, hasMultipleActions, animationEnabled, animationCycles, isOpen]);

  const handleStartChat = (message?: string) => {
    setInitialChatMessage(message);
    setView("chat");
    setActiveBarItem("chat");
  };

  const handleStartBooking = () => {
    setView("booking");
    setActiveBarItem("book");
  };

  const handleBookingComplete = () => {
    setView("booking-success");
  };

  const handleStartText = () => {
    setView("text");
    setActiveBarItem("text");
  };

  const handleTextComplete = () => {
    setView("text-success");
  };

  const handleBackToHome = () => {
    setView("home");
    setInitialChatMessage(undefined);
    setActiveBarItem(null);
  };

  const handleClosePanel = () => {
    setIsOpen(false);
    setActiveBarItem(null);
    setView("home");
  };

  const handleBarClick = (action: ActionBarItem) => {
    setActiveBarItem(action);
    setIsOpen(true);
    if (action === "book") setView("booking");
    else if (action === "text") setView("text");
    else setView("chat");
  };

  // For embedded widget, render the full-screen version
  if (!isEmbedded) {
    return (
      <div className="h-screen w-full bg-white">
        {view === "home" && (
          <WidgetHome
            chatbotName={chatbot.name}
            thumbnail={chatbot.thumbnail}
            welcomeMessage={chatbot.welcomeMessage}
            chatGreeting={chatbot.chatGreeting}
            suggestedQuestions={chatbot.suggestedQuestions}
            bookingConfig={bookingConfig}
            textConfig={textConfig}
            primaryColor={primaryColor}
            accentColor={accentColor}
            onStartChat={handleStartChat}
            onStartBooking={handleStartBooking}
            onStartText={handleStartText}
            onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
            isMenuOpen={isMenuOpen}
          />
        )}

        {view === "chat" && (
          <div className="h-full relative">
            <button
              onClick={handleBackToHome}
              className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
            <PublicChatbotInterface
              chatbot={{
                id: chatbot.id,
                name: chatbot.name,
                welcomeMessage: chatbot.welcomeMessage,
              }}
            />
          </div>
        )}

        {view === "booking" && bookingConfig && (
          <BookingWizard
            chatbotId={chatbot.id}
            config={bookingConfig}
            onBack={handleBackToHome}
            onComplete={handleBookingComplete}
            primaryColor={primaryColor}
          />
        )}

        {view === "booking-success" && (
          <BookingSuccessView
            onBackToHome={handleBackToHome}
            primaryColor={primaryColor}
          />
        )}

        {view === "text" && textConfig && (
          <TextRequestForm
            chatbotId={chatbot.id}
            config={textConfig}
            onBack={handleBackToHome}
            onComplete={handleTextComplete}
            primaryColor={primaryColor}
          />
        )}

        {view === "text-success" && (
          <TextSuccessView
            onBackToHome={handleBackToHome}
            primaryColor={primaryColor}
          />
        )}
      </div>
    );
  }

  // Action bar height for positioning
  const actionBarHeight = 56;

  // For embedded/floating widget
  return (
    <>
      {/* Animation keyframes for action bar icons */}
      <style>{`
        @keyframes widget-icon-bounce {
          0% { transform: translateY(0) scale(1); }
          20% { transform: translateY(-12px) scale(1.15); }
          40% { transform: translateY(-12px) scale(1.1); }
          60% { transform: translateY(0) scale(1.12); }
          80% { transform: translateY(-4px) scale(1.05); }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Fallback: Single floating chat button (only when no other features enabled) */}
      {!hasMultipleActions && !isOpen && (
        <button
          ref={chatButtonRef}
          onClick={() => {
            setIsOpen(true);
            setView("chat");
            setActiveBarItem("chat");
          }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110 z-50"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="h-6 w-6" fill="currentColor" />
        </button>
      )}

      {/* Action Bar (shown when booking or text is enabled) */}
      {hasMultipleActions && (
        <div
          ref={actionBarRef}
          className="fixed bottom-0 right-6 flex rounded-t-xl overflow-hidden shadow-lg z-50"
          style={{ backgroundColor: primaryColor }}
        >
          {bookingEnabled && (
            <button
              onClick={() => handleBarClick("book")}
              className="flex flex-col items-center justify-center px-6 py-3 text-white transition-colors hover:bg-white/10"
              style={{
                backgroundColor:
                  activeBarItem === "book"
                    ? "rgba(255,255,255,0.2)"
                    : undefined,
              }}
            >
              <CalendarCheck className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Book</span>
            </button>
          )}
          {textEnabled && (
            <button
              onClick={() => handleBarClick("text")}
              className="flex flex-col items-center justify-center px-6 py-3 text-white transition-colors hover:bg-white/10"
              style={{
                backgroundColor:
                  activeBarItem === "text"
                    ? "rgba(255,255,255,0.2)"
                    : undefined,
              }}
            >
              <Phone className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Text</span>
            </button>
          )}
          <button
            onClick={() => handleBarClick("chat")}
            className="flex flex-col items-center justify-center px-6 py-3 text-white transition-colors hover:bg-white/10"
            style={{
              backgroundColor:
                activeBarItem === "chat" ? "rgba(255,255,255,0.2)" : undefined,
            }}
          >
            <MessageCircle className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Chat</span>
          </button>
        </div>
      )}

      {/* Widget Panel */}
      {isOpen && (
        <div
          className="fixed right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
          style={{
            bottom: hasMultipleActions ? `${actionBarHeight + 8}px` : "24px",
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClosePanel}
            className="absolute top-3 right-3 z-30 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>

          {view === "home" && (
            <WidgetHome
              chatbotName={chatbot.name}
              thumbnail={chatbot.thumbnail}
              welcomeMessage={chatbot.welcomeMessage}
              chatGreeting={chatbot.chatGreeting}
              suggestedQuestions={chatbot.suggestedQuestions}
              bookingConfig={bookingConfig}
              textConfig={textConfig}
              primaryColor={primaryColor}
              accentColor={accentColor}
              onStartChat={handleStartChat}
              onStartBooking={handleStartBooking}
              onStartText={handleStartText}
              onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
              isMenuOpen={isMenuOpen}
            />
          )}

          {view === "chat" && (
            <div className="h-full relative">
              {!hasMultipleActions && (
                <button
                  onClick={handleClosePanel}
                  className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              )}
              <PublicChatbotInterface
                chatbot={{
                  id: chatbot.id,
                  name: chatbot.name,
                  welcomeMessage: chatbot.welcomeMessage,
                }}
              />
            </div>
          )}

          {view === "booking" && bookingConfig && (
            <BookingWizard
              chatbotId={chatbot.id}
              config={bookingConfig}
              onBack={hasMultipleActions ? handleClosePanel : handleBackToHome}
              onComplete={handleBookingComplete}
              primaryColor={primaryColor}
            />
          )}

          {view === "booking-success" && (
            <BookingSuccessView
              onBackToHome={
                hasMultipleActions ? handleClosePanel : handleBackToHome
              }
              primaryColor={primaryColor}
            />
          )}

          {view === "text" && textConfig && (
            <TextRequestForm
              chatbotId={chatbot.id}
              config={textConfig}
              onBack={hasMultipleActions ? handleClosePanel : handleBackToHome}
              onComplete={handleTextComplete}
              primaryColor={primaryColor}
            />
          )}

          {view === "text-success" && (
            <TextSuccessView
              onBackToHome={
                hasMultipleActions ? handleClosePanel : handleBackToHome
              }
              primaryColor={primaryColor}
            />
          )}
        </div>
      )}
    </>
  );
}

function BookingSuccessView({
  onBackToHome,
  primaryColor,
}: {
  onBackToHome: () => void;
  primaryColor: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${primaryColor}20` }}
      >
        <Check className="h-8 w-8" style={{ color: primaryColor }} />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Appointment Scheduled!
      </h2>
      <p className="text-gray-500 mb-6">
        We've sent a confirmation email with the details. Our team will be in
        touch with you shortly.
      </p>
      <button
        onClick={onBackToHome}
        className="px-6 py-3 rounded-xl font-medium text-white transition-colors"
        style={{ backgroundColor: primaryColor }}
      >
        Back to Home
      </button>
    </div>
  );
}

function TextSuccessView({
  onBackToHome,
  primaryColor,
}: {
  onBackToHome: () => void;
  primaryColor: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${primaryColor}20` }}
      >
        <Check className="h-8 w-8" style={{ color: primaryColor }} />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Message Sent!
      </h2>
      <p className="text-gray-500 mb-6">
        Thank you for reaching out. We'll get back to you as soon as possible.
      </p>
      <button
        onClick={onBackToHome}
        className="px-6 py-3 rounded-xl font-medium text-white transition-colors"
        style={{ backgroundColor: primaryColor }}
      >
        Back to Home
      </button>
    </div>
  );
}
