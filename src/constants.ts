/** Sent on every API request so Pay Hub can return `sessionToken` on login (native clients cannot use httpOnly cookies). */
export const CENTY_MOBILE_HEADERS = {
  "X-Centy-Client": "mobile",
} as const;
