# Travel Case — Search Results Page Prompt (Page 2 of 8)

*Paste into your UI generator. This is the results page a visitor lands on after searching from the homepage.*

---

## Page Purpose

Results page for whichever vertical was searched (flights, hotels, cars, activities), plus a secondary results section for a complementary vertical shown below it (e.g. hotels for the same destination/dates below flight results), supporting the unified-trip booking model. Shown to B2C travelers and B2B agents alike — same cards, same density, same layout. If the visitor is a logged-in agent, the price shown is Travel Case's **net rate** — the agent's own cost, not a discounted consumer price — clearly labeled as such (e.g. "Net rate" caption under the price) so it's never confused with what the agent will actually charge their client.

## Brand System (same as prior pages)

- **Colors:** Navy `#0B2545` (header/summary bar), Steel Blue `#3A6EA5`, Gold `#C9A24B` (CTA/accent only), Neutral background `#EDEFF2`, Card white `#FFFFFF`, Ink text `#1B2033`, Slate muted text `#5C6470`, Border `#DCE1E8`, Success green `#1E9E6B`.
- **Typography:** Space Grotesk for headings/prices, Inter for body/UI.
- **Logo:** icon (hairline gold outline suitcase) + "Travel Case" wordmark.
- **Controls:** solid filled pill buttons for primary actions and active states, not outlined/ghost buttons — matches the confirmed Wakanow convention (icon-prefixed fields, solid pill trip-type toggle) already applied to Page 1.

## Page Structure

**1. Header** — same as homepage: logo, nav links, language/currency, Log in, Agent portal button. No visual distinction elsewhere on this page for agents — the header button is the only place agent context is indicated.

**2. Search summary bar** (navy, full width, below header)
- Route/destination and dates in bold white text, muted lighter subtext below.
- An "Edit search" pill button, right-aligned — solid filled, not an outlined ghost button.

**3. Two-column body**

**Left sidebar (filters):** compact white card, tight vertical spacing — this is a working tool, not a landing page:
- Price range control (slider with two handles)
- Stops checkboxes (Direct / 1 stop) with result counts, small type
- Airline/category checkboxes with counts

**Right column (results):**
- Sort row: result count on the left, sort pill-chips on the right (Best/Cheapest/Fastest), solid-filled active state.
- **Result rows — compact and dense, closer to a data-table row than a spacious marketing card:**
  - Small airline-code badge (compact, not oversized)
  - Departure time (bold) + airport code (small, muted) directly beside it, minimal gap
  - Duration + stops as one compact inline label (e.g. "7h 40m · Direct" on one line, not spread across sub-rows)
  - Arrival time + airport code
  - Price (right-aligned, bold — the one element allowed to stand out) with a single solid gold "Select" button beside or below it, sized to the row height rather than towering over it
  - Target: a user should be able to scan 6–8 results without much scrolling, not 2–3 results per screen.
- Secondary section below (e.g. "Hotels in [destination] for these dates"): same density principle — compact rows with a small thumbnail, not large image-forward cards.

## Content Notes

- Realistic routes (Lagos origin; Bali, Dubai, Nairobi, London destinations), NGN as the primary displayed currency.
- Include one non-stop and one connecting result so the duration/stops comparison is visible.
- This page should feel like a comparison tool, not a showcase — every extra pixel of padding is a pixel not spent showing another result.
- The row-density spec above is written from general dense-OTA-list conventions (Wakanow's search form was the confirmed reference; their actual results list wasn't available to inspect directly) — if you have a results-page screenshot to compare against, check the row structure here matches before finalizing.

## What NOT to Do

- Don't build a separate "agent view" of this page — same component, same layout, only the price value and its "Net rate" label differ based on login state.
- Don't use spacious card-with-shadow-and-large-padding treatment for each result — that's the density problem this version corrects.
- Don't make filter checkboxes or sort chips more prominent than the actual results — they're tools, not content.
- Don't use outlined/ghost buttons for primary actions (Edit search, Select, sort chips) — solid filled pill buttons throughout.
