// Thin HTTP client the seed scripts share. Every seed needs the same two
// things: a fetch wrapper that throws a readable error carrying the status
// code, and an idempotent "register, or log in if the account already exists"
// step so a seed can be re-run without wiping the database first.
export function createApiClient({ baseUrl, password }) {
  async function jsonFetch(path, opts = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: opts.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      const err = new Error(
        `${opts.method ?? "GET"} ${path} → ${res.status}: ${text}`,
      );
      err.status = res.status;
      throw err;
    }

    if (res.status === 204) return null;
    return res.json();
  }

  async function registerOrLogin(user) {
    try {
      return await jsonFetch("/auth/register", {
        method: "POST",
        body: { ...user, password },
      });
    } catch (err) {
      if (err.status === 409) {
        return jsonFetch("/auth/login", {
          method: "POST",
          body: { email: user.email, password },
        });
      }
      throw err;
    }
  }

  return { jsonFetch, registerOrLogin };
}
