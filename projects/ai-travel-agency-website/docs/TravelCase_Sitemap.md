Travel Case

Website Sitemap & Page Flow

1. Purpose of This Document

This document explains how the pages of the Travel Case website connect – what a visitor can reach from any given page, and how the B2C (traveler) and B2B (agent) experiences relate to each other within the same site. Use this to understand the overall shape of the site, and the individual page prompts for what each page actually contains.

2. Sitemap Diagram

Blue = B2C traveler pages. Gold = B2B agent pages. Solid arrows are the primary booking path; dashed arrows are secondary actions (logging in, switching in/out of agent mode).

3. How to Read the Flow

The site has two parallel experiences sharing one Home page as the common entry point:

The B2C path (blue) is the main booking journey: Home → Search Results → Hotel Detail or straight to Checkout → Booking Confirmed → My Trips. Login/Sign Up sits off to the side, reachable from Home and returning back to Home once complete — it's not a mandatory step before searching, only before completing a booking that needs to be saved to an account.

The B2B path (gold) is a single Agent Dashboard page reached from Home via the “Agent portal” button. From the dashboard, an agent can start a new booking, which drops them into the same Search Results page the B2C flow uses — the booking engine is shared, only the entry point and the pricing shown differs by agent context.

“Exits portal” is a dashed line because it's a context switch, not a booking step — it returns an agent to the consumer-facing Home page.

4. Page-by-Page Reference

Page

Purpose

Entry / Exit Points

Home

Public entry point and search starting page for all visitors.

Enters: direct visit / return visit. Exits: Search Results (search), Login/Sign Up, Agent Dashboard.

Search Results

Shared results list across flights, hotels, cars, and activities/tours — used by both B2C travelers and B2B agents.

Enters: Home (search), Agent Dashboard (new booking). Exits: Checkout (select flight/car/activity), Hotel Detail (open hotel).

Hotel Detail

Single property page with gallery, amenities, reviews, and a booking box.

Enters: Search Results. Exits: Checkout (reserve).

Checkout

Unified cart and payment — handles flight, hotel, or a bundled combination in one transaction.

Enters: Search Results, Hotel Detail. Exits: Booking Confirmed.

Booking Confirmed

Confirmation state after successful payment.

Enters: Checkout. Exits: My Trips.

My Trips

Traveler's booking history / trip management.

Enters: Booking Confirmed (and, once built, direct nav from Home for return visitors).

Login / Sign Up

Combined auth page with a tab switch between the two modes.

Enters: Home (“Log in”). Exits: back to Home once authenticated.

Agent Dashboard

B2B home base — stats, recent bookings, agent-vs-client rate comparison.

Enters: Home (“Agent portal”). Exits: Search Results (new booking), Home (exit portal).

5. What This Diagram Deliberately Leaves Out

Error/edge states (failed payment, expired session, no search results) are not shown — this is the happy-path structure only.

Cars, transfers/insurance, and activities/tours flows aren't drawn as separate branches since they all follow the same Search Results → Checkout shape as flights/hotels — activities/tours is a confirmed P0 vertical (per the SRS update), sourced via its own provider integration, but it reuses this same page structure rather than needing new pages of its own. Adding a parallel branch for each vertical would repeat the diagram rather than add information.

Admin-side pages (agent approval back-office, per the SRS/PRD) aren't included here since they're an internal tool, not part of the public website's navigation.

6. Next Step

Use this alongside the page-by-page UI generator prompts already produced (starting with the homepage prompt) — this document tells you how the pages connect; each individual prompt tells you what to actually put on each one.