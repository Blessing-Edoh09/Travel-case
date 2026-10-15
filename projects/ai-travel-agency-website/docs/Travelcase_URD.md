Travelcase

User Requirements Document (URD)

Covers B2C traveler and B2B agent user types — MVP and full-vision phases  |  July 27, 2026

1. Purpose & Scope

This document captures user requirements for Travelcase – what travelers and travel agents need to be able to do on the platform, expressed from the user's point of view, independent of how it gets built. It complements the earlier Software Requirements Specification (SRS). Note: the SRS originally scoped a flights-only MVP; that scope has since been superseded — flights, hotels, car rentals, and activities/tours are now all confirmed P0 for the MVP.

Every requirement below is tagged MVP or Future so this document and the SRS stay consistent: MVP-tagged items are what the current 1–3 month build must satisfy across all four verticals; Future-tagged items are legitimate user needs that are deliberately deferred to a later phase.

How to read this document

MVP = must be true in the current build, which now covers flights, hotels, cars, and activities/tours — not flights-only.

Future = a real user need, planned for a later phase, not required for the current build.

This distinction matters because a user requirement (e.g. “I need to book a hotel”) is valid and worth documenting now, even though the technical MVP won't satisfy it yet.

2. User Personas

Ade — The B2C Traveler

Books her own trips, price-sensitive, wants certainty before she pays.

Goal: Find and book a flight (and eventually hotel/car) at a fair price, with no surprises at checkout.

Frustrations with existing sites: Hidden fees revealed late in checkout, unclear baggage rules, slow or confusing multi-city search.

Needs from Travelcase: Transparent pricing, clear fare rules up front, fast, trustworthy checkout, easy access to her booking afterward.

Chidi — The B2B Travel Agent

Books on behalf of clients, needs speed and margin, manages many bookings at once.

Goal: Search and book quickly for clients at agent rates, then track commission and booking status without calling support.

Frustrations with existing platforms: Manual approval delays, no visibility into markup/commission, no easy way to see all his bookings in one place.

Needs from Travelcase: Fast approval to start booking, visible agent pricing, a simple dashboard of bookings and earnings.

3. User Needs Summary

Know exactly what a trip will cost before committing to buy.

Search and compare flights (and, eventually, hotels/cars/activities) in one place, the way Priceline/Opodo/Kiwi.com/Ixigo already let users do.

Complete a booking end-to-end without needing to contact anyone.

Trust that payment is secure and card details aren't being stored insecurely.

As an agent: get set up quickly, see agent-specific pricing, and track bookings/commission without manual reconciliation.

Manage or cancel a booking after purchase without confusion about refund status.

4. User Stories & Requirements — Traveler (B2C)

ID

User Story

Acceptance Criteria

Phase

T-01

As a traveler, I want to search flights by route, dates, and passenger count, so I can find options that match my trip.

Search accepts one-way, round-trip, and multi-city; returns results within the GDS/aggregator's normal response time; shows an empty state if no fares are available.

MVP

T-02

As a traveler, I want to filter and sort results by price, duration, stops, and airline, so I can narrow down to what matters to me.

All four filter types are available; sort order updates the list without a full page reload.

MVP

T-03

As a traveler, I want to see fare rules (refundable/non-refundable, change fees) before I select a fare, so I'm not surprised later.

Fare rules are visible on the results card or one tap away, before checkout begins.

MVP

T-04

As a traveler, I want to enter passenger details that match passport requirements, so my ticket is issued correctly.

Form validates required fields (name as on passport, DOB, passport number/expiry for international routes) before allowing payment.

MVP

T-05

As a traveler, I want a clear, itemized fare summary before I pay, so I know exactly what I'm being charged.

Base fare, taxes/fees, and any add-ons are itemized; total matches the sum shown at checkout.

MVP

T-06

As a traveler, I want to pay securely without worrying about my card details being stored insecurely.

Payment is tokenized via the gateway; no raw card data touches Travelbox's own servers.

MVP

T-07

