import "server-only"

export function authCallback(type: "recovery" | "email") {
  const configured = process.env.CORCPR_AUTH_SITE_URL
  const deployedHost = process.env.VERCEL_URL
  const value = configured || (deployedHost ? `https://${deployedHost}` : null)
  if (!value) return undefined
  try {
    const site = new URL(value)
    if (site.protocol !== "https:" || site.username || site.password || site.pathname !== "/" ||
        site.search || site.hash || (deployedHost && !configured && !site.hostname.endsWith(".vercel.app"))) return undefined
    return new URL(`/auth/confirm?type=${type}`, site).href
  } catch {
    return undefined
  }
}
