Travel Case

Product Requirements Document (PRD)

Sabre internship deliverable  |  Draft v1  |  July 27, 2026  |  Companion to: Travel Case SRS

1. Purpose of This Document

This PRD sits upstream of the Travel Case Software Requirements Specification (SRS). The SRS defines detailed, API-level functional and technical requirements for the development team. This PRD defines the product rationale: the problem, the users, what is actually a priority given the timeline, and what still needs a decision before build. Where content overlaps with the SRS (functional requirements by vertical), this document summarizes; the SRS remains the source of technical detail.

2. Product Overview

Travel Case is a full-service Online Travel Agency (OTA) built on Sabre's GDS — flights, hotels, and car rentals under a single integration — extended with airport transfers, travel insurance, and activities/tours, serving both individual travelers (B2C) and reselling travel agents (B2B) from launch. Benchmarked against Priceline, Opodo, Kiwi.com, and Ixigo.

Working assumption (not yet confirmed with a product sponsor): Sabre requires a direct-facing OTA product covering its own GDS content plus adjacent services, for both retail travelers and reselling agents. This should be confirmed rather than treated as settled — see Section 16.

3. Goals & Success Metrics

TBD — intentionally left open.

No acquisition, GMV, booking-volume, or conversion targets have been defined or assumed. These need to come from product/business stakeholders before build kickoff, since they should drive prioritization decisions in Section 5, not follow from them.

4. Target Users

4.1 B2C — Individual Traveler

Searches and books flights, hotels, cars, and add-on services for their own trip, ideally in one flow. Needs: transparent pricing across all verticals, one unified checkout/cart where possible, a single confirmation for a multi-part trip.

4.2 B2B — Reselling Travel Agent

Books across all verticals on behalf of clients at agent rates. Needs: fast approval, visible markup/commission per vertical, consolidated booking history across flights/hotels/cars/services.

5. Scope & Prioritization

Requested scope: five verticals (flights, hotels, cars, transfers + insurance, activities/tours), B2C + B2B, web only, inside a 1–3 month build window.

Tier

Scope

Rationale

P0 — Day one

Flights, hotels, car rentals via Sabre; core B2C booking + unified checkout; core B2B layer (registration, approval, per-vertical markup, dashboard)

Sabre certification is the fixed critical-path constraint regardless of any other decision — this is the one thing that must start week 1

P1 — Fast-follow, target within MVP window

Airport transfers, travel insurance

Separate, smaller integrations outside Sabre's scope; can run in parallel without blocking certification

P2 — Recommended fast-follow after MVP launch

Activities/tours (Viator/GetYourGuide-style)

Requested as in-scope for MVP, but see the risk flag below before treating this as fixed

Risk flag: activities/tours in the MVP

The SRS already treats 4 verticals in 1–3 months as tight, with single-vendor Sabre certification as the one mitigating factor. Adding activities/tours is a third non-Sabre integration (alongside transfers and insurance), on a timeline where the fixed 4–8 week certification window already consumes most of the available time. My recommendation is to sequence activities/tours as a post-launch fast-follow. If it stays in the MVP as requested, the 1–3 month window should be treated as no longer realistic — either the timeline extends or something else moves out. This is a decision for whoever owns the timeline commitment, not something to quietly absorb.

6. Functional Capabilities by Vertical (Summary)

Full API-level requirements are specified in the SRS, Section 6. Summary:

Flights: search/filter by price, duration, stops, airline; fare rules shown pre-purchase; e-ticket/PNR via email.

Hotels: search/filter by price, star rating, guest rating, amenities; cancellation policy shown pre-booking. Known constraint: Sabre's hotel photography/branding is weaker than dedicated hotel platforms — plan UI fallback treatment (consistent card sizing, fallback imagery).

Car rentals: search/filter by price, vehicle type, transmission, supplier; insurance/excess terms shown pre-booking.

Transfers + insurance: add-ons offered at checkout, sourced via separate provider/affiliate integrations outside Sabre.

Activities/tours: not yet specified at API/vendor level — needs its own scoping pass if it stays in MVP (see Section 5).

7. Cross-Vertical Requirements (Summary)

Unified cart/checkout: pay once for a multi-vertical trip, not per component.

Single trip confirmation summarizing all booked components, each with its own supplier reference attached.

One login, one booking history view across all verticals.

8. B2B Agent Layer (Summary)

Agent sign-up with business verification; admin approval before activation.

Agent-specific pricing/markup applied consistently across verticals (see Section 10 for recommended bands).

Agent booking history and commission reporting across all verticals in one dashboard.

Deferred (out of MVP): white-label branding, sub-agent hierarchies, credit/wallet booking, bulk booking tools.

