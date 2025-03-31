import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>({
  method,
  url,
  data,
  headers = {},
}: ApiRequestOptions): Promise<T> {
  const requestHeaders: Record<string, string> = {
    ...headers,
  };
  
  if (data && !headers["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // For empty responses or when only status matters
  if (res.status === 204 || res.headers.get("Content-Length") === "0") {
    // Return a minimal success object for empty responses
    return { success: true } as unknown as T;
  }
  
  // Parse JSON for all other responses
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
