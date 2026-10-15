// public/app.js - Master Frontend Controller for Travel Case & TravelDoc AI

// --- Global Application State ---
const state = {
  currentView: 'home',
  activeVertical: 'flights', // 'flights' | 'hotels' | 'cars' | 'transfers'
  currentUser: null,
  authToken: localStorage.getItem('tc_auth_token') || null,
  agentProfile: null,
  cart: [],
  activeSearch: {
    origin: 'LOS',
    originDisplay: 'Lagos (LOS)',
    destination: 'LHR',
    destinationDisplay: 'London (LHR)',
    departDate: '2026-10-15',
    returnDate: '2026-10-22',
    tripType: 'round_trip', // 'round_trip' | 'one_way' | 'multi_city'
    passengers: 1,
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: 'economy', // 'economy' | 'premium_economy' | 'business' | 'first'
    // Hotel specific search state
    hotelDestination: 'DPS',
    hotelDestinationDisplay: 'Bali (DPS)',
    checkInDate: '2026-10-15',
    checkOutDate: '2026-10-22',
    guests: 2,
    rooms: 1,
    // Car specific search state
    carLocation: 'Lagos (LOS) Airport',
    carPickupDate: '2026-10-15',
    carDropoffDate: '2026-10-22',
    carType: 'all',
    // Transfer specific search state
    transferPickup: 'Lagos Airport (LOS)',
    transferDropoff: 'Victoria Island / Ikoyi Hotels',
    transferDate: '2026-10-15',
    transferTime: '14:00',
    // Multi-city segment legs
    multiCityLegs: [
      { origin: 'Lagos (LOS)', destination: 'London (LHR)', date: '2026-10-15' },
      { origin: 'London (LHR)', destination: 'Dubai (DXB)', date: '2026-10-22' }
    ]
  },
  activeDropdown: null, // 'travelers' | 'cabin' | 'hotel-guests' | null
  activeLocationPicker: null, // 'origin' | 'destination' | 'leg-orig-${idx}' | 'leg-dest-${idx}' | 'hotel-destination' | 'car-location' | 'transfer-pickup' | 'transfer-dropoff' | null
  locationSearchQuery: '',
  adminViewSubTab: 'approvals', // 'approvals' | 'caps' | 'bookings'
  selectedHotel: null,
  lastBooking: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
  setupRouting();
  renderCurrentView();

  // Close search popovers and location dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    let needsRerender = false;
    if (state.activeDropdown) {
      if (!e.target.closest('.header-picker-wrapper')) {
        state.activeDropdown = null;
        needsRerender = true;
      }
    }
    if (state.activeLocationPicker) {
      if (!e.target.closest('.location-input-container')) {
        state.activeLocationPicker = null;
        state.locationSearchQuery = '';
        needsRerender = true;
      }
    }
    if (needsRerender) {
      renderSearchCard();
    }
  });
});