As a traveler, I want to receive booking confirmation and e-ticket by email immediately after payment, so I have proof of my booking.

Confirmation email is sent within a short, defined window after successful payment and includes PNR/e-ticket.

MVP

T-08

As a traveler, I want to view my booking and request cancellation afterward, so I don't have to call anyone.

Traveler can log in, see booking status, and initiate cancellation; refund status is visible even if processing takes time.

MVP

T-09

As a traveler, I want to add a hotel to my trip alongside my flight, so I can book my whole trip in one place.

Hotel search/booking available from the same account and trip context as the flight booking.

MVP

T-10

As a traveler, I want to rent a car for my destination, so I don't need a separate site.

Car search/booking available, ideally bundled with an existing flight/hotel booking.

MVP

T-10b

As a traveler, I want to book local activities/tours for my destination, so I can plan my whole trip in one place.

Activities/tours search and booking available via a dedicated activities provider, bundled into the same trip/cart where possible.

MVP

T-11

As a traveler, I want prices shown in my local currency, so I understand the real cost without converting manually.

Currency selector affects displayed and charged price consistently through search, results, and checkout.

MVP (limited currency set) / Full multi-currency in Future

5. User Stories & Requirements — Travel Agent (B2B)

ID

User Story

Acceptance Criteria

Phase

A-01

As an agent, I want to register my agency and get approved, so I can start booking for clients.

Registration form captures business verification fields; admin can approve/reject; agent is notified of status.

MVP (manual approval)

A-02

As an approved agent, I want to see agent-specific pricing (markup/commission) on search results, so I know my margin before booking.

Agent-logged-in search results show agent rate distinctly from public B2C rate.

MVP

A-03

As an agent, I want to view my booking history and commission earned, so I can reconcile without asking support.

Agent dashboard lists past bookings with commission/markup per booking.

MVP (basic reporting)

A-04

As an agent, I want my own branding on the booking pages I send clients, so it looks like my own service.

Agent-facing pages support logo/color customization visible to the agent's own clients.

Future (white-label)

A-05

As an agency owner, I want to manage sub-agents under my account, so my team can book without individual approvals.

Sub-agent accounts inherit agency approval status and are manageable from a parent dashboard.

Future

A-06

As an agent, I want to book against a credit line or wallet instead of a card every time, so repeat bookings are faster.

Agent account supports a credit/wallet balance that can be drawn down at checkout.

Future

6. Cross-Cutting User Requirements (Non-Functional)

Trust & transparency: no price should change between search and checkout without a clear, visible reason.

Speed: a user should never be left staring at a blank screen without a loading indicator during search or payment.

Accessibility: forms and booking flow should be usable via keyboard and screen reader, per standard accessibility practice.

Data privacy: passenger PII (passport numbers, DOB) should be handled per applicable data protection law (NDPR for Nigerian users, GDPR for EU users).

7. Out of Scope for MVP (Explicitly Deferred)

White-label agent branding, sub-agent hierarchies, and credit/wallet booking (A-04, A-05, A-06).

Full global multi-currency support — MVP covers a limited, named currency set only.

Native mobile app — MVP is web only.

8. Open Questions

Which specific currencies must be supported at MVP launch (this still hasn't been named)?

What is the target turnaround time for agent approval (T-01/A-01) — same day, 48 hours, longer?

Is there a minimum viable version of hotel/car/activity search that should be shown as “coming soon” in the MVP UI, or should those verticals be fully absent until Phase 2?

Who owns approving/rejecting agent registrations day-to-day — is this a manual admin task at MVP stage, or does it need workflow automation from the start?

9. Assumptions

This document assumes the MVP scope now defined in the SRS (flights, hotels, cars, and activities/tours, B2C + limited B2B, web only, 1–3 months, built on Sabre plus a separate activities/tours integration) is the current build target; Future-tagged items here do not change that scope.

Personas (Ade, Chidi) are illustrative composites based on the stated target users, not real individuals or research findings — validate with real user interviews if resourcing allows.