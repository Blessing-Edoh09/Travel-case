# Travel Case — Hotel / Item Detail Page Prompt (Page 3 of 8)

*Paste into your UI generator. This is the single-property detail page a visitor lands on after clicking a hotel from search results (or, structurally, any single bookable item — car, activity — that needs its own detail page beyond a results-list row).*

---

## Page Purpose

Shows full detail on one property: photos, description, amenities, guest reviews, and a booking box to reserve it. Same page for B2C travelers and B2B agents — no separate agent layout. If an agent is logged in, the price shown in the booking box is Travel Case's **net rate** (the agent's cost), clearly labeled "Net rate" — not a discounted consumer price. The agent sets their markup at the checkout/ticketing step, not here.

## Brand System (same as prior pages)

- **Colors:** Navy `#0B2545`, Steel Blue `#3A6EA5`, Gold `#C9A24B` (CTA/accent only), Neutral background `#EDEFF2`, Card white `#FFFFFF`, Ink text `#1B2033`, Slate muted text `#5C6470`, Border `#DCE1E8`, Success green `#1E9E6B`.
- **Typography:** Space Grotesk for headings/prices, Inter for body/UI.
- **Logo:** icon (hairline gold outline suitcase) + "Travel Case" wordmark.
- **Controls:** solid filled pill buttons for primary actions, not outlined/ghost buttons (matches the confirmed Wakanow convention already applied to Pages 1–2).

## Page Structure

**1. Header** — same as prior pages: logo, nav links, language/currency, Log in, Agent portal button.

**2. Back link** — a plain text link above the gallery ("← Back to results"), steel blue, no button styling — this is a navigation aid, not a CTA.

**3. Photo gallery**
- A grid layout: one large image on the left, four smaller supporting images arranged 2×2 on the right, all with consistent rounded corners as a single unified block (not individually-cornered separate cards).
- Use gradient placeholder blocks (navy/steel/gold tones) rather than stock photography, consistent with how prior pages handle image placeholders.

**4. Two-column body below the gallery**

**Left column (main content):**
- Property name (Space Grotesk, large) and location line (muted, smaller) side by side with a rating pill on the right (navy background, white bold score, small "X reviews" caption underneath in muted text).
- A short description paragraph (2–3 sentences, plain Inter body text).
- An amenities grid — 3 columns, each item a short label with a small green checkmark prefix (free cancellation, private pool, free breakfast, airport shuttle, spa/wellness, free Wi-Fi, etc.) — compact, not oversized icons.
- A "Guest reviews" section: 2–3 review cards, each with reviewer name + numeric rating on one line (bold), and a short review excerpt below it (muted text). Keep these compact — this is supporting evidence, not the main focus of the page.

**Right column (booking box):**
- Sticky positioned card (stays visible as the page scrolls) with: large price (Space Grotesk, bold) with a smaller "/ night" or relevant unit label, a secondary line showing the date range and night/unit count.
- Check-in and check-out date fields (or equivalent for the item type), styled as compact bordered boxes matching the icon-prefixed field style from the search form.
- A full-width solid gold "Reserve now" button.
- A small reassurance line below the button ("You won't be charged yet"), centered, muted small text.

## Content Notes

- Use a realistic example property (e.g. a resort in Bali, consistent with prior page examples) with a genuine-sounding name, location, and review count rather than placeholder Lorem Ipsum.
- Reviews should read like real short guest feedback, not generic five-star praise — include at least one review with a minor caveat (e.g. "a little far from the center") so it reads as credible rather than manufactured.
- NGN as the primary displayed currency, consistent with prior pages.

## What NOT to Do

- Don't design a separate agent version of this page — same layout for both, only the price value and "Net rate" label in the booking box differ by login state.
- Don't let the review section or amenities grid compete visually with the booking box — the booking box is the primary action on this page and should read as the clear focal point on the right.
- Don't use outlined/ghost styling for the "Reserve now" button — solid gold fill, matching the established convention.
- Don't overload the gallery with more than 5 images in the grid — keep the one-large-plus-four-small structure rather than a full carousel or masonry grid.
