"use client";

import { Calendar, MessageSquare, Phone, Mail, Menu, X } from "lucide-react";
import type { BookingConfig } from "@/lib/validation/chatbot-booking";
import type { TextConfig } from "@/lib/validation/chatbot-text";

type WidgetHomeProps = {
  chatbotName: string;
  thumbnail?: string | null;
  welcomeMessage?: string | null;
  chatGreeting?: string | null;
  suggestedQuestions?: string[];
  bookingConfig?: BookingConfig | null;
  textConfig?: TextConfig | null;
  primaryColor?: string;
  accentColor?: string;
  onStartChat: (initialMessage?: string) => void;
  onStartBooking: () => void;
  onStartText: () => void;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
};

export default function WidgetHome({
  chatbotName,
  thumbnail,
  welcomeMessage,
  chatGreeting,
  suggestedQuestions = [],
  bookingConfig,
  textConfig,
  primaryColor = "#001F54",
  accentColor = "#3B82F6",
  onStartChat,
  onStartBooking,
  onStartText,
  onMenuToggle,
  isMenuOpen,
}: WidgetHomeProps) {
  const bookingEnabled =
    bookingConfig?.enabled &&
    (bookingConfig.categories?.length ?? 0) > 0 &&
    (bookingConfig.locations?.length ?? 0) > 0;

  const textEnabled = textConfig?.enabled === true;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div
        className="p-4 text-white relative"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between mb-4">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={chatbotName}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          )}
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
        <h1 className="text-xl font-semibold mb-1">{chatbotName}</h1>
        <p className="text-sm text-white/80">
          {welcomeMessage || "How can we help you today?"}
        </p>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute inset-0 bg-white z-20 flex flex-col">
          <div
            className="p-4 text-white flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={onMenuToggle}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    onMenuToggle();
                    onStartChat();
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                  Start a Chat
                </button>
              </li>
              {bookingEnabled && (
                <li>
                  <button
                    onClick={() => {
                      onMenuToggle();
                      onStartBooking();
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <Calendar className="h-5 w-5 text-gray-500" />
                    Schedule Appointment
                  </button>
                </li>
              )}
              {textEnabled && (
                <li>
                  <button
                    onClick={() => {
                      onMenuToggle();
                      onStartText();
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <Phone className="h-5 w-5 text-gray-500" />
                    Send us a Text
                  </button>
                </li>
              )}
              {!textEnabled && (
                <li>
                  <button
                    className="w-full text-left px-4 py-3 text-gray-400 rounded-lg flex items-center gap-3 cursor-not-allowed"
                    disabled
                  >
                    <Phone className="h-5 w-5" />
                    Call Us
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-auto">
                      Coming Soon
                    </span>
                  </button>
                </li>
              )}
              <li>
                <button
                  className="w-full text-left px-4 py-3 text-gray-400 rounded-lg flex items-center gap-3 cursor-not-allowed"
                  disabled
                >
                  <Mail className="h-5 w-5" />
                  Email Us
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-auto">
                    Coming Soon
                  </span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Action Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Primary Actions */}
        <div className="grid gap-3">
          {bookingEnabled && (
            <button
              onClick={onStartBooking}
              className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 bg-white shadow-sm hover:shadow transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Calendar
                    className="h-5 w-5"
                    style={{ color: accentColor }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Schedule an Appointment
                  </h3>
                  <p className="text-sm text-gray-500">
                    Book a free consultation
                  </p>
                </div>
              </div>
            </button>
          )}

          {textEnabled && (
            <button
              onClick={onStartText}
              className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 bg-white shadow-sm hover:shadow transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Phone className="h-5 w-5" style={{ color: accentColor }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Send us a Text
                  </h3>
                  <p className="text-sm text-gray-500">
                    Leave a message and we'll text you back
                  </p>
                </div>
              </div>
            </button>
          )}

          <button
            onClick={() => onStartChat()}
            className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 bg-white shadow-sm hover:shadow transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <MessageSquare
                  className="h-5 w-5"
                  style={{ color: primaryColor }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Chat with Us</h3>
                <p className="text-sm text-gray-500">
                  Get instant answers to your questions
                </p>
              </div>
            </div>
          </button>

          {/* Secondary Actions (disabled for now) */}
          <div className="grid grid-cols-2 gap-3">
            {!textEnabled && (
              <button
                className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed text-left"
                disabled
              >
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">Call Me</span>
                </div>
                <p className="text-xs mt-1">Coming Soon</p>
              </button>
            )}

            <button
              className={`p-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed text-left ${!textEnabled ? "" : "col-span-2"}`}
              disabled
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email Us</span>
              </div>
              <p className="text-xs mt-1">Coming Soon</p>
            </button>
          </div>
        </div>

        {/* Suggested Questions */}
        {suggestedQuestions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Quick Questions
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.slice(0, 4).map((question, index) => (
                <button
                  key={index}
                  onClick={() => onStartChat(question)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Greeting Footer */}
      {chatGreeting && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center italic">
            "{chatGreeting}"
          </p>
        </div>
      )}
    </div>
  );
}
