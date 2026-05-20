# Room 1913 — operational notes

## Dev server hygiene (important)

Symptom: `Cannot find module './XXX.js'` 500s, intermittent and self-healing on
refresh — almost always caused by **multiple `next dev` processes writing the
same `.next/` directory at the same time**. Next.js dev rebuilds chunks with
fresh hashes on every change; two writers race and the served HTML ends up
pointing at a hash that the other process just overwrote.

Rules:

1. **Only one `next dev` at a time.** Before starting one, run
   `ps aux | grep -E "next dev|next-server" | grep -v grep` and kill any
   survivors. IDE plugins and detached terminals quietly relaunch dev — re-check
   periodically if 500s reappear.
2. **Never `npm run build` while dev is running.** Build also writes `.next/`
   and corrupts the dev server's chunk graph. If a build is required, stop dev
   first, then `rm -rf .next && npm run build`, then restart dev clean.
3. **After any of the above goes wrong**, the recovery is always:
   `pkill -f "next dev"; pkill -f "next-server"; rm -rf .next; npm run dev`
   (in that order — kill writers first, then clear, then start one).
4. Default port is 3000. If something else holds it, fix the squatter rather
   than letting Next pick 3001 — the Vinyl player and any hardcoded URLs assume
   3000.

## Persistence (per-browser localStorage, no backend)

| Concern                       | Key                       | Module             |
| ----------------------------- | ------------------------- | ------------------ |
| Sealed session archives       | `room1913.archive.v1`     | `lib/archive.ts`   |
| Cross-session memory          | `room1913.memory.v1`      | `lib/memory.ts`    |
| In-progress chat draft        | `room1913.draft.v1`       | `lib/draft.ts`     |
| Ambience pref                 | (existing)                | `lib/ambience.ts`  |

Subconscious-map history and current radar state are **derived** from archives
at runtime via `lib/dimensions.ts` (`derivedHistory`, `latestState`). Do not
add a parallel store for them — single source of truth is the archive list.
