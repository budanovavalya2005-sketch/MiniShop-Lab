# REA Practical Report: MiniShop Lab

Date: 2026-10-19
Project: `MiniShop Lab`
Target: `http://localhost:3000/` (loopback only)

## 1. Goal

Create a small local Express storefront and use REA as an actual research tool to capture the login page, inspect requests to the local API, and observe catalog search/cart behavior. This is a training exercise, not a production authentication or commerce service.

## 2. Application

The project is in this folder. It has a login view, a seven-item JSON catalog, literal search, an in-memory cart, and a local REST API. It uses two explicitly labeled modes:

- Safe mode validates the synthetic login input and creates an HttpOnly/SameSite=Strict in-memory session only for the documented demo account.
- Training mode simulates an unchecked login response, but always returns `sessionIssued: false`; it never grants access to `/api/account`.

The app binds only to `127.0.0.1`. Product values are rendered with DOM nodes and `textContent`. No external runtime services, real accounts, or user data are used. The only dependency is Express.

The port was initially occupied by OWASP Juice Shop. After the user explicitly approved it, PID 1088 was rechecked as `node.exe` serving the `OWASP Juice Shop` title and stopped. MiniShop then started on port 3000.

## 3. REA Availability and Tools

Before writing project code, `mcp_rea_binary_session` was called with `{}`. Its result showed `analyze_javascript_application` and the browser-provider group available, with no missing client requirements. `capture_browser_scenario` was also available. No REA setup or installation was performed.

Tools actually used:

- `mcp_rea_binary_session` — current REA/browser/static-JS availability check.
- `mcp_rea_analyze_javascript_application` — broad inventory check, then targeted static analysis of MiniShop source files.
- `mcp_rea_capture_browser_scenario` — browser page, network metadata, bounded public API response bodies, catalog search, and cart interaction captures in provider-owned headless Chromium 155.0.8059.80.
- `mcp_rea_inspect_analysis_view` — selected endpoint and module facts from retained JavaScript-analysis Evidence.
- `mcp_rea_get_evidence_bundle` — verified Evidence retention by ID and project digest.

`inspect_analysis_view` does not support `capture_browser_scenario` Evidence. A real call returned `unsupported_target`; browser captures were instead read as their returned/retained capture records. No request/response bodies, header values, cookies, local/session storage, or credentials were captured.

## 4. Exact REA Requests

### Availability check

```json
{"tool":"mcp_rea_binary_session","arguments":{}}
```

### Initial broad static inventory

```json
{
  "tool": "mcp_rea_analyze_javascript_application",
  "arguments": {
    "input_path": "C:/Users/Валентин/Desktop/DatingSite/MiniShop-Lab",
    "format": "directory",
    "integrity_policy": "fail",
    "detail": "summary"
  }
}
```

This first broad pass also parsed installed dependencies: 264 JavaScript files parsed and 15 parse failures were reported. I did not use those dependency results for claims about MiniShop; the final analysis was narrowed to the project-owned files.

### Final targeted static analysis

```json
{
  "tool": "mcp_rea_analyze_javascript_application",
  "arguments": {
    "input_path": "C:/Users/Валентин/Desktop/DatingSite/MiniShop-Lab",
    "format": "directory",
    "integrity_policy": "fail",
    "source_paths": [
      "server.js",
      "public/index.html",
      "public/js/main.js",
      "public/js/api.js",
      "public/js/catalog.js",
      "public/js/cart.js",
      "public/js/state.js",
      "data/products.json",
      "package.json"
    ],
    "detail": "summary"
  }
}
```

### Final browser capture

The browser used a fresh provider-owned profile, empty storage, `http://localhost:3000/`, and blocked service workers. The declared actions were:

1. Wait 400 ms on the initial login view.
2. Click the `Catalog` button.
3. Fill `[data-search-input]` with the literal `journal`.
4. Wait 350 ms for the search debounce.
5. Click `Add Field Notes Journal to cart`.
6. Click `Open cart`.

The capture requested URL/accessibility after each action; at the end it requested URL, DOM, and accessibility. Event families were `network`, `console`, and `page-errors`; request bodies, response bodies, and header values were disabled for that run.

An additional bounded `mcp_rea_capture_browser_scenario` run loaded the login page and opened Catalog with `response_body: true`, `request_body: false`, `header_values: false`, and `max_network_body_bytes: 8192`. It retained bodies for the page and first-party scripts as well as `/api/config` and `/api/products`. I decoded only the two public API JSON bodies; captured HTML/JavaScript bodies were not decoded or statically analyzed in this step and were not copied into artifacts. The `/styles.css` response body (11,482 bytes) exceeded that per-body limit and was unavailable. No authentication request was sent.

