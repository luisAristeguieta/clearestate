<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- ERP state (active role, project filter, budget lines, adjustments) lives in `src/context/ErpContext.tsx` persisted to localStorage; seed data and financial rules live in `src/config/erpConfig.ts` — Phase 1 is a local synthetic-data prototype.
- Signed-in screens are children of the pathless `src/routes/_erp.tsx` layout (ssr: false, redirects to /login without a role); unbuilt modules render via `/modulo/$moduleId` — one generic route until each module is built.
- Dashboard priority actions are assembled in `src/config/dashboardConfig.ts` and tested independently of presentation so budget urgency stays consistent across layout changes.
- Browser view titles are centralized in `src/config/brandConfig.ts`, applied globally after navigation and mirrored in route head metadata; shared branding uses transparent light/inverse image assets and an icon-only SVG favicon.
- Phase 2 transactional cycle (requisitions, supplier invitations, purchase orders, invoices, work contracts) keeps its types, seeds and pure budget rules in `src/config/phase2Config.ts` with tests beside it; each built module gets its own `_erp.modulo.<id>.tsx` route, and the public supplier portal lives outside `_erp` at `src/routes/portal-proveedor.$token.tsx`.
- Phase 2 views use the shared `phase2-view` presentation scope and semantic StatusBadge tones so visual changes remain isolated from transactional rules.
- Phase 3 conceptual simulation lives in `phase3Config.ts` and `Phase3Context.tsx` with a separate local storage key to preserve earlier phases; Oracle, channel deliveries and the assistant are explicitly simulated, and the role matrix documents permissions without claiming security enforcement.
- Buyer and campaign detail routes un-nest from their content parents so each view renders independently; Phase 3 route metadata uses the shared head helper.
