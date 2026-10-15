# Travel Case — Checkout Page Prompt (Page 4 of 8)

*Paste into your UI generator. Covers the checkout flow itself plus the post-payment confirmation state as a single page with two states, per the sitemap.*

---

## Page Purpose

Unified cart and payment page — handles a flight, a hotel, a car, an activity, or any bundled combination of them in one transaction. Shared page for B2C travelers and B2B agents, with one real structural difference: when a logged-in agent is checking out on behalf of a client, two extra elements appear that a B2C traveler never sees — a **class of service selector** (for flight components) and a **markup control** (net rate → client price). Includes a second state of the same page shown after successful payment (Booking Confirmed), which now surfaces the PNR explicitly.

## Brand System (same as prior pages)

- **Colors:** Navy `#0B2545`, Steel Blue `#3A6EA5`, Gold `#C9A24B` (CTA/accent only), Neutral background `#EDEFF2`, Card white `#FFFFFF`, Ink text `#1B2033`, Slate muted text `#5C6470`, Border `#DCE1E8`, Success green `#1E9E6B`.
- **Typography:** Space Grotesk for headings/prices, Inter for body/UI.
- **Logo:** icon (hairline gold outline suitcase) + "Travel Case" wordmark.
- **Controls:** solid filled pill/rounded buttons for primary actions, not outlined/ghost buttons.

## State 1: Checkout

**1. Header** — simplified from prior pages: logo on the left, and just a small "Secure checkout" label on the right (muted, with a lock icon) — no nav links, no Log in/Agent portal buttons. Checkout should feel focused, without navigation that could distract from completing payment.

**2. Two-column layout**

**Left column (main content), top to bottom:**
- **Itinerary summary strip**: a card with a colored left border (gold), showing the trip name/destination and dates at the top, then a compact line-item list below it — each line showing one booked component (e.g. "✈ Emirates · Lagos → Dubai, round trip — ₦512,000", "🏨 Address Downtown · 7 nights — ₦1,295,000") with a "Change trip" text link beneath.
- **[Agent view only] Class of service section**: numbered step header ("① Class of service"), shown only for flight components — a set of selectable cards or a dropdown (Economy, Premium Economy, Business, First), each showing its own net rate, since class of service changes the price. The agent picks the class they're finalizing for their client here, which may differ from what was searched.
- **[Agent view only] Pricing & markup section**: numbered step header ("② Set your price"), a compact card showing: net rate (muted, labeled clearly as "Your cost"), a markup input (percentage field with a slider or stepper, range 0% to that vertical's cap — e.g. "0%　▬▬▬●▬▬　18% cap"), and the resulting client price recalculating live as the agent adjusts it (bold, prominent, labeled "Client will pay"). If the agent types a value above the cap, the field shows an inline error state (red border, small warning text like "Max markup for flights is 18%") and the "Continue" action stays disabled until corrected.
- **Traveler details section**: numbered step header (③ for agents, ① for B2C travelers) "Traveler details", a short instruction line, then a 2-column form grid: first name, last name, date of birth, nationality (dropdown). Add passport number/expiry fields if the booking includes an international flight component.
- **Payment section**: next numbered step header, "Payment", a short reassurance line about tokenization ("Card details are tokenized — never stored on Travel Case servers"), then a form grid: card number (full width), expiry, CVV.

**Right column: sticky fare summary card** (navy background, stays visible while scrolling)
- Small heading ("Trip total") — for agents, this reflects the client-facing price (net rate + their markup), never the net rate alone.
- Itemized lines for each component plus taxes/fees, each row showing a light-colored label and a white value, separated by thin dashed dividers.
- A bold total line at the bottom, visually separated from the itemized lines above it (more weight, larger text, no divider below it).
- A full-width solid gold "Confirm & pay" button (for agents, this button is disabled/greyed while a markup error is active, per the pricing section above).
- A small centered reassurance line below the button ("🔒 One secure checkout for your whole trip"), muted small text.

## State 2: Booking Confirmed

Shown in place of the checkout form after the "Confirm & pay" button is used — same header, same overall page frame, but the two-column content is replaced with a single centered confirmation block:

- A large green checkmark or success icon.
- A short confirmation headline ("Booking confirmed") in Space Grotesk.
- A one-line confirmation message including a mock booking reference and PNR (e.g. "Confirmation sent to your email · Booking ref TC-48291 · PNR: XR7QP2").
- A condensed version of the itinerary summary strip from checkout (same styling), showing what was booked.
- **[Agent view only]**: an additional "Send to client" button/row here — since agents need to forward this exact confirmation (with the client-facing price, never the net rate) to their client by email without leaving the page.
- Two buttons side by side: a solid gold "View my trips" button (primary — for agents this reads "View bookings" instead, linking to their dashboard rather than My Trips) and an outlined "Back to home" button (secondary — this is the one place an outlined button is acceptable, since it's explicitly the lower-priority action next to a clear primary).

## Content Notes

- Use the same example trip (Lagos → Dubai or Lagos → Bali, consistent with prior pages) so this reads as one continuous flow if reviewed alongside the results and detail page prompts.
- NGN as the primary displayed currency.
- Keep the traveler details form realistic for an international flight booking (passport fields), even if the specific example trip is domestic — the form needs to handle the harder case.

## What NOT to Do

- Don't include the main site navigation (nav links, Agent portal button) on the checkout page — this page should feel deliberately stripped-down and focused compared to the rest of the site.
- Don't build agent checkout as a completely separate page — same page frame, same itinerary strip, same payment section; the class-of-service and markup sections are additive steps that appear only for agents, not a different page design.
- Don't let a B2C traveler ever see net rate, markup controls, or class-of-service selection — those sections render only in the agent-logged-in state.
- Don't make the confirmation state (State 2) a completely different page design — it should clearly read as the same page/page-frame as checkout, just with the form area swapped for the confirmation block.
- Don't use an outlined button for "Confirm & pay" or "View my trips" — those are primary actions and should be solid gold fill.
