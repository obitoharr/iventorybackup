import { Redis } from "@upstash/redis/node";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redisClient =
  url && token
    ? new Redis({
        url,
        token,
      })
    : null;

export const redisEnabled = Boolean(redisClient);