### Directed analysis views

`mcp_rea_inspect_analysis_view` was called on the final static Evidence `ev_24ea00c66f781aa6ff1ffc0e0c6330569efb98aa960e9aece8397214896d48f8` for:

- `javascript-facts`, `where.paths: ["server.js"]`, `where.kinds: ["endpoint"]`, properties `endpoint_kind`, `interpretation`, `mechanism`, `value`.
- `javascript-facts`, `where.paths: ["public/js/api.js", "public/js/main.js", "public/js/catalog.js"]`, `include_available_property_keys: true`.

Evidence IDs for these views are `ev_af282447298300a1ad2ec1d15e1d6159f43adc1f487d1fe22d4617701c5e3a38` and `ev_73e9ca657936b5822d001e0acab820f1f675d9d44b94d05775fe341c928d8177`.

## 5. Evidence and Results

| Research | Evidence ID | Confirmed result |
|---|---|---|
| Initial login/search pass | `ev_cd320b2d9dfa7431dfc3eb0ee8827ad827f27f1a9b012dfca1c0ccd04a193aaa` | Captured the login view; subsequent catalog rendering exposed `swatches is not defined`. This was fixed and retested. |
| Post-fix search capture | `ev_71c4da0845ab1ad75eb40d9bb6e1f969af0c1bd71526450bb8da581d302b5960` | All steps completed; `journal` produced one visible result, Field Notes Journal. |
| Post-accessibility cart retest | `ev_bb54d29868006cec9c28ef20e3d8032750cc3d14db69011426e5bd21c6ba2cd3` | Unique product button label worked; cart showed one Field Notes Journal at $8.50. |
| Initial cart locator diagnostic | `ev_91f32943a1a170a2007ecdb0db18745c84e9c3a35fb6bcf17948accce343edd4` | REA stopped safely because seven identically named `Add to cart` buttons made the locator ambiguous; product-specific accessible names were added before the successful retest. |
| Final combined browser capture | `ev_a649b819cfff1c08644122c8847840bd754416935c759b054c48451ad17131c0` | All six declared actions completed. 30 events retained, 0 dropped, 0 page errors, 0 console events; provider-owned Chromium cleanup completed. |
| Bounded API response-body capture | `ev_97e46eaf2fb45fb177b69fd29c8a5e2e1af0e1518f9a7544b1f9c2fbd1b73317` | Public config and catalog bodies captured; request bodies/header values omitted; stylesheet body exceeded the 8 KiB limit. |
| Final static analysis | `ev_24ea00c66f781aa6ff1ffc0e0c6330569efb98aa960e9aece8397214896d48f8` | Directory snapshot digest at analysis time `a198f22f9b6f870e521d1987ae7cb3bc7c164af2905434cc0e3ae4dbc8acb9cd`; report/response artifacts were written later and selected source files were unchanged. 6 selected JS files parsed, 0 skipped, 0 parse failures; 354 inventoried files left outside the selected source scope; overall graph coverage partial. Summary view: `ev_a4f394087206e615dcf1fe955a3999026bfa026fea1ec50a4e0396a4077b1f58`. |

`mcp_rea_get_evidence_bundle` confirmed the final static analysis and final browser captures as `complete-record` entries. No full-session bundle was exported.

### Network facts

The final browser capture observed same-origin responses from `http://localhost:3000`:

- `GET /` — 200.
- `GET /api/config` — 200.
- `GET /api/products` — 200.
- `GET /api/products?q=journal` — 200; the captured request retained query key `q` and the test value was the literal `journal`.
- Local scripts `/js/main.js`, `/js/api.js`, `/js/catalog.js`, `/js/cart.js`, `/js/state.js` and `/styles.css` — 200.

No non-local origins were observed in the final interaction capture. In the separate bounded body capture, `/api/config` returned `appName: MiniShop Lab`, `mode: safe`, `availableModes: [safe, training]`, `apiVersion: 1`, `localOnly: true`, and `demoCredentialsExposed: false`. `/api/products` returned count 7 and the seven product names recorded in `artifacts/rea-api-responses.json`. These are observed response fields, not a security assessment. Header values and request bodies were not captured.

### Static endpoint facts

REA classified the following in `server.js`:

