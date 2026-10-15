# Travel Case — UI Generator Prompt

*Copy everything below into your UI generator of choice (Stitch, v0, Lovable, Galileo, Figma AI, etc.). Written as a single master prompt; trim sections if your tool has a length limit.*

---

## Project Overview

Design a responsive web app UI for **Travel Case**, a full-service Online Travel Agency (OTA) covering flight bookings, hotel bookings, car rentals, and travel add-ons (airport transfers, travel insurance). The platform serves two distinct user types from the same product:

1. **B2C — individual travelers** booking their own trips.
2. **B2B — reselling travel agents** booking on behalf of clients at agent rates.

Benchmark the UI/UX patterns against **Priceline, Opodo, Kiwi.com, and Ixigo** for the consumer side, and **Sabre Mosaic Agency Workspace** (Sabre's agent-facing booking tool) for the agent side. Do not copy their branding — only their layout logic and interaction patterns (unified multi-vertical search, fare-rule transparency, filter/sort conventions, agent rate visibility).

---

## Brand Identity

**Name:** Travel Case
**Brand feeling:** Trustworthy, corporate, confident — not playful, not budget/discount-feeling.

**Logo:** Icon + wordmark lockup (both required, not wordmark-only).
- Icon: an abstract compass/star mark (four-pointed directional star, like a compass rose reduced to its simplest form), rendered in gold on a rounded-square navy badge.
- Wordmark: "Travel Case" set in a confident geometric sans-serif, medium-bold weight, tight letter spacing.
- Lockup: icon to the left, wordmark to the right, small consistent gap between them.

**Color palette — "Deep Navy & Steel":**
| Role | Hex | Usage |
|---|---|---|
| Primary (Navy) | `#0B2545` | Header/nav backgrounds, primary text on light surfaces, dark hero sections |
| Primary Dark (Navy 2) | `#123063` | Gradient endpoint, secondary dark surfaces |
| Secondary (Steel Blue) | `#3A6EA5` | Links, secondary buttons, icon accents |
| Accent (Gold) | `#C9A24B` | Primary CTAs, highlights, badges — used sparingly, never as a full background |
| Accent Dark (Gold Dark) | `#A9823A` | Hover states for gold elements |
| Neutral background | `#EDEFF2` | Page background outside of cards |
| Card/surface | `#FFFFFF` | All cards, forms, panels |
| Ink (text) | `#1B2033` | Primary text |
| Slate (muted text) | `#5C6470` | Secondary/meta text |
| Line (borders) | `#DCE1E8` | Dividers, input borders |
| Success | `#1E9E6B` | Confirmed status, non-stop flight indicators |
| Warning/Error | `#C9302C` | Errors, cancellation warnings |

**Typography:**
- Display/headings: **Space Grotesk** (medium/semibold/bold weights) — used for the wordmark, page titles, section headers, prices.
- Body/UI text: **Inter** (regular/medium/semibold) — used for everything else: body copy, form labels, buttons, table content.

**Visual style notes:**
- Rounded corners throughout (10–16px on cards, 8px on inputs/buttons), not sharp-edged.
- Soft, low-opacity navy-tinted shadows on cards (not harsh drop shadows).
- Dark navy hero sections with a subtle gradient (navy → navy-2), gold used only for CTAs and small accent badges — never large gold fields.
- Avoid generic "AI startup" look (no glassmorphism-heavy hero, no purple/violet gradients, no overly rounded blob shapes).

---

## Screens to Design

### B2C (Consumer) Flow

**1. Home / Search**
- Dark navy hero section with headline and subheading.
- Vertical tab switcher for Flights / Hotels / Cars / Activities / Transfers, styled like folder tabs sitting on top of the search card.
- Search card (white, floating over the hero) with: trip-type radio (round trip / one way / multi-city), From/To fields with a swap button between them, date fields, passenger count, and a gold "Search" button.
- Below the hero: a "Popular this month" destination card grid (4 columns), and a 3-item "Why Travel Case" trust-signal row (live pricing, unified checkout, agent rates available).

**2. Search Results**
- Top summary bar (navy) showing the searched route/dates with an "Edit search" button.
- Left sidebar: filters (price range slider, stops, airline checkboxes with result counts).
- Main column: sortable result cards (Best / Cheapest / Fastest chips), each flight result showing airline badge, departure/arrival times and airports, duration, stop info, and price with a "Select" button.
- Below flight results on the same page: a "Hotels for these dates" section with horizontal hotel cards (image, name, location, star rating with review count, price per night, "Add" button).

**3. Hotel/Item Detail Page**
- Photo gallery grid (one large image + four smaller supporting images).
- Two-column body: left side has property name, location, guest rating pill, description, amenities checklist grid, and guest review cards; right side has a sticky booking box (price per night, date fields, "Reserve now" button, "you won't be charged yet" reassurance text).

**4. Checkout**
- Two-column layout: left side has the itinerary summary strip (gold left border) listing each booked component (flight, hotel) with its price, followed by numbered form sections for traveler details and payment (card fields, tokenization note).
- Right side: sticky fare summary card (navy background) itemizing each component, taxes/fees, and total, with a gold "Confirm & pay" button and a security reassurance line.

**5. Login / Sign Up**
- Split-screen layout: left half is a navy panel with the logo, a headline, and supporting copy; right half is a white panel with a tab switch between "Log in" and "Sign up," each with minimal form fields and a primary submit button.

### B2B (Agent) Flow

**6. Agent Dashboard**
- Same top navigation as B2C but with a small gold "AGENT" badge next to the logo, and an "Exit agent portal" link instead of consumer nav links.
- Welcome header with agency name and partner-since date, plus a prominent "New booking" CTA.
- Stat card row (4 cards): bookings this month, commission earned (gold-colored number), pending approvals, client satisfaction score.
- Two-column panel section below: left panel is a "Recent bookings" list (client name, booking type badge, status badge, commission earned per row); right panel is "Your agent rate vs. client rate" showing a struck-through client price next to a highlighted agent price for flights/hotels/cars.

---

## Interaction & Structure Notes

- All screens should feel like one connected app — consistent header/nav, consistent card styling, consistent spacing — not like disconnected mockups.
- Navigation between screens should be real (clicking "Search" goes to results, clicking a hotel goes to its detail page, clicking "Select"/"Reserve now" goes to checkout), not placeholder links.
- Design mobile-responsive layouts, but prioritize desktop/web first — this is a web app MVP, no native mobile app.
- Use realistic placeholder content (Nigerian/African + international routes and destinations, NGN currency as primary, since the primary market is Nigeria/West Africa with USD/GBP/EUR as secondary currencies) rather than generic Lorem Ipsum or US-only examples.

---

## What NOT to Do

- Don't use purple/violet gradients or glassmorphism-heavy styling — this should read as corporate/trustworthy, not "AI product" generic.
- Don't make the gold accent color a large background fill anywhere — it's for CTAs and small highlights only.
- Don't merge the B2C and B2B navigation into one confusing shared view — the agent context should always be visually distinct (badge, different top-right actions).
- Activities/tours is a confirmed P0 vertical (sourced via a separate provider like Viator/GetYourGuide) — don't drop it from search/results even though it's not featured as prominently as flights in the hero.
