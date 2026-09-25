"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askBusinessAssistant } from "@/lib/api/ai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "Give me a quick overview of my business.",
  "Which products should I consider restocking?",
  "What are my top-selling products?",
  "How are sales performing compared with expenses?",
];

export function BusinessAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function askQuestion(value?: string) {
    const finalQuestion = (value ?? question).trim();

    if (!finalQuestion || loading) {
      return;
    }

    setError("");
    setQuestion("");

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: finalQuestion,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setLoading(true);

    try {
      const answer =
        await askBusinessAssistant(finalQuestion);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answer,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to get an AI response.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    void askQuestion();
  }

  return (
    <>
      {/* Floating AI Button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open FurniCore AI Assistant"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#244A3D] px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#19372D] hover:shadow-xl sm:bottom-6 sm:right-6 print:hidden"
        >
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">
            Ask FurniCore AI
          </span>
        </button>
      )}

      {/* Assistant Panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[650px] sm:max-h-[calc(100vh-3rem)] sm:w-[420px] print:hidden">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#E5E2DA] bg-[#244A3D] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/10">
                <Sparkles className="size-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  FurniCore AI
                </h2>

                <p className="mt-0.5 text-xs text-white/70">
                  Business Assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close AI Assistant"
              className="flex size-9 items-center justify-center rounded-lg transition hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Conversation */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center py-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#244A3D]">
                  <Bot className="size-6" />
                </div>

                <h3 className="mt-4 text-center font-semibold text-[#242624]">
                  How can I help?
                </h3>

                <p className="mt-2 max-w-[300px] text-center text-sm leading-5 text-[#73766F]">
                  Ask me about your recent sales, expenses,
                  products, balances or inventory.
                </p>

                <div className="mt-5 grid w-full gap-2">
                  {suggestedQuestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        void askQuestion(item)
                      }
                      className="rounded-xl border border-[#E5E2DA] bg-[#F8F7F3] px-3 py-2.5 text-left text-xs leading-5 text-[#444640] transition hover:border-[#244A3D] hover:bg-[#EEF3F0] disabled:opacity-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF3F0] text-[#244A3D]">
                        <Bot className="size-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${
                        message.role === "user"
                          ? "bg-[#244A3D] text-white"
                          : "bg-[#F8F7F3] text-[#242624]"
                      }`}
                    >
                      {message.content}
                    </div>

                    {message.role === "user" && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#EEECE6] text-[#73766F]">
                        <User className="size-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF3F0] text-[#244A3D]">
                      <Bot className="size-3.5" />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl bg-[#F8F7F3] px-3.5 py-2.5 text-xs text-[#73766F]">
                      <Loader2 className="size-3.5 animate-spin" />
                      Analyzing your business...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[#E5E2DA] bg-white p-3">
            {error && (
              <div
                role="alert"
                className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2"
            >
              <Textarea
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                placeholder="Ask about your business..."
                maxLength={500}
                rows={1}
                disabled={loading}
                className="max-h-28 min-h-[44px] resize-none"
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    if (
                      question.trim() &&
                      !loading
                    ) {
                      void askQuestion();
                    }
                  }
                }}
              />

              <Button
                type="submit"
                disabled={
                  !question.trim() || loading
                }
                aria-label="Send question"
                className="size-11 shrink-0 bg-[#244A3D] text-white hover:bg-[#19372D]"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>

            <p className="mt-2 text-center text-[10px] text-[#9A9C96]">
              AI responses are based on available
              FurniCore business data.
            </p>
          </div>
        </div>
      )}
    </>
  );
}