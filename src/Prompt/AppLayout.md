
Act as a senior UI/UX designer and enterprise architect.

Design a full UI layout for a cloud-based earthquake monitoring application 
that uses geo-mapping (Azure Maps or similar).
Source Code Folder QuakePulse_WebUI
The UI should be clean, modern, responsive, and optimized for data visualization.

Provide a detailed structured layout including:

1. Overall Layout
- Page structure (header, sidebar, main content)
- Responsive behavior (desktop + tablet + mobile)

2. Map View (Main Focus)
- Large interactive map occupying primary space
- Marker plotting for earthquake locations
- Clustering for large data sets
- Map style support (light and dark themes)

3. Sidebar Panel
- Filters:
  - Date range selector
  - Magnitude filter
  - Location search
- Toggle options:
  - List view / map view
  - Theme switch (light/dark)
- Display summary stats:
  - Total earthquakes
  - Highest magnitude
  - Recent activity

4. List View (Secondary Panel)
- Scrollable list of earthquake events
- Each item shows:
  - Magnitude (highlighted)
  - Location
  - Time
- Click → zoom map to that location

5. Map Interaction Features
- Click marker → popup with details:
  - Magnitude
  - Location
  - Timestamp
  - Link to details
- Hover tooltip preview
- Zoom + pan controls

6. Visual Design
- Provide color palette:
  - Light theme
  - Dark theme
- Marker color coding:
  - Green (<3)
  - Yellow (3–5)
  - Red (>5)
- Ensure high contrast for visibility on map

7. User Experience
- Smooth transitions between themes
- Fast loading (lazy loading of data)
- Clear legend explaining marker colors
- Minimal UI clutter

8. Accessibility
- High contrast mode
- Keyboard navigation support
- Screen reader friendly labels

9. Performance Considerations
- Handle large datasets efficiently
- Use clustering and lazy loading
- Debounce filter inputs

10. Optional Enhancements
- Heatmap mode for high activity regions
- Real-time update indicator
- Refresh button

Output format:
- Structured layout description
- Component hierarchy
- Suggested UI wireframe in text (ASCII/block layout)
- Color palette suggestions

Avoid code. Focus on UI/UX design and layout strategy.

QuakePulse WebUI — Design Specification
1. Overall Layout Architecture
Page Structure
┌─────────────────────────────────────────────────────────────────┐
│                         TOP HEADER BAR                          │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│   SIDEBAR    │              MAIN CONTENT AREA                   │
│   PANEL      │         (Map View OR List View)                  │
│   (320px)    │                                                  │
│              │                                                  │
│              │                                                  │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
│                         STATUS BAR                              │
└─────────────────────────────────────────────────────────────────┘
Responsive Breakpoints
Breakpoint	Layout Behavior
Desktop (≥1280px)	Sidebar fixed left + full map/content right
Tablet (768–1279px)	Sidebar collapsible (icon rail) + full map
Mobile (<768px)	Bottom sheet drawer replaces sidebar; map fills screen
2. Header Bar
┌─────────────────────────────────────────────────────────────────┐
│  🌍 QuakePulse    [Search location...]   [↻ Live] [☀/🌙] [≡]  │
└─────────────────────────────────────────────────────────────────┘
Components:

Logo + Wordmark — left-anchored, links to default view
Global Location Search — center, autocomplete with geo suggestions
Live Indicator — pulsing dot + "Live" label, turns amber when stale
Refresh Button — manual data refresh with spinner state
Theme Toggle — sun/moon icon, animates on switch
Hamburger/Collapse — sidebar toggle on tablet/mobile
Height: 56px fixed
Elevation: Subtle shadow (2dp) to separate from content below

3. Sidebar Panel (320px wide)
┌────────────────────────┐
│  FILTERS               │
│  ─────────────────     │
│  📅 Date Range         │
│  [  Start  ][  End  ]  │
│                        │
│  📊 Magnitude          │
│  ●───────────○  [2–9]  │
│   Min              Max │
│                        │
│  📍 Location Search    │
│  [ Search region... ]  │
│                        │
│  ─────────────────     │
│  VIEW                  │
│  [🗺 Map] [☰ List]     │
│                        │
│  ─────────────────     │
│  SUMMARY STATS         │
│  ┌──────────────────┐  │
│  │ Total Events     │  │
│  │      1,284       │  │
│  ├──────────────────┤  │
│  │ Highest Mag.     │  │
│  │      7.2 ●       │  │
│  ├──────────────────┤  │
│  │ Last Activity    │  │
│  │  2 minutes ago   │  │
│  └──────────────────┘  │
│                        │
│  ─────────────────     │
│  LEGEND                │
│  ● < 3.0   Minor       │
│  ● 3.0–5.0 Moderate    │
│  ● > 5.0   Major       │
│                        │
└────────────────────────┘
Filter Components
Date Range Selector

