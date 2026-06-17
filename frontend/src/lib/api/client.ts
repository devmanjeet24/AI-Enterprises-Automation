import { siteConfig } from "@/config/site";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

function buildRequestHeaders(
  token?: string | null,
  extra?: HeadersInit,
): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (siteConfig.apiUrl.includes("ngrok")) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  return { ...headers, ...extra };
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, token, headers, ...rest } = options;

  const response = await fetch(`${siteConfig.apiUrl}${path}`, {
    ...rest,
    headers: buildRequestHeaders(token, headers),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = undefined;
    }
    throw new ApiError(
      `API request failed: ${response.status}`,
      response.status,
      errorBody,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

type DownloadOptions = {
  token?: string | null;
};

function parseContentDispositionFilename(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename="([^"]+)"/);
  return match?.[1] ?? null;
}

export async function apiDownload(
  path: string,
  options: DownloadOptions = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const { token } = options;

  const response = await fetch(`${siteConfig.apiUrl}${path}`, {
    method: "GET",
    headers: buildRequestHeaders(token),
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = undefined;
    }
    throw new ApiError(
      `API request failed: ${response.status}`,
      response.status,
      errorBody,
    );
  }

  const blob = await response.blob();
  const filename = parseContentDispositionFilename(
    response.headers.get("Content-Disposition"),
  );

  return { blob, filename };
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

type UploadOptions = {
  token?: string | null;
  method?: "POST" | "PUT" | "PATCH";
};

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: UploadOptions = {},
): Promise<T> {
  const { token, method = "POST" } = options;

  const uploadHeaders: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (siteConfig.apiUrl.includes("ngrok")) {
    uploadHeaders["ngrok-skip-browser-warning"] = "true";
  }

  const response = await fetch(`${siteConfig.apiUrl}${path}`, {
    method,
    headers: uploadHeaders,
    body: formData,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = undefined;
    }
    throw new ApiError(
      `API request failed: ${response.status}`,
      response.status,
      errorBody,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
