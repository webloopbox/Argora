import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';

// User-facing copy, so Polish - like every other exception message in this API.
const RATE_LIMITED_MESSAGE =
  'Dostawca modelu odrzucił zapytanie z powodu limitu żądań. Odczekaj chwilę i spróbuj ponownie.';
const UNAVAILABLE_MESSAGE =
  'Model AI jest chwilowo niedostępny. Spróbuj ponownie za chwilę lub wybierz inny model.';

// Matched against the vendor message as a fallback for SDKs that report a
// throttle without a usable status field. Deliberately narrow: a bare "429"
// is not accepted, because it also shows up in unrelated ids and payloads.
const RATE_LIMIT_PATTERN = /rate limit|too many requests|quota exceeded/i;

/** Log-safe rendering of a thrown value; vendor SDKs reject with non-Error shapes too. */
export function describeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return String(err);
}

/**
 * Vendor SDKs put the HTTP status on differently named fields: `ibm-cloud-sdk-core`
 * sets `status`, OpenAI-compatible clients set `status` or `statusCode`, and a raw
 * axios rejection keeps it under `response.status`. Read whichever is present rather
 * than coupling this to one SDK - the registry can serve any of them.
 */
function statusOf(err: unknown): number | null {
  if (typeof err !== 'object' || err === null) return null;
  const source = err as Record<string, unknown>;

  for (const key of ['status', 'statusCode']) {
    const value = source[key];
    if (typeof value === 'number') return value;
  }

  const response = source['response'];
  if (typeof response === 'object' && response !== null) {
    const nested = (response as Record<string, unknown>)['status'];
    if (typeof nested === 'number') return nested;
  }

  return null;
}

/**
 * Translates a provider failure into a response the client can act on.
 *
 * Without this, a watsonx throttle (its shared plan allows 2 requests per second,
 * so two AI actions fired back to back are enough) escaped as a generic 500 with
 * the raw English SDK message - indistinguishable from a real server fault, and
 * unactionable for the user.
 *
 * Only two outcomes are produced on purpose: 429 tells the user to wait, anything
 * else is an upstream outage they can only answer by retrying or switching model.
 * Vendor internals (keys, endpoints, quota details) never reach the response body.
 */
export function upstreamAiException(err: unknown): HttpException {
  const status = statusOf(err);
  const message = err instanceof Error ? err.message : String(err);

  if (
    status === HttpStatus.TOO_MANY_REQUESTS ||
    RATE_LIMIT_PATTERN.test(message)
  ) {
    return new HttpException(
      RATE_LIMITED_MESSAGE,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  return new ServiceUnavailableException(UNAVAILABLE_MESSAGE);
}