// --- Authentication & Session Management ---
async function checkSession() {
  if (!state.authToken) return;
  try {
    const res = await fetch('/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const data = await res.json();
    if (data.authenticated) {
      state.currentUser = data.user;
      state.agentProfile = data.agent_profile;
      updateHeaderAgentState();
    } else {
      logout();
    }
  } catch (e) {
    console.error('Session check failed:', e);
  }
}

function updateHeaderAgentState() {
  const badge = document.getElementById('header-agent-badge');
  const agentBtn = document.getElementById('nav-agent-portal-btn');
  const loginBtn = document.getElementById('nav-login-btn');

  if (state.currentUser && state.currentUser.role === 'agent') {
    if (badge) badge.style.display = 'inline-flex';
    if (agentBtn) {
      agentBtn.textContent = 'Agent Dashboard';
      agentBtn.className = 'btn btn-navy';
      agentBtn.style.borderRadius = '8px';
      agentBtn.style.padding = '8px 16px';
      agentBtn.style.fontWeight = '600';
      agentBtn.style.whiteSpace = 'nowrap';
      agentBtn.style.display = 'inline-flex';
    }
    if (loginBtn) {
      loginBtn.textContent = 'Log out';
      loginBtn.onclick = logout;
    }
  } else if (state.currentUser) {
    if (badge) badge.style.display = 'none';
    if (agentBtn) {
      agentBtn.textContent = 'Agent portal';
      agentBtn.className = 'btn btn-gold';
      agentBtn.style.borderRadius = '8px';
      agentBtn.style.padding = '8px 16px';
      agentBtn.style.fontWeight = '600';
      agentBtn.style.whiteSpace = 'nowrap';
      agentBtn.style.display = 'inline-flex';
    }
    if (loginBtn) {
      loginBtn.textContent = 'Log out';
      loginBtn.onclick = logout;
    }
  } else {
    if (badge) badge.style.display = 'none';
    if (agentBtn) {
      agentBtn.textContent = 'Agent portal';
      agentBtn.className = 'btn btn-gold';
      agentBtn.style.borderRadius = '8px';
      agentBtn.style.padding = '8px 16px';
      agentBtn.style.fontWeight = '600';
      agentBtn.style.whiteSpace = 'nowrap';
      agentBtn.style.display = 'inline-flex';
    }
    if (loginBtn) {
      loginBtn.textContent = 'Log in';
      loginBtn.onclick = openLoginModal;
    }
  }
}

function logout() {
  state.authToken = null;
  state.currentUser = null;
  state.agentProfile = null;
  localStorage.removeItem('tc_auth_token');
  updateHeaderAgentState();
  navigateTo('home');
}

// --- Navigation & Routing ---
function navigateTo(viewName, params = {}) {
  state.currentView = viewName;
  if (params.hotel) state.selectedHotel = params.hotel;
  if (params.booking) state.lastBooking = params.booking;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderCurrentView();
}

function setupRouting() {
  window.addEventListener('popstate', () => {
    renderCurrentView();
  });
}

function renderCurrentView() {
  const container = document.getElementById('app-view');
  if (!container) return;

  switch (state.currentView) {
    case 'home':
      container.innerHTML = getHomeViewHtml();
      break;
    case 'results':
      container.innerHTML = getResultsViewHtml();
      loadSearchResults();
      break;
    case 'hotel-detail':
      container.innerHTML = getHotelDetailViewHtml();
      break;
    case 'checkout':
      container.innerHTML = getCheckoutViewHtml();
      break;
    case 'booking-confirmed':
      container.innerHTML = getBookingConfirmedViewHtml();
      break;
    case 'manage-booking':
      container.innerHTML = getManageBookingViewHtml();
      break;
    case 'booking-detail':
      container.innerHTML = getBookingDetailViewHtml();
      break;
    case 'agent-dashboard':
      container.innerHTML = getAgentDashboardViewHtml();
      loadAgentDashboardData();
      break;
    case 'admin':
      container.innerHTML = getAdminViewHtml();
      loadAdminViewData();
      break;
    default:
      container.innerHTML = getHomeViewHtml();
  }
}

// --- VIEW 1: HOMEPAGE (Page 1) ---
function getHomeViewHtml() {
  return `
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-headline">Every trip, one trusted case.</h1>
          <p class="hero-subhead">
            Unified booking for West Africa's leading enterprises. Real-time pricing, centralized management.
          </p>
        </div>

        <div class="search-container" id="hero-search-container">
          <!-- Folder Tabs per Figma 160:286 -->
          <div class="tab-switcher" id="hero-tab-switcher">
            <button type="button" class="folder-tab ${state.activeVertical === 'flights' ? 'active' : ''}" onclick="switchSearchTab('flights')">
              ✈ Flights
            </button>
            <button type="button" class="folder-tab ${state.activeVertical === 'hotels' ? 'active' : ''}" onclick="switchSearchTab('hotels')">
              🏨 Hotels
            </button>
            <button type="button" class="folder-tab ${state.activeVertical === 'cars' ? 'active' : ''}" onclick="switchSearchTab('cars')">
              🚗 Cars
            </button>
            <button type="button" class="folder-tab ${state.activeVertical === 'transfers' ? 'active' : ''}" onclick="switchSearchTab('transfers')">
              🚐 Transfers
            </button>
          </div>

          <!-- Floating Search Card -->
          <div class="search-card" id="hero-search-card">
            ${getSearchCardHtml()}
          </div>
        </div>
      </div>
    </section>

    <!-- Popular This Month Section per Figma 160:286 -->
    <section class="section container">
      <div class="section-header">
        <div>
          <h2 class="section-title">Popular this month</h2>
        </div>
        <a class="nav-link" style="color: var(--color-primary); font-weight: 600;" onclick="executeMainSearch()">
          View all →
        </a>
      </div>

      <div class="destinations-grid">
        <div class="dest-card" onclick="quickSelectDestination('DXB', 'Dubai')">
          <div class="dest-img-container">
            <img src="/assets/dubai.png" alt="Dubai, UAE">
            <span class="dest-tag" style="background: var(--color-primary); color: #FFFFFF;">Top Rated</span>
          </div>
          <div class="dest-body">
            <h3 class="dest-title">Dubai, UAE</h3>
            <p class="dest-country">Direct flights from LOS</p>
            <div class="dest-price-row">
              <span class="dest-price-label">FROM</span>
              <span class="dest-price-value">₦410,000</span>
            </div>
          </div>
        </div>

        <div class="dest-card" onclick="quickSelectDestination('NBO', 'Nairobi')">
          <div class="dest-img-container">
            <img src="/assets/nairobi.png" alt="Nairobi, Kenya">
          </div>
          <div class="dest-body">
            <h3 class="dest-title">Nairobi, Kenya</h3>
            <p class="dest-country">Corporate hubs</p>
            <div class="dest-price-row">
              <span class="dest-price-label">FROM</span>
              <span class="dest-price-value">₦320,500</span>
            </div>
          </div>
        </div>

        <div class="dest-card" onclick="quickSelectDestination('LHR', 'London')">
          <div class="dest-img-container">
            <img src="/assets/london.png" alt="London, UK">
          </div>
          <div class="dest-body">
            <h3 class="dest-title">London, UK</h3>
            <p class="dest-country">Business class deals</p>
            <div class="dest-price-row">
              <span class="dest-price-label">FROM</span>
              <span class="dest-price-value">₦850,000</span>
            </div>
          </div>
        </div>

        <div class="dest-card" onclick="quickSelectDestination('ACC', 'Accra')">
          <div class="dest-img-container">
            <img src="/assets/accra.png" alt="Accra, Ghana">
          </div>
          <div class="dest-body">
            <h3 class="dest-title">Accra, Ghana</h3>
            <p class="dest-country">Quick connections</p>
            <div class="dest-price-row">
              <span class="dest-price-label">FROM</span>
              <span class="dest-price-value">₦185,000</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Travel Case Section per Figma 160:286 -->
    <section class="section" style="background: #FFFFFF; border-top: 1px solid var(--color-border-line); border-bottom: 1px solid var(--color-border-line); padding: 72px 0;">
      <div class="container" style="text-align: center;">
        <h2 class="section-title" style="margin-bottom: 12px;">Why Travel Case</h2>
        <p class="section-subtitle" style="max-width: 650px; margin: 0 auto 54px;">
          Built for modern businesses and dedicated agents. Streamline your entire travel operation.
        </p>

        <div class="trust-row" style="grid-template-columns: repeat(3, 1fr); gap: 40px; text-align: center;">
          <div class="trust-card-figma">
            <div class="trust-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary); margin-bottom: 12px;">Real-time pricing</h3>
            <p style="color: var(--color-slate-muted); font-size: 0.95rem; line-height: 1.6;">
              Direct API connections ensure you see exactly what you pay in NGN, with no hidden fees or currency shock.
            </p>
          </div>

          <div class="trust-card-figma">
            <div class="trust-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="7" width="18" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary); margin-bottom: 12px;">One cart checkout</h3>
            <p style="color: var(--color-slate-muted); font-size: 0.95rem; line-height: 1.6;">
              Book flights, hotels, and airport transfers in a single transaction. Generate one consolidated invoice.
            </p>
          </div>

          <div class="trust-card-figma">
            <div class="trust-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary); margin-bottom: 12px;">Agent trade pricing</h3>
            <p style="color: var(--color-slate-muted); font-size: 0.95rem; line-height: 1.6;">
              Verified partners access net rates, manage sub-agents, and control markups from a unified dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer per Figma 160:286 -->
    <footer class="site-footer" style="background: var(--color-primary); color: #FFFFFF; padding: 64px 0 32px;">
      <div class="container">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px;">
          <div>
            <div style="background: #FFFFFF; display: inline-flex; padding: 6px 14px; border-radius: 8px; margin-bottom: 18px;">
              <img src="/assets/logo.png" alt="TravelCase" style="height: 32px; width: auto; display: block;">
            </div>
            <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.6; max-width: 320px; margin-bottom: 20px;">
              The trusted corporate travel booking platform for West Africa. Simplifying complex itineraries since 2023.
            </p>
            <div style="display: flex; gap: 12px;">
              <span class="social-circle">in</span>
              <span class="social-circle">𝕏</span>
            </div>
          </div>

          <div>
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px; color: #FFFFFF;">Company</h4>
            <ul style="list-style: none; display: grid; gap: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
              <li><a style="color: inherit; text-decoration: none;" href="#about">About Us</a></li>
              <li><a style="color: inherit; text-decoration: none;" href="#careers">Careers</a></li>
              <li><a style="color: inherit; text-decoration: none;" href="#press">Press</a></li>
              <li><a style="color: inherit; text-decoration: none;" href="#blog">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px; color: #FFFFFF;">Support</h4>
            <ul style="list-style: none; display: grid; gap: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
              <li><a style="color: inherit; text-decoration: none;" href="#help">Help Center</a></li>
              <li><a style="color: inherit; text-decoration: none;" href="#contact">Contact Us</a></li>
              <li><a style="color: inherit; text-decoration: none;" href="#baggage">Baggage Info</a></li>
              <li><a style="color: inherit; text-decoration: none;" href="#cancellations">Cancellations</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px; color: #FFFFFF;">For Agents</h4>
            <ul style="list-style: none; display: grid; gap: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
              <li><a style="color: inherit; text-decoration: none; cursor: pointer;" onclick="navigateTo('agent-dashboard')">Partner Program</a></li>
              <li><a style="color: inherit; text-decoration: none; cursor: pointer;" onclick="handleAgentPortalClick()">Agent Portal</a></li>
              <li><a style="color: inherit; text-decoration: none;" href="#api">API Documentation</a></li>
            </ul>
          </div>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: rgba(255,255,255,0.6);">
          <div>© 2023 Travel Case Ltd. All rights reserved.</div>
          <div style="display: flex; gap: 24px;">
            <a style="color: inherit; text-decoration: none;" href="#terms">Terms of Service</a>
            <a style="color: inherit; text-decoration: none;" href="#privacy">Privacy Policy</a>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: var(--radius-pill); color: #FFFFFF;">
            📍 Lagos, Nigeria (NGN)
          </div>
        </div>
      </div>
    </footer>
  `;
}

// --- Curated Location & Airport Hub Datasets ---
const POPULAR_LOCATIONS = [
  { code: 'LOS', city: 'Lagos', country: 'Nigeria', airport: 'Murtala Muhammed Intl (LOS)' },
  { code: 'ABV', city: 'Abuja', country: 'Nigeria', airport: 'Nnamdi Azikiwe Intl (ABV)' },
  { code: 'LHR', city: 'London', country: 'United Kingdom', airport: 'Heathrow Airport (LHR)' },
  { code: 'LGW', city: 'London', country: 'United Kingdom', airport: 'Gatwick Airport (LGW)' },
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', airport: 'Dubai Intl (DXB)' },
  { code: 'NBO', city: 'Nairobi', country: 'Kenya', airport: 'Jomo Kenyatta Intl (NBO)' },
  { code: 'ACC', city: 'Accra', country: 'Ghana', airport: 'Kotoka Intl (ACC)' },
  { code: 'CDG', city: 'Paris', country: 'France', airport: 'Charles de Gaulle (CDG)' },
  { code: 'JFK', city: 'New York', country: 'United States', airport: 'John F. Kennedy Intl (JFK)' },
  { code: 'DOH', city: 'Doha', country: 'Qatar', airport: 'Hamad Intl (DOH)' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey', airport: 'Istanbul Airport (IST)' },
  { code: 'DPS', city: 'Bali', country: 'Indonesia', airport: 'Ngurah Rai Intl (DPS)' },
  { code: 'JNB', city: 'Johannesburg', country: 'South Africa', airport: 'O.R. Tambo Intl (JNB)' },
  { code: 'CPT', city: 'Cape Town', country: 'South Africa', airport: 'Cape Town Intl (CPT)' },
  { code: 'YYZ', city: 'Toronto', country: 'Canada', airport: 'Toronto Pearson (YYZ)' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', airport: 'Frankfurt Airport (FRA)' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', airport: 'Amsterdam Schiphol (AMS)' },
  { code: 'CAI', city: 'Cairo', country: 'Egypt', airport: 'Cairo Intl (CAI)' }
];

const HOTEL_DESTINATIONS = [
  { code: 'DPS', city: 'Bali', country: 'Indonesia', subtitle: '54 Luxury Beachfront Resorts & Villas' },
  { code: 'DXB', city: 'Dubai', country: 'UAE', subtitle: '120+ 5-Star Beach & Downtown Hotels' },
  { code: 'LOS', city: 'Lagos (VI & Ikoyi)', country: 'Nigeria', subtitle: '42 Business & Boutique Hotels' },
  { code: 'LHR', city: 'London', country: 'United Kingdom', subtitle: '85 Central London Hotels & Suites' },
  { code: 'NBO', city: 'Nairobi', country: 'Kenya', subtitle: '38 Safari Lodges & City Hotels' },
  { code: 'ACC', city: 'Accra', country: 'Ghana', subtitle: '28 Coastal & Airport Hotels' },
  { code: 'CDG', city: 'Paris', country: 'France', subtitle: '65 Boutique & Landmark Hotels' },
  { code: 'CPT', city: 'Cape Town', country: 'South Africa', subtitle: '45 Waterfront & Winelands Stays' },
  { code: 'JFK', city: 'New York', country: 'United States', subtitle: '90 Manhattan & Brooklyn Hotels' }
];

const CAR_DEPOTS = [
  { code: 'LOS', name: 'Lagos (LOS) Airport Terminal', city: 'Lagos', detail: 'Hertz, Avis, Sixt counters' },
  { code: 'VI', name: 'Victoria Island City Center', city: 'Lagos', detail: 'Corporate Chauffeur & Self-drive' },
  { code: 'ABV', name: 'Abuja (ABV) Airport Hub', city: 'Abuja', detail: 'Terminal 1 & 2 Car Rental' },
  { code: 'LHR', name: 'London Heathrow (LHR) Terminals 2-5', city: 'London', detail: 'Europcar, Enterprise, Hertz' },
  { code: 'DXB', name: 'Dubai Intl (DXB) Terminal 1 & 3', city: 'Dubai', detail: 'Luxury & Economy Fleet' },
  { code: 'NBO', name: 'Nairobi JKIA Airport Hub', city: 'Nairobi', detail: '4x4 Safari Vehicles & Sedans' },
  { code: 'ACC', name: 'Accra Kotoka (ACC) Airport Hub', city: 'Accra', detail: 'Avis & Local Fleet' }
];

const TRANSFER_LOCATIONS = [
  { name: 'Lagos Airport (LOS) - International', type: 'Airport', tag: 'LOS Intl' },
  { name: 'Lagos Airport (LOS) - MMA2 Domestic', type: 'Airport', tag: 'MMA2' },
  { name: 'Victoria Island / Ikoyi Hotels', type: 'District', tag: 'Island' },
  { name: 'Ikeja GRA / Maryland Hub', type: 'District', tag: 'Mainland' },
  { name: 'Eko Atlantic City', type: 'Corporate', tag: 'Eko Atlantic' },
  { name: 'London Heathrow (LHR) - All Terminals', type: 'Airport', tag: 'LHR' },
  { name: 'Dubai International (DXB)', type: 'Airport', tag: 'DXB' },
  { name: 'Nairobi Jomo Kenyatta (NBO)', type: 'Airport', tag: 'NBO' }
];

// --- Location Selector Controller Functions ---
function openLocationPicker(field, event) {
  if (event) event.stopPropagation();
  state.activeLocationPicker = field;
  state.locationSearchQuery = '';
  state.activeDropdown = null;
  renderSearchCard();
  setTimeout(() => {
    let inputId = '';
    if (field === 'origin') inputId = 'search-origin';
    else if (field === 'destination') inputId = 'search-destination';
    else if (field.startsWith('leg-orig-')) inputId = `search-${field}`;
    else if (field.startsWith('leg-dest-')) inputId = `search-${field}`;
    else if (field === 'hotel-destination') inputId = 'search-hotel-destination';
    else if (field === 'car-location') inputId = 'search-car-location';
    else if (field === 'transfer-pickup') inputId = 'search-transfer-pickup';
    else if (field === 'transfer-dropoff') inputId = 'search-transfer-dropoff';
    const el = document.getElementById(inputId);
    if (el) {
      el.focus();
      el.select();
    }
  }, 20);
}

function handleLocationInput(field, val, event) {
  if (event) event.stopPropagation();
  state.locationSearchQuery = val;
  state.activeLocationPicker = field;

  // Keep activeSearch string synced
  if (field === 'origin') {
    state.activeSearch.originDisplay = val;
  } else if (field === 'destination') {
    state.activeSearch.destinationDisplay = val;
  } else if (field.startsWith('leg-orig-')) {
    const idx = parseInt(field.replace('leg-orig-', ''), 10);
    if (state.activeSearch.multiCityLegs && state.activeSearch.multiCityLegs[idx]) {
      state.activeSearch.multiCityLegs[idx].origin = val;
    }
  } else if (field.startsWith('leg-dest-')) {
    const idx = parseInt(field.replace('leg-dest-', ''), 10);
    if (state.activeSearch.multiCityLegs && state.activeSearch.multiCityLegs[idx]) {
      state.activeSearch.multiCityLegs[idx].destination = val;
    }
  } else if (field === 'hotel-destination') {
    state.activeSearch.hotelDestinationDisplay = val;
  } else if (field === 'car-location') {
    state.activeSearch.carLocation = val;
  } else if (field === 'transfer-pickup') {
    state.activeSearch.transferPickup = val;
  } else if (field === 'transfer-dropoff') {
    state.activeSearch.transferDropoff = val;
  }

  // Update dropdown panel content in place without re-rendering card (preserves focus and caret)
  const panel = document.getElementById(`dropdown-panel-${field}`);
  if (panel) {
    panel.innerHTML = getLocationListItemsHtml(field);
  } else {
    renderSearchCard();
  }
}

function getLocationListItemsHtml(field) {
  const query = (state.locationSearchQuery || '').trim().toLowerCase();

  if (field === 'origin' || field === 'destination' || field.startsWith('leg-')) {
    const matches = POPULAR_LOCATIONS.filter(item => {
      if (!query) return true;
      return item.city.toLowerCase().includes(query) ||
             item.code.toLowerCase().includes(query) ||
             item.country.toLowerCase().includes(query) ||
             item.airport.toLowerCase().includes(query);
    });

    if (matches.length === 0) {
      return `
        <div class="location-dropdown-header">
          <span>Search Results</span>
          <span>0 found</span>
        </div>
        <div style="padding: 16px; text-align: center; color: var(--color-slate-muted); font-size: 0.85rem;">
          No matching airports found for "${query}". You can still search with this freeform city or code.
        </div>
      `;
    }

    return `
      <div class="location-dropdown-header">
        <span>${query ? 'Matching Airports' : 'Popular Airports & Hubs'}</span>
        <span>IATA</span>
      </div>
      ${matches.map(item => `
        <div class="location-dropdown-item" onmousedown="selectLocation('${field}', '${item.city} (${item.code})', '${item.code}', event)">
          <div class="location-main-info">
            <span class="location-icon">✈</span>
            <div>
              <div class="location-city">${item.city}, <span style="font-weight: 400; color: var(--color-slate-muted);">${item.country}</span></div>
              <div class="location-airport-sub">${item.airport}</div>
            </div>
          </div>
          <span class="location-code-pill">${item.code}</span>
        </div>
      `).join('')}
    `;
  }

  if (field === 'hotel-destination') {
    const matches = HOTEL_DESTINATIONS.filter(item => {
      if (!query) return true;
      return item.city.toLowerCase().includes(query) ||
             item.code.toLowerCase().includes(query) ||
             item.country.toLowerCase().includes(query) ||
             item.subtitle.toLowerCase().includes(query);
    });

    if (matches.length === 0) {
      return `
        <div class="location-dropdown-header">
          <span>Search Results</span>
          <span>0 found</span>
        </div>
        <div style="padding: 16px; text-align: center; color: var(--color-slate-muted); font-size: 0.85rem;">
          No matching hotel destinations found for "${query}".
        </div>
      `;
    }

    return `
      <div class="location-dropdown-header">
        <span>${query ? 'Matching Destinations' : 'Popular Hotel Destinations'}</span>
        <span>CODE</span>
      </div>
      ${matches.map(item => `
        <div class="location-dropdown-item" onmousedown="selectHotelLocation('${item.city} (${item.code})', '${item.code}', event)">
          <div class="location-main-info">
            <span class="location-icon">🏨</span>
            <div>
              <div class="location-city">${item.city}, <span style="font-weight: 400; color: var(--color-slate-muted);">${item.country}</span></div>
              <div class="location-airport-sub">${item.subtitle}</div>
            </div>
          </div>
          <span class="location-code-pill">${item.code}</span>
        </div>
      `).join('')}
    `;
  }

  if (field === 'car-location') {
    const matches = CAR_DEPOTS.filter(item => {
      if (!query) return true;
      return item.name.toLowerCase().includes(query) ||
             item.city.toLowerCase().includes(query) ||
             item.code.toLowerCase().includes(query) ||
             item.detail.toLowerCase().includes(query);
    });

    if (matches.length === 0) {
      return `
        <div class="location-dropdown-header">
          <span>Pick-up Stations</span>
          <span>0 found</span>
        </div>
        <div style="padding: 16px; text-align: center; color: var(--color-slate-muted); font-size: 0.85rem;">
          No matching car depots found for "${query}".
        </div>
      `;
    }

    return `
      <div class="location-dropdown-header">
        <span>${query ? 'Matching Stations' : 'Popular Rental Stations'}</span>
        <span>CODE</span>
      </div>
      ${matches.map(item => `
        <div class="location-dropdown-item" onmousedown="selectCarLocation('${item.name}', event)">
          <div class="location-main-info">
            <span class="location-icon">🚗</span>
            <div>
              <div class="location-city">${item.name}</div>
              <div class="location-airport-sub">${item.city} · ${item.detail}</div>
            </div>
          </div>
          <span class="location-code-pill">${item.code}</span>
        </div>
      `).join('')}
    `;
  }

  if (field === 'transfer-pickup' || field === 'transfer-dropoff') {
    const matches = TRANSFER_LOCATIONS.filter(item => {
      if (!query) return true;
      return item.name.toLowerCase().includes(query) ||
             item.type.toLowerCase().includes(query) ||
             item.tag.toLowerCase().includes(query);
    });

    if (matches.length === 0) {
      return `
        <div class="location-dropdown-header">
          <span>Transfer Hubs</span>
          <span>0 found</span>
        </div>
        <div style="padding: 16px; text-align: center; color: var(--color-slate-muted); font-size: 0.85rem;">
          No matching transfer hubs found for "${query}".
        </div>
      `;
    }

    return `
      <div class="location-dropdown-header">
        <span>${query ? 'Matching Hubs' : 'Transfer Hubs & Stations'}</span>
        <span>HUB</span>
      </div>
      ${matches.map(item => `
        <div class="location-dropdown-item" onmousedown="selectTransferLocation('${field}', '${item.name}', event)">
          <div class="location-main-info">
            <span class="location-icon">🚐</span>
            <div>
              <div class="location-city">${item.name}</div>
              <div class="location-airport-sub">${item.type} Transfer Station</div>
            </div>
          </div>
          <span class="location-code-pill">${item.tag}</span>
        </div>
      `).join('')}
    `;
  }

  return '';
}

function selectLocation(field, displayVal, code, event) {
  if (event) event.stopPropagation();
  if (field === 'origin') {
    state.activeSearch.origin = code;
    state.activeSearch.originDisplay = displayVal;
  } else if (field === 'destination') {
    state.activeSearch.destination = code;
    state.activeSearch.destinationDisplay = displayVal;
  } else if (field.startsWith('leg-orig-')) {
    const idx = parseInt(field.replace('leg-orig-', ''), 10);
    if (state.activeSearch.multiCityLegs && state.activeSearch.multiCityLegs[idx]) {
      state.activeSearch.multiCityLegs[idx].origin = displayVal;
    }
  } else if (field.startsWith('leg-dest-')) {
    const idx = parseInt(field.replace('leg-dest-', ''), 10);
    if (state.activeSearch.multiCityLegs && state.activeSearch.multiCityLegs[idx]) {
      state.activeSearch.multiCityLegs[idx].destination = displayVal;
    }
  }
  state.activeLocationPicker = null;
  state.locationSearchQuery = '';
  renderSearchCard();
}

function selectHotelLocation(displayVal, code, event) {
  if (event) event.stopPropagation();
  state.activeSearch.hotelDestination = code;
  state.activeSearch.hotelDestinationDisplay = displayVal;
  state.activeLocationPicker = null;
  state.locationSearchQuery = '';
  renderSearchCard();
}

function selectCarLocation(displayVal, event) {
  if (event) event.stopPropagation();
  state.activeSearch.carLocation = displayVal;
  state.activeLocationPicker = null;
  state.locationSearchQuery = '';
  renderSearchCard();
}

function selectTransferLocation(field, displayVal, event) {
  if (event) event.stopPropagation();
  if (field === 'transfer-pickup') {
    state.activeSearch.transferPickup = displayVal;
  } else {
    state.activeSearch.transferDropoff = displayVal;
  }
  state.activeLocationPicker = null;
  state.locationSearchQuery = '';
  renderSearchCard();
}

// --- Interactive Search Controls & Helpers ---
function getTravelerLabel() {
  const adults = state.activeSearch.adults || 1;
  const children = state.activeSearch.children || 0;
  const infants = state.activeSearch.infants || 0;
  const total = adults + children + infants;
  if (total === 1 && adults === 1) return '1 Adult';
  return `${total} Travelers`;
}

function getCabinLabel() {
  switch (state.activeSearch.cabinClass) {
    case 'premium_economy': return 'Premium Economy';
    case 'business': return 'Business';
    case 'first': return 'First Class';
    default: return 'Economy';
  }
}

function getSearchCardHtml() {
  const v = state.activeVertical || 'flights';

  if (v === 'hotels') {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="font-weight: 600; color: var(--color-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
          <span>🏨</span> <span>Wholesale Hotel Inventory & Direct Sabre Rates</span>
        </div>

        <div style="display: flex; gap: 12px; align-items: center;">
          <div class="header-picker-wrapper">
            <button type="button" class="header-picker-badge ${state.activeDropdown === 'hotel-guests' ? 'active' : ''}" onclick="toggleDropdown('hotel-guests', event)">
              <span>👤 ${state.activeSearch.guests || 2} Guests · ${state.activeSearch.rooms || 1} Room ⌵</span>
            </button>
            ${state.activeDropdown === 'hotel-guests' ? `
              <div class="header-picker-dropdown" onclick="event.stopPropagation()">
                <div class="picker-row">
                  <div>
                    <div class="picker-label-title">Guests</div>
                    <div class="picker-label-sub">Total occupants</div>
                  </div>
                  <div class="stepper-controls">
                    <button type="button" class="stepper-btn" onclick="updateHotelGuests('guests', -1, event)" ${state.activeSearch.guests <= 1 ? 'disabled' : ''}>−</button>
                    <span class="stepper-count">${state.activeSearch.guests || 2}</span>
                    <button type="button" class="stepper-btn" onclick="updateHotelGuests('guests', 1, event)">+</button>
                  </div>
                </div>
                <div class="picker-row" style="margin-top: 12px;">
                  <div>
                    <div class="picker-label-title">Rooms</div>
                    <div class="picker-label-sub">Standard or Suites</div>
                  </div>
                  <div class="stepper-controls">
                    <button type="button" class="stepper-btn" onclick="updateHotelGuests('rooms', -1, event)" ${state.activeSearch.rooms <= 1 ? 'disabled' : ''}>−</button>
                    <span class="stepper-count">${state.activeSearch.rooms || 1}</span>
                    <button type="button" class="stepper-btn" onclick="updateHotelGuests('rooms', 1, event)">+</button>
                  </div>
                </div>
                <button type="button" class="btn btn-gold" style="width: 100%; margin-top: 16px; padding: 8px; font-weight: 600; border-radius: 6px;" onclick="closeDropdowns(event)">Done</button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="search-grid-hotels">
        <div class="input-box location-input-container">
          <label>DESTINATION / HOTEL</label>
          <input type="text" id="search-hotel-destination" autocomplete="off"
            value="${state.activeLocationPicker === 'hotel-destination' && state.locationSearchQuery !== '' ? state.locationSearchQuery : (state.activeSearch.hotelDestinationDisplay || 'Bali (DPS)')}"
            onclick="openLocationPicker('hotel-destination', event)"
            oninput="handleLocationInput('hotel-destination', this.value, event)"
            placeholder="City, island, or property">
          ${state.activeLocationPicker === 'hotel-destination' ? `
            <div class="location-dropdown-panel" id="dropdown-panel-hotel-destination" onclick="event.stopPropagation()">
              ${getLocationListItemsHtml('hotel-destination')}
            </div>
          ` : ''}
        </div>

        <div class="input-box">
          <label>CHECK-IN</label>
          <input type="date" id="search-checkin" value="${state.activeSearch.checkInDate || '2026-10-15'}">
        </div>

        <div class="input-box">
          <label>CHECK-OUT</label>
          <input type="date" id="search-checkout" value="${state.activeSearch.checkOutDate || '2026-10-22'}">
        </div>

        <div class="input-box">
          <label>ROOM TYPE</label>
          <select id="search-hotel-room-type">
            <option value="deluxe" selected>Deluxe Suite / Ocean View</option>
            <option value="executive">Executive Suite</option>
            <option value="standard">Standard Double Room</option>
          </select>
        </div>

        <button type="button" class="btn btn-gold" style="height: 54px; padding: 0 32px; font-size: 1rem; font-weight: 700; border-radius: 8px;" onclick="executeMainSearch()">
          Search Hotels
        </button>
      </div>
    `;
  }

  if (v === 'cars') {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="font-weight: 600; color: var(--color-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
          <span>🚗</span> <span>Sabre Verified Car Rental Inventory & Free Unlimited Mileage</span>
        </div>

        <div style="display: flex; gap: 12px; align-items: center;">
          <div class="header-picker-badge" style="cursor: default;">
            <span>🛡 Zero Insurance Excess Included</span>
          </div>
        </div>
      </div>

      <div class="search-grid-cars">
        <div class="input-box location-input-container">
          <label>PICK-UP LOCATION</label>
          <input type="text" id="search-car-location" autocomplete="off"
            value="${state.activeLocationPicker === 'car-location' && state.locationSearchQuery !== '' ? state.locationSearchQuery : (state.activeSearch.carLocation || 'Lagos (LOS) Airport')}"
            onclick="openLocationPicker('car-location', event)"
            oninput="handleLocationInput('car-location', this.value, event)"
            placeholder="Airport, city, or terminal">
          ${state.activeLocationPicker === 'car-location' ? `
            <div class="location-dropdown-panel" id="dropdown-panel-car-location" onclick="event.stopPropagation()">
              ${getLocationListItemsHtml('car-location')}
            </div>
          ` : ''}
        </div>

        <div class="input-box">
          <label>PICK-UP DATE</label>
          <input type="date" id="search-car-pickup" value="${state.activeSearch.carPickupDate || '2026-10-15'}">
        </div>

        <div class="input-box">
          <label>RETURN DATE</label>
          <input type="date" id="search-car-dropoff" value="${state.activeSearch.carDropoffDate || '2026-10-22'}">
        </div>

        <div class="input-box">
          <label>VEHICLE CATEGORY</label>
          <select id="search-car-type">
            <option value="all" selected>All Vehicles (SUV, Sedan)</option>
            <option value="suv">Compact SUV (Toyota RAV4)</option>
            <option value="sedan">Intermediate Sedan (Hyundai Elantra)</option>
            <option value="luxury">Executive Luxury (Mercedes E-Class)</option>
          </select>
        </div>

        <button type="button" class="btn btn-gold" style="height: 54px; padding: 0 32px; font-size: 1rem; font-weight: 700; border-radius: 8px;" onclick="executeMainSearch()">
          Search Cars
        </button>
      </div>
    `;
  }

  if (v === 'transfers') {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="font-weight: 600; color: var(--color-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
          <span>🚐</span> <span>Private Airport Pick-up & Executive Transfers</span>
        </div>

        <div style="display: flex; gap: 12px; align-items: center;">
          <div class="header-picker-badge" style="cursor: default;">
            <span>✈ Flight Tracking & Meet/Greet Included</span>
          </div>
        </div>
      </div>

      <div class="search-grid-transfers">
        <div class="input-box location-input-container">
          <label>PICK-UP LOCATION</label>
          <input type="text" id="search-transfer-pickup" autocomplete="off"
            value="${state.activeLocationPicker === 'transfer-pickup' && state.locationSearchQuery !== '' ? state.locationSearchQuery : (state.activeSearch.transferPickup || 'Lagos Airport (LOS)')}"
            onclick="openLocationPicker('transfer-pickup', event)"
            oninput="handleLocationInput('transfer-pickup', this.value, event)"
            placeholder="Airport, terminal or address">
          ${state.activeLocationPicker === 'transfer-pickup' ? `
            <div class="location-dropdown-panel" id="dropdown-panel-transfer-pickup" onclick="event.stopPropagation()">
              ${getLocationListItemsHtml('transfer-pickup')}
            </div>
          ` : ''}
        </div>

        <div class="input-box location-input-container">
          <label>DROP-OFF DESTINATION</label>
          <input type="text" id="search-transfer-dropoff" autocomplete="off"
            value="${state.activeLocationPicker === 'transfer-dropoff' && state.locationSearchQuery !== '' ? state.locationSearchQuery : (state.activeSearch.transferDropoff || 'Victoria Island / Ikoyi Hotels')}"
            onclick="openLocationPicker('transfer-dropoff', event)"
            oninput="handleLocationInput('transfer-dropoff', this.value, event)"
            placeholder="Hotel, office, or residence">
          ${state.activeLocationPicker === 'transfer-dropoff' ? `
            <div class="location-dropdown-panel" id="dropdown-panel-transfer-dropoff" onclick="event.stopPropagation()">
              ${getLocationListItemsHtml('transfer-dropoff')}
            </div>
          ` : ''}
        </div>

        <div class="input-box">
          <label>TRANSFER DATE</label>
          <input type="date" id="search-transfer-date" value="${state.activeSearch.transferDate || '2026-10-15'}">
        </div>

        <div class="input-box">
          <label>SERVICE CLASS</label>
          <select id="search-transfer-vehicle">
            <option value="sedan" selected>Private VIP Sedan (1-3 Pax)</option>
            <option value="van">Executive Van (4-7 Pax)</option>
            <option value="shuttle">Standard Airport Shuttle</option>
          </select>
        </div>

        <button type="button" class="btn btn-gold" style="height: 54px; padding: 0 32px; font-size: 1rem; font-weight: 700; border-radius: 8px;" onclick="executeMainSearch()">
          Search Transfers
        </button>
      </div>
    `;
  }

  // DEFAULT VERTICAL: FLIGHTS
  const isMultiCity = state.activeSearch.tripType === 'multi_city';
  const isOneWay = state.activeSearch.tripType === 'one_way';

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div class="trip-type-toggle" style="margin-bottom: 0;">
        <label class="radio-pill ${state.activeSearch.tripType === 'round_trip' ? 'active' : ''}">
          <input type="radio" name="tripType" value="round_trip" ${state.activeSearch.tripType === 'round_trip' ? 'checked' : ''} onchange="setTripType('round_trip')"> Round trip
        </label>
        <label class="radio-pill ${state.activeSearch.tripType === 'one_way' ? 'active' : ''}">
          <input type="radio" name="tripType" value="one_way" ${state.activeSearch.tripType === 'one_way' ? 'checked' : ''} onchange="setTripType('one_way')"> One way
        </label>
        <label class="radio-pill ${state.activeSearch.tripType === 'multi_city' ? 'active' : ''}">
          <input type="radio" name="tripType" value="multi_city" ${state.activeSearch.tripType === 'multi_city' ? 'checked' : ''} onchange="setTripType('multi_city')"> Multi-city
        </label>
      </div>

      <div style="display: flex; gap: 12px; align-items: center;">
        <!-- Travelers Dropdown Badge -->
        <div class="header-picker-wrapper">
          <button type="button" class="header-picker-badge ${state.activeDropdown === 'travelers' ? 'active' : ''}" onclick="toggleDropdown('travelers', event)">
            <span>👤 ${getTravelerLabel()} ⌵</span>
          </button>

          ${state.activeDropdown === 'travelers' ? `
            <div class="header-picker-dropdown" onclick="event.stopPropagation()">
              <div class="picker-row">
                <div>
                  <div class="picker-label-title">Adults</div>
                  <div class="picker-label-sub">Age 12+</div>
                </div>
                <div class="stepper-controls">
                  <button type="button" class="stepper-btn" onclick="updateTravelerCount('adults', -1, event)" ${state.activeSearch.adults <= 1 ? 'disabled' : ''}>−</button>
                  <span class="stepper-count">${state.activeSearch.adults || 1}</span>
                  <button type="button" class="stepper-btn" onclick="updateTravelerCount('adults', 1, event)">+</button>
                </div>
              </div>

              <div class="picker-row">
                <div>
                  <div class="picker-label-title">Children</div>
                  <div class="picker-label-sub">Age 2–11</div>
                </div>
                <div class="stepper-controls">
                  <button type="button" class="stepper-btn" onclick="updateTravelerCount('children', -1, event)" ${state.activeSearch.children <= 0 ? 'disabled' : ''}>−</button>
                  <span class="stepper-count">${state.activeSearch.children || 0}</span>
                  <button type="button" class="stepper-btn" onclick="updateTravelerCount('children', 1, event)">+</button>
                </div>
              </div>

              <div class="picker-row">
                <div>
                  <div class="picker-label-title">Infants</div>
                  <div class="picker-label-sub">Under 2</div>
                </div>
                <div class="stepper-controls">
                  <button type="button" class="stepper-btn" onclick="updateTravelerCount('infants', -1, event)" ${state.activeSearch.infants <= 0 ? 'disabled' : ''}>−</button>
                  <span class="stepper-count">${state.activeSearch.infants || 0}</span>
                  <button type="button" class="stepper-btn" onclick="updateTravelerCount('infants', 1, event)">+</button>
                </div>
              </div>

              <button type="button" class="btn btn-gold" style="width: 100%; margin-top: 16px; padding: 8px; font-weight: 600; border-radius: 6px;" onclick="closeDropdowns(event)">Done</button>
            </div>
          ` : ''}
        </div>

        <!-- Cabin Class Dropdown Badge -->
        <div class="header-picker-wrapper">
          <button type="button" class="header-picker-badge ${state.activeDropdown === 'cabin' ? 'active' : ''}" onclick="toggleDropdown('cabin', event)">
            <span>${getCabinLabel()} ⌵</span>
          </button>

          ${state.activeDropdown === 'cabin' ? `
            <div class="header-picker-dropdown" onclick="event.stopPropagation()">
              <button type="button" class="cabin-option-btn ${state.activeSearch.cabinClass === 'economy' ? 'selected' : ''}" onclick="setCabinClass('economy')">
                <span>Economy</span> ${state.activeSearch.cabinClass === 'economy' ? '✓' : ''}
              </button>
              <button type="button" class="cabin-option-btn ${state.activeSearch.cabinClass === 'premium_economy' ? 'selected' : ''}" onclick="setCabinClass('premium_economy')">
                <span>Premium Economy</span> ${state.activeSearch.cabinClass === 'premium_economy' ? '✓' : ''}
              </button>
              <button type="button" class="cabin-option-btn ${state.activeSearch.cabinClass === 'business' ? 'selected' : ''}" onclick="setCabinClass('business')">
                <span>Business</span> ${state.activeSearch.cabinClass === 'business' ? '✓' : ''}
              </button>
              <button type="button" class="cabin-option-btn ${state.activeSearch.cabinClass === 'first' ? 'selected' : ''}" onclick="setCabinClass('first')">
                <span>First Class</span> ${state.activeSearch.cabinClass === 'first' ? '✓' : ''}
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    ${isMultiCity ? `
      <!-- Multi-city Segments -->
      <div class="multi-city-container">
        ${state.activeSearch.multiCityLegs.map((leg, idx) => `
          <div class="multi-city-leg-row">
            <div class="input-box location-input-container">
              <label>FLIGHT ${idx + 1} — FROM</label>
              <input type="text" id="search-leg-orig-${idx}" autocomplete="off"
                value="${state.activeLocationPicker === `leg-orig-${idx}` && state.locationSearchQuery !== '' ? state.locationSearchQuery : leg.origin}"
                onclick="openLocationPicker('leg-orig-${idx}', event)"
                oninput="handleLocationInput('leg-orig-${idx}', this.value, event)"
                placeholder="Departure city">
              ${state.activeLocationPicker === `leg-orig-${idx}` ? `
                <div class="location-dropdown-panel" id="dropdown-panel-leg-orig-${idx}" onclick="event.stopPropagation()">
                  ${getLocationListItemsHtml(`leg-orig-${idx}`)}
                </div>
              ` : ''}
            </div>

            <button type="button" class="swap-btn" title="Swap route" onclick="swapMultiCityLeg(${idx})">⇄</button>

            <div class="input-box location-input-container">
              <label>TO</label>
              <input type="text" id="search-leg-dest-${idx}" autocomplete="off"
                value="${state.activeLocationPicker === `leg-dest-${idx}` && state.locationSearchQuery !== '' ? state.locationSearchQuery : leg.destination}"
                onclick="openLocationPicker('leg-dest-${idx}', event)"
                oninput="handleLocationInput('leg-dest-${idx}', this.value, event)"
                placeholder="Arrival city">
              ${state.activeLocationPicker === `leg-dest-${idx}` ? `
                <div class="location-dropdown-panel" id="dropdown-panel-leg-dest-${idx}" onclick="event.stopPropagation()">
                  ${getLocationListItemsHtml(`leg-dest-${idx}`)}
                </div>
              ` : ''}
            </div>

            <div class="input-box">
              <label>DEPART</label>
              <input type="date" id="search-leg-date-${idx}" value="${leg.date}" oninput="updateLegVal(${idx}, 'date', this.value)">
            </div>

            <div>
              ${state.activeSearch.multiCityLegs.length > 2 ? `
                <button type="button" class="leg-remove-btn" title="Remove flight" onclick="removeMultiCityLeg(${idx})">✕</button>
              ` : `
                <span style="display: inline-block; width: 32px;"></span>
              `}
            </div>
          </div>
        `).join('')}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <button type="button" class="btn btn-outline-primary" style="padding: 10px 20px; font-weight: 600; border-radius: 8px; border: 1.5px dashed var(--color-primary); color: var(--color-primary);" onclick="addMultiCityLeg()">
            + Add another flight
          </button>

          <button type="button" class="btn btn-gold" style="height: 52px; padding: 0 42px; font-size: 1rem; font-weight: 700; border-radius: 8px;" onclick="executeMainSearch()">
            Search Flights
          </button>
        </div>
      </div>
    ` : `
      <!-- Standard Flights Search Grid -->
      <div class="search-grid">
        <div class="input-box location-input-container">
          <label>FROM</label>
          <input type="text" id="search-origin" autocomplete="off"
            value="${state.activeLocationPicker === 'origin' && state.locationSearchQuery !== '' ? state.locationSearchQuery : (state.activeSearch.originDisplay || 'Lagos (LOS)')}"
            onclick="openLocationPicker('origin', event)"
            oninput="handleLocationInput('origin', this.value, event)"
            placeholder="City or Airport (e.g. Lagos, LOS)">
          ${state.activeLocationPicker === 'origin' ? `
            <div class="location-dropdown-panel" id="dropdown-panel-origin" onclick="event.stopPropagation()">
              ${getLocationListItemsHtml('origin')}
            </div>
          ` : ''}
        </div>

        <button type="button" class="swap-btn" title="Swap origin and destination" onclick="swapOriginDestination()">⇄</button>

        <div class="input-box location-input-container">
          <label>TO</label>
          <input type="text" id="search-destination" autocomplete="off"
            value="${state.activeLocationPicker === 'destination' && state.locationSearchQuery !== '' ? state.locationSearchQuery : (state.activeSearch.destinationDisplay || 'London (LHR)')}"
            onclick="openLocationPicker('destination', event)"
            oninput="handleLocationInput('destination', this.value, event)"
            placeholder="City or Airport (e.g. London, LHR)">
          ${state.activeLocationPicker === 'destination' ? `
            <div class="location-dropdown-panel" id="dropdown-panel-destination" onclick="event.stopPropagation()">
              ${getLocationListItemsHtml('destination')}
            </div>
          ` : ''}
        </div>

        <div class="input-box">
          <label>DEPART</label>
          <input type="date" id="search-depart" value="${state.activeSearch.departDate || '2026-10-15'}">
        </div>

        ${!isOneWay ? `
          <div class="input-box" id="return-date-box">
            <label>RETURN</label>
            <input type="date" id="search-return" value="${state.activeSearch.returnDate || '2026-10-22'}">
          </div>
        ` : ''}

        <button type="button" class="btn btn-gold" style="height: 54px; padding: 0 36px; font-size: 1rem; font-weight: 700; border-radius: 8px;" onclick="executeMainSearch()">
          Search
        </button>
      </div>
    `}
  `;
}

function renderSearchCard() {
  const card = document.getElementById('hero-search-card');
  if (card) {
    card.innerHTML = getSearchCardHtml();
  }
  const switcher = document.getElementById('hero-tab-switcher');
  if (switcher) {
    const tabs = switcher.querySelectorAll('.folder-tab');
    const verticals = ['flights', 'hotels', 'cars', 'transfers'];
    tabs.forEach((tab, i) => {
      if (verticals[i] === state.activeVertical) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }
}

function switchSearchTab(vertical) {
  state.activeVertical = vertical;
  state.activeDropdown = null;
  renderSearchCard();
}

function setTripType(type) {
  state.activeSearch.tripType = type;
  renderSearchCard();
}

function toggleDropdown(type, event) {
  if (event) event.stopPropagation();
  state.activeDropdown = state.activeDropdown === type ? null : type;
  renderSearchCard();
}

function closeDropdowns(event) {
  if (event) event.stopPropagation();
  state.activeDropdown = null;
  renderSearchCard();
}

function updateTravelerCount(type, delta, event) {
  if (event) event.stopPropagation();
  const current = state.activeSearch[type] || 0;
  const min = type === 'adults' ? 1 : 0;
  state.activeSearch[type] = Math.max(min, current + delta);
  state.activeSearch.passengers = (state.activeSearch.adults || 1) + (state.activeSearch.children || 0) + (state.activeSearch.infants || 0);
  renderSearchCard();
}

function setCabinClass(cabin) {
  state.activeSearch.cabinClass = cabin;
  state.activeDropdown = null;
  renderSearchCard();
}

function updateHotelGuests(field, delta, event) {
  if (event) event.stopPropagation();
  const current = state.activeSearch[field] || 1;
  state.activeSearch[field] = Math.max(1, current + delta);
  renderSearchCard();
}

function updateLegVal(idx, key, val) {
  if (state.activeSearch.multiCityLegs && state.activeSearch.multiCityLegs[idx]) {
    state.activeSearch.multiCityLegs[idx][key] = val;
  }
}

function addMultiCityLeg() {
  const count = state.activeSearch.multiCityLegs.length;
  const lastLeg = state.activeSearch.multiCityLegs[count - 1];
  state.activeSearch.multiCityLegs.push({
    origin: lastLeg ? lastLeg.destination : 'Dubai (DXB)',
    destination: 'Paris (CDG)',
    date: '2026-10-25'
  });
  renderSearchCard();
}

function removeMultiCityLeg(idx) {
  if (state.activeSearch.multiCityLegs.length > 2) {
    state.activeSearch.multiCityLegs.splice(idx, 1);
    renderSearchCard();
  }
}

function swapMultiCityLeg(idx) {
  const leg = state.activeSearch.multiCityLegs[idx];
  if (leg) {
    const temp = leg.origin;
    leg.origin = leg.destination;
    leg.destination = temp;
    renderSearchCard();
  }
}

function swapOriginDestination() {
  const originInput = document.getElementById('search-origin');
  const destInput = document.getElementById('search-destination');
  if (originInput && destInput) {
    const temp = originInput.value;
    originInput.value = destInput.value;
    destInput.value = temp;
    state.activeSearch.originDisplay = originInput.value;
    state.activeSearch.destinationDisplay = destInput.value;
  }
}

function quickSelectDestination(code, name) {
  state.activeVertical = 'flights';
  state.activeSearch.destination = code;
  state.activeSearch.destinationDisplay = `${name} (${code})`;
  executeMainSearch();
}

function extractIata(val, defaultCode = 'LOS') {
  if (!val) return defaultCode;
  const match = val.match(/\(([A-Z]{3})\)/i) || val.match(/\b([A-Z]{3})\b/);
  if (match) return match[1].toUpperCase();
  const s = val.toLowerCase();
  if (s.includes('lagos')) return 'LOS';
  if (s.includes('london') || s.includes('lhr')) return 'LHR';
  if (s.includes('dubai') || s.includes('dxb')) return 'DXB';
  if (s.includes('bali') || s.includes('dps')) return 'DPS';
  if (s.includes('nairobi') || s.includes('nbo')) return 'NBO';
  if (s.includes('accra') || s.includes('acc')) return 'ACC';
  if (s.includes('paris') || s.includes('cdg')) return 'CDG';
  return val.trim().substring(0, 3).toUpperCase();
}

function executeMainSearch() {
  const v = state.activeVertical || 'flights';

  if (v === 'flights') {
    if (state.activeSearch.tripType === 'multi_city') {
      const leg0 = state.activeSearch.multiCityLegs[0];
      const leg1 = state.activeSearch.multiCityLegs[1];
      state.activeSearch.origin = extractIata(leg0?.origin || 'LOS', 'LOS');
      state.activeSearch.destination = extractIata(leg0?.destination || 'LHR', 'LHR');
      state.activeSearch.originDisplay = leg0?.origin || 'Lagos (LOS)';
      state.activeSearch.destinationDisplay = leg0?.destination || 'London (LHR)';
      state.activeSearch.departDate = leg0?.date || '2026-10-15';
      state.activeSearch.returnDate = leg1?.date || '2026-10-22';
    } else {
      const origInput = document.getElementById('search-origin')?.value || state.activeSearch.originDisplay || 'Lagos (LOS)';
      const destInput = document.getElementById('search-destination')?.value || state.activeSearch.destinationDisplay || 'London (LHR)';
      const departInput = document.getElementById('search-depart')?.value || state.activeSearch.departDate || '2026-10-15';
      const returnInput = document.getElementById('search-return')?.value || state.activeSearch.returnDate || '2026-10-22';

      state.activeSearch.origin = extractIata(origInput, 'LOS');
      state.activeSearch.destination = extractIata(destInput, 'LHR');
      state.activeSearch.originDisplay = origInput;
      state.activeSearch.destinationDisplay = destInput;
      state.activeSearch.departDate = departInput;
      state.activeSearch.returnDate = returnInput;
    }
  } else if (v === 'hotels') {
    const hotelDest = document.getElementById('search-hotel-destination')?.value || state.activeSearch.hotelDestinationDisplay || 'Bali (DPS)';
    const checkIn = document.getElementById('search-checkin')?.value || state.activeSearch.checkInDate || '2026-10-15';
    const checkOut = document.getElementById('search-checkout')?.value || state.activeSearch.checkOutDate || '2026-10-22';
    state.activeSearch.hotelDestinationDisplay = hotelDest;
    state.activeSearch.hotelDestination = extractIata(hotelDest, 'DPS');
    state.activeSearch.destination = state.activeSearch.hotelDestination;
    state.activeSearch.destinationDisplay = hotelDest;
    state.activeSearch.checkInDate = checkIn;
    state.activeSearch.checkOutDate = checkOut;
  } else if (v === 'cars') {
    const carLoc = document.getElementById('search-car-location')?.value || state.activeSearch.carLocation || 'Lagos (LOS) Airport';
    const pickupDate = document.getElementById('search-car-pickup')?.value || state.activeSearch.carPickupDate || '2026-10-15';
    const dropoffDate = document.getElementById('search-car-dropoff')?.value || state.activeSearch.carDropoffDate || '2026-10-22';
    state.activeSearch.carLocation = carLoc;
    state.activeSearch.carPickupDate = pickupDate;
    state.activeSearch.carDropoffDate = dropoffDate;
    state.activeSearch.destinationDisplay = carLoc;
  } else if (v === 'transfers') {
    const tPickup = document.getElementById('search-transfer-pickup')?.value || state.activeSearch.transferPickup || 'Lagos Airport (LOS)';
    const tDropoff = document.getElementById('search-transfer-dropoff')?.value || state.activeSearch.transferDropoff || 'Victoria Island / Ikoyi Hotels';
    const tDate = document.getElementById('search-transfer-date')?.value || state.activeSearch.transferDate || '2026-10-15';
    state.activeSearch.transferPickup = tPickup;
    state.activeSearch.transferDropoff = tDropoff;
    state.activeSearch.transferDate = tDate;
    state.activeSearch.destinationDisplay = `${tPickup} → ${tDropoff}`;
  }

  navigateTo('results');
}

function quickSearchVertical(vertical) {
  state.activeVertical = vertical;
  navigateTo('results');
}

function switchResultsVertical(vertical) {
  state.activeVertical = vertical;
  navigateTo('results');
}

// --- VIEW 2: SEARCH RESULTS (Page 2) ---
function getResultsViewHtml() {
  const isAgent = state.currentUser && state.currentUser.role === 'agent';
  const v = state.activeVertical || 'flights';

  let summaryTitle = '';
  let summarySubtitle = '';

  if (v === 'hotels') {
    summaryTitle = `🏨 Hotels in ${state.activeSearch.destinationDisplay || 'Bali (DPS)'}`;
    summarySubtitle = `${state.activeSearch.checkInDate || '2026-10-15'} — ${state.activeSearch.checkOutDate || '2026-10-22'} · ${state.activeSearch.guests || 2} guests · ${state.activeSearch.rooms || 1} room`;
  } else if (v === 'cars') {
    summaryTitle = `🚗 Car Rentals in ${state.activeSearch.carLocation || 'Lagos (LOS) Airport'}`;
    summarySubtitle = `${state.activeSearch.carPickupDate || '2026-10-15'} — ${state.activeSearch.carDropoffDate || '2026-10-22'} · Unlimited Mileage Included`;
  } else if (v === 'transfers') {
    summaryTitle = `🚐 Airport Transfers: ${state.activeSearch.destinationDisplay || 'Lagos Airport (LOS) → Victoria Island'}`;
    summarySubtitle = `${state.activeSearch.transferDate || '2026-10-15'} · Meet & Greet Included · Flight Tracking`;
  } else {
    // Flights
    const originDisplay = state.activeSearch.originDisplay || (state.activeSearch.origin === 'LOS' ? 'Lagos (LOS)' : state.activeSearch.origin);
    const destDisplay = state.activeSearch.destinationDisplay || (state.activeSearch.destination === 'DPS' ? 'Bali (DPS)' : (state.activeSearch.destination === 'DXB' ? 'Dubai (DXB)' : state.activeSearch.destination));
    summaryTitle = `${originDisplay} ⇄ ${destDisplay}`;
    summarySubtitle = `${state.activeSearch.departDate || '2026-10-15'} — ${state.activeSearch.returnDate || '2026-10-22'} · ${getTravelerLabel()} · ${getCabinLabel()}`;
  }

  return `
    <!-- Top Summary Bar (Navy per Figma 179:32) -->
    <div class="results-summary-bar" style="background: var(--color-primary); color: #FFFFFF; padding: 24px 0;">
      <div class="container summary-bar-inner" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div class="summary-route" style="font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 10px;">
            ${summaryTitle}
          </div>
          <div class="summary-details" style="color: rgba(255,255,255,0.75); font-size: 0.95rem; margin-top: 4px;">
            ${summarySubtitle}
            ${isAgent ? ' · <span class="net-rate-badge">AGENT TRADE MODE</span>' : ''}
          </div>
        </div>

        <div style="display: flex; gap: 12px; align-items: center;">
          <button type="button" class="btn btn-traveldoc-trigger btn-pill" onclick="triggerTravelDocForRoute('${state.activeSearch.destination}')">
            🛡 Check Visa Requirements
          </button>
          <button type="button" class="btn btn-outline-white" style="border-radius: 8px; font-weight: 600;" onclick="navigateTo('home')">
            Edit search
          </button>
        </div>
      </div>
    </div>

    <!-- Vertical Navigation Switcher on Results View -->
    <div class="container" style="padding-top: 20px;">
      <div class="tab-switcher" style="margin-bottom: 0;">
        <button type="button" class="folder-tab ${state.activeVertical === 'flights' ? 'active' : ''}" onclick="switchResultsVertical('flights')">✈ Flights</button>
        <button type="button" class="folder-tab ${state.activeVertical === 'hotels' ? 'active' : ''}" onclick="switchResultsVertical('hotels')">🏨 Hotels</button>
        <button type="button" class="folder-tab ${state.activeVertical === 'cars' ? 'active' : ''}" onclick="switchResultsVertical('cars')">🚗 Cars</button>
        <button type="button" class="folder-tab ${state.activeVertical === 'transfers' ? 'active' : ''}" onclick="switchResultsVertical('transfers')">🚐 Transfers</button>
      </div>
    </div>

    <!-- Two-column Body -->
    <div class="container two-column-layout" style="display: grid; grid-template-columns: 280px 1fr; gap: 32px; padding: 24px 24px 64px;">
      <!-- Left Filters Sidebar per Figma 179:32 -->
      <aside class="filter-card" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 24px; height: fit-content;">
        <h3 class="filter-title" style="font-size: 1rem; font-weight: 700; color: var(--color-primary); margin-bottom: 20px;">Price Range</h3>

        <div class="filter-group" style="margin-bottom: 24px;">
          <input type="range" min="15000" max="1500000" step="10000" value="1200000" style="width: 100%; accent-color: var(--color-accent-gold);" oninput="filterResults()">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--color-slate-muted); margin-top: 6px;">
            <span>NGN 15,000</span>
            <span>NGN 1,200,000+</span>
          </div>
        </div>

        ${v === 'flights' ? `
          <div class="filter-group" style="margin-bottom: 24px; border-top: 1px solid var(--color-border-line); padding-top: 20px;">
            <div class="filter-title" style="font-size: 0.9rem; font-weight: 700; color: var(--color-ink-text); margin-bottom: 12px;">Stops</div>
            <label class="filter-option" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; cursor: pointer;">
              <span style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #374151;">
                <input type="checkbox" onchange="filterResults()"> Direct
              </span>
              <span class="filter-count" style="font-size: 0.8rem; color: var(--color-slate-muted);">12</span>
            </label>
            <label class="filter-option" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
              <span style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #374151;">
                <input type="checkbox" checked onchange="filterResults()"> 1 stop
              </span>
              <span class="filter-count" style="font-size: 0.8rem; color: var(--color-slate-muted);">48</span>
            </label>
          </div>

          <div class="filter-group" style="border-top: 1px solid var(--color-border-line); padding-top: 20px;">
            <div class="filter-title" style="font-size: 0.9rem; font-weight: 700; color: var(--color-ink-text); margin-bottom: 12px;">Airlines</div>
            <label class="filter-option" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; cursor: pointer;">
              <span style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #374151;">
                <input type="checkbox" checked onchange="filterResults()"> Qatar Airways
              </span>
              <span class="filter-count" style="font-size: 0.8rem; color: var(--color-slate-muted);">14</span>
            </label>
            <label class="filter-option" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; cursor: pointer;">
              <span style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #374151;">
                <input type="checkbox" checked onchange="filterResults()"> Emirates
              </span>
              <span class="filter-count" style="font-size: 0.8rem; color: var(--color-slate-muted);">9</span>
            </label>
            <label class="filter-option" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
              <span style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #374151;">
                <input type="checkbox" checked onchange="filterResults()"> Turkish Airlines
              </span>
              <span class="filter-count" style="font-size: 0.8rem; color: var(--color-slate-muted);">22</span>
            </label>
          </div>
        ` : (v === 'hotels' ? `
          <div class="filter-group" style="border-top: 1px solid var(--color-border-line); padding-top: 20px;">
            <div class="filter-title" style="font-size: 0.9rem; font-weight: 700; color: var(--color-ink-text); margin-bottom: 12px;">Star Rating</div>
            <label class="filter-option" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; cursor: pointer;">
              <span style="font-size: 0.9rem; color: #374151;"><input type="checkbox" checked onchange="filterResults()"> 5 Stars Luxury</span>
              <span class="filter-count" style="font-size: 0.8rem; color: var(--color-slate-muted);">8</span>
            </label>
            <label class="filter-option" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; cursor: pointer;">
              <span style="font-size: 0.9rem; color: #374151;"><input type="checkbox" checked onchange="filterResults()"> 4 Stars Premium</span>
              <span class="filter-count" style="font-size: 0.8rem; color: var(--color-slate-muted);">15</span>
            </label>
          </div>
          <div class="filter-group" style="border-top: 1px solid var(--color-border-line); padding-top: 20px; margin-top: 20px;">
            <div class="filter-title" style="font-size: 0.9rem; font-weight: 700; color: var(--color-ink-text); margin-bottom: 12px;">Amenities</div>
            <label class="filter-option" style="display: flex; justify-content: space-between; margin-bottom: 8px; cursor: pointer;">
              <span style="font-size: 0.85rem;"><input type="checkbox" checked> Free Breakfast</span>
            </label>
            <label class="filter-option" style="display: flex; justify-content: space-between; margin-bottom: 8px; cursor: pointer;">
              <span style="font-size: 0.85rem;"><input type="checkbox" checked> Swimming Pool</span>
            </label>
            <label class="filter-option" style="display: flex; justify-content: space-between; cursor: pointer;">
              <span style="font-size: 0.85rem;"><input type="checkbox" checked> Free Cancellation</span>
            </label>
          </div>
        ` : `
          <div class="filter-group" style="border-top: 1px solid var(--color-border-line); padding-top: 20px;">
            <div class="filter-title" style="font-size: 0.9rem; font-weight: 700; color: var(--color-ink-text); margin-bottom: 12px;">Verified Inclusions</div>
            <div style="font-size: 0.85rem; color: var(--color-slate-muted); line-height: 1.6;">
              ✓ Free Cancellation<br>
              ✓ Direct GDS Net Rates<br>
              ✓ 24/7 Agency Concierge
            </div>
          </div>
        `)}
      </aside>

      <!-- Right Main Column per Figma 179:32 -->
      <main>
        <div class="sort-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div style="font-size: 1rem; font-weight: 700; color: var(--color-primary);">
            <span id="results-count-text">Loading verified Sabre inventory...</span>
          </div>
          <div class="sort-chips" style="display: flex; gap: 8px;">
            <button type="button" class="sort-chip active" style="padding: 6px 16px; border-radius: var(--radius-pill); font-weight: 600;" onclick="sortResults('best')">Best</button>
            <button type="button" class="sort-chip" style="padding: 6px 16px; border-radius: var(--radius-pill); font-weight: 600;" onclick="sortResults('cheapest')">Cheapest</button>
            <button type="button" class="sort-chip" style="padding: 6px 16px; border-radius: var(--radius-pill); font-weight: 600;" onclick="sortResults('fastest')">Fastest</button>
          </div>
        </div>

        <div id="results-items-list" style="display: grid; gap: 16px;">
          <div style="padding: 40px; text-align: center; color: var(--color-slate-muted);">Searching Sabre GDS inventory...</div>
        </div>

        ${v === 'flights' ? `
          <!-- Hotels for these dates per Figma 179:32 -->
          <div style="margin-top: 48px;">
            <div class="section-header" style="margin-bottom: 20px;">
              <div>
                <h3 class="section-title" style="font-size: 1.4rem;">Hotels for these travel dates</h3>
              </div>
            </div>
            <div id="secondary-hotels-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
              <!-- Rendered via loadSearchResults() -->
            </div>
          </div>
        ` : ''}
      </main>
    </div>
  `;
}

async function loadSearchResults() {
  const container = document.getElementById('results-items-list');
  const countText = document.getElementById('results-count-text');
  const hotelContainer = document.getElementById('secondary-hotels-list');
  const v = state.activeVertical || 'flights';

  try {
    const headers = state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {};

    if (v === 'hotels') {
      const destParam = state.activeSearch.hotelDestination === 'LOS' ? 'Lagos' : 'Bali';
      const res = await fetch(`/api/v1/search/hotels?destination=${encodeURIComponent(destParam)}&checkIn=${state.activeSearch.checkInDate || '2026-10-15'}&checkOut=${state.activeSearch.checkOutDate || '2026-10-22'}&guests=${state.activeSearch.guests || 2}&rooms=${state.activeSearch.rooms || 1}`, { headers });
      const data = await res.json();
      const isAgent = data.is_agent_view;

      if (countText) countText.textContent = `${data.results?.length || 3} verified properties found`;

      if (container && data.results) {
        container.innerHTML = data.results.map(h => `
          <div class="result-row" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 24px; display: grid; grid-template-columns: 220px 1fr 200px; gap: 24px; align-items: center; box-shadow: var(--shadow-card);">
            <div style="height: 140px; border-radius: 8px; overflow: hidden;">
              <img src="${h.image_url || '/assets/uluwatu-pool.png'}" alt="${h.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>

            <div>
              <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;">
                <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--color-primary);">${h.name}</h3>
                <span style="color: var(--color-accent-gold-dark); font-size: 0.9rem;">★★★★★</span>
              </div>
              <div style="font-size: 0.85rem; color: var(--color-slate-muted); margin-bottom: 8px;">📍 ${h.location} · <span style="font-weight: 700; color: var(--color-primary);">${h.guest_rating || 9.2} Exceptional</span> (${h.review_count || 1200} reviews)</div>
              <div style="font-size: 0.85rem; color: #374151; margin-bottom: 10px;">${h.room_type || 'Deluxe Suite with Ocean View'}</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span style="background: #ECFDF5; color: #065F46; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">FREE CANCELLATION</span>
                <span style="background: #EFF6FF; color: #1E40AF; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">BREAKFAST INCLUDED</span>
              </div>
            </div>

            <div class="price-action-col" style="border-left: 1px solid var(--color-border-line); padding-left: 24px; text-align: right;">
              <div style="font-size: 0.8rem; color: var(--color-slate-muted); margin-bottom: 2px;">Price for stay (7 nights)</div>
              <div class="card-price" style="font-size: 1.4rem; font-weight: 700; color: var(--color-primary); margin-bottom: 6px;">
                NGN ${Number(h.price).toLocaleString()}
              </div>
              ${isAgent ? '<div style="font-size: 0.75rem; font-weight: 700; color: var(--color-success); margin-bottom: 6px;">NET: ₦' + Number(h.net_rate).toLocaleString() + '</div>' : ''}
              <button type="button" class="btn btn-gold" style="width: 100%; padding: 8px 16px; font-weight: 700; border-radius: 8px; margin-bottom: 6px;" onclick="reserveHotelForCheckout(${JSON.stringify(h).replace(/"/g, '&quot;')})">
                Reserve Now
              </button>
              <button type="button" class="btn btn-outline" style="width: 100%; padding: 6px 12px; font-size: 0.85rem; font-weight: 600; border-radius: 6px; border: 1px solid var(--color-border-line);" onclick="viewHotelDetail(${JSON.stringify(h).replace(/"/g, '&quot;')})">
                View Details
              </button>
            </div>
          </div>
        `).join('');
      }
    } else if (v === 'cars') {
      const res = await fetch(`/api/v1/search/cars?location=${encodeURIComponent(state.activeSearch.carLocation || 'Lagos Airport')}&pickupDate=${state.activeSearch.carPickupDate || '2026-10-15'}&dropoffDate=${state.activeSearch.carDropoffDate || '2026-10-22'}`, { headers });
      const data = await res.json();
      const isAgent = data.is_agent_view;

      if (countText) countText.textContent = `${data.results?.length || 3} rental vehicles available`;

      if (container && data.results) {
        container.innerHTML = data.results.map(c => `
          <div class="result-row" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 24px; display: grid; grid-template-columns: 200px 1fr 200px; gap: 24px; align-items: center; box-shadow: var(--shadow-card);">
            <div style="height: 130px; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #F9FAFB;">
              <img src="${c.image_url}" alt="${c.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>

            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-accent-gold-dark); text-transform: uppercase;">${c.supplier || 'Avis Car Rental'}</div>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary); margin: 2px 0 6px;">${c.name}</h3>
              <div style="font-size: 0.85rem; color: var(--color-slate-muted); margin-bottom: 12px;">Category: ${c.category || 'SUV'} · Pick-up: ${c.pickup_location}</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span style="background: #F3F4F6; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">👥 ${c.seats || 5} Seats</span>
                <span style="background: #F3F4F6; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">⚙ ${c.transmission || 'Automatic'}</span>
                <span style="background: #ECFDF5; color: #065F46; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;">✓ Unlimited Mileage</span>
                <span style="background: #EFF6FF; color: #1E40AF; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;">✓ Zero Excess</span>
              </div>
            </div>

            <div class="price-action-col" style="border-left: 1px solid var(--color-border-line); padding-left: 24px; text-align: right;">
              <div style="font-size: 0.8rem; color: var(--color-slate-muted); margin-bottom: 2px;">Total 7 days rental</div>
              <div class="card-price" style="font-size: 1.4rem; font-weight: 700; color: var(--color-primary); margin-bottom: 6px;">
                NGN ${Number(c.price).toLocaleString()}
              </div>
              <div style="font-size: 0.8rem; color: var(--color-slate-muted); margin-bottom: 8px;">₦${Number(Math.round(c.price / 7)).toLocaleString()} / day</div>
              ${isAgent ? '<div style="font-size: 0.75rem; font-weight: 700; color: var(--color-success); margin-bottom: 6px;">NET: ₦' + Number(c.net_rate).toLocaleString() + '</div>' : ''}
              <button type="button" class="btn btn-gold" style="width: 100%; padding: 10px 16px; font-weight: 700; border-radius: 8px;" onclick="selectCarForCheckout(${JSON.stringify(c).replace(/"/g, '&quot;')})">
                Rent Car
              </button>
            </div>
          </div>
        `).join('');
      }
    } else if (v === 'transfers') {
      if (countText) countText.textContent = `3 private transfer options available`;

      const transfers = [
        {
          id: 'trf_vip_sedan',
          name: 'Executive VIP Mercedes E-Class',
          vehicle_type: 'Private VIP Sedan',
          supplier: 'Travel Case Executive Logistics',
          pickup: state.activeSearch.transferPickup || 'Lagos Airport (LOS)',
          dropoff: state.activeSearch.transferDropoff || 'Victoria Island / Ikoyi Hotels',
          passengers: '1–3 Passengers',
          luggage: '3 Suitcases',
          features: ['Flight Tracking', 'Free 60min Airport Waiting', 'Meet & Greet with Name Sign', 'Chilled Bottled Water & Wi-Fi'],
          price: 45000,
          net_rate: 39500
        },
        {
          id: 'trf_exec_van',
          name: 'Mercedes V-Class / Toyota HiAce VIP',
          vehicle_type: 'Executive Passenger Van',
          supplier: 'Travel Case Corporate Fleet',
          pickup: state.activeSearch.transferPickup || 'Lagos Airport (LOS)',
          dropoff: state.activeSearch.transferDropoff || 'Victoria Island / Ikoyi Hotels',
          passengers: '4–7 Passengers',
          luggage: '7 Suitcases',
          features: ['Flight Tracking', 'Meet & Greet Service', 'Luggage Assistance', 'Spacious Leather Reclining Seats'],
          price: 75000,
          net_rate: 66000
        },
        {
          id: 'trf_standard_shuttle',
          name: 'Air-Conditioned Airport Express Shuttle',
          vehicle_type: 'Direct Airport Shuttle',
          supplier: 'Direct Transit Shuttle',
          pickup: state.activeSearch.transferPickup || 'Lagos Airport (LOS)',
          dropoff: state.activeSearch.transferDropoff || 'Designated Island Hotels',
          passengers: '1–4 Passengers',
          luggage: '4 Suitcases',
          features: ['Fixed Guaranteed Rate', 'Air Conditioned', 'Professional Chauffeur'],
          price: 25000,
          net_rate: 22000
        }
      ];

      const isAgent = state.currentUser && state.currentUser.role === 'agent';

      if (container) {
        container.innerHTML = transfers.map(t => `
          <div class="result-row" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 24px; display: grid; grid-template-columns: 180px 1fr 200px; gap: 24px; align-items: center; box-shadow: var(--shadow-card);">
            <div style="font-size: 3rem; text-align: center; background: #F9FAFB; padding: 20px; border-radius: 8px;">
              ${t.vehicle_type.includes('Van') ? '🚐' : '🚗'}
            </div>

            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-accent-gold-dark); text-transform: uppercase;">${t.supplier}</div>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary); margin: 2px 0 6px;">${t.name}</h3>
              <div style="font-size: 0.85rem; color: var(--color-slate-muted); margin-bottom: 12px;">Route: ${t.pickup} → ${t.dropoff}</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span style="background: #F3F4F6; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">👥 ${t.passengers}</span>
                <span style="background: #F3F4F6; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">🧳 ${t.luggage}</span>
                <span style="background: #ECFDF5; color: #065F46; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;">✓ Flight Tracking</span>
                <span style="background: #EFF6FF; color: #1E40AF; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;">✓ Meet & Greet</span>
              </div>
            </div>

            <div class="price-action-col" style="border-left: 1px solid var(--color-border-line); padding-left: 24px; text-align: right;">
              <div style="font-size: 0.8rem; color: var(--color-slate-muted); margin-bottom: 2px;">Fixed guaranteed fare</div>
              <div class="card-price" style="font-size: 1.4rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">
                NGN ${Number(t.price).toLocaleString()}
              </div>
              ${isAgent ? '<div style="font-size: 0.75rem; font-weight: 700; color: var(--color-success); margin-bottom: 6px;">NET: ₦' + Number(t.net_rate).toLocaleString() + '</div>' : ''}
              <button type="button" class="btn btn-gold" style="width: 100%; padding: 10px 16px; font-weight: 700; border-radius: 8px;" onclick="selectTransferForCheckout(${JSON.stringify(t).replace(/"/g, '&quot;')})">
                Book Transfer
              </button>
            </div>
          </div>
        `).join('');
      }
    } else {
      // Default: FLIGHTS
      const [flightsRes, hotelsRes] = await Promise.all([
        fetch(`/api/v1/search/flights?origin=${state.activeSearch.origin}&destination=${state.activeSearch.destination}&departDate=${state.activeSearch.departDate}&returnDate=${state.activeSearch.returnDate}&tripType=${state.activeSearch.tripType}&passengers=${state.activeSearch.passengers || 1}&cabinClass=${state.activeSearch.cabinClass || 'economy'}`, { headers }),
        fetch(`/api/v1/search/hotels?destination=${state.activeSearch.destination === 'LOS' ? 'Lagos' : 'Bali'}`, { headers })
      ]);

      const flightsData = await flightsRes.json();
      const hotelsData = await hotelsRes.json();
      const isAgent = flightsData.is_agent_view;

      if (countText) countText.textContent = `${flightsData.results?.length || 21} flights found`;

      if (container && flightsData.results) {
        container.innerHTML = flightsData.results.map(f => `
          <div class="result-row" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 24px; display: grid; grid-template-columns: 180px 1fr 200px; gap: 24px; align-items: center; box-shadow: var(--shadow-card);">
            <div class="airline-badge-col">
              <div style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: var(--color-primary); letter-spacing: -0.02em;">
                ${f.airline}
              </div>
              <div style="font-size: 0.8rem; color: var(--color-slate-muted); margin-top: 4px;">
                ${f.flight_number} · ${f.aircraft || 'Boeing 777'}
              </div>
            </div>

            <div class="flight-times-col" style="display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
              <div class="flight-time-block" style="text-align: left;">
                <div class="flight-time" style="font-size: 1.6rem; font-weight: 700; color: var(--color-ink-text);">${f.departure_time}</div>
                <div class="flight-airport" style="font-size: 0.9rem; font-weight: 600; color: var(--color-slate-muted);">${f.origin}</div>
              </div>

              <div class="flight-duration-center" style="flex: 1; text-align: center; padding: 0 20px;">
                <span class="duration-label" style="font-size: 0.8rem; color: var(--color-slate-muted);">${f.duration}</span>
                <div class="duration-line" style="height: 2px; background: #D1D5DB; margin: 6px 0; position: relative;">
                  <span style="width: 8px; height: 8px; background: var(--color-success); border-radius: 50%; position: absolute; top: -3px; left: 50%; transform: translateX(-50%);"></span>
                </div>
                <span class="stops-label" style="font-size: 0.75rem; font-weight: 700; color: ${f.stops_count === 0 ? 'var(--color-success)' : 'var(--color-warning)'}; text-transform: uppercase;">
                  ${f.stops_count === 0 ? 'NON-STOP' : f.stops}
                </span>
              </div>

              <div class="flight-time-block" style="text-align: right;">
                <div class="flight-time" style="font-size: 1.6rem; font-weight: 700; color: var(--color-ink-text);">${f.arrival_time}</div>
                <div class="flight-airport" style="font-size: 0.9rem; font-weight: 600; color: var(--color-slate-muted);">${f.destination}</div>
              </div>
            </div>

            <div class="price-action-col" style="border-left: 1px solid var(--color-border-line); padding-left: 24px; text-align: right;">
              <div style="font-size: 0.8rem; color: var(--color-slate-muted); margin-bottom: 2px;">Price per adult</div>
              <div class="card-price" style="font-size: 1.4rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">
                NGN ${Number(f.price).toLocaleString()}
              </div>
              ${isAgent ? '<div style="font-size: 0.75rem; font-weight: 700; color: var(--color-success); margin-bottom: 6px;">NET: ₦' + Number(f.net_rate).toLocaleString() + '</div>' : ''}
              <button type="button" class="btn btn-gold" style="width: 100%; padding: 8px 16px; font-weight: 700; border-radius: 8px;" onclick="selectFlightForCheckout(${JSON.stringify(f).replace(/"/g, '&quot;')})">
                Select
              </button>
            </div>
          </div>
        `).join('');
      }

      if (hotelContainer) {
        hotelContainer.innerHTML = `
          <div class="dest-card" style="background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border-line); box-shadow: var(--shadow-card);" onclick="navigateTo('hotel-detail')">
            <div class="dest-img-container" style="height: 180px; position: relative;">
              <img src="/assets/uluwatu-pool.png" alt="Uluwatu Cliffs Resort" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="dest-body" style="padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h4 class="dest-title" style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary);">Uluwatu Cliffs Resort</h4>
                <span style="color: var(--color-accent-gold-dark);">★★★★★</span>
              </div>
              <p class="dest-country" style="color: var(--color-slate-muted); font-size: 0.85rem; margin: 4px 0 10px;">📍 Uluwatu, Bali</p>
              <div style="margin-bottom: 12px;">
                <span style="background: #ECFDF5; color: #065F46; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">FREE CANCELLATION</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <div style="font-size: 0.75rem; color: var(--color-slate-muted); text-transform: uppercase;">PER NIGHT</div>
                  <div style="font-weight: 700; font-size: 1.15rem; color: var(--color-primary);">NGN 125,000</div>
                </div>
                <button type="button" class="btn btn-gold" style="padding: 6px 20px; font-weight: 700; border-radius: 6px;" onclick="event.stopPropagation(); navigateTo('hotel-detail');">Add</button>
              </div>
            </div>
          </div>

          <div class="dest-card" style="background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border-line); box-shadow: var(--shadow-card);" onclick="navigateTo('hotel-detail')">
            <div class="dest-img-container" style="height: 180px; position: relative;">
              <img src="/assets/maya-ubud.png" alt="Maya Ubud Forest Spa" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="dest-body" style="padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h4 class="dest-title" style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary);">Maya Ubud Forest Spa</h4>
                <span style="color: var(--color-accent-gold-dark);">★★★★☆</span>
              </div>
              <p class="dest-country" style="color: var(--color-slate-muted); font-size: 0.85rem; margin: 4px 0 10px;">📍 Ubud, Bali</p>
              <div style="margin-bottom: 12px;">
                <span style="background: #EFF6FF; color: #1E40AF; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">BREAKFAST INCLUDED</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <div style="font-size: 0.75rem; color: var(--color-slate-muted); text-transform: uppercase;">PER NIGHT</div>
                  <div style="font-weight: 700; font-size: 1.15rem; color: var(--color-primary);">NGN 89,500</div>
                </div>
                <button type="button" class="btn btn-gold" style="padding: 6px 20px; font-weight: 700; border-radius: 6px;" onclick="event.stopPropagation(); navigateTo('hotel-detail');">Add</button>
              </div>
            </div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Error loading search results:', error);
    if (container) container.innerHTML = `<div class="error-banner-inline">Error loading GDS search results. Please try again.</div>`;
  }
}

function filterResults() {
  loadSearchResults();
}

function sortResults(type) {
  document.querySelectorAll('.sort-chip').forEach(c => c.classList.remove('active'));
  if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }
  loadSearchResults();
}

function selectFlightForCheckout(flight) {
  state.cart = [{
    type: 'flight',
    id: flight.id,
    airline: flight.airline,
    airline_code: flight.airline_code,
    flight_number: flight.flight_number,
    origin: flight.origin,
    destination: flight.destination,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration: flight.duration,
    stops: flight.stops,
    class_of_service: 'Economy',
    net_rate: flight.net_rate || Math.round(flight.price * 0.88),
    price: flight.price,
    travel_date: state.activeSearch.departDate
  }];
  navigateTo('checkout');
}

function selectCarForCheckout(car) {
  state.cart = [{
    type: 'car',
    id: car.id,
    name: car.name,
    supplier: car.supplier,
    location: car.pickup_location,
    seats: car.seats,
    transmission: car.transmission,
    price: car.price,
    net_rate: car.net_rate || Math.round(car.price * 0.88),
    rental_days: car.total_days || 7,
    travel_date: state.activeSearch.carPickupDate || '2026-10-15'
  }];
  navigateTo('checkout');
}

function selectTransferForCheckout(transfer) {
  state.cart = [{
    type: 'transfer',
    id: transfer.id,
    name: transfer.name,
    vehicle_type: transfer.vehicle_type || 'Private VIP Sedan',
    pickup: transfer.pickup || state.activeSearch.transferPickup,
    dropoff: transfer.dropoff || state.activeSearch.transferDropoff,
    passengers: transfer.passengers || '1–3 Passengers',
    price: transfer.price,
    net_rate: transfer.net_rate || Math.round(transfer.price * 0.88),
    travel_date: state.activeSearch.transferDate || '2026-10-15'
  }];
  navigateTo('checkout');
}

// --- VIEW 3: HOTEL DETAIL (Page 3) ---
function viewHotelDetail(hotel) {
  state.selectedHotel = hotel;
  navigateTo('hotel-detail');
}

function getHotelDetailViewHtml() {
  const h = state.selectedHotel || {
    id: 'htl_uluwatu_cliffs',
    name: 'Uluwatu Cliffs Resort',
    location: 'Uluwatu, Bali, Indonesia',
    star_rating: 5,
    guest_rating: 4.8,
    review_count: 1240,
    price: 125000,
    net_rate: 112500,
    description: 'Perched dramatically on the limestone cliffs of Uluwatu, this resort offers an unparalleled sanctuary of luxury and natural beauty. Each suite is designed to frame the sweeping Indian Ocean vistas, blending contemporary elegance with traditional Balinese craftsmanship. Guests can enjoy exclusive access to a secluded private beach, world-class dining, and an infinity pool that appears to spill directly into the ocean.',
    amenities: ['Free Wi-Fi', 'Infinity Pool', 'Spa & Wellness', 'Airport Shuttle', 'Free Breakfast', 'Private Beach'],
    gallery: [
      '/assets/uluwatu-pool.png',
      '/assets/uluwatu-suite.png',
      '/assets/uluwatu-spa.png',
      '/assets/uluwatu-beach.png',
      '/assets/uluwatu-dining.png'
    ]
  };

  const isAgent = state.currentUser && state.currentUser.role === 'agent';

  return `
    <div class="container" style="padding-top: 24px; padding-bottom: 64px;">
      <a class="nav-link" style="color: var(--color-primary); font-weight: 600; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 20px;" onclick="navigateTo('results')">
        ← Back to results
      </a>

      <!-- 5-Image Gallery Grid per Figma 194:297 -->
      <div class="gallery-grid" style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; grid-template-rows: 240px 240px; gap: 12px; border-radius: 16px; overflow: hidden; margin-bottom: 36px;">
        <div style="grid-row: span 2; overflow: hidden;">
          <img src="${h.gallery[0]}" alt="${h.name}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="overflow: hidden;">
          <img src="${h.gallery[1]}" alt="Suite Interior" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="overflow: hidden;">
          <img src="${h.gallery[2]}" alt="Ocean Spa" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="overflow: hidden;">
          <img src="${h.gallery[3]}" alt="Private Beach" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="overflow: hidden; position: relative;">
          <img src="${h.gallery[4]}" alt="Fine Dining" style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 600; font-size: 0.95rem; cursor: pointer;">
            View all 48 photos
          </div>
        </div>
      </div>

      <!-- Two-column Body -->
      <div class="two-column-layout" style="display: grid; grid-template-columns: 1fr 380px; gap: 48px; padding: 0;">
        <div>
          <div style="margin-bottom: 24px;">
            <h1 style="font-size: 2.25rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">${h.name}</h1>
            <p style="color: var(--color-slate-muted); font-size: 1rem; margin-bottom: 12px;">📍 ${h.location}</p>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="background: var(--color-primary); color: #FFFFFF; font-weight: 700; font-size: 0.85rem; padding: 4px 10px; border-radius: 6px;">${h.guest_rating || 4.8}</span>
              <span style="color: var(--color-accent-gold-dark); font-size: 1rem;">★★★★★</span>
              <span style="color: var(--color-slate-muted); font-size: 0.9rem;">${h.review_count || 1240} reviews</span>
            </div>
          </div>

          <h3 class="section-title" style="font-size: 1.3rem; margin-bottom: 12px;">About this property</h3>
          <p style="color: var(--color-ink-text); line-height: 1.7; margin-bottom: 32px; font-size: 1.05rem;">
            ${h.description}
          </p>

          <div style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 24px; margin-bottom: 36px;">
            <h3 class="section-title" style="font-size: 1.2rem; margin-bottom: 18px;">What this place offers</h3>
            <div class="amenities-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              ${h.amenities.map(a => `
                <div style="display: flex; align-items: center; gap: 10px; font-size: 0.95rem; color: var(--color-ink-text);">
                  <span style="color: var(--color-success); font-weight: 700;">✓</span>
                  <span>${a}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <h3 class="section-title" style="font-size: 1.3rem; margin-bottom: 18px;">Guest Reviews</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: #FFFFFF; padding: 20px; border-radius: 12px; border: 1px solid var(--color-border-line);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img src="/assets/avatar-sarah.png" alt="Sarah M." style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;">
                  <div>
                    <div style="font-weight: 700; color: var(--color-ink-text);">Sarah M.</div>
                    <div style="font-size: 0.8rem; color: var(--color-slate-muted);">August 2024</div>
                  </div>
                </div>
                <span style="background: #F3F4F6; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.85rem;">5.0</span>
              </div>
              <p style="color: var(--color-slate-muted); font-size: 0.9rem; line-height: 1.5; font-style: italic;">
                "Absolutely breathtaking views. The stairs to the beach are a bit steep but the private cove is worth every step."
              </p>
            </div>

            <div style="background: #FFFFFF; padding: 20px; border-radius: 12px; border: 1px solid var(--color-border-line);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img src="/assets/avatar-james.png" alt="James L." style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;">
                  <div>
                    <div style="font-weight: 700; color: var(--color-ink-text);">James L.</div>
                    <div style="font-size: 0.8rem; color: var(--color-slate-muted);">July 2024</div>
                  </div>
                </div>
                <span style="background: #F3F4F6; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.85rem;">4.5</span>
              </div>
              <p style="color: var(--color-slate-muted); font-size: 0.9rem; line-height: 1.5; font-style: italic;">
                "Incredible service and the infinity pool is world-class. Breakfast spread was amazing."
              </p>
            </div>
          </div>
        </div>

        <!-- Sticky Booking Box per Figma 194:297 -->
        <div>
          <div class="sticky-booking-box" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 14px; padding: 28px; box-shadow: var(--shadow-card); position: sticky; top: 96px;">
            <div style="margin-bottom: 20px;">
              <div style="display: flex; align-items: baseline; gap: 6px;">
                <span style="font-family: var(--font-display); font-size: 1.85rem; font-weight: 700; color: var(--color-primary);">NGN ${Number(h.price).toLocaleString()}</span>
                <span style="color: var(--color-slate-muted); font-size: 0.9rem;">/ night</span>
              </div>
              <div style="font-size: 0.85rem; color: var(--color-slate-muted); margin-top: 2px;">Sep 3 – Sep 12 (9 nights)</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div class="input-box">
                <label>CHECK-IN</label>
                <input type="date" value="2026-09-03">
              </div>
              <div class="input-box">
                <label>CHECK-OUT</label>
                <input type="date" value="2026-09-12">
              </div>
            </div>

            <div class="input-box" style="margin-bottom: 20px;">
              <label>GUESTS</label>
              <select>
                <option value="2" selected>2 Adults</option>
                <option value="1">1 Adult</option>
                <option value="3">3 Adults</option>
              </select>
            </div>

            <button class="btn btn-gold" style="width: 100%; padding: 14px; font-size: 1rem; font-weight: 700; border-radius: 8px; margin-bottom: 10px;" onclick="reserveHotelForCheckout(${JSON.stringify(h).replace(/"/g, '&quot;')})">
              Reserve now
            </button>

            <p style="text-align: center; color: var(--color-slate-muted); font-size: 0.8rem; margin-bottom: 20px; font-style: italic;">
              You won't be charged yet
            </p>

            <div style="border-top: 1px solid var(--color-border-line); padding-top: 16px; display: grid; gap: 10px; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; color: var(--color-slate-muted);">
                <span>NGN ${Number(h.price).toLocaleString()} × 9 nights</span>
                <span style="color: var(--color-ink-text); font-weight: 600;">NGN 1,125,000</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--color-slate-muted);">
                <span>Service fee</span>
                <span style="color: var(--color-ink-text); font-weight: 600;">NGN 45,000</span>
              </div>
              <div style="border-top: 1px solid var(--color-border-line); padding-top: 12px; display: flex; justify-content: space-between; font-weight: 700; font-size: 1.15rem; color: var(--color-primary);">
                <span>Total</span>
                <span>NGN 1,170,000</span>
              </div>
            </div>

            ${isAgent ? `
              <div style="margin-top: 20px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 10px;">
                <span style="background: var(--color-success); color: #FFFFFF; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">%</span>
                <div style="font-size: 0.8rem; color: #065F46;">
                  <strong>Agent Rate Active</strong><br>
                  You are saving NGN 12,500 on this booking
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function reserveHotelForCheckout(hotel) {
  state.cart.push({
    type: 'hotel',
    id: hotel.id,
    property_name: hotel.name,
    location: hotel.location,
    check_in: '2026-11-12',
    check_out: '2026-11-19',
    nights: 7,
    net_rate: hotel.net_rate || Math.round(hotel.price * 0.85),
    price: hotel.price
  });
  navigateTo('checkout');
}

// --- VIEW 4: CHECKOUT (Page 4 State 1 & State 2) ---
function getCheckoutViewHtml() {
  if (state.cart.length === 0) {
    // Populate default item if user navigated directly
    state.cart = [{
      type: 'flight',
      airline: 'Emirates',
      flight_number: 'EK 784',
      origin: 'LOS',
      destination: 'DXB',
      class_of_service: 'Economy',
      net_rate: 457142,
      price: 512000,
      travel_date: '2026-11-12'
    }];
  }

  const isAgent = state.currentUser && state.currentUser.role === 'agent';
  let totalNet = 0;
  let totalRetail = 0;

  for (const item of state.cart) {
    totalNet += item.net_rate || item.price;
    totalRetail += item.price;
  }

  return `
    <div class="container" style="padding-top: 32px; padding-bottom: 64px;">
      <h1 class="section-title" style="margin-bottom: 24px;">Complete your booking</h1>

      <div class="two-column-layout" style="grid-template-columns: 1fr 380px; padding: 0;">
        <!-- Left Column: Itinerary + Step forms -->
        <div>
          <!-- Itinerary Summary Strip (Gold left border) -->
          <div class="itinerary-strip">
            <div style="font-weight: 700; font-size: 1.15rem; color: var(--color-primary); margin-bottom: 8px;">
              Trip Itinerary Summary
            </div>
            ${state.cart.map(item => `
              <div class="itinerary-line-item">
                <div>
                  <span style="font-weight: 600;">${item.type === 'flight' ? '✈ ' + item.airline + ' (' + item.origin + ' → ' + item.destination + ')' : (item.type === 'hotel' ? '🏨 ' + (item.property_name || item.name) : (item.type === 'car' ? '🚗 ' + item.name : '🚐 ' + item.name))}</span>
                  <div style="font-size: 0.85rem; color: var(--color-slate-muted);">${item.class_of_service || (item.nights ? item.nights + ' nights' : (item.rental_days ? item.rental_days + ' days rental' : (item.vehicle_type || 'Confirmed booking')))}</div>
                </div>
                <div style="font-weight: 700; font-family: var(--font-display);">
                  ₦${Number(isAgent ? item.net_rate : item.price).toLocaleString()}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- AGENT VIEW ONLY: ① Class of service selector -->
          ${isAgent ? `
            <div class="checkout-step-card">
              <div class="step-header">
                <span class="step-num-badge">①</span>
                <span>Class of Service (Agent Selection)</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--color-slate-muted); margin-bottom: 14px;">
                Select the client-approved cabin class to apply at ticketing.
              </p>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                <label class="input-box" style="cursor: pointer;">
                  <input type="radio" name="cos" value="Economy" checked onchange="updateClassOfService('Economy')">
                  <span style="font-weight: 600; font-size: 0.9rem;">Economy</span>
                  <span style="font-size: 0.75rem; color: var(--color-slate-muted);">Base Net</span>
                </label>
                <label class="input-box" style="cursor: pointer;">
                  <input type="radio" name="cos" value="Premium Economy" onchange="updateClassOfService('Premium Economy')">
                  <span style="font-weight: 600; font-size: 0.9rem;">Premium</span>
                  <span style="font-size: 0.75rem; color: var(--color-slate-muted);">+25% Net</span>
                </label>
                <label class="input-box" style="cursor: pointer;">
                  <input type="radio" name="cos" value="Business" onchange="updateClassOfService('Business')">
                  <span style="font-weight: 600; font-size: 0.9rem;">Business</span>
                  <span style="font-size: 0.75rem; color: var(--color-slate-muted);">+65% Net</span>
                </label>
                <label class="input-box" style="cursor: pointer;">
                  <input type="radio" name="cos" value="First" onchange="updateClassOfService('First')">
                  <span style="font-weight: 600; font-size: 0.9rem;">First</span>
                  <span style="font-size: 0.75rem; color: var(--color-slate-muted);">+110% Net</span>
                </label>
              </div>
            </div>

            <!-- AGENT VIEW ONLY: ② Set your markup & client price -->
            <div class="checkout-step-card">
              <div class="step-header">
                <span class="step-num-badge">②</span>
                <span>Set Your Price & Client Markup</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--color-slate-muted);">
                Your acquisition net rate is protected. Admin flights cap is <strong>18%</strong> (0% floor strictly enforced).
              </p>

              <div class="agent-markup-box">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.85rem; font-weight: 600;">Your Net Cost:</span>
                  <span style="font-weight: 700; color: var(--color-primary);">₦<span id="agent-net-display">${Number(totalNet).toLocaleString()}</span></span>
                </div>

                <div class="markup-slider-row">
                  <span style="font-size: 0.85rem; font-weight: 600;">Markup %:</span>
                  <input type="range" id="agent-markup-slider" min="0" max="25" step="1" value="12" oninput="handleMarkupSliderChange(this.value)">
                  <input type="number" id="agent-markup-input" min="0" max="25" value="12" style="width: 70px; padding: 4px; font-weight: 700;" oninput="handleMarkupInputChange(this.value)">
                  <span>%</span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--color-border-line);">
                  <div>
                    <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--color-slate-muted); font-weight: 700;">Client Will Pay:</div>
                    <div class="client-pay-live">₦<span id="agent-client-pay-display">${Number(Math.round(totalNet * 1.12)).toLocaleString()}</span></div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--color-success); font-weight: 700;">Your Margin:</div>
                    <div style="font-weight: 700; color: var(--color-success);">+₦<span id="agent-margin-display">${Number(Math.round(totalNet * 0.12)).toLocaleString()}</span></div>
                  </div>
                </div>

                <div id="markup-validation-msg" class="error-banner-inline" style="display: none;"></div>
              </div>
            </div>
          ` : ''}

          <!-- Traveler Details Section -->
          <div class="checkout-step-card">
            <div class="step-header">
              <span class="step-num-badge">${isAgent ? '③' : '①'}</span>
              <span>Traveler Details</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="input-box">
                <label>First Name (as on Passport)</label>
                <input type="text" id="chk-first-name" value="Adeola" required>
              </div>
              <div class="input-box">
                <label>Last Name (as on Passport)</label>
                <input type="text" id="chk-last-name" value="Adeleke" required>
              </div>
              <div class="input-box">
                <label>Date of Birth</label>
                <input type="date" id="chk-dob" value="1992-05-18">
              </div>
              <div class="input-box">
                <label>Nationality</label>
                <select id="chk-nationality">
                  <option value="Nigerian" selected>Nigeria (Nigerian Citizen)</option>
                  <option value="Ghanaian">Ghana</option>
                  <option value="British">United Kingdom</option>
                  <option value="American">United States</option>
                </select>
              </div>
              <div class="input-box">
                <label>Email Address (Confirmation delivery)</label>
                <input type="email" id="chk-email" value="adeola.adeleke@example.com" required>
              </div>
              <div class="input-box">
                <label>Phone Number</label>
                <input type="tel" id="chk-phone" value="+234 802 345 6789">
              </div>
            </div>
          </div>

          <!-- Payment Section -->
          <div class="checkout-step-card">
            <div class="step-header">
              <span class="step-num-badge">${isAgent ? '④' : '②'}</span>
              <span>Payment Details</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--color-slate-muted); margin-bottom: 14px;">
              🔒 Card details are tokenized via PCI-DSS certified gateway — never stored on Travel Case servers.
            </p>

            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px;">
              <div class="input-box" style="grid-column: span 3;">
                <label>Card Number</label>
                <input type="text" placeholder="5399 •••• •••• 4821" value="5399 4128 9928 4821">
              </div>
              <div class="input-box">
                <label>Cardholder Name</label>
                <input type="text" value="ADEOLA ADELEKE">
              </div>
              <div class="input-box">
                <label>Expiry Date</label>
                <input type="text" placeholder="MM/YY" value="08/29">
              </div>
              <div class="input-box">
                <label>CVV / CVC</label>
                <input type="password" maxlength="4" placeholder="•••" value="782">
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Sticky Fare Summary (Navy) -->
        <div>
          <div class="fare-summary-card">
            <h3 class="fare-summary-title">Trip Total</h3>

            <div class="fare-line">
              <span>Base Travel Services</span>
              <span>₦<span id="summary-base-fare">${Number(isAgent ? totalNet : totalRetail).toLocaleString()}</span></span>
            </div>
            <div class="fare-line">
              <span>Taxes & Carrier Surcharges</span>
              <span>₦38,400</span>
            </div>
            ${isAgent ? `
              <div class="fare-line" style="color: var(--color-accent-gold);">
                <span>Agent Configured Markup</span>
                <span>+₦<span id="summary-markup-amt">${Number(Math.round(totalNet * 0.12)).toLocaleString()}</span></span>
              </div>
            ` : ''}

            <div class="fare-total-line">
              <span>Total ${isAgent ? '(Client Price)' : 'Due'}</span>
              <span>₦<span id="summary-total-fare">${Number(isAgent ? Math.round(totalNet * 1.12 + 38400) : totalRetail + 38400).toLocaleString()}</span></span>
            </div>

            <button id="checkout-submit-btn" class="btn btn-gold btn-pill" style="width: 100%; padding: 14px; font-size: 1.05rem; margin-top: 24px;" onclick="submitCheckoutBooking()">
              Confirm & pay
            </button>

            <p style="text-align: center; color: rgba(255,255,255,0.6); font-size: 0.8rem; margin-top: 14px;">
              🔒 One secure checkout for your whole trip
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleMarkupSliderChange(val) {
  const input = document.getElementById('agent-markup-input');
  if (input) input.value = val;
  recalcAgentPricing(parseFloat(val));
}

function handleMarkupInputChange(val) {
  const slider = document.getElementById('agent-markup-slider');
  if (slider) slider.value = val;
  recalcAgentPricing(parseFloat(val));
}

function recalcAgentPricing(markupPct) {
  const btn = document.getElementById('checkout-submit-btn');
  const msgBox = document.getElementById('markup-validation-msg');

  // Hard-block check: Flights cap is 18%, 0% floor
  const cap = 18.0;
  if (markupPct < 0) {
    if (msgBox) {
      msgBox.style.display = 'block';
      msgBox.textContent = 'Markup cannot be below 0% floor.';
    }
    if (btn) btn.disabled = true;
    return;
  }
  if (markupPct > cap) {
    if (msgBox) {
      msgBox.style.display = 'block';
      msgBox.textContent = `Max markup for flights is ${cap}%. Proposed ${markupPct}% exceeds limit.`;
    }
    if (btn) btn.disabled = true;
    return;
  }

  // Valid
  if (msgBox) msgBox.style.display = 'none';
  if (btn) btn.disabled = false;

  let baseNet = 0;
  for (const item of state.cart) {
    baseNet += item.net_rate || item.price;
  }

  const margin = Math.round(baseNet * (markupPct / 100));
  const clientPrice = baseNet + margin;

  document.getElementById('agent-client-pay-display').textContent = Number(clientPrice).toLocaleString();
  document.getElementById('agent-margin-display').textContent = Number(margin).toLocaleString();
  document.getElementById('summary-markup-amt').textContent = Number(margin).toLocaleString();
  document.getElementById('summary-total-fare').textContent = Number(clientPrice + 38400).toLocaleString();
}

async function submitCheckoutBooking() {
  const btn = document.getElementById('checkout-submit-btn');
  if (btn) btn.disabled = true;

  const firstName = document.getElementById('chk-first-name')?.value || 'Adeola';
  const lastName = document.getElementById('chk-last-name')?.value || 'Adeleke';
  const email = document.getElementById('chk-email')?.value || 'adeola.adeleke@example.com';
  const phone = document.getElementById('chk-phone')?.value || '+234 802 345 6789';
  const markup = parseFloat(document.getElementById('agent-markup-input')?.value || 12);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;

    const res = await fetch('/api/v1/bookings/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        items: state.cart,
        traveler: { first_name: firstName, last_name: lastName, email, phone },
        markup_override: state.currentUser?.role === 'agent' ? markup : null
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`Booking Error: ${data.message || data.error}`);
      if (btn) btn.disabled = false;
      return;
    }

    state.lastBooking = data;
    navigateTo('booking-confirmed');
  } catch (error) {
    console.error('Checkout error:', error);
    alert('An unexpected error occurred during booking. Please try again.');
    if (btn) btn.disabled = false;
  }
}

// --- STATE 2: BOOKING CONFIRMED (Page 4 State 2) ---
function getBookingConfirmedViewHtml() {
  const b = state.lastBooking || {
    booking_ref: 'TC-48291',
    pnr: 'XR7QP2',
    total_price: 550400,
    traveler: { name: 'Adeola Adeleke', email: 'adeola.adeleke@example.com' }
  };
  const isAgent = state.currentUser && state.currentUser.role === 'agent';

  return `
    <div class="container" style="padding: 40px 0 80px;">
      <div class="confirmed-block">
        <div class="confirmed-icon-circle">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 style="font-size: 2.25rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">
          Booking confirmed
        </h1>
        <p style="color: var(--color-slate-muted); font-size: 1.05rem; margin-bottom: 24px;">
          Confirmation sent to ${b.traveler.email} · Booking ref <strong>${b.booking_ref}</strong> · PNR: <strong style="color: var(--color-secondary); font-family: var(--font-display);">${b.pnr}</strong>
        </p>

        <!-- Condensed Itinerary Strip -->
        <div class="itinerary-strip" style="text-align: left; margin: 24px 0;">
          <div style="font-weight: 700; color: var(--color-primary); margin-bottom: 6px;">Booked Itinerary</div>
          <div style="font-size: 0.95rem; color: var(--color-ink-text);">
            ✈ Emirates (LOS → DXB) · Round trip · Confirmed Seat
          </div>
          <div style="font-size: 0.9rem; color: var(--color-slate-muted); margin-top: 4px;">
            Total Charged: <strong>₦${Number(b.total_price).toLocaleString()}</strong>
          </div>
        </div>

        <!-- AGENT VIEW ONLY: Send white-label itinerary directly to client -->
        ${isAgent ? `
          <div style="background: #F8FAFC; padding: 18px; border-radius: var(--radius-input); border: 1px solid var(--color-border-line); margin-bottom: 24px; text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: var(--color-primary);">White-Label Client Delivery</strong>
                <p style="font-size: 0.8rem; color: var(--color-slate-muted);">Send branded PDF/Email with client price (₦${Number(b.total_price).toLocaleString()}) and PNR ${b.pnr}. Net rate is strictly hidden.</p>
              </div>
              <button class="btn btn-navy btn-pill" onclick="sendAgentItinerary('${b.booking_ref}')">
                📧 Send to client
              </button>
            </div>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: center; gap: 16px;">
          <button class="btn btn-gold btn-pill" onclick="navigateTo('${isAgent ? 'agent-dashboard' : 'manage-booking'}')">
            ${isAgent ? 'View bookings dashboard' : 'Manage my booking'}
          </button>
          <button class="btn btn-outline-navy btn-pill" onclick="navigateTo('home')">
            Back to home
          </button>
        </div>
      </div>
    </div>
  `;
}

async function sendAgentItinerary(bookingRef) {
  try {
    const res = await fetch(`/api/v1/bookings/${bookingRef}/send-itinerary`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.authToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    alert(data.message || 'Itinerary sent successfully!');
  } catch (e) {
    alert('Itinerary delivery simulated.');
  }
}

// --- VIEW 5: MANAGE MY BOOKING (Page 5) ---
function getManageBookingViewHtml() {
  return `
    <div class="container" style="padding: 64px 0 96px;">
      <div class="lookup-card">
        <h1 style="font-size: 2rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">Find your booking.</h1>
        <p style="color: var(--color-slate-muted); font-size: 0.95rem; margin-bottom: 24px;">
          Enter your booking reference or PNR and the email or last name used when booking. No login required.
        </p>

        <div id="lookup-error" class="error-banner-inline" style="display: none; margin-bottom: 16px;"></div>

        <div class="input-box" style="margin-bottom: 16px;">
          <label>Booking Reference or PNR</label>
          <input type="text" id="lookup-ref" placeholder="e.g. TC-48291 or XR7QP2" value="TC-48291" style="text-transform: uppercase;">
        </div>

        <div class="trip-type-toggle" style="margin-bottom: 12px;">
          <label class="radio-pill active">
            <input type="radio" name="lookupType" value="email" checked onchange="toggleLookupField('email')"> Email Address
          </label>
          <label class="radio-pill">
            <input type="radio" name="lookupType" value="lastName" onchange="toggleLookupField('lastName')"> Last Name
          </label>
        </div>

        <div class="input-box" style="margin-bottom: 24px;">
          <label id="lookup-field-label">Email Address</label>
          <input type="text" id="lookup-field-input" placeholder="adeola.adeleke@example.com" value="adeola.adeleke@example.com">
        </div>

        <button class="btn btn-gold btn-pill" style="width: 100%; padding: 14px; font-size: 1rem;" onclick="executeBookingLookup()">
          Find my booking
        </button>

        <p style="text-align: center; color: var(--color-slate-muted); font-size: 0.8rem; margin-top: 14px;">
          Your 5-digit booking reference was included in your confirmation email.
        </p>
      </div>
    </div>
  `;
}

function toggleLookupField(type) {
  const label = document.getElementById('lookup-field-label');
  const input = document.getElementById('lookup-field-input');
  if (type === 'email') {
    if (label) label.textContent = 'Email Address';
    if (input) { input.placeholder = 'adeola.adeleke@example.com'; input.value = 'adeola.adeleke@example.com'; }
  } else {
    if (label) label.textContent = 'Last Name';
    if (input) { input.placeholder = 'Adeleke'; input.value = 'Adeleke'; }
  }
}

async function executeBookingLookup() {
  const ref = document.getElementById('lookup-ref')?.value?.trim();
  const val = document.getElementById('lookup-field-input')?.value?.trim();
  const errorBox = document.getElementById('lookup-error');

  if (!ref || !val) {
    if (errorBox) {
      errorBox.style.display = 'block';
      errorBox.textContent = 'Please enter your booking reference and email or last name.';
    }
    return;
  }

  const isEmail = val.includes('@');
  const queryParam = isEmail ? `email=${encodeURIComponent(val)}` : `lastName=${encodeURIComponent(val)}`;

  try {
    const res = await fetch(`/api/v1/bookings/lookup?reference=${encodeURIComponent(ref)}&${queryParam}`);
    const data = await res.json();

    if (!res.ok) {
      if (errorBox) {
        errorBox.style.display = 'block';
        errorBox.textContent = data.message || "We couldn't find a booking with those details. Double-check your reference and try again.";
      }
      return;
    }

    state.lastBooking = data.booking;
    navigateTo('booking-detail');
  } catch (error) {
    if (errorBox) {
      errorBox.style.display = 'block';
      errorBox.textContent = 'Network error looking up booking. Please try again.';
    }
  }
}

// --- VIEW 6: BOOKING DETAIL (Page 12 / Figma 302:4) ---
function getBookingDetailViewHtml() {
  const b = state.lastBooking || {
    booking_ref: 'TC-48291',
    pnr: 'XR7QP2',
    client_name: 'Chidi Okoro',
    client_email: 'chidi.okoro@example.com',
    status: 'confirmed',
    travel_date: 'Oct 12, 2024',
    total_price: 1987700,
    items: [
      {
        type: 'flight',
        airline: 'Emirates Airline',
        flight_number: 'EK784',
        origin: 'Lagos (LOS)',
        destination: 'Dubai (DXB)',
        departure_time: '14:30',
        arrival_time: '01:10 +1',
        duration: '7h 40m',
        stops: 'Non-stop',
        class_of_service: 'Y — Full-fare Economy',
        baggage: '2 × 23kg'
      },
      {
        type: 'hotel',
        property_name: 'Address Downtown',
        location: 'Downtown Dubai, United Arab Emirates',
        check_in: 'Sat, Oct 12, 2024 (After 3:00 PM)',
        check_out: 'Sat, Oct 19, 2024 (Before 12:00 PM)',
        room_type: 'Deluxe Room - Burj Khalifa View',
        nights: 7
      }
    ]
  };

  return `
    <div class="container" style="padding-top: 24px; padding-bottom: 64px;">
      <a class="nav-link" style="color: var(--color-primary); font-weight: 600; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 20px;" onclick="navigateTo('manage-booking')">
        ← Look up another booking
      </a>

      <!-- Status Banner per Figma 302:4 -->
      <div style="background: #2B5885; color: #FFFFFF; border-radius: 12px; padding: 24px 32px; display: flex; align-items: center; gap: 18px; margin-bottom: 32px; box-shadow: var(--shadow-card);">
        <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
          ✓
        </div>
        <div>
          <h1 style="font-size: 1.85rem; font-weight: 700; color: #FFFFFF; margin-bottom: 2px;">Confirmed</h1>
          <div style="font-size: 1rem; color: rgba(255,255,255,0.85);">
            Booking ref <strong>${b.booking_ref}</strong> · PNR: <strong style="font-family: var(--font-display);">${b.pnr}</strong>
          </div>
        </div>
      </div>

      <div class="two-column-layout" style="display: grid; grid-template-columns: 1fr 360px; gap: 36px; padding: 0;">
        <!-- Left Column: Itinerary + Details + Fare Breakdown -->
        <div style="display: grid; gap: 24px;">
          <!-- Card 1: Your Itinerary -->
          <div style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 28px; box-shadow: var(--shadow-card);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
              <span style="font-size: 1.3rem;">🧳</span>
              <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--color-primary);">Your Itinerary</h2>
            </div>

            <!-- Flight Segment -->
            <div style="border-bottom: 1px solid var(--color-border-line); padding-bottom: 24px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="background: #EFF6FF; color: var(--color-secondary); padding: 8px; border-radius: 8px;">✈</span>
                  <div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary);">Lagos (LOS) to Dubai (DXB)</h3>
                    <p style="font-size: 0.85rem; color: var(--color-slate-muted);">Emirates Airline · Flight EK784</p>
                  </div>
                </div>
                <span style="background: #F3F4F6; color: #374151; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">OCT 12, 2024</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 0 12px;">
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-ink-text);">14:30</div>
                  <div style="font-size: 0.85rem; color: var(--color-slate-muted);">Lagos (LOS)</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 0 24px;">
                  <span style="font-size: 0.8rem; color: var(--color-slate-muted);">7h 40m</span>
                  <div style="height: 1.5px; background: #D1D5DB; margin: 4px 0; position: relative;">
                    <span style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); font-size: 0.75rem;">✈</span>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--color-slate-muted);">Non-stop</span>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-ink-text);">01:10 <sup style="font-size: 0.75rem; color: var(--color-secondary);">+1</sup></div>
                  <div style="font-size: 0.85rem; color: var(--color-slate-muted);">Dubai (DXB)</div>
                </div>
              </div>

              <div style="border-top: 1px dashed var(--color-border-line); padding-top: 12px; display: flex; gap: 24px; font-size: 0.85rem; color: #374151;">
                <span>🎫 Class: <strong>Y — Full-fare Economy</strong></span>
                <span>🧳 Baggage: <strong>2 × 23kg</strong></span>
              </div>
            </div>

            <!-- Hotel Segment -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="background: #EFF6FF; color: var(--color-secondary); padding: 8px; border-radius: 8px;">🏨</span>
                  <div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary);">Address Downtown</h3>
                    <p style="font-size: 0.85rem; color: var(--color-slate-muted);">Downtown Dubai, United Arab Emirates</p>
                  </div>
                </div>
                <span style="background: #F3F4F6; color: #374151; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">7 NIGHTS</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #F9FAFB; padding: 14px; border-radius: 8px; margin-bottom: 12px;">
                <div>
                  <div style="font-size: 0.75rem; color: var(--color-slate-muted); text-transform: uppercase;">CHECK-IN</div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-ink-text);">Sat, Oct 12, 2024</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate-muted);">After 3:00 PM</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: var(--color-slate-muted); text-transform: uppercase;">CHECK-OUT</div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-ink-text);">Sat, Oct 19, 2024</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate-muted);">Before 12:00 PM</div>
                </div>
              </div>

              <div style="background: #F9FAFB; padding: 14px; border-radius: 8px; font-size: 0.9rem;">
                <span style="color: var(--color-slate-muted);">Room Type:</span> <strong>Deluxe Room - Burj Khalifa View</strong>
              </div>
            </div>
          </div>

          <!-- Card 2: Traveler Details -->
          <div style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 28px; box-shadow: var(--shadow-card);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
              <span style="font-size: 1.3rem;">👤</span>
              <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--color-primary);">Traveler Details</h2>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
              <div>
                <div style="font-size: 0.75rem; color: var(--color-slate-muted); text-transform: uppercase;">PRIMARY TRAVELER</div>
                <div style="font-weight: 700; font-size: 1rem; color: var(--color-ink-text);">${b.client_name}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--color-slate-muted); text-transform: uppercase;">PASSPORT NUMBER</div>
                <div style="font-weight: 700; font-size: 1rem; color: var(--color-ink-text);">A01234567</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--color-slate-muted); text-transform: uppercase;">NATIONALITY</div>
                <div style="font-weight: 700; font-size: 1rem; color: var(--color-ink-text);">Nigerian</div>
              </div>
            </div>
          </div>

          <!-- Card 3: Fare Breakdown -->
          <div style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 28px; box-shadow: var(--shadow-card);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
              <span style="font-size: 1.3rem;">📋</span>
              <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--color-primary);">Fare Breakdown</h2>
            </div>
            <div style="display: grid; gap: 12px; font-size: 0.95rem;">
              <div style="display: flex; justify-content: space-between; color: var(--color-slate-muted);">
                <span>Base Fare (1 Adult)</span>
                <span style="color: var(--color-ink-text); font-weight: 600;">₦1,450,000</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--color-slate-muted);">
                <span>Taxes & Fees</span>
                <span style="color: var(--color-ink-text); font-weight: 600;">₦537,700</span>
              </div>
              <div style="border-top: 1px solid var(--color-border-line); padding-top: 14px; display: flex; justify-content: space-between; align-items: baseline;">
                <div>
                  <div style="font-size: 0.8rem; color: var(--color-slate-muted); text-transform: uppercase;">TOTAL AMOUNT PAID</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate-muted);">Charged to Card •••• 4242</div>
                </div>
                <div style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 700; color: var(--color-primary);">
                  ₦${Number(b.total_price).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Action Panel + Support + Upsell Promo per Figma 302:4 -->
        <div style="display: grid; gap: 24px; height: fit-content;">
          <!-- Manage Booking Card -->
          <div style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 24px; box-shadow: var(--shadow-card);">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary); margin-bottom: 18px;">Manage booking</h3>

            <button class="btn btn-gold" style="width: 100%; padding: 12px; font-weight: 700; border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="alert('e-Ticket PDF generated for PNR ${b.pnr}')">
              <span>🎟</span> Download e-ticket
            </button>
            <button class="btn btn-outline-navy" style="width: 100%; padding: 12px; font-weight: 600; border-radius: 8px; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="requestCancellation('${b.booking_ref}')">
              <span>✕</span> Request cancellation
            </button>

            <div style="border-top: 1px solid var(--color-border-line); padding-top: 18px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-slate-muted); text-transform: uppercase; margin-bottom: 12px;">SUPPORT & HELP</div>
              <div style="display: grid; gap: 12px; font-size: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="background: #EFF6FF; color: var(--color-secondary); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">📞</span>
                  <div>
                    <div style="font-weight: 700; color: var(--color-ink-text);">+234 (0) 1 234 5678</div>
                    <div style="color: var(--color-slate-muted); font-size: 0.75rem;">24/7 Priority Support</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="background: #EFF6FF; color: var(--color-secondary); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">✉</span>
                  <div>
                    <div style="font-weight: 700; color: var(--color-ink-text);">help@travelcase.com</div>
                    <div style="color: var(--color-slate-muted); font-size: 0.75rem;">Response within 2 hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Promo Upsell Card per Figma 302:4 -->
          <div style="background: linear-gradient(135deg, #1B3557 0%, #0F243E 100%); color: #FFFFFF; border-radius: 12px; padding: 24px; position: relative; overflow: hidden; box-shadow: var(--shadow-card); cursor: pointer;" onclick="alert('Airport transfer booked for your trip!')">
            <img src="/assets/dubai-transfer-car.png" alt="Airport Transfer" style="position: absolute; right: -20px; bottom: -20px; width: 180px; opacity: 0.35; pointer-events: none;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-accent-gold); text-transform: uppercase; margin-bottom: 8px;">LIMITED OFFER</div>
            <h4 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 12px; max-width: 220px; line-height: 1.3;">
              Save 20% on Airport Transfers in Dubai
            </h4>
            <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-accent-gold); display: flex; align-items: center; gap: 6px;">
              Book now →
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function requestCancellation(bookingRef) {
  if (!confirm('Are you sure you want to request cancellation for this trip?')) return;
  try {
    const res = await fetch(`/api/v1/bookings/${bookingRef}/cancel`, { method: 'POST' });
    const data = await res.json();
    alert(data.message || 'Cancellation request submitted.');
    state.lastBooking.status = 'refund_pending';
    renderCurrentView();
  } catch (e) {
    alert('Cancellation requested.');
  }
}

// --- VIEW 7: AGENT DASHBOARD (Page 8 / Figma 247:4) ---
function getAgentDashboardViewHtml() {
  return `
    <div class="container" style="padding-top: 32px; padding-bottom: 64px;">
      <!-- Welcome Row per Figma 247:4 -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;">
        <div>
          <h1 style="font-size: 2.2rem; font-weight: 700; color: var(--color-primary); margin-bottom: 4px;">
            Welcome back, <span id="agent-dash-name">Chidi</span>
          </h1>
          <p style="color: var(--color-slate-muted); font-size: 0.95rem;">
            <span id="agent-dash-agency">Skyline Travel Agency</span> | Approved partner since Jan 2026
          </p>
        </div>
        <div style="display: flex; gap: 16px; align-items: center;">
          <a class="nav-link" style="color: var(--color-slate-muted); font-size: 0.9rem; cursor: pointer;" onclick="logout()">
            Exit agent portal
          </a>
          <button class="btn btn-gold btn-pill" style="padding: 12px 24px; font-weight: 700;" onclick="navigateTo('results')">
            New booking →
          </button>
        </div>
      </div>

      <!-- Stat Card Row (4 Cards per Figma 247:4) -->
      <div class="stats-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px;">
        <div class="stat-tile" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 22px; box-shadow: var(--shadow-card);">
          <div class="stat-tile-label" style="font-size: 0.75rem; font-weight: 700; color: var(--color-slate-muted); text-transform: uppercase; margin-bottom: 8px;">BOOKINGS THIS MONTH</div>
          <div class="stat-tile-value" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; color: var(--color-primary);" id="dash-stat-bookings">42</div>
        </div>
        <div class="stat-tile" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 22px; box-shadow: var(--shadow-card);">
          <div class="stat-tile-label" style="font-size: 0.75rem; font-weight: 700; color: var(--color-slate-muted); text-transform: uppercase; margin-bottom: 8px;">COMMISSION EARNED</div>
          <div class="stat-tile-value gold-stat" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; color: var(--color-accent-gold-dark);" id="dash-stat-margin">₦1,240,500</div>
        </div>
        <div class="stat-tile" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 22px; box-shadow: var(--shadow-card);">
          <div class="stat-tile-label" style="font-size: 0.75rem; font-weight: 700; color: var(--color-slate-muted); text-transform: uppercase; margin-bottom: 8px;">PENDING APPROVALS</div>
          <div class="stat-tile-value" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; color: var(--color-primary);" id="dash-stat-pending">8</div>
        </div>
        <div class="stat-tile" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 22px; box-shadow: var(--shadow-card);">
          <div class="stat-tile-label" style="font-size: 0.75rem; font-weight: 700; color: var(--color-slate-muted); text-transform: uppercase; margin-bottom: 8px;">CLIENT SATISFACTION</div>
          <div class="stat-tile-value" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; color: var(--color-success);" id="dash-stat-sat">
            4.9<span style="font-size: 1.2rem; color: var(--color-slate-muted); font-weight: 500;">/5.0 ★</span>
          </div>
        </div>
      </div>

      <!-- Two-Column Panel Section below Stats per Figma 247:4 -->
      <div class="two-column-layout" style="display: grid; grid-template-columns: 1fr 380px; gap: 32px; padding: 0; margin-bottom: 32px;">
        <!-- Left Panel: Recent Bookings Table per Figma 247:4 -->
        <div class="data-table-container" style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; box-shadow: var(--shadow-card); overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--color-border-line); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 1.2rem; font-weight: 700; color: var(--color-primary);">Recent bookings</span>
            <div style="display: flex; gap: 8px;">
              <button style="background: #FFFFFF; border: 1px solid var(--color-border-line); width: 34px; height: 34px; border-radius: 6px; cursor: pointer;" title="Filter">⚡</button>
              <button style="background: #FFFFFF; border: 1px solid var(--color-border-line); width: 34px; height: 34px; border-radius: 6px; cursor: pointer;" title="Search">🔍</button>
            </div>
          </div>

          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--color-border-line); background: #FAFAFA; text-align: left; font-size: 0.75rem; color: var(--color-slate-muted); text-transform: uppercase;">
                <th style="padding: 14px 24px;">CLIENT & BOOKING</th>
                <th style="padding: 14px 16px;">TYPE</th>
                <th style="padding: 14px 16px;">STATUS</th>
                <th style="padding: 14px 24px; text-align: right;">COMMISSION</th>
              </tr>
            </thead>
            <tbody id="agent-dash-bookings-body">
              <tr style="border-bottom: 1px solid var(--color-border-line);">
                <td style="padding: 18px 24px;">
                  <div style="font-weight: 700; color: var(--color-ink-text);">Femi K. — Lagos–Dubai</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate-muted);">Flight + Hotel · Hilton Al Jaddaf</div>
                </td>
                <td style="padding: 18px 16px;">
                  <span style="background: #E0F2FE; color: #0369A1; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">PACKAGE</span>
                </td>
                <td style="padding: 18px 16px;">
                  <span style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #065F46;">
                    <span style="width: 7px; height: 7px; background: var(--color-success); border-radius: 50%;"></span> Confirmed
                  </span>
                </td>
                <td style="padding: 18px 24px; text-align: right; font-weight: 700; color: var(--color-success);">
                  +₦42,400
                </td>
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border-line);">
                <td style="padding: 18px 24px;">
                  <div style="font-weight: 700; color: var(--color-ink-text);">Chinelo O. — London Heathrow</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate-muted);">Flight Only · Virgin Atlantic</div>
                </td>
                <td style="padding: 18px 16px;">
                  <span style="background: #E0F2FE; color: #0369A1; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">FLIGHT</span>
                </td>
                <td style="padding: 18px 16px;">
                  <span style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #D97706;">
                    <span style="width: 7px; height: 7px; background: #F59E0B; border-radius: 50%;"></span> Pending
                  </span>
                </td>
                <td style="padding: 18px 24px; text-align: right; font-weight: 700; color: var(--color-success);">
                  +₦12,800
                </td>
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border-line);">
                <td style="padding: 18px 24px;">
                  <div style="font-weight: 700; color: var(--color-ink-text);">Tunde J. — Abuja Transit</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate-muted);">Car Rental · Avis Premium</div>
                </td>
                <td style="padding: 18px 16px;">
                  <span style="background: #E0F2FE; color: #0369A1; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">CAR</span>
                </td>
                <td style="padding: 18px 16px;">
                  <span style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #065F46;">
                    <span style="width: 7px; height: 7px; background: var(--color-success); border-radius: 50%;"></span> Confirmed
                  </span>
                </td>
                <td style="padding: 18px 24px; text-align: right; font-weight: 700; color: var(--color-success);">
                  +₦4,500
                </td>
              </tr>
              <tr>
                <td style="padding: 18px 24px;">
                  <div style="font-weight: 700; color: var(--color-ink-text);">Amina W. — New York JFK</div>
                  <div style="font-size: 0.8rem; color: var(--color-slate-muted);">Hotel · The Peninsula NY</div>
                </td>
                <td style="padding: 18px 16px;">
                  <span style="background: #E0F2FE; color: #0369A1; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">HOTEL</span>
                </td>
                <td style="padding: 18px 16px;">
                  <span style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #065F46;">
                    <span style="width: 7px; height: 7px; background: var(--color-success); border-radius: 50%;"></span> Confirmed
                  </span>
                </td>
                <td style="padding: 18px 24px; text-align: right; font-weight: 700; color: var(--color-success);">
                  +₦84,200
                </td>
              </tr>
            </tbody>
          </table>

          <div style="padding: 16px; text-align: center; border-top: 1px solid var(--color-border-line);">
            <a style="font-size: 0.85rem; font-weight: 700; color: var(--color-secondary); text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer;">
              VIEW ALL BOOKINGS
            </a>
          </div>
        </div>

        <!-- Right Panel: "Your agent rate vs. client rate" per Figma 247:4 -->
        <div>
          <div style="background: #FFFFFF; border: 1px solid var(--color-border-line); border-radius: 12px; padding: 24px; box-shadow: var(--shadow-card); margin-bottom: 20px;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary); margin-bottom: 20px;">
              Your agent rate vs. client rate
            </h3>

            <!-- Item 1: Flight -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--color-border-line);">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-ink-text);">Lagos – Dubai (Return)</div>
                <div style="font-size: 0.8rem; color: var(--color-slate-muted);">Economy Class</div>
              </div>
              <div style="text-align: right;">
                <div style="text-decoration: line-through; color: var(--color-slate-muted); font-size: 0.8rem;">₦550,000</div>
                <div style="font-weight: 700; color: var(--color-success); font-size: 1rem;">₦485,000</div>
              </div>
            </div>

            <!-- Item 2: Hotel -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--color-border-line);">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-ink-text);">Radisson Blu Lagos</div>
                <div style="font-size: 0.8rem; color: var(--color-slate-muted);">Standard Room / Night</div>
              </div>
              <div style="text-align: right;">
                <div style="text-decoration: line-through; color: var(--color-slate-muted); font-size: 0.8rem;">₦180,000</div>
                <div style="font-weight: 700; color: var(--color-success); font-size: 1rem;">₦154,500</div>
              </div>
            </div>

            <!-- Item 3: Transfer -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-line);">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-ink-text);">Airport Transfer</div>
                <div style="font-size: 0.8rem; color: var(--color-slate-muted);">Private Sedan (LHR)</div>
              </div>
              <div style="text-align: right;">
                <div style="text-decoration: line-through; color: var(--color-slate-muted); font-size: 0.8rem;">₦45,000</div>
                <div style="font-weight: 700; color: var(--color-success); font-size: 1rem;">₦38,000</div>
              </div>
            </div>

            <!-- Info Box -->
            <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 12px; display: flex; gap: 10px; font-size: 0.8rem; color: #0369A1; line-height: 1.4;">
              <span>ℹ</span>
              <span>Markup bands are applied automatically at checkout based on your agency profile settings.</span>
            </div>
          </div>

          <!-- Trust Badges below Card per Figma 247:4 -->
          <div style="display: flex; justify-content: center; gap: 24px; font-size: 0.75rem; font-weight: 700; color: var(--color-slate-muted); letter-spacing: 0.05em;">
            <span style="display: flex; align-items: center; gap: 6px;">🛡 SECURE SSL</span>
            <span style="display: flex; align-items: center; gap: 6px;">✓ VERIFIED 2026</span>
          </div>
        </div>
      </div>

      <!-- Business Branding Panel (White-label Itineraries) -->
      <div class="checkout-step-card" style="margin-top: 24px;">
        <h3 class="section-title" style="font-size: 1.25rem; margin-bottom: 8px;">Your Business Branding (White-Label)</h3>
        <p style="font-size: 0.85rem; color: var(--color-slate-muted); margin-bottom: 20px;">
          This appears on itineraries and receipts sent to your clients instead of Travel Case's own branding. Underlying PNR and ticketing remain official Sabre GDS issued.
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center;">
          <div>
            <div class="input-box" style="margin-bottom: 14px;">
              <label>Agency Business Name</label>
              <input type="text" id="agency-branding-name" value="Skyline Travel Agency">
            </div>
            <div class="input-box" style="margin-bottom: 14px;">
              <label>Logo Image URL</label>
              <input type="text" id="agency-branding-logo" value="/assets/skyline_logo.png">
            </div>
            <button class="btn btn-gold btn-pill" onclick="saveAgentBrandingSettings()">
              Save branding
            </button>
          </div>

          <!-- Live White-label Itinerary Preview -->
          <div style="border: 2px dashed var(--color-border-line); border-radius: var(--radius-card); padding: 20px; background: #F8FAFC;">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--color-slate-muted); font-weight: 700; margin-bottom: 12px;">Client Receipt Header Preview:</div>
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border-line); padding-bottom: 10px;">
              <div style="font-weight: 700; font-size: 1.15rem; color: var(--color-primary);" id="preview-agency-name">Skyline Travel Agency</div>
              <span style="font-size: 0.75rem; background: #E2E8F0; padding: 2px 8px; border-radius: 4px;">Official Partner</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--color-slate-muted); margin-top: 8px;">
              Issued via Sabre GDS Network · PNR XR7QP2 · Ticket Status: Confirmed
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadAgentDashboardData() {
  try {
    const res = await fetch('/api/v1/agent/dashboard', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    document.getElementById('agent-dash-name').textContent = data.agency.contact_name;
    document.getElementById('agent-dash-agency').textContent = data.agency.agency_name;
    document.getElementById('dash-stat-bookings').textContent = data.stats.bookings_this_month;
    document.getElementById('dash-stat-margin').textContent = `₦${Number(data.stats.margin_earned_this_month).toLocaleString()}`;
    document.getElementById('dash-stat-pending').textContent = data.stats.pending_approvals;

    // Load bookings table
    const tbody = document.getElementById('agent-dash-bookings-body');
    if (tbody && data.recent_bookings && data.recent_bookings.length > 0) {
      tbody.innerHTML = data.recent_bookings.map(b => `
        <tr style="border-bottom: 1px solid var(--color-border-line);">
          <td style="padding: 18px 24px;">
            <div style="font-weight: 700; color: var(--color-ink-text);">${b.client_name} — Ref ${b.booking_ref}</div>
            <div style="font-size: 0.8rem; color: var(--color-slate-muted);">PNR ${b.pnr} · ${b.travel_date || '2026-11-12'}</div>
          </td>
          <td style="padding: 18px 16px;">
            <span style="background: #E0F2FE; color: #0369A1; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">${b.vertical || 'FLIGHT'}</span>
          </td>
          <td style="padding: 18px 16px;">
            <span style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: ${b.status === 'confirmed' ? '#065F46' : (b.status === 'pending' ? '#D97706' : '#4B5563')}; text-transform: capitalize;">
              <span style="width: 7px; height: 7px; background: ${b.status === 'confirmed' ? 'var(--color-success)' : (b.status === 'pending' ? '#F59E0B' : '#6B7280')}; border-radius: 50%;"></span>
              ${b.status}
            </span>
          </td>
          <td style="padding: 18px 24px; text-align: right; font-weight: 700; color: var(--color-success);">
            +₦${Number(b.margin).toLocaleString()}
          </td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Failed loading agent dashboard data:', e);
  }
}

async function saveAgentPricingSettings() {
  const markups = {
    flights: parseFloat(document.getElementById('cfg-markup-flights').value),
    hotels: parseFloat(document.getElementById('cfg-markup-hotels').value),
    cars: parseFloat(document.getElementById('cfg-markup-cars').value),
    activities: parseFloat(document.getElementById('cfg-markup-activities').value)
  };

  try {
    const res = await fetch('/api/v1/agent/pricing', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ markups })
    });
    const data = await res.json();
    if (!res.ok) alert(data.error || 'Failed saving pricing');
    else alert('Default agent markups saved successfully.');
  } catch (e) {
    alert('Failed to save pricing.');
  }
}

async function saveAgentBrandingSettings() {
  const agencyName = document.getElementById('agency-branding-name').value;
  const logoUrl = document.getElementById('agency-branding-logo').value;

  try {
    const res = await fetch('/api/v1/agent/branding', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agency_name: agencyName, logo_url: logoUrl })
    });
    const data = await res.json();
    alert(data.message || 'Branding updated.');
    document.getElementById('preview-agency-name').textContent = agencyName;
  } catch (e) {
    alert('Failed to save branding.');
  }
}

// --- VIEW 8: ADMIN BACK-OFFICE (Page 9) ---
function getAdminViewHtml() {
  return `
    <div class="admin-shell">
      <!-- Fixed Left Sidebar -->
      <aside class="admin-sidebar">
        <div>
          <div style="padding: 0 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="background: #FFFFFF; border-radius: 8px; padding: 6px 12px; display: inline-flex; margin-bottom: 12px;">
              <img src="/assets/logo.png" alt="TravelCase Admin" style="height: 26px; width: auto; display: block;">
            </div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">Platform Management Portal</div>
          </div>

          <div style="margin-top: 16px;">
            <div class="admin-nav-item ${state.adminViewSubTab === 'approvals' ? 'active' : ''}" onclick="switchAdminTab('approvals')">
              <span>Agent Approvals</span>
              <span id="admin-pending-badge" style="background: var(--color-accent-gold); color: var(--color-primary); font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 10px; margin-left: auto;">1</span>
            </div>
            <div class="admin-nav-item ${state.adminViewSubTab === 'caps' ? 'active' : ''}" onclick="switchAdminTab('caps')">
              <span>Markup Caps</span>
            </div>
            <div class="admin-nav-item ${state.adminViewSubTab === 'bookings' ? 'active' : ''}" onclick="switchAdminTab('bookings')">
              <span>All Bookings</span>
            </div>
            <div class="admin-nav-item ${state.adminViewSubTab === 'traveldoc' ? 'active' : ''}" onclick="switchAdminTab('traveldoc')">
              <span>TravelDoc AI Rules</span>
            </div>
          </div>
        </div>

        <div style="padding: 16px 24px; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6);">
          Logged in as <strong>Super Admin</strong>
        </div>
      </aside>

      <!-- Main Admin Content Area -->
      <main class="admin-content" id="admin-subview-container">
        <!-- Rendered via loadAdminViewData() -->
      </main>
    </div>
  `;
}

function switchAdminTab(tab) {
  state.adminViewSubTab = tab;
  renderCurrentView();
}

async function loadAdminViewData() {
  const container = document.getElementById('admin-subview-container');
  if (!container) return;

  // Ensure admin token exists; if not, use demo admin token
  const headers = {
    'Authorization': `Bearer ${state.authToken || ''}`,
    'Content-Type': 'application/json'
  };

  if (state.adminViewSubTab === 'approvals') {
    // View A: Agent Approvals
    try {
      const res = await fetch('/api/v1/admin/pending-agents', { headers });
      const data = await res.json();

      container.innerHTML = `
        <h2 class="section-title" style="margin-bottom: 8px;">Agent Approvals</h2>
        <p class="section-subtitle" style="margin-bottom: 24px;">Review agency business registration and approve for trade net rate access.</p>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>Contact Name & Email</th>
                <th>Business Reg (CAC)</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${(data.agents && data.agents.length > 0) ? data.agents.map(a => `
                <tr>
                  <td><strong>${a.agency_name}</strong><br><span style="font-size: 0.75rem; color: var(--color-slate-muted);">${a.address || 'Lagos'}</span></td>
                  <td>${a.contact_name}<br><span style="font-size: 0.75rem; color: var(--color-slate-muted);">${a.email}</span></td>
                  <td><code>${a.business_reg_number}</code></td>
                  <td>${new Date(a.submitted_at).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn-success btn-pill" style="padding: 4px 12px; font-size: 0.8rem; margin-right: 6px;" onclick="approveAgent('${a.agent_id}')">Approve</button>
                    <button class="btn btn-outline-danger btn-pill" style="padding: 4px 12px; font-size: 0.8rem;" onclick="rejectAgent('${a.agent_id}')">Reject</button>
                  </td>
                </tr>
              `).join('') : `
                <tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--color-slate-muted);">No pending agent registrations awaiting review.</td></tr>
              `}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="error-banner-inline">Admin authentication required. Log in as admin@travelcase.com</div>`;
    }
  } else if (state.adminViewSubTab === 'caps') {
    // View B: Markup Caps
    try {
      const res = await fetch('/api/v1/admin/markup-caps', { headers });
      const data = await res.json();

      container.innerHTML = `
        <h2 class="section-title" style="margin-bottom: 8px;">Markup Caps</h2>
        <p class="section-subtitle" style="margin-bottom: 20px;">
          The maximum markup percentage an agent can apply on top of net rate, per vertical. Agents cannot submit a booking above this cap.
        </p>

        <div class="filter-card" style="max-width: 600px;">
          ${(data.caps || []).map(c => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border-line);">
              <span style="font-weight: 700; text-transform: capitalize;">${c.vertical}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" id="adm-cap-${c.vertical}" value="${c.max_markup_pct}" style="width: 80px; padding: 6px; font-weight: 700; border: 1px solid var(--color-border-line); border-radius: 6px;">
                <span>%</span>
              </div>
            </div>
          `).join('')}

          <div style="margin-top: 20px;">
            <button class="btn btn-navy btn-pill" onclick="saveAdminMarkupCaps()">Save changes</button>
          </div>

          <p style="font-size: 0.8rem; color: var(--color-slate-muted); margin-top: 14px;">
            * Changes apply to new bookings only — bookings already priced under the previous cap are not affected.
          </p>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="error-banner-inline">Error loading markup caps.</div>`;
    }
  } else if (state.adminViewSubTab === 'bookings') {
    // View C: All Bookings
    try {
      const res = await fetch('/api/v1/admin/all-bookings', { headers });
      const data = await res.json();

      container.innerHTML = `
        <h2 class="section-title" style="margin-bottom: 8px;">All Platform Bookings</h2>
        <p class="section-subtitle" style="margin-bottom: 20px;">Platform oversight across consumer and B2B wholesale transactions.</p>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Booking Ref / PNR</th>
                <th>Client / Agency</th>
                <th>Vertical</th>
                <th>Status</th>
                <th>Net Rate</th>
                <th>Client Price</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${(data.bookings || []).map(b => `
                <tr>
                  <td><strong>${b.booking_ref}</strong><br><span style="font-family: var(--font-display); font-size: 0.8rem; color: var(--color-secondary);">${b.pnr}</span></td>
                  <td>${b.client_name}<br><span style="font-size: 0.75rem; color: var(--color-slate-muted);">${b.agency_name || 'B2C Direct'}</span></td>
                  <td>${b.vertical}</td>
                  <td><span class="status-pill ${b.status}">${b.status}</span></td>
                  <td>₦${Number(b.net_rate).toLocaleString()}</td>
                  <td><strong>₦${Number(b.client_price).toLocaleString()}</strong></td>
                  <td style="color: var(--color-success); font-weight: 700;">+₦${Number(b.margin).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="error-banner-inline">Error loading all bookings.</div>`;
    }
  } else if (state.adminViewSubTab === 'traveldoc') {
    // TravelDoc AI Curator Verification view
    try {
      const res = await fetch('/api/v1/traveldoc/manifest');
      const manifest = await res.json();

      container.innerHTML = `
        <h2 class="section-title" style="margin-bottom: 8px;">TravelDoc AI: Rules Registry & Coverage Manifest</h2>
        <p class="section-subtitle" style="margin-bottom: 20px;">
          Deterministic travel rules stored in the database. Independent 2-person verification is enforced.
        </p>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rule Code</th>
                <th>Route</th>
                <th>Purpose</th>
                <th>Outcome</th>
                <th>Status</th>
                <th>Source Authority</th>
              </tr>
            </thead>
            <tbody>
              ${(manifest.rules || []).map(r => `
                <tr>
                  <td><code>${r.rule_code}</code></td>
                  <td><strong>${r.passport_country} → ${r.destination_country}</strong></td>
                  <td>${r.travel_purpose}</td>
                  <td><span class="doc-cat-badge ${r.permission_outcome === 'visa_required' ? 'doc-cat-required' : 'doc-cat-recommended'}">${r.permission_outcome}</span></td>
                  <td><span class="status-pill ${r.status}">${r.status}</span></td>
                  <td style="font-size: 0.8rem;">${r.source_name}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="error-banner-inline">Error loading TravelDoc manifest.</div>`;
    }
  }
}

async function approveAgent(id) {
  try {
    await fetch(`/api/v1/admin/agents/${id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    alert('Agency approved successfully.');
    loadAdminViewData();
  } catch (e) {
    alert('Error approving agent.');
  }
}

async function rejectAgent(id) {
  try {
    await fetch(`/api/v1/admin/agents/${id}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    alert('Agency registration rejected.');
    loadAdminViewData();
  } catch (e) {
    alert('Error rejecting agent.');
  }
}

async function saveAdminMarkupCaps() {
  const caps = [
    { vertical: 'flights', max_markup_pct: parseFloat(document.getElementById('adm-cap-flights')?.value || 18) },
    { vertical: 'hotels', max_markup_pct: parseFloat(document.getElementById('adm-cap-hotels')?.value || 25) },
    { vertical: 'cars', max_markup_pct: parseFloat(document.getElementById('adm-cap-cars')?.value || 20) },
    { vertical: 'activities', max_markup_pct: parseFloat(document.getElementById('adm-cap-activities')?.value || 30) },
    { vertical: 'transfers', max_markup_pct: parseFloat(document.getElementById('adm-cap-transfers')?.value || 25) }
  ];

  try {
    const res = await fetch('/api/v1/admin/markup-caps', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${state.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ caps })
    });
    const data = await res.json();
    alert(data.message || 'Markup caps updated.');
  } catch (e) {
    alert('Error updating markup caps.');
  }
}

// --- TravelDoc AI Modal & Engine ---
function openTravelDocModal() {
  const modal = document.getElementById('traveldoc-modal');
  if (modal) modal.classList.add('active');
}

function closeTravelDocModal() {
  const modal = document.getElementById('traveldoc-modal');
  if (modal) modal.classList.remove('active');
}

function triggerTravelDocForRoute(destinationCode) {
  openTravelDocModal();
  const destSelect = document.getElementById('td-destination');
  if (destSelect) {
    if (destinationCode === 'DXB') destSelect.value = 'United Arab Emirates';
    else if (destinationCode === 'CDG') destSelect.value = 'France';
    else if (destinationCode === 'LHR') destSelect.value = 'United Kingdom';
    else if (destinationCode === 'NBO') destSelect.value = 'Kenya';
  }
  runTravelDocCheck();
}

async function runTravelDocCheck() {
  const passport = document.getElementById('td-passport')?.value || 'Nigeria';
  const destination = document.getElementById('td-destination')?.value || 'France';
  const purpose = document.getElementById('td-purpose')?.value || 'tourism';
  const transit = document.getElementById('td-transit')?.value || null;
  const notes = document.getElementById('td-notes')?.value || '';
  const resultsDiv = document.getElementById('traveldoc-results');

  if (!resultsDiv) return;
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--color-slate-muted);">Evaluating deterministic travel rules & authoritative sources...</div>`;

  try {
    const res = await fetch('/api/v1/traveldoc/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passport_country: passport,
        destination_country: destination,
        travel_purpose: purpose,
        transit_country: transit,
        notes: notes
      })
    });

    const data = await res.json();
    const evalData = data.evaluation;
    const expl = data.explanation;
    const sec = data.security;

    let secNotice = '';
    if (sec && sec.prohibited_detected) {
      secNotice = `
        <div class="error-banner-inline" style="margin-bottom: 16px;">
          🛡 <strong>Privacy Warning:</strong> ${sec.warnings.join(' ')}
        </div>
      `;
    }

    if (!evalData.is_covered) {
      resultsDiv.innerHTML = `
        ${secNotice}
        <div style="background: #FEE2E2; color: #991B1B; padding: 18px; border-radius: var(--radius-input); margin-bottom: 16px;">
          <strong>No Verified Coverage:</strong> ${evalData.message}
          <div style="font-size: 0.85rem; margin-top: 6px;">${evalData.disclaimer}</div>
        </div>
      `;
      return;
    }

    resultsDiv.innerHTML = `
      ${secNotice}

      <!-- Grounded AI Explanation Card -->
      <div class="grounded-explanation-card">
        <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--color-secondary); font-weight: 700; margin-bottom: 6px;">
          🤖 AI Grounded Overview (${expl.source_mode})
        </div>
        <div>${expl.explanation}</div>
        <div style="font-size: 0.75rem; color: var(--color-slate-muted); margin-top: 8px;">
          Cited Rule IDs: <code>${expl.cited_requirement_ids.join(', ')}</code> · Source: <em>${evalData.source.name}</em>
        </div>
      </div>

      <!-- Destination Requirements Checklist -->
      <h4 style="margin: 20px 0 12px; font-size: 1.1rem; color: var(--color-primary);">
        Destination Checklist: ${destination} (${evalData.permission_outcome})
      </h4>

      ${(evalData.destination_requirements || []).map(r => `
        <div class="doc-checklist-item">
          <span class="doc-cat-badge doc-cat-${r.category.toLowerCase()}">${r.category}</span>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem;">${r.title} <code style="font-size: 0.75rem;">${r.id}</code></div>
            <div style="font-size: 0.85rem; color: var(--color-slate-muted); margin-top: 2px;">${r.description}</div>
            ${r.stale_note ? `<div style="font-size: 0.75rem; color: var(--color-warning); margin-top: 4px;">⚠️ ${r.stale_note}</div>` : ''}
          </div>
        </div>
      `).join('')}

      <!-- Transit Requirements if applicable -->
      ${(evalData.transit_requirements && evalData.transit_requirements.length > 0) ? `
        <h4 style="margin: 24px 0 12px; font-size: 1.1rem; color: var(--color-primary);">
          Transit Airside Requirements (${evalData.transit_country})
        </h4>
        ${evalData.transit_requirements.map(tr => `
          <div class="doc-checklist-item">
            <span class="doc-cat-badge doc-cat-${tr.category.toLowerCase()}">${tr.category}</span>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">${tr.title}</div>
              <div style="font-size: 0.85rem; color: var(--color-slate-muted);">${tr.description}</div>
            </div>
          </div>
        `).join('')}
      ` : ''}

      <!-- Source Attribution Footer -->
      <div style="border-top: 1px solid var(--color-border-line); padding-top: 14px; margin-top: 20px; font-size: 0.8rem; color: var(--color-slate-muted); display: flex; justify-content: space-between;">
        <span>Verified Source: <a href="${evalData.source.url}" target="_blank" style="color: var(--color-secondary); font-weight: 600;">${evalData.source.name}</a></span>
        <span>Last Verified: ${new Date(evalData.source.last_verified_at).toLocaleDateString()}</span>
      </div>
    `;
  } catch (e) {
    resultsDiv.innerHTML = `<div class="error-banner-inline">Error running TravelDoc verification.</div>`;
  }
}

// --- Auth Modal & Handlers ---
function handleAgentPortalClick() {
  if (state.currentUser && state.currentUser.role === 'agent') {
    navigateTo('agent-dashboard');
  } else {
    openAuthModal();
  }
}

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('active');
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
}

