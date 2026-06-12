"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DashboardCard,
  DashboardCardHeader,
} from "@/components/dashboard/dashboard-card";
import { useDocumentSearch } from "@/hooks/use-knowledge-base";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { DocumentSearchResult } from "@/lib/knowledge-base/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

export function SemanticSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocumentSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const searchMutation = useDocumentSearch();

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearchError(null);
    setHasSearched(true);

    try {
      const response = await searchMutation.mutateAsync({ query: trimmed });
      setResults(response.results);
      if (response.results.length === 0) {
        toast.info("No matching chunks found.");
      }
    } catch (error) {
      const message = getApiErrorMessage(error, "Search failed.");
      setSearchError(message);
      setResults([]);
      toast.error(message);
    }
  };

  return (
    <DashboardCard variant="panel" accent="purple" interactive={false}>
      <DashboardCardHeader
        title="Semantic search"
        subtitle="Find relevant chunks across all documents"
        accent="purple"
      />

      <div className="p-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-tertiary" />
            <Input
              placeholder="Search knowledge chunks…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
              className="pl-10"
              disabled={searchMutation.isPending}
            />
          </div>
          <Button
            variant="brand"
            size="default"
            onClick={handleSearch}
            disabled={!query.trim() || searchMutation.isPending}
          >
            {searchMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Search
          </Button>
        </div>

        <div className="mt-5">
          {searchMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className={cn("size-6 animate-spin", accent.text)} />
              <p className="mt-3 text-[13px] text-muted-foreground">
                Searching embedded chunks…
              </p>
            </div>
          )}

          {!searchMutation.isPending && searchError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center">
              <p className="text-[14px] text-destructive">{searchError}</p>
            </div>
          )}

          {!searchMutation.isPending &&
            !searchError &&
            hasSearched &&
            results.length === 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
                <p className="text-[14px] text-muted-foreground">
                  No matching chunks found. Try a different query or embed more
                  documents first.
                </p>
              </div>
            )}

          {!searchMutation.isPending && results.length > 0 && (
            <ul className="space-y-3">
              {results.map((result) => (
                <li
                  key={result.chunk_id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground">
                        {result.document_title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-tertiary">
                        Chunk {result.chunk_index}
                        {result.page_number != null && ` · Page ${result.page_number}`}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        accent.bgSubtle,
                        accent.border,
                        accent.text,
                      )}
                    >
                      {(result.similarity_score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                    {result.content}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {!searchMutation.isPending && !hasSearched && (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-8 text-center">
              <Search className="mx-auto size-5 text-tertiary" />
              <p className="mt-3 text-[13px] text-muted-foreground">
                Search across all embedded document chunks using natural language.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
