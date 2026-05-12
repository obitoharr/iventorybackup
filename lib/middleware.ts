// lib/middleware.ts - Performance and compression middleware
import { NextResponse, NextRequest } from "next/server";

/**
 * Request performance monitoring middleware
 * Logs slow requests and tracks metrics
 */
export function withPerformanceTracking(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const startTime = performance.now();
    const path = req.nextUrl.pathname;

    try {
      const response = await handler(req);
      const duration = performance.now() - startTime;

      // Log slow requests (> 1 second)
      if (duration > 1000) {
        console.warn(`[SLOW_REQUEST] ${path} took ${duration.toFixed(2)}ms`);
      }

      // Add performance headers
      const headers = new Headers(response.headers);
      headers.set("X-Response-Time", `${duration.toFixed(2)}ms`);

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (err) {
      const duration = performance.now() - startTime;
      console.error(`[REQUEST_ERROR] ${path} after ${duration.toFixed(2)}ms:`, err);
      throw err;
    }
  };
}

/**
 * Add cache headers to responses
 */
export function withCacheHeaders(
  response: NextResponse,
  options: {
    maxAge?: number; // seconds
    sMaxAge?: number; // server cache in seconds
    public?: boolean;
  }
) {
  const headers = new Headers(response.headers);

  if (options.public) {
    headers.set("Cache-Control", `public, max-age=${options.maxAge || 300}`);
  } else {
    headers.set("Cache-Control", `private, max-age=${options.maxAge || 60}`);
  }

  if (options.sMaxAge) {
    headers.append("Cache-Control", `, s-maxage=${options.sMaxAge}`);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Rate limit headers based on Upstash usage
 */
export function withRateLimitHeaders(
  response: NextResponse,
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
  }
) {
  const headers = new Headers(response.headers);

  if (rateLimitInfo) {
    headers.set("X-RateLimit-Limit", rateLimitInfo.limit.toString());
    headers.set("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
    headers.set("X-RateLimit-Reset", rateLimitInfo.reset.toString());
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
