# The `bugdrop-elasbit-dev` Worker (fork testbed)

A Cloudflare Worker on `workers.dev` that runs this fork's `elasbit` branch so
fork-side changes can be exercised end to end. It is a **testbed only**: Holver
does not use it. Holver runs its own vendored copy of this code
(`packages/bug-report` in `elasbit-tech/holver`) on AWS Lambda behind API
Gateway, and nothing in Holver points at this Worker.

## Why its configuration is not in `wrangler.toml`

This repository is public. The Worker's configuration names Holver's dev-portal
origin, whose hostname label is deliberately random so it cannot be guessed, and
the Cloudflare account id. Committed, both are readable by anyone, which defeats
the point of the random label.

So the `[env.elasbit-dev]` section lives in a local file that git ignores, and
`wrangler.toml` on `elasbit` stays byte-identical to upstream's (`main`). That
second property is worth keeping for its own sake: `git merge main` into
`elasbit` can never conflict on `wrangler.toml`.

**Removing the values from the tree does not remove them from history.** They
were committed in `517b1af` and pushed to the public `elasbit` branch. Treat the
dev-portal label as disclosed: rotate it on the Holver side (Holver's
`docs/runbooks/portal-dev-deploy.md`, "Rotate the obfuscated subdomain label")
rather than relying on the file being gone.

## Files

| File | Tracked | What it holds |
|---|---|---|
| `wrangler.toml` | yes | upstream's config, unchanged |
| `wrangler.elasbit-dev.local.toml` | **no** (`wrangler.*.local.toml` in `.gitignore`) | only the `[env.elasbit-dev]` section, real values |
| `wrangler.elasbit-dev.deploy.local.toml` | **no** | generated at deploy time; never edit it |

## Recreating the local file

If `wrangler.elasbit-dev.local.toml` is missing (a new machine, a fresh clone),
create it from this template. Every `<…>` is a placeholder; none of the real
values belong in a tracked file, an issue or a PR.

```toml
[env.elasbit-dev]
name = "bugdrop-elasbit-dev"
account_id = "<cloudflare-account-id>"
workers_dev = true
preview_urls = false
routes = []

[env.elasbit-dev.vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "<https://dev-portal-origin>"
ALLOWED_REPOSITORIES = "elasbit-tech/holver"
GITHUB_APP_NAME = "elasbit-bugdrop"
ROOT_REDIRECT_URL = "https://elasbit.com"
MAX_SCREENSHOT_SIZE_MB = "5"

[[env.elasbit-dev.kv_namespaces]]
binding = "RATE_LIMIT"
id = "<rate-limit-kv-id>"
preview_id = "<rate-limit-kv-preview-id>"

[env.elasbit-dev.durable_objects]
bindings = [{ name = "FEEDBACK_COUNTER", class_name = "FeedbackCounter" }]

[env.elasbit-dev.assets]
directory = "public"
binding = "ASSETS"

[[env.elasbit-dev.kv_namespaces]]
binding = "INSTALLATION_ANALYTICS"
id = "<installation-analytics-kv-id>"

[env.elasbit-dev.triggers]
crons = []
```

Where each value comes from:

- `<cloudflare-account-id>` — `npx wrangler whoami`, the account that owns
  `bugdrop-elasbit-dev`.
- `<https://dev-portal-origin>` — `https://<label>.dev.holver.ai`, where
  `<label>` is Holver's AWS SSM parameter `/holver/portal-dev/host-label`
  (profile `elasbit-dev`). After a rotation, use the new label.
- The three KV ids — Cloudflare dashboard → Workers → `bugdrop-elasbit-dev` →
  Settings → Bindings, or `npx wrangler kv namespace list`.

**Keep `ALLOWED_ORIGINS` in the file.** An `[env.*]` section does not inherit
`[vars]` from the top level, and `src/routes/api.ts` falls back to `'*'` when
`ALLOWED_ORIGINS` is unset. A section without it deploys a Worker that accepts
any origin, and nothing fails to tell you.

## Deploying

```bash
cat wrangler.toml wrangler.elasbit-dev.local.toml > wrangler.elasbit-dev.deploy.local.toml
npx wrangler deploy --config wrangler.elasbit-dev.deploy.local.toml --env elasbit-dev
```

Why the two files are concatenated rather than one kept whole: `--config` takes
a complete configuration, and an `[env.*]` section inherits the top-level keys
it does not override — `main`, `compatibility_date`, `[[migrations]]` — from
the same file. Concatenating keeps upstream's `wrangler.toml` the single source
for those keys instead of a hand-copied duplicate that drifts every time
upstream changes them. The generated file lives at the repository root because
wrangler resolves `main` and `assets.directory` relative to the config file.

If the local file is missing, `cat` fails and nothing deploys.

To check a change without deploying:

```bash
npx wrangler deploy --config wrangler.elasbit-dev.deploy.local.toml --env elasbit-dev --dry-run --outdir .wrangler/elasbit-dev-dry-run
```

## Secrets

Secrets live in Cloudflare, not in any file. The names are the ones
`wrangler.toml` lists (`GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`,
`GITHUB_WEBHOOK_SECRET`, and the optional `AUTH_TOKEN_SECRET`, `VARIANT_LABELS`,
`BUGDROP_BOARD_TOKEN_SECRET`). Set or rotate one against this environment:

```bash
npx wrangler secret put GITHUB_APP_ID --config wrangler.elasbit-dev.deploy.local.toml --env elasbit-dev
```

`GITHUB_APP_NAME` above names the `elasbit-bugdrop` GitHub App, and
`ALLOWED_REPOSITORIES` limits the Worker to `elasbit-tech/holver`: a report
filed through this testbed lands in Holver's real issue tracker whenever that
App is installed there.
