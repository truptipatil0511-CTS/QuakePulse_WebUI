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