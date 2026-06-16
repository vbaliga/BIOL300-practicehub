/* coi-serviceworker v0.1.7 — https://github.com/gzuidhof/coi-serviceworker */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

function isHTML(response) {
  const ct = response.headers.get("content-type") || "";
  return ct.includes("text/html");
}

function setHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener("fetch", function(e) {
  const req = e.request;
  if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;
  e.respondWith(
    fetch(req).then(response => {
      if (response.status === 0) return response;
      return setHeaders(response);
    })
  );
});
