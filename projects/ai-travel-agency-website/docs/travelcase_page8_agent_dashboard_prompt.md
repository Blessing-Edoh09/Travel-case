# Travel Case — Agent Dashboard Page Prompt (Page 8 of 9)

*Paste into your UI generator. This is the B2B home base — reached via "Agent portal" in the header from any B2C page. Unlike every other page in this set, this one is genuinely different for agents, not just a pricing variant.*

---

## Page Purpose

The landing page for a logged-in travel agent: shows performance stats, recent client bookings with real statuses (Pending/Confirmed/Flown/Cancelled), default markup settings bounded by admin-set caps, and business branding for white-labeled itineraries. From here, an agent starts a new booking (which drops them into the same Search Results page B2C travelers use, showing net rate instead of a public price). Benchmark the overall feel — data-forward, no-nonsense, built for someone doing this professionally — against Sabre Mosaic Agency Workspace (formerly Sabre Red 360), not against consumer OTA homepages.

## Brand System (same as prior pages)

- **Colors:** Navy `#0B2545`, Steel Blue `#3A6EA5`, Gold `#C9A24B` (accent — used more sparingly here than on consumer pages, mainly for the commission figure and the primary CTA), Neutral background `#EDEFF2`, Card white `#FFFFFF`, Ink text `#1B2033`, Slate muted text `#5C6470`, Border `#DCE1E8`, Success green `#1E9E6B` for confirmed status, amber for pending status.
- **Typography:** Space Grotesk for headings/stats, Inter for body/table content.
- **Logo:** icon (hairline gold outline suitcase) + "Travel Case" wordmark, with a small solid gold "AGENT" badge directly beside it — this badge is the one clear visual signal that distinguishes agent mode from consumer mode.
- **Controls:** solid filled pill buttons for primary actions, consistent with the rest of the site.

## Page Structure

**1. Header** — same logo position as other pages, but with the gold "AGENT" badge next to it, and the nav links/Log in/Agent portal button replaced with a single "Exit agent portal" link (text link, not a button — this is a deliberately low-emphasis way out, since staying in agent mode is the expected default while working).

**2. Welcome row**
- Agent's name and agency name ("Welcome back, Chidi" / "Skyline Travel Agency · Approved partner since Jan 2026") on the left.
- A solid gold "New booking →" button on the right — the primary action on this page, sized and weighted to stand out clearly from everything below it.

**3. Stat card row** — 4 compact cards in a horizontal row:
- Bookings this month (plain number, Space Grotesk)
- Margin earned this month (same style, gold-dark color — the sum of client price minus net rate across bookings; this is the number an agent checks first)
- Pending approvals (plain number)
- Client satisfaction score (green, with a star)
- Keep these cards small and dense — stat tiles, not hero numbers. This is a working tool a professional checks daily, not a celebratory dashboard.

**4. Two-column panel section below the stats:**

**Left panel (wider) — "Recent bookings":**
- A compact table, not cards, with columns: client name + what was booked (e.g. "Femi K. — Flight + Hotel"), a type badge (Flight/Hotel/Car/Bundle, steel-blue pill), a status badge, net rate, client price, and margin (client price minus net rate, green, bold).
- **Status badge uses four real states, not a generic pair**: Pending (amber), Confirmed (steel blue), Flown (green — the travel date has passed and the ticket was used), Cancelled (muted red/grey). Show at least one row of each status so all four are visible.
- Each row has a small "Send itinerary" icon-button (envelope icon) that would trigger emailing the white-labeled itinerary (with PNR) to that booking's client.
- Rows should be dense — this is a scan-and-check list, matching the same density principle used on the consumer Search Results and My Trips pages, not spaced-out cards.

**Right panel (narrower) — "Your pricing":**
- Replaces any "agent rate vs. client rate" comparison — that framing no longer applies now that pricing is agent-controlled, not a fixed discount.
- A short settings list, one row per vertical (Flights, Hotels, Cars, Other services), each showing: the vertical name, a default markup percentage input for that vertical, and the admin-set cap shown alongside it as a small muted label (e.g. "Default: 12%　·　Cap: 18%"). This is where an agent sets the default markup applied automatically to new bookings in that vertical (per SRS 8.2/8.6) — the per-booking override happens at checkout, not here.
- A "Save pricing" button, solid gold, at the bottom of this panel.
- A small caption below explaining that individual bookings can still override these defaults at checkout, within the same cap.

**5. Business branding section** (new panel, full width, below the two-column section):
- A card titled "Your business branding" with a short explanation: "This appears on itineraries and receipts sent to your clients instead of Travel Case's own branding."
- A logo upload control (simple dashed-border drop zone) and a business name text field, pre-filled with the agent's existing settings (e.g. "Skyline Travel Agency").
- A small preview showing how a sample itinerary header would look with their name/logo applied.
- A "Save branding" button, solid gold.

## Content Notes

- Use the same example agent/agency (Chidi, Skyline Travel Agency) and example routes (Lagos–Dubai) as used elsewhere, so this reads as part of the same continuous system.
- Currency in NGN, consistent with the rest of the site.
- This page should feel noticeably more information-dense than the B2C homepage — that's intentional, not a bug to fix. An agent working through many bookings a day needs data density over marketing polish.
- The page is now longer than a typical dashboard (stats, bookings table, pricing settings, branding settings) — that's expected; let it scroll rather than compressing everything above the fold.

## What NOT to Do

- Don't reuse the light, spacious, marketing-forward B2C homepage tone here — this page should read as a professional tool, closer in spirit to Sabre Mosaic Agency Workspace than to Priceline's homepage.
- Don't hide or bury the "Exit agent portal" control, but don't give it button-level visual weight either — it's a text link, intentionally lower-emphasis than "New booking."
- Don't use gold as a background fill anywhere except the "AGENT" badge and primary CTAs — it's still an accent color here, not a dominant one.
- Don't show a fixed "agent rate vs. client rate" comparison anymore — that framing belonged to the old commission-band model. Pricing is now agent-controlled markup on a net rate, shown as editable settings, not a static discount table.
- Don't invent sub-agent management or credit/wallet balance features — those remain out of MVP scope. White-label branding, markup controls, and the four-state booking status, by contrast, are now confirmed MVP requirements — build them, don't omit them as "future" features.
