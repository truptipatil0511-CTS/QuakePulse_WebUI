QuakePulse WebUI - Master Testing Guidelines

---

PURPOSE

This document defines **testing standards, best practices, and conventions** for the QuakePulse WebUI project.

Goal:
-  Maximize confidence with minimal effort
-  Keep automation SIMPLE and maintainable
-  Focus on high-value user flows
-  Avoid over-engineering

---

TESTING PHILOSOPHY

PRIORITY ORDER

1. End-to-End User Flows ⭐⭐⭐
2. Core Functional Validation ⭐⭐
3. UI Visibility & Stability ⭐
4. Edge Cases (minimal for POC)

---

WHAT TO AVOID

- Complex frameworks
- Overuse of Page Object Model (POM)
- Testing implementation details
- Fragile selectors
- Hard waits (timeouts/sleeps)

---

TECH STACK

- Playwright (TypeScript)
- Angular UI
- MapLibre (map rendering)
- OpenStreetMap tiles
- Base URL: http://localhost:4200

---

APPLICATION CONTEXT

 Core Feature: Map Visualization
- Earthquake markers
- Clusters
- Zoom controls
- Map styles

Filters Panel
- Date range (24h / 7d / 30d)
- Custom date selection
- Magnitude slider
- Location filter

Header Search
- Global location search

Summary Panel
- Total Events
- Highest Magnitude
- Last Activity

View Modes
- Map view
- List view

---

 TEST COVERAGE STRATEGY

  MUST COVER 

| Area | Coverage |
|------|--------|
| App Load |  |
| Filters |  |
| Map Interaction |  |
| Summary |  |
| End-to-End Flow |  |

---

  OPTIONAL (POC skip if needed)

- Visual regression
- Performance testing
- Accessibility

---

CORE TEST SCENARIOS

---

# 1. Smoke Test
- App loads successfully
- Map is visible
- Filters panel exists
- Search inputs visible
- Summary panel visible

---

# 2. Filters Testing
- Date range selection (24h / 7d / 30d)
- Custom date selection
- Magnitude filtering
- Location filter input
- Map updates accordingly

---

# 3. Map Interaction
- Zoom controls (+ / -)
- Marker rendering
- Cluster display
- Marker click interaction

---

# 4. Summary Validation
- Total Events visible
- Highest magnitude text
- Last activity timestamp
- Updates after filter change

---

# 5. End-to-End Flow (MOST IMPORTANT )