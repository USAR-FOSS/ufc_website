import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** Extra fields to send back with the error, such as how long to wait. */
    public readonly details: Record<string, unknown> = {},
    public readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string) => new ApiError(message, 400);
export const unauthorized = (message = "Unauthorized") => new ApiError(message, 401);
/** 401 with a code the pages recognise: this member's GitHub connection ran out, so they are sent to sign in again. */
export const reauthRequired = () => new ApiError("Your GitHub connection has run out. Please sign in again.", 401, { code: "reauth" });
export const forbidden = (message = "Forbidden") => new ApiError(message, 403);
export const notFound = (message: string) => new ApiError(message, 404);
export const conflict = (message: string) => new ApiError(message, 409);
/** 503: a service this request depends on could not answer, so the same request is worth making again later. */
export const serviceUnavailable = (message: string) => new ApiError(message, 503);
/** 429, with the standard Retry-After header so clients and proxies know when to come back. */
export const tooManyRequests = (message: string, retryAfterSeconds: number, details: Record<string, unknown> = {}) =>
  new ApiError(message, 429, { ...details, retryAfterSeconds }, { "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))) });

export const json = <T>(body: T, init?: ResponseInit) => NextResponse.json(body, init);

type RouteHandler<TArgs extends unknown[]> = (...args: TArgs) => Promise<NextResponse>;

/** Converts known domain errors to consistent API responses at the HTTP boundary. */
export function withApiErrorHandling<TArgs extends unknown[]>(handler: RouteHandler<TArgs>): RouteHandler<TArgs> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        return json({ error: error.message, ...error.details }, { status: error.status, headers: error.headers });
      }

      console.error("Unhandled API error:", error);
      return json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
