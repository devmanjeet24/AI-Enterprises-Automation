"use client";

import { Bot, Loader2, Send, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/customer-support";
import { useCreateTicketMessage, useTicketMessages } from "@/hooks/use-support-tickets";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { SupportMessageRole } from "@/lib/customer-support/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

import { CustomerSupportError } from "./customer-support-error";

interface SupportTicketConversationProps {
  ticketId: string;
  canReply: boolean;
}

function getAuthorLabel(message: {
  role: SupportMessageRole;
  author_user_name: string | null;
  author_ai_employee_name: string | null;
}): string {
  if (message.author_user_name) return message.author_user_name;
  if (message.author_ai_employee_name) return message.author_ai_employee_name;
  if (message.role === "customer") return "Customer";
  if (message.role === "system") return "System";
  return "Agent";
}

function AuthorLabel({
  message,
}: {
  message: {
    author_ai_employee_id: string | null;
    role: SupportMessageRole;
    author_user_name: string | null;
    author_ai_employee_name: string | null;
  };
}) {
  const label = getAuthorLabel(message);
  if (message.author_ai_employee_id) {
    return (
      <Link
        href={`/ai-employees/${message.author_ai_employee_id}`}
        className="text-[12px] font-medium text-foreground transition-colors hover:text-brand"
      >
        {label}
      </Link>
    );
  }
  return <span className="text-[12px] font-medium text-foreground">{label}</span>;
}

export function SupportTicketConversation({
  ticketId,
  canReply,
}: SupportTicketConversationProps) {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const {
    data: messages = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTicketMessages(ticketId);

  const replyMutation = useCreateTicketMessage(ticketId);

  const handleSend = async () => {
    if (!content.trim()) return;

    try {
      await replyMutation.mutateAsync({
        content: content.trim(),
        role: "agent",
        is_internal: isInternal,
      });
      setContent("");
      toast.success(isInternal ? "Internal note added" : "Reply sent");
    } catch (sendError) {
      toast.error(getApiErrorMessage(sendError, "Failed to send message."));
    }
  };

  if (isLoading) {
    return (
      <DashboardCard variant="panel" accent="blue" className="min-h-[320px] p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <CustomerSupportError
        title="Failed to load conversation"
        message={getApiErrorMessage(error, "Could not load messages.")}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <DashboardCard variant="panel" accent="blue" className="flex flex-col p-0">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="text-[14px] font-medium text-foreground">Conversation</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="max-h-[480px] flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            No messages yet. Send the first reply below.
          </p>
        ) : (
          messages.map((message) => {
            const isAgentSide =
              message.role === "agent" ||
              message.role === "ai_assistant" ||
              message.role === "system";

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isAgentSide ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                    message.role === "ai_assistant"
                      ? "border-[#A78BFA]/30 bg-[#A78BFA]/10"
                      : isAgentSide
                        ? "border-[#6B9BF8]/30 bg-[#6B9BF8]/10"
                        : "border-white/10 bg-white/[0.04]",
                  )}
                >
                  {message.role === "ai_assistant" ? (
                    <Bot className="size-3.5 text-[#A78BFA]" />
                  ) : (
                    <User className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl border px-4 py-3",
                    message.is_internal
                      ? "border-amber-400/20 bg-amber-400/5"
                      : isAgentSide
                        ? "border-[#6B9BF8]/20 bg-[#6B9BF8]/5"
                        : "border-white/[0.08] bg-white/[0.03]",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <AuthorLabel message={message} />
                    {message.is_internal && (
                      <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                        Internal
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                    {message.content}
                  </p>
                  <p className="mt-2 text-[11px] text-tertiary">
                    {formatDateTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canReply && (
        <div className="border-t border-white/[0.06] p-4">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a reply to the customer…"
            rows={3}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none focus:border-brand/50"
          />
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(event) => setIsInternal(event.target.checked)}
                className="rounded border-white/20"
              />
              Internal note
            </label>
            <Button
              variant="brand"
              size="sm"
              onClick={() => void handleSend()}
              disabled={!content.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Send
            </Button>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