9. Payments & Currency Strategy

Recommendation: launch with four currencies — NGN (home market), USD (dominant travel-booking currency and largest diaspora corridor), GBP, and EUR (the two other major diaspora/travel corridors into Nigeria and West Africa). “Global” as stated is not a realistic MVP currency list; a genuinely global set (100+ currencies) is not something an MVP should try to support. This is a recommendation, not a confirmed decision — it needs sign-off from whoever owns pricing/markets.

Payment gateways: at least one gateway for Nigeria/Africa (e.g., Paystack or Flutterwave) plus one for international cards (e.g., Stripe). PCI-DSS compliance required — no raw card data stored, tokenization via gateway.

10. Commission / Markup Model

What this covers: whether a B2B agent earns the same percentage markup regardless of what they book, or whether the percentage differs by vertical. Industry norm is that it differs — airline commissions are thin because GDS/airline rules already cap them, while hotels, cars, and affiliate-style add-ons carry fatter margins. Recommended starting bands, pending confirmation from Sabre's commercial team:

Vertical

Recommended Band

Why

Flights

~3–5%

GDS/airline commission structures leave little room

Hotels

~10–12%

Standard OTA hotel margin range

Car rentals

~8–10%

Mid-range margin, between flights and hotels

Transfers / insurance

~15–20%

Affiliate-style products typically pay the highest rate

These are starting-point figures based on general OTA industry practice, not numbers specific to Travel Case's actual supplier agreements. Treat as a draft for the commercial team to confirm or correct.

11. Non-Functional Requirements (Pointer)

Full detail in SRS Section 11: HTTPS everywhere, tokenized payments, encrypted PII, role-based access control; search latency across three supplier APIs must be parallelized, not chained; IATA/airline ticketing rules; NDPR/GDPR depending on user base.

12. Assumptions & Dependencies

Internal Sabre initiative — no external GDS contract or procurement dependency; sandbox/dev credentials are an internal request, not a vendor negotiation. This removes a risk the SRS had flagged as open.

Sabre certification (4–8 weeks) remains the fixed critical-path constraint no matter what else is decided — it should start in week 1, in parallel with non-Sabre-dependent work.

“Travel Case” is confirmed as a distinct project from the earlier “Travelbox” project, with no shared codebase or assets expected.

Development team and budget are already in place (per SRS Section 13) — this document assumes no hiring/procurement delay.

The currency list (Section 9) and commission bands (Section 10) above are recommendations pending sign-off, not confirmed product decisions.

13. Risks

Risk

Likelihood

Impact

Recommendation

5-vertical scope (incl. activities/tours) in 1–3 months

High

High

Defer activities/tours to post-launch, or extend the timeline — don't absorb silently

Sabre certification consumes most of the build window

High

High

Start certification submission in week 1, no exceptions

Hotel content quality weaker than dedicated hotel platforms

Medium

Medium

Design UI fallback treatment (card sizing, fallback imagery) up front

Multi-supplier search latency (flights + hotels + cars)

Medium

Medium

Parallelize supplier API calls; never chain them

Currency & commission decisions still pending sign-off

Medium

High

Resolve before payments/commission engineering starts, not mid-build

14. Timeline & Milestones

Timeframe

Activity

Week 1

Sabre sandbox integration + certification submission begins; transfers/insurance integration scoping starts in parallel; UI/UX and non-GDS build (accounts, admin, agent approval workflow) begins concurrently

Weeks 1–8

Sabre certification runs in parallel with build — this is the critical path for the whole MVP

Weeks 2–6

B2C + B2B core build across flights, hotels, and car rentals

Weeks 4–8 (if in scope)

Transfers + travel insurance integration and checkout add-on flow

Post-certification

Production go-live gated by Sabre's certification sign-off, not internal readiness alone

Post-MVP (recommended)

Activities/tours integration and launch, once core verticals are stable

15. Out of Scope (MVP)

Native mobile app (web only, responsive)

White-label B2B branding / full white-label portal

Sub-agent hierarchies

Credit/wallet-based booking for agents

Bulk booking tools

Cross-airline “virtual interlining” (Kiwi.com-style)

16. Open Items Requiring Sign-off

Confirm final currency list and payment gateway priority (recommendation: NGN/USD/GBP/EUR, Paystack or Flutterwave + Stripe)

Confirm commission/markup bands per vertical (recommendation given in Section 10)

Confirm whether activities/tours stays P0 or moves to P1/post-launch given the timeline impact

Define goals & success metrics (Section 3) with product/business stakeholders

Confirm the internal Sabre stakeholder(s) who sign off at each milestone