"use client";

import { BookOpen, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DashboardCard,
  DashboardCardHeader,
} from "@/components/dashboard/dashboard-card";
import { useKnowledgeQuery } from "@/hooks/use-knowledge-base";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { KnowledgeSourceCitation } from "@/lib/knowledge-base/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

export function KnowledgeQueryPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<KnowledgeSourceCitation[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const queryMutation = useKnowledgeQuery();

  const handleQuery = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    setQueryError(null);
    setAnswer(null);
    setSources([]);

    try {
      const response = await queryMutation.mutateAsync({ question: trimmed });
      setAnswer(response.answer);
      setSources(response.sources);
      toast.success("Answer generated from your knowledge base.");
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to generate answer.");
      setQueryError(message);
      toast.error(message);
    }
  };

  return (
    <DashboardCard variant="panel" accent="purple" interactive={false}>
      <DashboardCardHeader
        title="Knowledge Q&A"
        subtitle="Ask questions with grounded answers"
        accent="purple"
      />

      <div className="p-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MessageCircleQuestion className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-tertiary" />
            <Input
              placeholder="e.g. How many annual leave days are allowed?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleQuery();
              }}
              className="pl-10"
              disabled={queryMutation.isPending}
            />
          </div>
          <Button
            variant="brand"
            size="default"
            onClick={handleQuery}
            disabled={!question.trim() || queryMutation.isPending}
          >
            {queryMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Ask
          </Button>
        </div>

        <div className="mt-5">
          {queryMutation.isPending && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
              <Loader2 className={cn("size-6 animate-spin", accent.text)} />
              <p className="mt-3 text-[13px] text-muted-foreground">
                Generating grounded answer from knowledge base…
              </p>
            </div>
          )}

          {!queryMutation.isPending && queryError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center">
              <p className="text-[14px] text-destructive">{queryError}</p>
            </div>
          )}

          {!queryMutation.isPending && answer && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className={cn("size-4", accent.text)} />
                  <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
                    Answer
                  </p>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-foreground">
                  {answer}
                </p>
              </div>

              {sources.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
                    Sources
                  </p>
                  <ul className="space-y-2">
                    {sources.map((source, index) => (
                      <li
                        key={`${source.document_title}-${index}`}
                        className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                      >
                        <BookOpen className={cn("size-3.5 shrink-0", accent.text)} />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                          {source.document_title}
                          {source.page_number != null && ` · p. ${source.page_number}`}
                        </span>
                        <span className="shrink-0 text-[11px] text-tertiary">
                          {(source.similarity_score * 100).toFixed(0)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!queryMutation.isPending && !answer && !queryError && (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-8 text-center">
              <MessageCircleQuestion className="mx-auto size-5 text-tertiary" />
              <p className="mt-3 text-[13px] text-muted-foreground">
                Ask a natural language question. Answers are generated from your
                embedded knowledge base with citations.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
