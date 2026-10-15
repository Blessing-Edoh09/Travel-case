Travel Case

Software Requirements Specification — MVP

1. Executive Summary

Travel Case is a full-service Online Travel Agency (OTA) covering flight bookings, hotel bookings, car rentals, and other travel/aviation-adjacent services (e.g. airport transfers, travel insurance, activities), serving both individual travelers (B2C) and reselling travel agents (B2B) from launch. Benchmarks: Priceline, Opodo, Wakanow, Kiwi.com, and Ixigo.

Unlike a phased approach, all four verticals (flights, hotels, cars, other services) are requested as part of the MVP itself, within a 1–3 month build window using an existing team. Sabre is the confirmed GDS provider, covering flights, hotels, and car rentals under a single integration. This document defines what is realistically achievable at that scope and timeline, and is explicit about where the requested scope and the timeline are in tension.

2. MVP Scope Definition

As requested, the MVP includes all of the following verticals at launch, built on Sabre:

Flights — search, compare, and book via Sabre's Air Shopping and Booking APIs.

Hotels — search, compare, and book via Sabre's Hotel API.

Car rentals — search and book via Sabre's Car Rental API.

Other aviation-adjacent services — airport transfers, travel insurance, and activities/tours (Viator/GetYourGuide-style), all confirmed as P0 alongside flights, hotels, and cars.

B2C booking flow across all four, end to end.

B2B agent layer limited to: agent registration/approval, agent login, agent-visible pricing markup across all verticals — not a full white-label portal at MVP stage.

Web only (responsive); no native mobile app in MVP.

Multi-currency display and checkout for a limited, named set of currencies (to be confirmed — see Open Questions).

3. Target Users

3.1 B2C — Individual Traveler

Searches and books flights, hotels, cars, and add-on services for their own trip, ideally in one flow. Needs: transparent pricing across all verticals, one unified checkout/cart where possible, single confirmation for a multi-part trip.

3.2 B2B — Reselling Travel Agent

Books across all four verticals on behalf of clients at agent rates. Needs: fast approval, visible markup/commission per vertical, consolidated booking history across flights/hotels/cars/services.

4. Functional Requirements — By Vertical

4.1 Flights

Search by origin/destination, dates (one-way, round-trip, multi-city), passengers, cabin class.

Filter/sort by price, duration, stops, airline; fare rules shown before purchase.

Passenger detail capture per GDS/airline requirements; e-ticket/PNR delivered by email.

4.2 Hotels

Search by destination, check-in/out dates, number of guests/rooms, via Sabre's Hotel API.

Filter by price, star rating, guest rating, amenities; cancellation policy shown before booking.

Room selection, guest details, confirmation delivered by email.

Known content limitation: Sabre's hotel property photos and branding assets are lower resolution than dedicated hotel platforms — plan UI treatment (e.g. consistent card sizing, fallback imagery) accordingly rather than assuming high-res supplier photography.

4.3 Car Rentals

Search by pickup/drop-off location, dates, car category, via Sabre's Car Rental API.

Filter by price, vehicle type, transmission, supplier; insurance/excess terms shown before booking.

Driver details capture, confirmation delivered by email.

4.4 Other Services (MVP: travel insurance, activities/tours)

Travel insurance add-on offered at checkout, sourced via an insurance API/affiliate partner.

Activities/tours (city tours, excursions, experiences) — confirmed as P0, sourced via a dedicated activities API (e.g. Viator or GetYourGuide's partner API), searchable and bookable at the destination alongside flights/hotels. This is a fourth integration, separate from Sabre and from the transfers/insurance provider — see Section 10 for what this does to the timeline.

5. Cross-Vertical Requirements

Unified cart/checkout: a traveler booking a flight + hotel together should be able to pay once, not check out twice.

Single trip confirmation summarizing all booked components (flight, hotel, car, add-ons) with each provider's own confirmation reference attached.

Consistent account/profile across all verticals — one login, one booking history view.

6. B2B Agent Layer (MVP — limited)

Agent sign-up with business verification; admin approval before activation.

Agent-specific pricing/markup applied consistently across flights, hotels, and cars.

Agent booking history and commission reporting across all verticals in one dashboard.

Deferred: white-label branding, sub-agent hierarchies, credit/wallet-based booking, bulk booking tools.

7. Payments & Multi-Currency

Multi-currency display based on user location/selection, for a limited named currency set at MVP.

Payment gateway(s) covering target markets — likely at least one gateway for Nigeria/Africa (e.g. Paystack/Flutterwave) plus one for international cards (e.g. Stripe); confirm priority markets.

PCI-DSS compliance: no raw card data stored, tokenization via gateway.

Single checkout must correctly split/reconcile payment across multiple supplier bookings (flight + hotel + car) charged as one transaction to the traveler.

8. Technical Notes on Sabre Integration

Sabre is the confirmed GDS provider for this project, covering flights, hotels, and car rentals under one commercial and technical relationship. This is the integration path the dev team should plan against.

Onboarding: register on Sabre Dev Studio / the Sabre developer portal to obtain sandbox API credentials (client ID/secret), then build against Air Shopping, Booking/PNR, Hotel, and Car Rental APIs.

Certification: Sabre requires formal certification of each API module (search, booking, ticketing, cancellation/refund flows) before production credentials are issued. This phase typically runs 4–8 weeks and is the critical path for the whole MVP — it should start as early as possible, in parallel with UI/UX and non-Sabre-dependent work, not after other work is finished.

“Other services” (transfers, travel insurance) fall outside Sabre's scope and need a separate, smaller integration — this should not block the Sabre certification timeline and can run in parallel.

Activities/tours also fall outside Sabre's scope and are now a fourth, confirmed P0 integration (e.g. Viator or GetYourGuide's partner API). Unlike transfers/insurance, this is a full search-and-book flow, not a simple checkout add-on — it needs its own workstream (API onboarding, search UI, checkout integration), the same as flights/hotels/cars do. Start this integration in week 1 alongside Sabre, not after — sequencing it later is what would actually break the 1–3 month timeline.

Recommended sequencing: start Sabre sandbox integration and certification submission in week 1; start the activities/tours API integration in parallel in week 1, as its own workstream; build UI/UX and non-GDS features (accounts, admin, agent approval workflow) concurrently; treat production go-live as gated by Sabre's certification sign-off, not by internal readiness alone.

9. Non-Functional Requirements

Security: HTTPS everywhere, tokenized payments, encrypted PII storage, role-based access control.

Performance: search latency across three separate supplier APIs (flight, hotel, car) needs to be managed so a combined search doesn't feel slower than the sum of its parts — parallelize calls, don't chain them.

Compliance: IATA/airline ticketing rules via the flight aggregator; local travel agency licensing where applicable; data protection (NDPR/GDPR depending on user base).