function switchToRegisterAgent() {
  const email = prompt('Enter your agency contact email:');
  const agencyName = prompt('Enter your registered business name:');
  const contactName = prompt('Enter your primary contact name:');
  if (!email || !agencyName || !contactName) return;

  fetch('/api/v1/auth/register-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Password123!',
      agency_name: agencyName,
      full_name: contactName
    })
  }).then(r => r.json()).then(data => {
    alert(data.message || 'Agency registration submitted!');
  });
}

async function handleLoginSubmit() {
  const email = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value;
  const errorBox = document.getElementById('auth-error');

  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      if (errorBox) {
        errorBox.style.display = 'block';
        errorBox.textContent = data.error || 'Login failed';
      }
      return;
    }

    state.authToken = data.token;
    localStorage.setItem('tc_auth_token', data.token);
    state.currentUser = data.user;
    state.agentProfile = data.agent_profile;
    updateHeaderAgentState();
    closeAuthModal();

    if (data.user.role === 'agent') {
      navigateTo('agent-dashboard');
    } else if (data.user.role === 'admin') {
      navigateTo('admin');
    } else {
      navigateTo('home');
    }
  } catch (error) {
    if (errorBox) {
      errorBox.style.display = 'block';
      errorBox.textContent = 'Server communication error during login.';
    }
  }
}

function openCoverageManifest() {
  switchAdminTab('traveldoc');
  navigateTo('admin');
}
