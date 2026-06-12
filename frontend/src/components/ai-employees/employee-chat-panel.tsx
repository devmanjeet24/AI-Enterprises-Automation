"use client";

import { BookOpen, Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatRelativeDate } from "@/config/ai-employees";
import {
  useChatWithEmployee,
  useConversation,
  useEmployeeConversations,
} from "@/hooks/use-ai-employees";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AIEmployeeDetail, ChatMessage } from "@/lib/ai-employees/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface EmployeeChatPanelProps {
  employee: AIEmployeeDetail;
  canChat?: boolean;
}

export function EmployeeChatPanel({ employee, canChat = true }: EmployeeChatPanelProps) {
  const accent = dashboardAccents.emerald;
  const toast = useToast();
  const chatMutation = useChatWithEmployee(employee.id);

  const isActive = employee.status === "active";
  const hasKnowledge = employee.document_assignments.length > 0;
  const chatEnabled = canChat && isActive && hasKnowledge;

  const {
    data: conversations = [],
    isLoading: conversationsLoading,
  } = useEmployeeConversations(employee.id, chatEnabled);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);

  const { data: conversationDetail, isLoading: conversationLoading } = useConversation(
    activeConversationId,
  );

  useEffect(() => {
    if (conversationDetail?.messages) {
      setOptimisticMessages(conversationDetail.messages);
    }
  }, [conversationDetail]);

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setOptimisticMessages([]);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setOptimisticMessages([]);
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || !chatEnabled) return;

    const userMsg: ChatMessage = {
      id: `optimistic-user-${Date.now()}`,
      conversation_id: activeConversationId ?? "",
      role: "user",
      content: trimmed,
      sources: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setOptimisticMessages((prev) => [...prev, userMsg]);
    setMessage("");

    try {
      const response = await chatMutation.mutateAsync({
        message: trimmed,
        conversation_id: activeConversationId,
      });

      setActiveConversationId(response.conversation_id);

      const assistantMsg: ChatMessage = {
        id: `optimistic-assistant-${Date.now()}`,
        conversation_id: response.conversation_id,
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setOptimisticMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      toast.error(getApiErrorMessage(error, "Failed to send message."));
    }
  };

  const displayMessages = optimisticMessages;
  const isSending = chatMutation.isPending;

  return (
    <DashboardCard variant="panel" accent="emerald" interactive={false} className="overflow-hidden">
      <div className="flex h-[min(560px,70vh)] flex-col lg:flex-row">
        <div className="flex w-full shrink-0 flex-col border-b border-white/[0.06] lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
              Conversations
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={handleNewConversation}
              disabled={!chatEnabled}
            >
              New
            </Button>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {conversationsLoading && (
              <li className="space-y-2 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
                ))}
              </li>
            )}
            {!conversationsLoading && conversations.length === 0 && (
              <li className="px-2 py-6 text-center text-[12px] text-muted-foreground">
                No conversations yet
              </li>
            )}
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                    activeConversationId === conversation.id
                      ? cn(accent.bgSubtle, "border", accent.border)
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {conversation.title ?? "Untitled conversation"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-tertiary">
                    {formatRelativeDate(conversation.updated_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {!chatEnabled ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageSquare className="size-8 text-tertiary" />
              <p className="mt-3 text-[14px] font-medium text-foreground">
                Chat unavailable
              </p>
              <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
                {!canChat
                  ? "You do not have permission to chat."
                  : !isActive
                    ? "Activate this employee to enable chat."
                    : "Assign at least one embedded knowledge document."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {(conversationLoading && activeConversationId) && displayMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className={cn("size-6 animate-spin", accent.text)} />
                  </div>
                ) : null}

                {!conversationLoading && displayMessages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <Sparkles className={cn("size-6", accent.text)} />
                    <p className="mt-3 text-[14px] text-muted-foreground">
                      Start a conversation with {employee.name}
                    </p>
                  </div>
                )}

                {displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3",
                        msg.role === "user"
                          ? "bg-brand/20 text-foreground"
                          : "border border-white/[0.08] bg-white/[0.03]",
                      )}
                    >
                      <p className="text-[14px] leading-relaxed">{msg.content}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <ul className="mt-3 space-y-1 border-t border-white/[0.06] pt-2">
                          {msg.sources.map((source, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-2 text-[11px] text-muted-foreground"
                            >
                              <BookOpen className={cn("size-3", accent.text)} />
                              <span>
                                {source.document_title}
                                {source.page_number != null && ` · p. ${source.page_number}`}
                              </span>
                              <span className="text-tertiary">
                                {(source.similarity_score * 100).toFixed(0)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                      <Loader2 className={cn("size-4 animate-spin", accent.text)} />
                      <span className="text-[13px] text-muted-foreground">Thinking…</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.06] p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Message ${employee.name}…`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isSending}
                  />
                  <Button
                    variant="brand"
                    size="icon"
                    onClick={handleSend}
                    disabled={!message.trim() || isSending}
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
