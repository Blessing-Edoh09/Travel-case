# Travel Case — Booking Detail Prompt (Page 12)

*Paste into your UI generator. Reached after a successful lookup on the Manage My Booking page (page 5) — not from an account/login, since B2C travelers book as guests with no account at all. This is the full detail view of one specific booking.*

---

## Page Purpose

Shows everything about a single booking: full itinerary, class of service, PNR, price paid, and status — plus the actions a traveler can take on it (request cancellation, download/view e-ticket). This is a B2C-only page reached exclusively via booking-reference lookup; agents have their own equivalent booking-row detail inside the Agent Dashboard, not this page.

## Brand System (same as prior pages)

- **Colors:** Navy `#0B2545`, Steel Blue `#3A6EA5`, Gold `#C9A24B` (CTA/accent only), Neutral background `#EDEFF2`, Card white `#FFFFFF`, Ink text `#1B2033`, Slate muted text `#5C6470`, Border `#DCE1E8`, Success green `#1E9E6B`, Amber for pending states, Red for cancelled.
- **Typography:** Space Grotesk for headings/prices, Inter for body/UI.
- **Logo:** icon (hairline gold outline suitcase) + "Travel Case" wordmark.
- **Controls:** solid filled pill buttons for primary actions.

## Page Structure

**1. Header** — same as other B2C pages: logo, nav links, "Manage my booking" (not a logged-in avatar — there's no account, so nothing here indicates a signed-in identity), Agent portal.

**2. Back link** — plain text ("← Look up another booking"), steel blue, above everything else, returning to the Manage My Booking lookup form — not "Back to My Trips," since there's no list this page was drilled down from.

**3. Status banner** (full width, colored by status — steel blue for Confirmed, green for Flown, red-tinted for Cancelled, amber-tinted for Pending/Refund pending)
- Large status label ("Confirmed", "Refund pending", etc.) with the booking reference and PNR shown clearly beside it (e.g. "Booking ref TC-48291　·　PNR: XR7QP2").

**4. Two-column body below the banner**

**Left column (main content):**
- **Itinerary card**: full breakdown of each booked component. For a flight: airline, flight number, departure/arrival times and airports, duration/stops, **class of service** (clearly labeled, e.g. "Economy — fare class Y"), baggage allowance. For a hotel: property name, address, check-in/out dates, room type. Each component in its own clearly separated block within the card, not run together.
- **Traveler details card**: name(s), passport info if applicable — shown as read-only summary, not editable fields here.
- **Fare breakdown card**: itemized price paid (base fare, taxes/fees, total) — same itemization style as the checkout fare summary, but shown as a static receipt here, not an editable cart.

**Right column: action panel** (sticky, white card)
- A "Manage booking" heading.
- For Confirmed trips: an outlined "Request cancellation" button (outlined, not solid gold — this is a consequential but not primary/celebratory action) and a solid gold "Download e-ticket" button.
- For Flown trips: only "Download e-ticket" / "View receipt", no cancellation option.
- For Cancelled/Refund pending trips: a small status timeline instead of action buttons — simple stacked steps (e.g. "Cancellation requested → Refund processing → Refund complete"), with the current step highlighted, so the traveler can see progress without contacting support.

## Content Notes

- Use the same example trip data as the Manage My Booking page (Lagos → Dubai or Lagos → Bali) so this reads as a natural result of that lookup, not a disconnected screen.
- Show class of service explicitly and prominently — this page is the natural place a traveler checks exactly what they booked, and it was easy to lose track of on the results/results-summary pages.
- Make up a realistic PNR format (e.g. 6 characters, letters and numbers) rather than a placeholder like "PNR12345," and keep it consistent with the format referenced on the lookup page.

## What NOT to Do

- Don't make this page editable — traveler details and the fare breakdown are shown as a record of what was booked, not a form to change. Changes go through "Request cancellation" or support, not inline editing.
- Don't show a logged-in avatar, account menu, or any account-related UI in the header — there's no account behind this page at all.
- Don't omit the status timeline for cancelled/refund-pending bookings — refund status needs to be visible even while processing takes time, not just a flat "pending" label with no context.
- Don't use gold fill for "Request cancellation" — that's a consequential action, not the page's primary positive action, so it should be visually secondary (outlined) next to "Download e-ticket."
- Don't show any agent-specific fields (net rate, markup, margin) — this is the traveler's own view of their own booking, at the price they paid, full stop.