- Observed literal registrations: `POST /api/mode` (lines 51–60), `POST /api/login` (81–108), and `POST /api/logout` (110–115).
- Candidate GET routes: `/api/config` (40–49), `/api/products` (62–72), `/api/products/:id` (74–79), `/api/account` (117–119), and `*splat` (122). REA marked these as inferred/low-confidence candidates; the analyzer explicitly warns that static endpoint candidates do not prove network behavior.
- In `public/js/api.js`, the static request target is a `url` expression passed to `fetch` (lines 4–8), not a complete literal. Runtime capture provides the concrete observed paths independently.

## 6. Observations

### Observation 1 — Catalog renderer regression

**Fact:** The first REA accessibility capture exposed the catalog status `swatches is not defined`. The renderer referenced a removed swatch array. After changing swatch selection to seven local CSS classes, REA captured one search result for `journal`, and the later cart capture displayed the item and subtotal.

**Possible risk:** Before the fix, catalog cards could not render after navigation/search. This was a functional failure, not a security vulnerability.

**Confidence:** High; directly visible in REA accessibility snapshots before and after the fix.

**Manual verification:** Open the catalog, search `journal`, confirm one Field Notes Journal card, add it, and confirm Cart (1) and $8.50.

### Observation 2 — Login mode boundary

**Fact:** In Safe mode, a malformed email/short password request returned 400. The synthetic demo login returned 200; `/api/account` returned 200 with that session, logout returned 200, and `/api/account` returned 401 afterward. In Training mode an empty JSON login request returned `simulated: true` and `sessionIssued: false`; `/api/account` remained 401. Safe mode was restored afterward.

**Possible risk:** A caller that treats Training mode's `ok: true` as proof of authentication could misread the response. The response explicitly marks the result as simulated, issues no session, and the protected endpoint denied access in the check.

**Confidence:** High for the tested local request/response behavior; the browser REA capture itself did not submit the login form.

**Manual verification:** Repeat the documented local PowerShell tests in `artifacts/api-verification.json`; do not use real credentials.

### Observation 3 — Search request and literal rendering

**Fact:** REA recorded `GET /api/products?q=journal` with status 200 and one accessible result. The selected client source uses `encodeURIComponent` for the query and the catalog renderer assigns product name/category/description through `textContent`.

**Possible risk:** The REA static graph cannot establish all runtime call paths or arbitrary future data sources. A future refactor to HTML-string rendering or acceptance of remote product data would need a new review. No current vulnerability is established by this observation.

**Confidence:** High for the captured request/result and source text inspected; limited for application-wide behavior because the analyzer's graph coverage is partial.

**Manual verification:** Try benign search terms such as `journal`, `tea`, and a string containing `<`/`>`; verify results are filtered and the characters are displayed as text.

## 7. Build and Manual Checks

- Node.js `v26.10.0`; npm `11.19.1`.
- `npm.cmd install` installed Express; npm reported 0 vulnerabilities in 66 audited packages.
- `node --check server.js` and `node --check` on each client module passed.
- `npm test --if-present` found no project test script.
- Local checks passed for page/config/product list/product detail, search length, unauthenticated account access, synthetic login/session/logout, and training-mode no-session behavior. Exact outcomes are in `artifacts/api-verification.json`.

## 8. Limitations and Recommendations

- REA static analysis was restricted to nine project-owned paths. 354 other inventoried files were left unselected; the full graph is partial and static analysis did not execute source.
- Browser captures were bounded local scenarios. The final interaction capture omitted all bodies; a separate 8 KiB-limited capture retained HTML/JS and public API bodies. Only config/catalog JSON was decoded for this report; script bodies were not inspected. Header values and browser storage were disabled. No real login credentials were submitted in REA browser scenarios.
- `inspect_analysis_view` does not support `capture_browser_scenario` Evidence; its call returned `unsupported_target`. Browser capture details were summarized from retained capture records instead.
- Training mode is intentionally not authentication. Never use it as an authorization implementation; keep it confined to this loopback lab.
- The demo session store is in memory and the server uses plain HTTP on loopback. For production, use a persistent vetted auth design, server-enforced expiry, HTTPS with Secure cookies, CSRF controls, and automated tests.
- HTTP 200 and endpoint names alone are not vulnerability evidence. No vulnerability is claimed in this report.

## 9. Saved Artifacts

- `artifacts/rea-browser-evidence.json` — browser actions, selected DOM/network facts, and browser Evidence IDs.
- `artifacts/rea-api-responses.json` — selected public config/catalog response fields and body-capture limits.
- `artifacts/rea-static-analysis.json` — source selection, static analysis metrics, endpoint facts, digest, and limitations.
- `artifacts/api-verification.json` — manual local HTTP checks without session token values.
- REA's complete Evidence records remain in the current session; no full-session export was performed.
