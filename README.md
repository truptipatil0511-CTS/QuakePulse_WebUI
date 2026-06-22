# 🌍 QuakePulse WebUI

A cloud-based real-time earthquake monitoring application built with **Angular 19**, **MapLibre GL JS**, and **SCSS CSS custom properties** for full light/dark theming.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Open browser at http://localhost:4200
```

**No API keys required** — the map renders out-of-the-box using free public tiles.

---

## Map Provider

Maps are powered by **MapLibre GL JS** with public tile providers — **no authentication needed**:

| Style | Provider | Notes |
|---|---|---|
| Standard (Road) | [OpenFreeMap Liberty](https://openfreemap.org/) | Community-hosted vector tiles |
| Dark | [OpenFreeMap Fiord](https://openfreemap.org/) | Same provider, dark variant |
| Satellite | [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) | Free raster tiles |

The component sits behind a thin abstraction so you can swap providers (e.g. Azure Maps, Mapbox) by replacing one constants block in `MapViewComponent`.

---

## Backend API

The app connects to **QuakePulse_WebService** (ASP.NET Core). When the backend is unreachable it automatically falls back to 20 built-in mock earthquakes for UI development.

Set the base URL in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7240'
};
```

---

## Features

| Feature | Details |
|---|---|
| 🗺 Interactive Map | MapLibre GL JS with zoom, pan, fit-to-data |
| 📍 Marker Clustering | Native GeoJSON-source clustering, breaks apart on zoom |
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
│   │   ├── map-view/        MapLibre GL JS integration with clustering & popups
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
│       ├── earthquake.service    API calls + DTO adapter + reactive stats
│       └── theme.service         Light/dark toggle + localStorage persistence
├── environments/
│   ├── environment.ts            Development config
│   └── environment.prod.ts       Production config
└── styles.scss                   CSS variables, global resets, MapLibre overrides
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