Dual calendar picker (start/end)
Quick presets: Last 24h · 7 days · 30 days · Custom
Clear button to reset
Magnitude Slider

Dual-handle range slider (0.0 – 10.0)
Numeric input fields flanking slider for precision entry
Track color mirrors magnitude palette (green → yellow → red)
Debounced: fires query 400ms after last interaction
Location Search

Text input with typeahead (city, region, country)
"Use my location" button with GPS icon
Draws bounding box overlay on map when active
View Toggle

Segmented button control: Map | List
Keyboard shortcut hint on hover (M / L)
Summary Stats Cards

Three compact stat cards, stacked vertically
Each: label top, large value center, contextual sub-label bottom
Highest magnitude card uses magnitude color coding on the value
Legend

Three color-dot + label rows
Persistent — always visible at bottom of sidebar
4. Main Content — Map View
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   [+]                     INTERACTIVE MAP                       │
│   [-]          ●●                                               │
│   [⊡]       ⑤●   ●              ●●                            │
│              ●          ●●                    ●                 │
│                    ●③                                           │
│          ●                  ●           ●                       │
│                 ●●                                              │
│                       ●                  ●                      │
│                                                                 │
│  [🗺 Standard] [🌑 Dark] [🔥 Heatmap]         [⊞ Cluster ON]   │
└─────────────────────────────────────────────────────────────────┘
Map Controls (floating, positioned)
Control	Position	Function
Zoom +/−	Top-left	Standard map zoom
Fit to Data	Top-left (below zoom)	Bounds all visible markers
Fullscreen	Top-right	Expand map to full viewport
Map Style Switcher	Bottom-left	Standard · Dark · Satellite
Heatmap Toggle	Bottom-left	Switches to density heatmap
Cluster Toggle	Bottom-right	On/Off cluster grouping
Scale Indicator	Bottom-right	Dynamic distance scale
Marker Design
Isolated marker:         Cluster marker:
    ╭───╮                   ╭──────╮
    │ M │   ← magnitude     │  23  │  ← event count
    ╰─┬─╯                   ╰──┬───╯
      │                        │
      ▼                        ▼
  (tear-drop shape)        (circle badge)
Size scales with magnitude: M3 = 12px, M5 = 18px, M7+ = 26px
Pulse animation on markers <1 hour old (ripple ring effect)
Cluster circles show count inside; break apart on zoom in
Cluster color inherits the highest magnitude within the group
Click → Popup Card
╭────────────────────────────╮
│ ● M 6.1  MAJOR             │
│────────────────────────────│
│ 📍 Northwest of Honshu,    │
│    Japan                   │
│ 🕐 Today, 14:32 UTC        │
│ 📏 Depth: 42 km            │
│────────────────────────────│
│         [View Details →]   │
╰────────────────────────────╯
Closes on outside click or Escape key
"View Details" links to detail panel / external USGS page
Popup anchors above marker, shifts if near viewport edge
Hover Tooltip
╭─────────────────────╮
│ M 4.3 · 3 hrs ago   │
╰─────────────────────╯
Lightweight, no shadow, appears after 200ms hover delay
Dismissed immediately on mouse leave
5. List View (Secondary Panel / Full Replace on Mobile)
┌─────────────────────────────────────────────────────────────────┐
│  EARTHQUAKE EVENTS (1,284)              [Sort: Recent ▾]        │
│─────────────────────────────────────────────────────────────────│
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ ●  M 7.2    Northwest Honshu, Japan         2h 14m ago   │   │
│ │             Depth: 35 km                    [→ Map]       │   │
│ └───────────────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ ●  M 4.8    Central Italy                   5h 02m ago   │   │
│ │             Depth: 12 km                    [→ Map]       │   │
│ └───────────────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ ●  M 2.6    Southern California, USA        8h 30m ago   │   │
│ │             Depth: 8 km                     [→ Map]       │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    [ Load more... ]                             │
└─────────────────────────────────────────────────────────────────┘
List Item Anatomy
[Color Dot]  [M Value]  [Location Name]          [Relative Time]
             [Bold]     [Secondary text]          [→ Map Button]
                        [Depth sub-label]
