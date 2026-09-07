const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const renderUnsafePage = (targetUrl: string): string => {
  const safeUrl = escapeHtml(targetUrl);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Warning — URL flagged as unsafe</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #fff7ed 0%, #fff 45%, #fef2f2 100%);
      color: #1e293b;
      padding: 24px;
    }
    .card {
      max-width: 560px;
      width: 100%;
      background: white;
      border: 1px solid #fecaca;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      background: #fef2f2;
      color: #b91c1c;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h1 { font-size: 24px; margin: 20px 0 8px; }
    p { margin: 0 0 12px; line-height: 1.5; color: #475569; }
    .url {
      display: block;
      margin: 20px 0;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      word-break: break-all;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 13px;
      color: #334155;
    }
    .actions { margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap; }
    .btn {
      display: inline-flex;
      align-items: center;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 14px;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn-primary { background: #1e293b; color: white; }
    .btn-primary:hover { background: #0f172a; }
    .btn-secondary { background: transparent; color: #64748b; border: 1px solid #cbd5e1; }
    .btn-secondary:hover { background: #f8fafc; }
  </style>
</head>
<body>
  <main class="card" role="alert">
    <span class="badge">⚠ Safety warning</span>
    <h1>This link was flagged as unsafe</h1>
    <p>
      Our safety check identified this destination as potentially harmful
      (malware, phishing or unwanted software).
      For your protection, we won't redirect you.
    </p>
    <code class="url">${safeUrl}</code>
    <p>
      If you believe this is a mistake, contact the person who shared the link.
      This decision is re-evaluated periodically.
    </p>
    <div class="actions">
      <a class="btn btn-primary" href="/">Back to safety</a>
    </div>
  </main>
</body>
</html>`;
};
