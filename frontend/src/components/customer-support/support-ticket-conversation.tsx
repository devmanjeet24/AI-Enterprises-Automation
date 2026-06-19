"use client";

import {
  AlertTriangle,
  BookOpen,
  Bot,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime, supportStatusLabels } from "@/config/customer-support";
import {
  useCreateTicketMessage,
  useSuggestSupportTicketResponse,
  useTicketMessages,
  useUpdateSupportTicket,
} from "@/hooks/use-support-tickets";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  SupportAiSuggestion,
  SupportMessageRole,
  SupportTicketStatus,
} from "@/lib/customer-support/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

import { CustomerSupportError } from "./customer-support-error";

interface SupportTicketConversationProps {
  ticketId: string;
  ticketStatus: SupportTicketStatus;
  canReply: boolean;
  assignedAiEmployeeId?: string | null;
  assignedAiEmployeeName?: string | null;
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

function confidenceTone(confidence: number): string {
  if (confidence >= 0.75) return "text-emerald-400";
  if (confidence >= 0.55) return "text-amber-400";
  return "text-rose-400";
}

export function SupportTicketConversation({
  ticketId,
  ticketStatus,
  canReply,
  assignedAiEmployeeId,
  assignedAiEmployeeName,
}: SupportTicketConversationProps) {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<SupportAiSuggestion | null>(null);
  const analyzedTicketRef = useRef<string | null>(null);

  const {
    data: messages = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTicketMessages(ticketId);

  const replyMutation = useCreateTicketMessage(ticketId);
  const updateMutation = useUpdateSupportTicket(ticketId);
  const suggestMutation = useSuggestSupportTicketResponse(ticketId);
  const canUseAiEmployee = Boolean(assignedAiEmployeeId) && canReply;
  const isTerminalStatus = ticketStatus === "resolved" || ticketStatus === "closed";
  const isAnalyzing = suggestMutation.isPending;

  const applySuggestion = (result: SupportAiSuggestion) => {
    setAiSuggestion(result);
    setContent(result.suggestion);
  };

  const handleAnalyze = async () => {
    try {
      const result = await suggestMutation.mutateAsync();
      applySuggestion(result);
    } catch (analyzeError) {
      toast.error(getApiErrorMessage(analyzeError, "Failed to analyze ticket."));
    }
  };

  useEffect(() => {
    if (!canUseAiEmployee || isTerminalStatus) return;
    if (analyzedTicketRef.current === ticketId) return;

    analyzedTicketRef.current = ticketId;
    void handleAnalyze();
  }, [ticketId, canUseAiEmployee, isTerminalStatus]);

  const resetComposer = () => {
    setContent("");
    setAiSuggestion(null);
    setIsInternal(false);
  };

  const handleSend = async (resolveTicket = false) => {
    if (!content.trim()) return;

    try {
      await replyMutation.mutateAsync({
        content: content.trim(),
        is_internal: isInternal,
        resolve_ticket: resolveTicket,
        as_ai_employee: Boolean(aiSuggestion) && !isInternal,
      });
      resetComposer();
      toast.success(
        resolveTicket
          ? "Reply sent and ticket resolved."
          : isInternal
            ? "Internal note added."
            : "Reply sent.",
      );
    } catch (sendError) {
      toast.error(getApiErrorMessage(sendError, "Failed to send message."));
    }
  };

  const handleEscalate = async () => {
    try {
      await updateMutation.mutateAsync({ status: "waiting" });
      await replyMutation.mutateAsync({
        content: aiSuggestion
          ? `Escalated to human agent. ${aiSuggestion.reasoning}`
          : "Escalated to human agent for manual review.",
        is_internal: true,
      });
      resetComposer();
      toast.success("Ticket escalated to human review.");
    } catch (escalateError) {
      toast.error(getApiErrorMessage(escalateError, "Failed to escalate ticket."));
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
            No messages yet. The assigned AI employee will draft the first reply below.
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
          {canUseAiEmployee && !isTerminalStatus && (
            <div className="mb-3 rounded-lg border border-[#A78BFA]/20 bg-[#A78BFA]/5 px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Bot className="mt-0.5 size-4 shrink-0 text-[#A78BFA]" />
                  <div>
                    <p className="text-[13px] font-medium text-foreground">
                      {assignedAiEmployeeName ?? "AI employee"} analysis
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {isAnalyzing
                        ? "Analyzing ticket and retrieving knowledge sources…"
                        : aiSuggestion
                          ? "Knowledge-grounded recommendation ready for review."
                          : "Waiting for analysis."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleAnalyze()}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Re-analyze
                </Button>
              </div>

              {aiSuggestion && (
                <div className="mt-3 space-y-3 border-t border-[#A78BFA]/10 pt-3">
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <span className={cn("font-medium", confidenceTone(aiSuggestion.confidence))}>
                      {(aiSuggestion.confidence * 100).toFixed(0)}% confidence
                    </span>
                    <span className="text-tertiary">·</span>
                    <span className="text-muted-foreground">
                      Recommended:{" "}
                      <span className="text-foreground">
                        {supportStatusLabels[aiSuggestion.recommended_status]}
                      </span>
                    </span>
                    {aiSuggestion.can_auto_resolve && (
                      <>
                        <span className="text-tertiary">·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          Ready to resolve
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    {aiSuggestion.reasoning}
                  </p>

                  {aiSuggestion.sources.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-tertiary">
                        Knowledge sources
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {aiSuggestion.sources.map((source, index) => (
                          <li
                            key={`${source.document_title}-${index}`}
                            className="flex items-center gap-2 text-[12px] text-muted-foreground"
                          >
                            <BookOpen className="size-3.5 shrink-0 text-[#A78BFA]" />
                            <span className="text-foreground">
                              {source.document_title}
                              {source.page_number != null && ` · p. ${source.page_number}`}
                            </span>
                            <span className="text-tertiary">
                              {(source.similarity_score * 100).toFixed(0)}% match
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={
              canUseAiEmployee
                ? "AI draft will appear here for review…"
                : "Write a reply to the customer…"
            }
            rows={3}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none focus:border-brand/50"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(event) => setIsInternal(event.target.checked)}
                className="rounded border-white/20"
              />
              Internal note
            </label>
            <div className="flex flex-wrap gap-2">
              {canUseAiEmployee && aiSuggestion && !isInternal && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-400 hover:text-amber-300"
                  onClick={() => void handleEscalate()}
                  disabled={replyMutation.isPending || updateMutation.isPending}
                >
                  <AlertTriangle className="size-3.5" />
                  Escalate
                </Button>
              )}
              <Button
                variant="brand"
                size="sm"
                onClick={() => void handleSend(false)}
                disabled={!content.trim() || replyMutation.isPending}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Send
              </Button>
              {aiSuggestion?.can_auto_resolve && !isInternal && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleSend(true)}
                  disabled={!content.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  Send &amp; resolve
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