Color dot — matches magnitude color coding (green/yellow/red)
M value — bold, larger font, color-coded
Location — primary text weight
Time — right-aligned, relative ("3h ago"), tooltip shows absolute UTC
Map button — appears on hover or focus; zooms map to event, switches to map view on mobile
Hover state — subtle row highlight, slight left border accent
Infinite scroll with virtual rendering (only DOM-render visible rows)
Sort options: Most Recent · Highest Magnitude · Nearest (if location active)
6. Color Palette
Light Theme
Token	Hex	Usage
bg-primary	#F8F9FA	Page background
bg-surface	#FFFFFF	Cards, sidebar, panels
bg-overlay	#F1F3F5	Input fields, stat cards
border	#DEE2E6	Dividers, card borders
text-primary	#1A1D23	Headings, values
text-secondary	#6C757D	Labels, sub-text
accent-blue	#1A73E8	Links, active states, buttons
accent-blue-light	#E8F0FE	Button hover backgrounds
header-bg	#FFFFFF	Top bar
shadow	rgba(0,0,0,0.08)	Card elevation
Dark Theme
Token	Hex	Usage
bg-primary	#0F1117	Page background
bg-surface	#1A1D2E	Cards, sidebar, panels
bg-overlay	#252836	Input fields, stat cards
border	#2D3148	Dividers, card borders
text-primary	#E8EAED	Headings, values
text-secondary	#9AA0B1	Labels, sub-text
accent-blue	#4F8EF7	Links, active states, buttons
accent-blue-light	#1C2A4A	Button hover backgrounds
header-bg	#13151F	Top bar
shadow	rgba(0,0,0,0.4)	Card elevation
Magnitude Color Scale
Range	Color Name	Light Hex	Dark Hex	Meaning
< 3.0	Sage Green	#2ECC71	#27AE60	Minor — informational
3.0 – 4.9	Amber	#F39C12	#E67E22	Moderate — attention
5.0 – 6.9	Coral Red	#E74C3C	#C0392B	Strong — warning
7.0+	Deep Crimson	#922B21	#FF4444	Major — critical
Map Tile Styles
Light: Azure Maps Road (light) or Mapbox Light
Dark: Azure Maps Night / Mapbox Dark
Satellite: Azure Maps Aerial (optional toggle)
Marker colors maintain contrast on all tile styles; white stroke border on dark tiles, dark stroke on light tiles
7. Component Hierarchy
<App>
├── <ThemeProvider>           — CSS variable injection, theme context
├── <Header>
│   ├── <Logo>
│   ├── <GlobalSearch>        — location autocomplete
│   ├── <LiveIndicator>       — pulsing dot + status
│   ├── <RefreshButton>
│   ├── <ThemeToggle>
│   └── <SidebarToggle>       — mobile/tablet only
│
├── <AppLayout>
│   ├── <Sidebar>
│   │   ├── <FilterSection>
│   │   │   ├── <DateRangePicker>
│   │   │   ├── <MagnitudeRangeSlider>
│   │   │   └── <LocationFilter>
│   │   ├── <ViewToggle>      — Map / List
│   │   ├── <SummaryStats>
│   │   │   ├── <StatCard total />
│   │   │   ├── <StatCard highest />
│   │   │   └── <StatCard recent />
│   │   └── <Legend>
│   │
│   └── <MainContent>
│       ├── <MapView>         — shown when view = "map"
│       │   ├── <AzureMap>    — base map instance
│       │   ├── <MarkerLayer> — clustered + individual
│       │   ├── <PopupCard>   — click-triggered
│       │   ├── <HoverTooltip>
│       │   ├── <MapControls>
│       │   │   ├── <ZoomControls>
│       │   │   ├── <StyleSwitcher>
│       │   │   └── <HeatmapToggle>
│       │   └── <HeatmapLayer>  — optional overlay
│       │
│       └── <ListView>        — shown when view = "list"
│           ├── <ListHeader>  — count + sort control
│           ├── <VirtualList>
│           │   └── <EarthquakeListItem> × N
│           └── <LoadMoreTrigger>  — intersection observer
│
└── <StatusBar>
    ├── <LastUpdated>
    ├── <DataSourceCredit>
    └── <ConnectionStatus>
8. UX Interaction Flows
Filter → Map Update Flow
User adjusts filter
       ↓
Debounce (400ms)
       ↓
Query fires → Loading skeleton on map
       ↓
Markers update (fade-in transition, 200ms)
       ↓
Summary stats recount (animated number tick)
Map Marker → Detail Flow
Click marker
       ↓
Map pans/zooms to center marker (smooth, 300ms)
       ↓
Popup appears (scale-up animation, 150ms)
       ↓
"View Details" → Detail drawer slides in from right
                  OR opens external link in new tab
Theme Switch Flow
Click theme toggle
       ↓
CSS variables swap (transition: all 200ms ease)
       ↓
Map tile style changes (crossfade, 300ms)
       ↓
