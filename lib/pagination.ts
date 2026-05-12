// lib/pagination.ts - Cursor-based pagination for scale
import { z } from "zod";

export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  direction: z.enum(["forward", "backward"]).default("forward"),
});

export type CursorPaginationParams = z.infer<typeof CursorPaginationSchema>;

export interface CursorPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: string | null;
  previousCursor: string | null;
}

export interface CursorPageResult<T> {
  items: T[];
  pageInfo: CursorPageInfo;
  totalCount?: number; // Optional: expensive to compute for large sets
}

/**
 * Encode a cursor from a database row ID and timestamp
 * Format: base64(id:timestamp)
 */
export function encodeCursor(id: string, timestamp: string): string {
  return Buffer.from(`${id}:${timestamp}`).toString("base64");
}

/**
 * Decode a cursor back to id and timestamp
 */
export function decodeCursor(cursor: string): { id: string; timestamp: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const [id, timestamp] = decoded.split(":");
    return { id, timestamp };
  } catch {
    return null;
  }
}

/**
 * Build a Supabase query with cursor-based pagination
 * Assumes table is ordered by created_at DESC (newest first)
 */
export function buildCursorQuery(params: CursorPaginationParams) {
  const { cursor, limit, direction } = params;

  if (!cursor) {
    // First page: get newest items first
    return {
      offset: 0,
      limit: direction === "forward" ? limit + 1 : limit,
      orderByCreatedAt: "desc" as const,
    };
  }

  const decoded = decodeCursor(cursor);
  if (!decoded) {
    throw new Error("Invalid cursor");
  }

  return {
    cursor: decoded.timestamp,
    limit: direction === "forward" ? limit + 1 : limit,
    orderByCreatedAt: direction === "forward" ? ("desc" as const) : ("asc" as const),
  };
}

/**
 * Process cursor pagination results to determine page info
 */
export function processCursorPage<T extends { id: string; created_at?: string }>(
  items: T[],
  params: CursorPaginationParams,
  requestedLimit: number
): CursorPageResult<T> {
  const { direction } = params;
  const hasExtra = items.length > requestedLimit;
  const pageItems = hasExtra ? items.slice(0, requestedLimit) : items;

  const hasNextPage = direction === "forward" && hasExtra;
  const hasPreviousPage = direction === "backward" && hasExtra;

  let nextCursor: string | null = null;
  let previousCursor: string | null = null;

  if (hasNextPage && pageItems.length > 0) {
    const lastItem = pageItems[pageItems.length - 1];
    nextCursor = encodeCursor(lastItem.id, lastItem.created_at || new Date().toISOString());
  }

  if (hasPreviousPage && pageItems.length > 0) {
    const firstItem = pageItems[0];
    previousCursor = encodeCursor(firstItem.id, firstItem.created_at || new Date().toISOString());
  }

  return {
    items: pageItems,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      nextCursor,
      previousCursor,
    },
  };
}
