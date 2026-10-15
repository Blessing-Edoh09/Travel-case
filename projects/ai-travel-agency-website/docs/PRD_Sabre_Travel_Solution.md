Product Requirements Document

Sabre Travel Network — B2B/B2C Online Travel Solution

Prepared by: Oghenekome (UI/UX Design Intern), in collaboration with PM/Tech Lead  |  Status: DRAFT v0.1  |  Internal Use Only

1. Document Control

Classification

Internal — not for external/portfolio distribution in this form

Owner

PM / Tech Lead (business & technical decisions); UX Intern (design & drafting support)

Status

Draft — sections marked OPEN require sign-off before implementation begins

Deadline

Under 1 month from project start; no interim milestones confirmed yet (flagged, Section 10)

2. Executive Summary

This PRD defines a single online travel platform, built on Sabre's own API infrastructure, offering one experience shell with two modes: a consumer (B2C) mode for individual travelers and a business (B2B) mode for travel agents and corporate travel managers. The platform targets the Nigeria/West Africa market initially, covering flights, hotels, ground transport, packages/tours, and visa services, monetized via commission/markup on bookings.

Given a sub-one-month delivery window with no interim milestones yet defined, this document distinguishes between the full product vision (all verticals, both audiences) and a V1 scope that is realistically buildable and designable in the time available. Treat the full vision as the north star and the V1 scope (Section 6.2) as what actually ships first.

3. Problem Statement & Opportunity

Travelers in the Nigeria/West Africa market currently rely on a fragmented mix of international OTAs (not locally optimized) and local players (e.g. Wakanow) for booking flights, hotels, and related travel services.

Sabre's GDS relationships and API infrastructure (Dev Studio / Red 360) provide direct access to global flight inventory that a locally-built consumer/business layer could productize for this market.

A dual B2C/B2B model lets the same core booking engine serve both individual travelers and travel agents/corporate buyers, rather than building two separate systems.

4. Goals & Success Metrics

Goal

How it's measured

Enable end-to-end self-serve booking (search → pay → confirm)

% of started searches that complete a booking (conversion rate)

Serve B2B agents/corporate buyers without a separate product

Agent/corporate account activation and repeat booking rate

Usable on common West African mobile conditions

Task completion rate on mobile / lower-bandwidth test conditions

Sustainable unit economics via commission model

Revenue per booking vs. Sabre API/transaction costs

5. Target Users

5.1 B2C

Leisure traveler — personal/family trips, price-sensitive, compares options

Independent business traveler — books own work trips, values speed/reliability

5.2 B2B

Travel agent/agency — books and manages trips for multiple clients; needs volume efficiency and commission visibility

Corporate travel manager — books/oversees employee travel within policy and budget; needs approval workflow and spend reporting

6. Scope

6.1 Full Product Vision (all phases)

Vertical

Included

Flights

Search, compare, book, manage — via Sabre APIs

Hotels

Search, compare, book, manage

Ground transport

Car rental and/or intercity bus (final supplier TBD)

Packages/tours

Bundled itineraries combining the above

Visa services

Application, document upload, status tracking

6.2 V1 Scope (realistic for the current 1-month window)

Shared platform shell: home, B2C/B2B mode switch, account/login, global search

Flights: search → compare → book → pay → confirm (B2C and B2B)

Hotels: same core flow (B2C and B2B)

B2B: basic agent dashboard (view/manage bookings made on behalf of a client) — commission tracking and corporate approval workflows deferred to V2

OPEN / NEEDS CONFIRMATION: This V1 boundary is my working recommendation based on the timeline given, not an approved scope. Confirm with PM/tech lead before treating it as final — in particular, whether flights+hotels alone is an acceptable V1 or whether ground transport/packages/visa must be included from day one.

6.3 Explicitly Out of Scope (V1)

Native mobile app (responsive web only)

Ground transport, packages/tours, visa services (deferred to later phase per 6.2)

Commission payout automation, corporate approval workflows

7. Functional Requirements

7.1 Search & Booking (Flights, Hotels)

User can search by origin/destination/dates (flights) or location/dates/guests (hotels)

Results are comparable side-by-side with price, duration/rating, and key filters

User can select an option and proceed to a checkout flow capturing traveler details and payment

Booking confirmation is presented in-app and via email

7.2 Account & Roles

Single account system supporting three role types: individual traveler, agent, corporate manager

Role determines which mode (B2C/B2B) and dashboard the user lands in after login

OPEN / NEEDS CONFIRMATION: Verification process for B2B accounts (agent/corporate) — manual approval, document upload, or automatic — is undefined.

7.3 B2B Agent Capabilities (V1)

View and manage bookings made on behalf of named clients

Book on behalf of a client using the same search/booking flow as B2C, with a client-selection step added

7.4 B2B Corporate Capabilities (deferred to V2)

Traveler roster management

Booking policy configuration and approval workflow

Spend reporting/export

8. Non-Functional Requirements

Category

Requirement

Performance

Search results returned within a few seconds under typical mobile network conditions in target market

Localization

Currency (NGN + relevant others), local payment methods, English language baseline

Payments

PCI-DSS-aware handling for card payments; local payment rail integration (e.g. Paystack/Flutterwave-style) — provider TBD

Data protection

Compliance with Nigeria Data Protection Act (NDPA) for personal/traveler data

Accessibility

Responsive layouts usable across common mobile viewport sizes; baseline web accessibility practices

9. Technical Overview

This section is a high-level framing for design purposes, not an engineering spec. Final technical decisions belong to the tech lead.

Core inventory/booking: Sabre's own APIs (Dev Studio / Red 360, or equivalent) for flights, and hotels where Sabre's inventory covers it

Payment processing: third-party payment gateway integration, provider TBD

Frontend: responsive web application

OPEN / NEEDS CONFIRMATION: Confirm exact Sabre API products in use (which endpoints cover hotels, ground transport, packages) — this determines whether any vertical needs a separate third-party supplier alongside Sabre.

OPEN / NEEDS CONFIRMATION: Confirm hosting/infrastructure ownership — likely existing Sabre infrastructure, but not yet stated explicitly.

10. Business Model

Revenue via commission/markup on each completed booking

OPEN / NEEDS CONFIRMATION: Exact commission/markup rates, and whether B2B agents receive a revenue share, are undefined.

11. Timeline

Current known constraint: full deliverable (this PRD plus UX design work) due in under 1 month, with no interim milestones set.

OPEN / NEEDS CONFIRMATION: No interim milestones exist yet. Recommend agreeing dates for: PRD sign-off, wireframes complete, hi-fi complete, prototype/review — within the remaining time — before design work starts, so the V1 scope in Section 6.2 has room to actually be designed and reviewed rather than rushed at the deadline.

12. Roles & Responsibilities

Role

Responsibility

PM / Tech Lead

Final decisions on business model, technical architecture, API/vendor choices, timeline sign-off

UX Design Intern (Oghenekome)

Information architecture, user flows, wireframes, high-fidelity UI, clickable prototype; drafting support on this PRD

13. Open Items Requiring Confirmation — Summary

V1 scope boundary (Section 6.2) — confirm with PM/tech lead

B2B account verification process (Section 7.2)

Exact Sabre API coverage per vertical (Section 9)

Hosting/infrastructure ownership (Section 9)

Payment gateway provider (Section 8, 9)

Commission/markup rates and agent revenue share (Section 10)

Interim milestone dates within the 1-month deadline (Section 11)

14. Reference Products

ixigo — multi-modal search UX, comparison-heavy results, fare alerts

Wakanow — African-market OTA covering flights, hotels, visa, tours under one brand

Flight-fare — flight search/fare comparison UX