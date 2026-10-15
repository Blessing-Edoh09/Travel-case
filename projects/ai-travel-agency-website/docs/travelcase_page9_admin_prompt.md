# Travel Case — Admin Back-Office Prompt (Page 9 of 9)

*Paste into your UI generator. This is an internal tool for Travel Case staff, not reachable from the public site's navigation — it's a separate login/area entirely. Per the SRS/PRD, admin owns agent approval and the per-vertical markup caps that bound what agents can charge.*

---

## Page Purpose

Internal back-office for Travel Case staff to: approve or reject new agent registrations, set the maximum markup percentage per vertical (the cap that bounds every agent's pricing), and see all bookings/agents at a platform level. This is not a consumer or agent-facing page — it should read as a plain internal admin tool, not a branded marketing experience.

## Brand System (functional, not marketing)

- **Colors:** Navy `#0B2545` (sparingly, mainly the sidebar), Steel Blue `#3A6EA5`, Gold `#C9A24B` (used minimally here — this is an internal tool, not a place to sell anything), Neutral background `#EDEFF2`, Card white `#FFFFFF`, Ink text `#1B2033`, Slate muted text `#5C6470`, Border `#DCE1E8`, Success green `#1E9E6B`, Warning amber, Error red `#C9302C`.
- **Typography:** Inter throughout, including headings — Space Grotesk's more expressive display styling isn't necessary here; this page prioritizes legibility and density over brand expression.
- **Logo:** small icon + wordmark in the sidebar header, no special treatment — this is a tool, not a landing experience.
- **Layout convention:** left sidebar navigation (not a top nav bar like the rest of the site) — standard admin-panel pattern, since this page has multiple distinct sub-views (Agent Approvals, Markup Caps, All Bookings) rather than one linear flow.

## Page Structure

**1. Left sidebar** (fixed, navy background, full height)
- Small logo lockup at the top.
- Nav items, each with a small icon: "Agent Approvals" (with a small numeric badge showing pending count), "Markup Caps", "All Bookings", "All Agents". Active item highlighted with a solid background block, not just a color change.
- Admin user info (name/role) pinned at the bottom of the sidebar.

**2. Main content area — three views, shown one at a time based on sidebar selection:**

### View A: Agent Approvals (default view)
- Page title "Agent Approvals" with a subtitle count ("3 pending").
- A table: agency name, contact name/email, date submitted, business verification status (a small icon indicating documents attached), and two action buttons per row — a solid green "Approve" and an outlined red "Reject" button, side by side.
- Clicking a row (not the buttons) would expand or navigate to a detail view showing the full submitted registration info — represent this as a simple expand/chevron affordance, doesn't need full detail in this prompt.

### View B: Markup Caps
- Page title "Markup Caps" with a short explanation line: "The maximum markup percentage an agent can apply on top of net rate, per vertical. Agents cannot submit a booking above this cap."
- A simple table/form: one row per vertical (Flights, Hotels, Cars, Other Services), each with the vertical name and an editable percentage input showing its current cap value.
- A "Save changes" button at the bottom, solid navy.
- A small muted note below the table: "Changes apply to new bookings only — bookings already priced under the previous cap are not affected."

### View C: All Bookings
- Page title "All Bookings" with a filter row above the table: a status filter (All/Pending/Confirmed/Flown/Cancelled) as pill tabs, and a search field for client/agent name.
- A dense table: booking ID, agent/agency name, client name, vertical (icon), status badge (same four-state system as the agent dashboard: Pending/Confirmed/Flown/Cancelled), net rate, client price, margin, and date.
- This view is read-only for admin — no edit actions on individual bookings in this prompt, just visibility.

## Content Notes

- Use realistic example data consistent with the rest of the site (Skyline Travel Agency as one example agent, Lagos routes, NGN currency).
- Show at least one pending agent approval with a clearly flagged missing-document state, so the review workflow is visible, not just a happy-path list.
- Keep table rows dense throughout — this mirrors the density principle already established on the consumer results page and the agent dashboard, but taken further, since this is a pure data-management tool.

## What NOT to Do

- Don't reuse the consumer site's top navigation, hero sections, or marketing tone anywhere on this page — it's an internal tool with its own sidebar-based layout convention.
- Don't make this page reachable from any button on the public B2C site or the Agent Dashboard — it's a separate admin login, out of the normal user flow entirely.
- Don't add agent-facing features here (booking creation, itinerary sending) — this page is for platform oversight and configuration only, not for transacting.
- Don't skip the "changes apply to new bookings only" note on the Markup Caps view — it's a real behavior called out explicitly in the SRS (Section 8.6) and matters for admin to understand before changing a live cap.
