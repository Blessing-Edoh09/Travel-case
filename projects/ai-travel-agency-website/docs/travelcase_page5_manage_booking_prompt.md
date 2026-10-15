# Travel Case — Manage My Booking Prompt (Page 5, revised)

*Paste into your UI generator. This replaces the earlier account-based "My Trips" page. Per a product decision from the team: B2C travelers book as guests, with no login required — so booking retrieval works by lookup (booking reference + email/last name), the same pattern airlines use for "Manage My Booking," not an account dashboard.*

---

## Page Purpose

Lets any traveler — logged in or not, since there's no B2C login at all — retrieve their booking using their booking reference and either their email or last name. A successful lookup takes them to the Booking Detail page (separate prompt) showing their itinerary, PNR, and status. This page itself is just the lookup step.

## Brand System (same as prior pages)

- **Colors:** Navy `#0B2545`, Steel Blue `#3A6EA5`, Gold `#C9A24B` (CTA/accent only), Neutral background `#EDEFF2`, Card white `#FFFFFF`, Ink text `#1B2033`, Slate muted text `#5C6470`, Border `#DCE1E8`.
- **Typography:** Space Grotesk for headings, Inter for body/UI.
- **Logo:** icon (hairline gold outline suitcase) + "Travel Case" wordmark.
- **Controls:** solid filled pill buttons, icon-prefixed input fields, consistent with the rest of the site.

## Page Structure

**1. Header** — same as homepage, but the header's right-side "Log in" button is replaced with "Manage my booking" (this page is effectively what that link leads to) — "Agent portal" stays as-is, unaffected by this change.

**2. Centered lookup card** (single column, generous whitespace — this is a simple utility page, not a dense list)
- Heading: "Find your booking."
- A short supporting line: "Enter your booking reference and the email or last name used when booking."
- Form fields:
  - Booking reference / PNR (icon-prefixed, e.g. a ticket icon)
  - Email address **or** last name — present as a single field with a toggle/tab above it ("Email" / "Last name") so the traveler can use whichever they remember, not two required fields.
- A full-width solid gold "Find my booking" button.
- Below the button, a muted helper line: "Your booking reference was included in your confirmation email."

**3. Empty/error state** (design this too)
- If the lookup doesn't match anything: an inline message directly above or below the form (not a separate page) — "We couldn't find a booking with those details. Double-check your reference and try again," with the form still visible and editable, not cleared.

## Content Notes

- This page should feel closer to an airline's "Manage My Booking" utility than to a personal account dashboard — plain, functional, no marketing content, no destination imagery.
- Use a realistic example booking reference format consistent with a PNR (e.g. a 6-character alphanumeric code like "TC48291" or similar) as placeholder text in the field.

## What NOT to Do

- Don't design this as a login form — there's no password field, no "create account" link, no account concept at all. It's a one-time lookup, not authentication.
- Don't show a list of multiple bookings — without an account, there's no "all my trips" list to show; each lookup retrieves exactly one booking.
- Don't reference "My Trips" as a nav label anywhere — the correct label throughout the site is "Manage my booking," reflecting that this is a lookup tool, not a personal dashboard.
- Don't add social login, password reset, or any other account-management affordance — none of that applies when there's no account to begin with.