Preference persisted to localStorage
9. Accessibility Design
Requirement	Implementation
Color not sole indicator	All magnitude dots have text label (M value) alongside
Keyboard navigation	Tab order: Header → Sidebar → Map/List; Arrow keys navigate list
Map keyboard	+/- zoom, arrow keys pan, Enter to select focused marker
Screen reader	All markers have aria-label="Magnitude 6.1 earthquake, Japan, 2 hours ago"
Focus indicators	2px solid accent-blue outline on all interactive elements
High contrast mode	Detected via prefers-contrast: more — borders thickened, colors maximized
Reduced motion	prefers-reduced-motion disables pulse animations and transitions
Skip links	"Skip to map" / "Skip to list" at top of page
Form labels	All filter inputs have visible <label> elements (not just placeholder)
10. Performance Strategy
Challenge	Strategy
Large marker datasets (10k+)	Cluster at zoom <8; only render visible viewport markers
List rendering	Virtual scroll — render only ~20 visible rows at a time
Filter responsiveness	Debounce inputs 400ms; show stale data with loading overlay rather than blank
Initial load	Load map shell first; stream earthquake data in background
Image/tile loading	Lazy-load map tiles; prefetch adjacent tiles on pan
Real-time updates	WebSocket or 30s polling; diff-patch markers (add/remove only changed)
Re-renders	Memo-ize list items; only re-render markers whose data changed
11. Status Bar (Bottom Strip)
┌─────────────────────────────────────────────────────────────────┐
│  Source: USGS Earthquake Feed    Last updated: 14:32 UTC   ● Live│
└─────────────────────────────────────────────────────────────────┘
Height: 28px
Font size: 11px, secondary text color
Live dot: green pulse when connected, amber when >5min stale, red when offline
Clicking "Last updated" triggers manual refresh
12. Mobile Layout (< 768px)
┌───────────────────────┐
│  🌍 QuakePulse  [≡]   │  ← slim header (48px)
├───────────────────────┤
│                       │
│                       │
│   FULL-SCREEN MAP     │
│       (fills          │
│     viewport)         │
│                       │
│                       │
├───────────────────────┤
│  [🗺 Map] [☰ List]    │  ← sticky tab bar (52px)
└───────────────────────┘
        ↕ swipe up
┌───────────────────────┐
│  ▬  (drag handle)     │
│  BOTTOM SHEET         │
│  ┌─ FILTERS ─────┐    │
│  │ Date range     │    │
│  │ Magnitude      │    │
│  │ Location       │    │
│  └────────────────┘    │
│  SUMMARY STATS         │
│  LEGEND                │
└───────────────────────┘
Bottom sheet: peek at 30% height by default, drag to 85%
Map remains live behind the sheet (visible in top 15%)
Tap a list item → sheet collapses, map zooms to event
13. Wireframe Summary (Full Desktop)
┌──────────────────────────────────────────────────────────────────────┐
│  🌍 QuakePulse      [  Search location...  ]     [↻ Live ●] [☀] [≡] │
├──────────────────┬───────────────────────────────────────────────────┤
│                  │ [+]                                                │
│  FILTERS         │ [-]           ●④          ●                       │
│  ─────────────   │ [⊡]      ●③    ●●②                                │
│  📅 Date Range   │                    ●①                             │
│  [────][────]    │          ●                    ●                   │
│                  │   ●           ●③        ●②                        │
│  📊 Magnitude    │                  ●                                │
│  ●──────────○    │                                     ●             │
│  2.0       9.0   │                                                   │
│                  │                                                   │
│  📍 Location     ├───────────────────────────────────────────────────│
│  [Search...]     │ [🗺 Standard][🌑 Dark][🔥 Heat]       [⊞ Cluster]│
│                  └───────────────────────────────────────────────────┤
│  VIEW            │                                                   │
│  [MAP]  [LIST]   │  (List view replaces map when toggled)            │
│                  │                                                   │
│  ─────────────   │                                                   │
│  SUMMARY         │                                                   │
│  ┌────────────┐  │                                                   │
│  │ Total 1,284│  │                                                   │
│  │ High  M7.2 │  │                                                   │
│  │ Last  2min │  │                                                   │
│  └────────────┘  │                                                   │
│                  │                                                   │
│  LEGEND          │                                                   │
│  ● <3  Minor     │                                                   │
│  ● 3-5 Moderate  │                                                   │
│  ● >5  Major     │                                                   │
│                  │                                                   │
├──────────────────┴───────────────────────────────────────────────────┤
│  Source: USGS     Last updated: 14:32 UTC                      ● Live│
└──────────────────────────────────────────────────────────────────────┘
Design Principles Summary
Map-first — the map owns 75%+ of the viewport; UI chrome steps back
Data density without clutter — stats and filters visible without overwhelming
Progressive disclosure — tooltip → popup → detail panel as user engagement deepens
Consistent magnitude language — green/yellow/red reinforced everywhere (dots, sliders, cards)
Theme cohesion — both themes are equally polished; dark is not an afterthought
Accessible by default — color is decorative, not the only signal
Resilient UX — stale data shown with indicator rather than blank state; errors explained clearly
Please implement the same at C:\Users\349300\OneDrive - Cognizant\U2A_2026\ph-3\Source\Claude\QuakePulse_WebUI