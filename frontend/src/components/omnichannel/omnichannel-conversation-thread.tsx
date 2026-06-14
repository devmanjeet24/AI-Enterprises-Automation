"use client";

import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/omnichannel";
import {
  useCreateConversationMessage,
  useSuggestAiResponse,
} from "@/hooks/use-omnichannel";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { OmnichannelMessage, OmnichannelMessageRole } from "@/lib/omnichannel/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

function getAuthorLabel(message: OmnichannelMessage): string {
  if (message.author_user_name) return message.author_user_name;
  if (message.author_ai_employee_name) return message.author_ai_employee_name;
  if (message.role === "customer") return "Customer";
  if (message.role === "system") return "System";
  return "Agent";
}

function AuthorLabel({ message }: { message: OmnichannelMessage }) {
  const label = getAuthorLabel(message);
  if (message.author_ai_employee_id) {
    return (
      <Link
        href={`/ai-employees/${message.author_ai_employee_id}`}
        className="font-medium text-foreground transition-colors hover:text-brand"
      >
        {label}
      </Link>
    );
  }
  return <span className="font-medium text-foreground">{label}</span>;
}

export function OmnichannelConversationThread({
  conversationId,
  messages,
  canReply,
}: {
  conversationId: string;
  messages: OmnichannelMessage[];
  canReply: boolean;
}) {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const replyMutation = useCreateConversationMessage(conversationId);
  const suggestMutation = useSuggestAiResponse(conversationId);

  const handleSend = async (role: OmnichannelMessageRole = "agent") => {
    if (!content.trim()) return;
    try {
      await replyMutation.mutateAsync({
        content: content.trim(),
        role,
        is_internal: isInternal,
      });
      setContent("");
      setSuggestion(null);
      toast.success(isInternal ? "Internal note added" : "Message sent");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send message."));
    }
  };

  const handleSuggest = async () => {
    try {
      const result = await suggestMutation.mutateAsync();
      setSuggestion(result.suggestion);
      setContent(result.suggestion);
      toast.success("AI suggestion generated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to generate suggestion."));
    }
  };

  return (
    <DashboardCard variant="panel" accent="purple" className="flex flex-col p-0">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="text-[14px] font-medium text-foreground">Conversation</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="max-h-[480px] flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((message) => {
            const isAi = message.role === "ai_assistant";
            const isCustomer = message.role === "customer";
            return (
              <div
                key={message.id}
                className={cn(
                  "rounded-lg border px-4 py-3",
                  isAi
                    ? "border-purple-400/20 bg-purple-400/5"
                    : isCustomer
                      ? "border-white/[0.08] bg-white/[0.03]"
                      : "border-white/[0.06] bg-white/[0.02]",
                  message.is_internal && "border-dashed opacity-80",
                )}
              >
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  {isAi ? <Bot className="size-3.5 text-purple-400" /> : <User className="size-3.5" />}
                  <AuthorLabel message={message} />
                  {message.is_internal && <span className="text-amber-400">· Internal</span>}
                  <span>·</span>
                  <span>{formatDateTime(message.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                  {message.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {canReply && (
        <div className="border-t border-white/[0.06] p-4">
          {suggestion && (
            <p className="mb-2 text-[12px] text-purple-300">
              AI suggestion loaded — edit before sending.
            </p>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a reply…"
            rows={3}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              Internal note
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleSuggest()}
                disabled={suggestMutation.isPending}
              >
                {suggestMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                AI suggest
              </Button>
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
        </div>
      )}
    </DashboardCard>
  );
}
