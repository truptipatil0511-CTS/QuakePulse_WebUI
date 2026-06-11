# 🌍 QuakePulse WebUI

A cloud-based real-time earthquake monitoring application built with **Angular 19**, **Azure Maps**, and **SCSS CSS custom properties** for full light/dark theming.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Open browser at http://localhost:4200
```

---

## Azure Maps Setup

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Maps Accounts**
2. Create or open an account → **Authentication** → copy your **Primary Key**
3. Paste it into `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000',
  azureMapsKey: 'YOUR_KEY_HERE'   // ← paste here
};
```

> **Without a key** the app still works — the Map view shows a friendly setup message while **List View**, all filters, summary stats, and theme switching are fully functional.

---

## Backend API

The app connects to **QuakePulse_WebService** (ASP.NET Core). When the backend is unavailable it automatically falls back to 20 built-in mock earthquakes for UI development.

Set the base URL in `src/environments/environment.ts`:

```typescript
apiBaseUrl: 'http://localhost:5000'   // default
```

---

## Features

| Feature | Details |
|---|---|
| 🗺 Interactive Map | Azure Maps with zoom, pan, fit-to-data |
| 📍 Marker Clustering | Auto-clusters dense regions, breaks apart on zoom |
| 🎨 Marker Color Coding | Green < 3.0 · Amber 3–5 · Red 5–7 · Crimson ≥ 7 |
| 💬 Click Popups | Magnitude, place, time, depth, external link |
| 🔥 Heatmap Mode | Toggle density heatmap overlay |
| 🌙 Dark / Light Theme | System preference detected, persisted to localStorage |
| 🗂 List View | Sortable, scrollable, click to zoom map |
| 🔍 Filters | Date range presets, dual magnitude slider, location search |
| 📊 Summary Stats | Total events, highest magnitude, last activity |
| ♿ Accessibility | ARIA labels, keyboard navigation, high-contrast support |
| 📱 Responsive | Desktop · Tablet (collapsible sidebar) · Mobile (bottom sheet) |

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── header/          Header bar with search, live indicator, theme toggle
│   │   ├── sidebar/         Filters, view toggle, stats, legend
│   │   ├── map-view/        Azure Maps integration with clustering & popups
│   │   ├── list-view/       Scrollable earthquake list with sort
│   │   └── status-bar/      Data source credit + live/stale indicator
│   ├── models/
│   │   ├── earthquake.model.ts   All TypeScript interfaces
│   │   └── mock-data.ts          20 seed earthquakes for dev/fallback
│   ├── pipes/
│   │   ├── magnitude-class.pipe  minor/moderate/strong/major CSS class
│   │   └── time-ago.pipe         "2h 14m ago" relative time
│   └── services/
│       ├── app-state.service     View mode, filters, selected event, zoom events
│       ├── earthquake.service    API calls + mock fallback + reactive stats
│       └── theme.service         Light/dark toggle + localStorage persistence
├── environments/
│   ├── environment.ts            Development config
│   └── environment.prod.ts       Production config
└── styles.scss                   CSS variables, global resets, Azure Maps overrides
```

---

## Build

```bash
# Development build
ng build --configuration=development

# Production build
ng build --configuration=production
```

Output → `dist/QuakePulseWebUI/`
