Travel Case

Product Requirements Document (PRD)

Draft v2  |  Updated after supervisor review  |  Companion to: Travel Case SRS, URD  |  August 2026

1. Purpose of This Document

This PRD sits upstream of the Travel Case Software Requirements Specification (SRS). The SRS defines detailed, API-level functional and technical requirements for the development team. This PRD defines the product rationale: the problem, the users, the pricing model, and what still needs a decision before build. This version replaces the earlier fixed-commission-band pricing model with a wholesale/reseller model, following direct feedback from a stakeholder review — Sections 9 and 10 are the ones that changed substantially.

2. Product Overview

Travel Case is a full-service Online Travel Agency (OTA) built on Sabre's GDS — flights, hotels, and car rentals under a single integration — extended with airport transfers, travel insurance, and activities/tours, serving both individual travelers (B2C) and reselling travel agents (B2B) from launch. Benchmarked against Priceline, Opodo, Kiwi.com, Ixigo, and Wakanow.

The B2B relationship works like a wholesale supply arrangement: an approved agent buys at Travel Case's net rate, the same way a shop buys stock from a wholesaler, and then resells to their own client at whatever price they set. The client sees the agent's business name on the itinerary and receipt, not Travel Case's — just as a shop's receipt carries its own name even though a wholesaler supplied the product inside.

3. Goals & Success Metrics

Status

No acquisition, GMV, booking-volume, or conversion targets have been defined or assumed. These need to come from product/business stakeholders before build kickoff.

4. Target Users

4.1 B2C — Individual Traveler

Searches and books flights, hotels, cars, and add-on services for their own trip, ideally in one flow. Needs: transparent pricing, one unified checkout/cart, a single confirmation for a multi-part trip.

4.2 B2B — Reselling Travel Agent

Buys at Travel Case's net rate and resells to their own clients at a price they control. Needs: visibility into the true net rate, full control over their own markup, a white-labeled itinerary/receipt carrying their own business identity, and booking statuses that reflect real travel-industry states rather than a generic placeholder.

5. Scope & Prioritization

Scope: flights, hotels, cars, transfers/insurance, and activities/tours; B2C + B2B with wholesale pricing; web only; inside a 1–3 month build window.

Tier

Scope

Rationale

P0 — Day one

Flights, hotels, car rentals via Sabre; core B2C booking + unified checkout; B2B wholesale pricing engine (net rate, agent-set markup, markup override); white-labeled itinerary/receipt; class-of-service selection at ticketing; itinerary email with PNR; agent booking statuses (pending/confirmed/flown/cancelled)

Sabre certification is the fixed critical-path constraint regardless of any other decision — it starts week 1. The wholesale pricing engine and white-label itinerary are now core to the B2B value proposition, not an add-on.

P1 — Fast-follow, target within MVP window

Airport transfers, travel insurance

Separate, smaller integrations outside Sabre's scope; run in parallel without blocking certification

P2 — Recommended fast-follow after MVP launch

Sub-agent hierarchies, credit/wallet-based agent booking, bulk booking tools

Genuine agent conveniences, but not required to prove out the core wholesale-resale model

6. Functional Capabilities by Vertical (Summary)

Full API-level requirements are specified in the SRS, Section 6. Summary:

Flights: search/filter by price, duration, stops, airline; fare rules and class of service shown pre-purchase; e-ticket/PNR via email.

Hotels: search/filter by price, star rating, guest rating, amenities; cancellation policy shown pre-booking. Known constraint: Sabre's hotel photography/branding is weaker than dedicated hotel platforms — UI plans for fallback imagery.

Car rentals: search/filter by price, vehicle type, transmission, supplier; insurance/excess terms shown pre-booking.

Transfers + insurance: add-ons offered at checkout, sourced via separate provider/affiliate integrations outside Sabre.

Activities/tours: sourced via a dedicated activities API (Viator or GetYourGuide-style), its own search-and-book flow, not just a checkout add-on.

7. Cross-Vertical Requirements (Summary)

Unified cart/checkout: pay once for a multi-vertical trip, not per component.

Single trip confirmation summarizing all booked components, each with its own supplier reference and PNR (for flights) attached.

One login, one booking history view across all verticals.

8. B2B Agent Layer (Summary)

Agent sign-up with business verification; admin approval before activation.

Net rate visible to the agent on every search result — this is their cost, never shown to their client.

Agent sets a default markup percentage (overall or per vertical); can override it per booking, so long as the resulting price doesn't fall below the net rate.

Itinerary and receipt sent to the client carry the agent's own business name and logo; underlying PNR/airline/ticket data still shows as issued through Travel Case/Sabre.

Agent selects class of service on behalf of the client at the ticketing step.

Agent can email the itinerary and booking details, including the PNR, directly to their client from the platform.

Agent booking history shows real statuses: pending, confirmed, flown, cancelled — with net rate, client price, and margin per booking.

Deferred (out of MVP): sub-agent hierarchies, credit/wallet booking, bulk booking tools.

9. Pricing Model — Wholesale / Net Rate

