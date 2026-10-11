import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Which Redis database each kind of data lives in. Everything works with a single database (the default), and each extra database that is
 * configured takes a share of the load off it, so each database carries only its own part of the traffic.
 *
 *   UPSTASH_REDIS_REST_URL / _TOKEN             the main database: the cache and the rate limiter. Required for Redis to be used at all.
 *   UPSTASH_REDIS_STATE_REST_URL / _TOKEN       optional. What the site must remember between requests (the live poll's notes, locks, who has
 *                                               to sign in again). Kept apart so flushing or filling the cache can never touch it.
 *   UPSTASH_REDIS_CACHE_2_REST_URL / _TOKEN     optional, and so on up to _6_. More cache databases: each cache namespace lives on exactly one
 *                                               of them (see CACHE_ORDER in cache.ts), so a read is still one request.
 *
 * Everything here is a copy of something that can be rebuilt, so losing any of these databases costs a few slow minutes and never data.
 */
const connect = (name: string, urlKey: string, tokenKey: string) => {
  const url = process.env[urlKey];
  const token = process.env[tokenKey];
  if (!url || !token) return null;
  if (!url.startsWith("https://")) {
    console.error(`${name} is disabled because ${urlKey} is not an https address.`);
    return null;
  }
  try {
    return new Redis({ url, token });
  } catch (error) {
    console.error(`${name} is disabled because its configuration is invalid:`, error);
    return null;
  }
};

const main = connect("Upstash Redis", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN");
const state = connect("Upstash Redis (state)", "UPSTASH_REDIS_STATE_REST_URL", "UPSTASH_REDIS_STATE_REST_TOKEN");

const cacheDatabases: Redis[] = main ? [main] : [];
for (let n = 2; n <= 6; n++) {
  const extra = connect(`Upstash Redis (cache ${n})`, `UPSTASH_REDIS_CACHE_${n}_REST_URL`, `UPSTASH_REDIS_CACHE_${n}_REST_TOKEN`);
  if (extra && main) cacheDatabases.push(extra);
}

/** The main database (cache and rate limiter), or null when Redis is not configured. */
export const getRedis = () => main;

/** Where the site's working memory lives: its own database if one is configured, otherwise the main one. Null when Redis is not configured. */
export const getStateRedis = () => state ?? main;

/** Every database that holds cache, the main one first. */
export const getCacheDatabases = () => cacheDatabases;
