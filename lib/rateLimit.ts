// lib/rateLimit.ts
import { NextResponse } from "next/server";
import { redisClient } from "@/lib/redis";

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per interval
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

const memoryStore = new Map<string, { count: number; resetTime: number }>();

async function handleRedisLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const count = Number(await redisClient!.incr(key));
  if (count === 1) {
    await redisClient!.expire(key, Math.ceil(config.interval / 1000));
  }

  const ttl = await redisClient!.ttl(key);
  const remaining = Math.max(0, config.maxRequests - count);
  const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : config.interval);

  return {
    success: count <= config.maxRequests,
    remaining,
    resetTime,
    limit: config.maxRequests,
  };
}

function handleMemoryLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (record && now > record.resetTime) {
    memoryStore.delete(key);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.interval,
      limit: config.maxRequests,
    };
  }

  if (!record) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + config.interval,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.interval,
      limit: config.maxRequests,
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      limit: config.maxRequests,
    };
  }

  record.count++;
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
    limit: config.maxRequests,
  };
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;

  if (redisClient) {
    try {
      return await handleRedisLimit(key, config);
    } catch {
      return handleMemoryLimit(key, config);
    }
  }

  return handleMemoryLimit(key, config);
}

export function getRateLimitIdentifier(req: Request, userId?: string) {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");

  if (forwardedFor) {
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  return "anonymous";
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: "Too many requests",
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetTime.toString(),
      },
    }
  );
}

export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
) {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetTime.toString());
  return response;
}
