// lib/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per interval
}

// In-memory store for rate limiting
// In production, use Redis or Upstash for distributed rate limiting
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

export function createRateLimiter(config: RateLimitConfig) {
  return (identifier: string) => {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    const record = rateLimitStore.get(key);

    // Clean up expired records
    if (record && now > record.resetTime) {
      rateLimitStore.delete(key);
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.interval,
      };
    }

    if (!record) {
      // First request in this window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.interval,
      });
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.interval,
      };
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    // Increment counter
    record.count++;
    return {
      success: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  };
}

export type RateLimitResult = ReturnType<ReturnType<typeof createRateLimiter>>;

export function rateLimitResponse(
  result: RateLimitResult,
  req: NextRequest
) {
  if (!result.success) {
    const resetTime = new Date(result.resetTime).toUTCString();
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: Math.ceil(
          (result.resetTime - Date.now()) / 1000
        ),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(
            (result.resetTime - Date.now()) / 1000
          ).toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      }
    );
  }

  return null;
}

export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult) {
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  return response;
}
