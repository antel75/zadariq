

# ZadarIQ — Smart City Assistant for Zadar

## Overview
A mobile-first web app that gives residents and tourists instant access to local business info, services, and emergency contacts in Zadar, Croatia. Designed for speed and simplicity — answers in under 5 seconds.

---

## Pages & Navigation

### 1. Home Screen (Main Experience)
- Large search bar at top: *"Pitaj Zadar bilo što… / Ask Zadar anything…"*
- Horizontal scrollable category buttons (Pharmacy, Doctor, Shops, Restaurants, Cafes, Parking, Transport, Emergency, Events, Public Services)
- Below: trending/popular searches and nearby highlights
- Language selector in top corner (HR / EN / DE / IT) with auto-detection

### 2. Search Results Page
- Displays structured **Business Info Cards** with:
  - Business name
  - Large color-coded OPEN (green) / CLOSED (red) badge
  - Today's working hours
  - Address
  - Call button & Navigation button (opens maps)
  - "Last verified" timestamp
  - "Report incorrect info" link
- Filter/sort options (distance, open now, rating)

### 3. Business Detail Page
- Full working hours for all days
- Map preview
- Contact info (phone, website)
- "I am the owner" claim button
- Crowdsourced correction: "Working hours wrong?" → options: closed / moved / wrong hours
- Verification badge if owner-verified

### 4. Category Browse Page
- Grid/list of all businesses in a category
- Quick filter: "Open now" toggle

### 5. Emergency Info Page
- Static page with key emergency numbers (police, ambulance, fire, hospital, tourist police)
- Always accessible, no search needed

### 6. Owner Claim Flow (UI mockup)
- "I am the owner" → email input → verification message
- Dashboard mockup showing editable hours and pending status
- Changes marked as "verified" or "pending moderation"

---

## Design System
- **Primary color:** Deep blue
- **Accent:** Cyan
- **Open status:** Green badge
- **Closed status:** Red badge
- **Style:** iOS-like, minimal, large touch targets, rounded cards, clean typography
- **Mobile-first** layout, responsive up to desktop

---

## Multilingual Support
- Four languages: Croatian (default), English, German, Italian
- Language context provider with translations for all UI strings
- Auto-detect browser language on first visit

---

## Mock Data
- 10 pharmacies with real Zadar names/addresses
- 10 dentists
- 10 cafes
- 5 parking zones
- Emergency contacts
- Realistic Croatian business names, streets, and working hours
- Some marked as "verified," others as community-sourced

---

## Crowdsourced Corrections (Frontend)
- "Report" button on each card
- Modal with options: closed / moved / wrong hours
- Counter showing number of reports
- Visual indicator when 3+ users report an issue ("Possibly incorrect" warning badge)

---

## Architecture Notes
- All data stored in local mock data files, structured to mirror a future database schema (businesses, categories, reports, verifications)
- Search logic with keyword matching and category filtering
- Translation system via React context — ready for backend API swap
- Component structure ready for future AI assistant, live parking data, and municipal integrations

