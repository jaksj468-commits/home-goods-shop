const COOKIE_NAME = "pex_verified";
const SESSION_SECONDS = 24 * 60 * 60;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.UPSTREAM_ORIGIN || !env.TURNSTILE_SITEKEY || !env.TURNSTILE_SECRET || !env.SESSION_SECRET) {
      return new Response("Worker setup incomplete. Add the required Cloudflare variables and secrets.", { status: 503 });
    }

    if (url.pathname === "/__verify" && request.method === "POST") {
      return verifyHuman(request, url, env);
    }

    if (!(await hasValidSession(request, env))) {
      return new Response(challengePage(env.TURNSTILE_SITEKEY, url.pathname + url.search), {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "referrer-policy": "same-origin"
        }
      });
    }

    const upstream = new URL(url.pathname + url.search, env.UPSTREAM_ORIGIN);
    const headers = new Headers(request.headers);
    headers.delete("cookie");
    headers.delete("host");
    headers.delete("cf-connecting-ip");

    const proxyRequest = new Request(upstream.toString(), {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual"
    });
    const response = await fetch(proxyRequest);
    const outHeaders = new Headers(response.headers);
    outHeaders.set("x-robots-tag", "noindex, nofollow");
    outHeaders.delete("set-cookie");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outHeaders
    });
  }
};

async function verifyHuman(request, url, env) {
  const form = await request.formData();
  const token = form.get("cf-turnstile-response");
  if (typeof token !== "string" || !token) {
    return new Response("验证信息缺失，请返回后重试。", { status: 400 });
  }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET,
    response: token
  });
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) body.set("remoteip", ip);

  const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  const result = await check.json();
  if (!result.success || (result.action && result.action !== "pex_gate")) {
    return new Response(challengePage(env.TURNSTILE_SITEKEY, safeNext(form.get("next")) , "验证失败，请重试。"), {
      status: 403,
      headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "no-store" }
    });
  }

  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = String(expires);
  const signature = await sign(payload, env.SESSION_SECRET);
  const next = safeNext(form.get("next"));
  return new Response(null, {
    status: 303,
    headers: {
      "location": next,
      "set-cookie": `${COOKIE_NAME}=${payload}.${signature}; Max-Age=${SESSION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      "cache-control": "no-store"
    }
  });
}

async function hasValidSession(request, env) {
  const cookieHeader = request.headers.get("cookie") || "";
  const item = cookieHeader.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE_NAME + "="));
  if (!item) return false;
  const value = item.slice(COOKIE_NAME.length + 1);
  const dot = value.indexOf(".");
  if (dot < 1) return false;
  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expires = Number(payload);
  if (!Number.isFinite(expires) || expires <= Math.floor(Date.now() / 1000)) return false;
  const expected = await sign(payload, env.SESSION_SECRET);
  return constantTimeEqual(signature, expected);
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64url(new Uint8Array(signature));
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function safeNext(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\r") || value.includes("\n")) return "/";
  return value;
}

function challengePage(sitekey, next, error = "") {
  const safePath = escapeHtml(safeNext(next));
  const message = error ? `<p class="error">${escapeHtml(error)}</p>` : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>www.pexshop.com — 安全验证</title>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#0a0a0a;color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;display:grid;place-items:center;padding:24px}
.panel{width:min(100%,480px);border:1px solid #333;padding:42px 32px;text-align:center}
.brand{font-weight:800;letter-spacing:3px;font-size:22px}.line{width:48px;height:2px;background:#eee;margin:25px auto}
h1{font-size:25px;margin:0 0 12px}p{color:#aaa;line-height:1.6;font-size:14px}.widget{display:flex;justify-content:center;margin:28px 0}.error{color:#fff}
button{background:#f5f5f5;color:#111;border:0;padding:14px 28px;font-weight:700;letter-spacing:1px;cursor:pointer;width:100%}
small{display:block;color:#666;margin-top:25px;font-size:11px}
</style>
</head>
<body><main class="panel">
<div class="brand">www.pexshop.com</div><div class="line"></div>
<h1>正在进行安全验证</h1>
<p>本网站使用安全服务防护恶意自动程序。在验证您不是自动程序期间，将显示此页面。</p>
${message}
<form method="POST" action="/__verify">
<input type="hidden" name="next" value="${safePath}">
<div class="widget"><div class="cf-turnstile" data-sitekey="${escapeHtml(sitekey)}" data-action="pex_gate" data-theme="dark"></div></div>
<button type="submit">继续</button>
</form>
<small>安全验证 · www.pexshop.com</small>
</main></body></html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
