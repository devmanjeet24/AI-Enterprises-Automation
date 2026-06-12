"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  chunkDocument,
  deleteDocument,
  embedDocument,
  getDocument,
  listDocuments,
  processDocument,
  searchDocuments,
  uploadDocument,
} from "@/lib/api/documents";
import { queryKnowledge } from "@/lib/api/knowledge";
import { documentKeys } from "@/lib/knowledge-base/query-keys";
import type {
  DocumentSearchRequest,
  DocumentStatus,
  KnowledgeQueryRequest,
  UploadDocumentInput,
} from "@/lib/knowledge-base/types";

import { useAuthToken } from "./use-auth-token";

export function useDocuments(status?: DocumentStatus | "all") {
  const token = useAuthToken();
  const apiStatus = status === "all" || !status ? undefined : status;

  return useQuery({
    queryKey: documentKeys.list(status),
    queryFn: () => listDocuments(token!, apiStatus),
    enabled: Boolean(token),
  });
}

export function useDocument(documentId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => getDocument(token!, documentId),
    enabled: Boolean(token) && Boolean(documentId),
  });
}

export function useUploadDocument() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadDocumentInput) => uploadDocument(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useProcessDocument(documentId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => processDocument(token!, documentId),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(documentId), document);
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useChunkDocument(documentId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => chunkDocument(token!, documentId),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(documentId), document);
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useEmbedDocument(documentId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => embedDocument(token!, documentId),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(documentId), document);
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useDeleteDocument() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(token!, documentId),
    onSuccess: (_data, documentId) => {
      queryClient.removeQueries({ queryKey: documentKeys.detail(documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useDocumentSearch() {
  const token = useAuthToken();

  return useMutation({
    mutationFn: (payload: DocumentSearchRequest) =>
      searchDocuments(token!, payload),
  });
}

export function useKnowledgeQuery() {
  const token = useAuthToken();

  return useMutation({
    mutationFn: (payload: KnowledgeQueryRequest) =>
      queryKnowledge(token!, payload),
  });
}
