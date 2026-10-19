# MiniShop Lab

MiniShop Lab is a local-only Express storefront for practicing safe browser and API inspection. It uses a small JSON product catalog, first-party static JavaScript modules, and no external services.

## Requirements

- Node.js 20 or newer
- npm

## Install and run

```powershell
cd MiniShop-Lab
npm.cmd install
npm.cmd start
```

The server binds to `127.0.0.1:3000` by default. If that port is already occupied, leave the existing process alone and choose an unused local port:

```powershell
$env:PORT = "3001"
npm.cmd start
```

Then open `http://localhost:3001/` (or port 3000 when available). The server does not bind to a network interface accessible to other machines.

## Demo account

Safe mode has one synthetic account for local testing:

- Email: `student@example.test`
- Password: `MiniShop-Lab-Only-42!`

These are demonstration credentials, not a real account. Do not reuse them elsewhere.

## Modes

- **Safe mode** validates email/password shape and length, checks the synthetic account, issues an HttpOnly/SameSite=Strict in-memory session only on an exact match, and protects `GET /api/account`.
- **Training mode** demonstrates an unchecked login decision using a synthetic response. It returns `simulated: true` and `sessionIssued: false`; it does not create a session or authorize any protected endpoint. It is bound to loopback and exists only in this local lab.

The mode is selected with the UI or `POST /api/mode` using `{"mode":"safe"}` or `{"mode":"training"}`. Restarting the process resets it to safe mode and clears in-memory sessions.

## API

- `GET /api/config` — public app and mode metadata; contains no credentials.
- `GET /api/products` — product list; optional `q` query performs a literal substring search.
- `GET /api/products/:id` — one product by numeric ID.
- `POST /api/mode` — switch local practice mode.
- `POST /api/login` — safe synthetic login or non-privileged training simulation.
- `POST /api/logout` — clears the current in-memory demo session.
- `GET /api/account` — returns 401 without a valid safe-mode demo session.

## Code map

- `server.js` — Express routes, local session guard, and response headers.
- `data/products.json` — seven synthetic products.
- `public/index.html` and `public/styles.css` — interface and local styling.
- `public/js/api.js` — same-origin JSON request wrappers.
- `public/js/main.js` — view, login, mode, search, and cart event handling.
- `public/js/catalog.js` — product-card rendering with DOM nodes and `textContent`.
- `public/js/cart.js` — in-memory cart rendering.

## Security practice notes

The training login response is intentionally weak as an authentication decision but grants no access, creates no session, and uses no real credentials or data. Compare it with the Safe mode branch in `server.js`. Product text is rendered as text rather than HTML. The API is intentionally small and is not a production authentication or commerce system.