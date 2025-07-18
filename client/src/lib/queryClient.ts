import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Static JSON files served from public/api/
const API_BASE_URL = "";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // For static JSON files, we only support GET requests
  // POST/PUT/DELETE requests will return mock success responses
  if (method !== "GET") {
    // Return mock success response for write operations
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Static API - operation completed",
      data: data,
      id: Math.floor(Math.random() * 1000) + 1
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Convert API URLs to static JSON file paths
  let jsonPath = url.replace(/^\/api/, "/api");
  
  // Handle specific URL patterns
  if (jsonPath.includes("/applications/") && !jsonPath.endsWith(".json")) {
    jsonPath = jsonPath + ".json";
  } else if (jsonPath === "/api/applications") {
    jsonPath = "/api/applications.json";
  } else if (jsonPath.includes("/questions/analyze")) {
    jsonPath = "/api/questions/analyze.json";
  } else if (jsonPath.includes("/questions/analyses/")) {
    jsonPath = jsonPath.replace("/questions/analyses/", "/questions/analyses/") + ".json";
  } else if (jsonPath.includes("/data-collection/session/")) {
    jsonPath = jsonPath.replace("/data-collection/session/", "/data-collection/session/") + ".json";
  } else if (jsonPath.includes("/data-collection/start")) {
    jsonPath = "/api/data-collection/start.json";
  } else if (jsonPath.includes("/data-requests/") && !jsonPath.endsWith(".json")) {
    jsonPath = jsonPath + ".json";
  } else if (jsonPath === "/api/data-requests") {
    jsonPath = "/api/data-requests.json";
  } else if (jsonPath === "/api/health") {
    jsonPath = "/api/health.json";
  } else if (!jsonPath.endsWith(".json")) {
    jsonPath = jsonPath + ".json";
  }
  
  const res = await fetch(jsonPath, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    // Convert API URLs to static JSON file paths
    let jsonPath = url.replace(/^\/api/, "/api");
    
    // Handle specific URL patterns
    if (jsonPath.includes("/applications/") && !jsonPath.endsWith(".json")) {
      jsonPath = jsonPath + ".json";
    } else if (jsonPath === "/api/applications") {
      jsonPath = "/api/applications.json";
    } else if (jsonPath.includes("/questions/analyze")) {
      jsonPath = "/api/questions/analyze.json";
    } else if (jsonPath.includes("/questions/analyses/")) {
      jsonPath = jsonPath.replace("/questions/analyses/", "/questions/analyses/") + ".json";
    } else if (jsonPath.includes("/data-collection/session/")) {
      jsonPath = jsonPath.replace("/data-collection/session/", "/data-collection/session/") + ".json";
    } else if (jsonPath.includes("/data-collection/start")) {
      jsonPath = "/api/data-collection/start.json";
    } else if (jsonPath.includes("/data-requests/") && !jsonPath.endsWith(".json")) {
      jsonPath = jsonPath + ".json";
    } else if (jsonPath === "/api/data-requests") {
      jsonPath = "/api/data-requests.json";
    } else if (jsonPath === "/api/health") {
      jsonPath = "/api/health.json";
    } else if (!jsonPath.endsWith(".json")) {
      jsonPath = jsonPath + ".json";
    }
    
    const res = await fetch(jsonPath, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