This replaces the earlier fixed-commission-band model entirely. The relationship is a wholesale supply arrangement, not a percentage commission set by Travel Case:

Travel Case quotes every fare/rate to an approved agent at a net rate — the agent's actual cost.

The agent decides their own client-facing price by applying a markup on top of the net rate. This can be a saved default (per vertical or overall) applied automatically, or a manual override entered per booking.

There is no Travel Case-imposed commission percentage — the agent's margin is entirely a function of their own markup decision, the same way a retailer decides its own retail price on wholesale stock.

Markup is bounded on both ends: a 0% floor (client price can equal net rate, never below it) and a maximum markup percentage per vertical, set by Travel Case admin. Flights, hotels, cars, and other services each have their own cap, since realistic margins differ by vertical.

Submitting a markup above the vertical's cap is hard-blocked by the system — the booking cannot proceed until the agent enters a value within range. This is enforced automatically, not left as an advisory warning.

The net rate is never exposed to the client under any circumstance — not on the itinerary, not in the confirmation email, not through any client-facing view.

10. White-Label Itinerary and Receipt

An agent's clients should experience the booking as coming from the agent's own business, not from Travel Case — consistent with the wholesale relationship in Section 9.

Agents configure a business name and logo once, in account settings.

Every itinerary and receipt generated for that agent's bookings displays their business name/logo as the seller.

The underlying PNR, airline, flight numbers, and any GDS-issued ticket data still show as issued through Travel Case/Sabre — this is factual travel document data and isn't altered by white-labeling, the same way a real airline ticket always discloses its operating carrier regardless of which agency sold it.

The agent can send this white-labeled itinerary directly to their client by email from within the platform, including the PNR and full booking details, without needing to export or manually forward anything.

11. Non-Functional Requirements (Pointer)

Full detail in SRS Section 11: HTTPS everywhere, tokenized payments, encrypted PII, role-based access control; search latency across supplier APIs must be parallelized, not chained; IATA/airline ticketing rules; NDPR/GDPR depending on user base. Net rate data is treated as sensitive and must never be reachable from a client-facing session.

12. Assumptions & Dependencies

Internal Sabre initiative — no external GDS contract or procurement dependency; sandbox/dev credentials are an internal request.

Sabre certification (4–8 weeks) remains the fixed critical-path constraint no matter what else is decided — it starts in week 1.

“Travel Case” is confirmed as a distinct project from the earlier “Travelbox” project, with no shared codebase or assets expected.

Development team and budget are already in place.

The wholesale/net-rate pricing model (Sections 9–10) is a confirmed product decision from stakeholder review, replacing the earlier draft commission bands — it is not a pending recommendation.

13. Risks

Risk

Likelihood

Impact

Recommendation

5-vertical scope in 1–3 months

High

High

Activities/tours runs as its own parallel workstream from week 1, not sequenced after Sabre

Sabre certification consumes most of the build window

High

High

Start certification submission in week 1, no exceptions

Agent prices below net rate or above vertical cap

Low

High

Both bounds are system-enforced (0% floor, per-vertical cap) with hard-blocked submission — residual risk is implementation bugs, not policy ambiguity

Net rate accidentally exposed to a client

Low

High

Treat net rate as a sensitive field end-to-end; never include it in any client-facing template, email, or API response

Hotel content quality weaker than dedicated hotel platforms

Medium

Medium

Design UI fallback treatment (card sizing, fallback imagery) up front

Multi-supplier search latency (flights + hotels + cars)

Medium

Medium

Parallelize supplier API calls; never chain them

14. Timeline & Milestones

Timeframe

Activity

Week 1

Sabre sandbox integration + certification submission begins; activities/tours integration scoping starts in parallel; UI/UX and non-GDS build (accounts, admin, agent approval workflow, wholesale pricing engine) begins concurrently

Weeks 1–8

Sabre certification runs in parallel with build — this is the critical path for the whole MVP

Weeks 2–6

B2C + B2B core build across flights, hotels, and car rentals, including the net-rate/markup pricing engine and white-label itinerary templates

Weeks 4–8

Transfers, travel insurance, and activities/tours integration and checkout add-on flow

Post-certification

Production go-live gated by Sabre's certification sign-off, not internal readiness alone

15. Out of Scope (MVP)

Native mobile app (web only, responsive)

Sub-agent hierarchies

Credit/wallet-based booking for agents

Bulk booking tools

Cross-airline “virtual interlining” (Kiwi.com-style)

16. Open Items Requiring Sign-off

What are the actual maximum markup percentages per vertical at launch (flights, hotels, cars, other services)? The rule (0% floor, per-vertical cap, hard block above it) is confirmed — the specific numbers still need sign-off from the commercial team.

How is “flown” status determined — automatically once the travel date passes, or via a sync back from Sabre confirming the ticket was used?

Does the white-labeled itinerary need agent-level customization beyond logo/business name (colors, footer contact details)?

Confirm final currency list and payment gateway priority.

Confirm the internal Sabre stakeholder(s) who sign off at each milestone.