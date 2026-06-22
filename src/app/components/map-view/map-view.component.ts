import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, NgZone
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import maplibregl, { Map as MapLibreMap, GeoJSONSource, LngLatBounds, MapMouseEvent, MapGeoJSONFeature, StyleSpecification } from 'maplibre-gl';
import type { Feature, Point } from 'geojson';

import { EarthquakeService } from '../../services/earthquake.service';
import { ThemeService } from '../../services/theme.service';
import { AppStateService } from '../../services/app-state.service';
import { Earthquake, MapStyle } from '../../models/earthquake.model';

/**
 * Map renderer powered by MapLibre GL JS + OpenFreeMap public tiles.
 *
 * Why MapLibre over Azure Maps:
 *   - Zero authentication (no subscription key required)
 *   - Free OpenStreetMap-based vector tiles via OpenFreeMap
 *   - Same vector-tile engine lineage as Azure Maps → identical
 *     style-expression syntax for clustering, bubble layers, heatmap
 *   - Maintains every UX feature of the previous Azure Maps implementation
 *     (clustering, popups, heatmap, theme sync, programmatic zoom)
 */

// ── Tile-style URLs (no signup, no key) ─────────────────────────
const STYLE_URLS: Record<MapStyle, string | StyleSpecification> = {
  road:  'https://tiles.openfreemap.org/styles/liberty',
  night: 'https://tiles.openfreemap.org/styles/fiord',
  satellite_road_labels: {
    version: 8,
    sources: {
      'esri-imagery': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics'
      }
    },
    layers: [{ id: 'satellite', type: 'raster', source: 'esri-imagery' }]
  }
};

const SOURCE_ID = 'quakes';
// Separate, NON-clustered source feeding the heatmap. A clustered source
// replaces raw points with aggregated cluster features (which carry no
// `magnitude`), so a heatmap bound to it renders a sparse scatter with
// zero weight. The heatmap needs every raw point.
const SOURCE_RAW = 'quakes-raw';
const LAYER_CLUSTERS = 'clusters';
const LAYER_CLUSTER_LABELS = 'cluster-labels';
const LAYER_POINTS = 'quake-points';

// heatmap-color can ONLY be driven by ['heatmap-density'] — never by a feature
// property like magnitude. So a single heatmap cannot colour by magnitude
// category; a dense cluster of MINOR quakes would still hit the hot (red) end
// of any ramp, contradicting the legend. Instead we stack one single-hue
// heatmap per legend band, each filtered to its magnitude range: colour now
// encodes the band (matching the legend) and shade encodes density within it.
interface HeatmapBand { id: string; filter: any; color: any; }
const HEATMAP_BANDS: HeatmapBand[] = [
  {
    id: 'heatmap-minor',
    filter: ['<', ['get', 'magnitude'], 3],
    color: ['interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(46,204,113,0)', 0.2, '#abebc6', 0.4, '#82e0aa', 0.6, '#52be80', 0.8, '#27ae60', 1, '#1e8449']
  },
  {
    id: 'heatmap-moderate',
    filter: ['all', ['>=', ['get', 'magnitude'], 3], ['<', ['get', 'magnitude'], 5]],
    color: ['interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(243,156,18,0)', 0.2, '#fad7a0', 0.4, '#f8c471', 0.6, '#f5b041', 0.8, '#f39c12', 1, '#b9770e']
  },
  {
    id: 'heatmap-strong',
    filter: ['all', ['>=', ['get', 'magnitude'], 5], ['<', ['get', 'magnitude'], 7]],
    color: ['interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(231,76,60,0)', 0.2, '#f5b7b1', 0.4, '#f1948a', 0.6, '#ec7063', 0.8, '#e74c3c', 1, '#b03a2e']
  },
  {
    id: 'heatmap-major',
    filter: ['>=', ['get', 'magnitude'], 7],
    color: ['interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(146,43,33,0)', 0.2, '#d98880', 0.4, '#cd6155', 0.6, '#a93226', 0.8, '#922b21', 1, '#641e16']
  }
];
const HEATMAP_LAYER_IDS = HEATMAP_BANDS.map(b => b.id);

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

  mapReady = false;
  heatmapEnabled = false;
  loading$!: Observable<boolean>;
  selectedStyle: MapStyle = 'road';
  initError: string | null = null;

  private map!: MapLibreMap;
  private mapInitialized = false;
  private currentFeatures: Feature[] = [];
  private popup!: maplibregl.Popup;
  private resizeObserver?: ResizeObserver;
  private destroy$ = new Subject<void>();

  constructor(
    private earthquakeService: EarthquakeService,
    private themeService: ThemeService,
    private stateService: AppStateService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loading$ = this.earthquakeService.loading$;
  }

  ngAfterViewInit(): void {
    if (this.mapInitialized) return;       // hard guard — load only once
    this.mapInitialized = true;
    this.initMap();
  }

  // ── Map bootstrap ────────────────────────────────────────────

  private initMap(): void {
    try {
      this.selectedStyle = this.themeService.isDark ? 'night' : 'road';

      // Create + run the map entirely outside Angular's zone. MapLibre drives
      // an internal requestAnimationFrame loop for every pan/zoom/drag; inside
      // the zone each frame would trigger a full app change-detection cycle.
      // Outside the zone, gestures repaint the canvas with zero CD churn.
      // Handlers that touch Angular state re-enter via ngZone.run() (see below).
      this.ngZone.runOutsideAngular(() => {
        this.map = new maplibregl.Map({
          container: this.mapContainerRef.nativeElement,
          style: STYLE_URLS[this.selectedStyle],
          center: [0, 20],
          zoom: 2,
          minZoom: 1,                    // keep one world copy filling the viewport
          renderWorldCopies: false,      // ← stops the horizontal world duplication
          attributionControl: { compact: true }
        });

        this.popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: '280px',
          offset: 14,
          className: 'qp-map-popup'
        });

        this.map.on('load', () => {
          this.installDataLayers();
          this.wireMapEvents();
          this.subscribeToData();
          this.subscribeToTheme();
          this.subscribeToZoom();
          this.observeContainerResize();
          this.mapReady = true;
          // detectChanges() (not markForCheck) because we're outside the zone:
          // there is no pending tick to schedule, so render synchronously.
          this.cdr.detectChanges();
        });

        this.map.on('error', (e) => {
          console.error('[MapView] MapLibre error', e?.error ?? e);
        });
      });
    } catch (err: any) {
      this.initError = err?.message ?? 'Failed to initialise map';
      console.error('[MapView] init failed', err);
    }
  }

  /**
   * Add the GeoJSON source + four data-driven layers (clusters, cluster
   * labels, individual points, heatmap). Replays current features so
   * data is preserved across map.setStyle() calls.
   */
  private installDataLayers(): void {
    this.map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: this.currentFeatures },
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 14,
      clusterProperties: { maxMag: ['max', ['get', 'magnitude']] }
    });

    // Non-clustered twin of the data, used only by the heatmap so every raw
    // point contributes to the density field (clustered sources cannot).
    this.map.addSource(SOURCE_RAW, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: this.currentFeatures }
    });

    // One single-hue heatmap per magnitude band (hidden by default). Each is
    // filtered to its range and bound to the raw source, so colour matches the
    // legend category and shade reflects density within that category. Added
    // minor→major so stronger bands paint on top where they overlap.
    const heatPaintCommon = {
      // Within a narrow band magnitude barely varies, so weight is ~density of
      // events; a slight ramp still nudges the higher end of each band up.
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'magnitude'], 0, 0.6, 7, 1.0],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 4, 12, 9, 25, 14, 45],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0.85, 15, 0.3]
    };
    for (const band of HEATMAP_BANDS) {
      this.map.addLayer({
        id: band.id,
        type: 'heatmap',
        source: SOURCE_RAW,
        maxzoom: 15,
        filter: band.filter,
        layout: { visibility: this.heatmapEnabled ? 'visible' : 'none' },
        paint: { ...heatPaintCommon, 'heatmap-color': band.color }
      } as any);
    }

    // Cluster circles
    this.map.addLayer({
      id: LAYER_CLUSTERS,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: { visibility: this.heatmapEnabled ? 'none' : 'visible' },
      paint: {
        'circle-radius': ['step', ['get', 'point_count'], 22, 10, 32, 50, 42],
        'circle-color': [
          'step', ['get', 'maxMag'],
          '#2ECC71', 3,
          '#F39C12', 5,
          '#E74C3C', 7,
          '#922B21'
        ],
        'circle-stroke-color': 'rgba(255,255,255,0.55)',
        'circle-stroke-width': 2
      }
    });

    // Cluster count labels
    this.map.addLayer({
      id: LAYER_CLUSTER_LABELS,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12,
        'text-offset': [0, 0.05],
        'text-allow-overlap': true,
        visibility: this.heatmapEnabled ? 'none' : 'visible'
      },
      paint: { 'text-color': '#ffffff' }
    });

    // Individual earthquake points
    this.map.addLayer({
      id: LAYER_POINTS,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      layout: { visibility: this.heatmapEnabled ? 'none' : 'visible' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 1, 5, 5, 10, 8, 18],
        'circle-color': [
          'case',
          ['<', ['get', 'magnitude'], 3], '#2ECC71',
          ['<', ['get', 'magnitude'], 5], '#F39C12',
          ['<', ['get', 'magnitude'], 7], '#E74C3C',
          '#922B21'
        ],
        'circle-stroke-color': 'rgba(255,255,255,0.85)',
        'circle-stroke-width': 1.5
      }
    });
  }

  private wireMapEvents(): void {
    this.map.on('click', LAYER_POINTS, (e) => this.onMarkerClick(e));
    this.map.on('click', LAYER_CLUSTERS, (e) => this.onClusterClick(e));

    const canvas = this.map.getCanvas();
    this.map.on('mouseenter', LAYER_POINTS,   () => canvas.style.cursor = 'pointer');
    this.map.on('mouseleave', LAYER_POINTS,   () => canvas.style.cursor = '');
    this.map.on('mouseenter', LAYER_CLUSTERS, () => canvas.style.cursor = 'pointer');
    this.map.on('mouseleave', LAYER_CLUSTERS, () => canvas.style.cursor = '');
  }

  // ── Reactive subscriptions ───────────────────────────────────

  private subscribeToData(): void {
    this.earthquakeService.earthquakes$.pipe(takeUntil(this.destroy$)).subscribe(eqs => {
      this.currentFeatures = eqs.map<Feature>(eq => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [eq.coordinates.longitude, eq.coordinates.latitude, eq.depth ?? 0]
        },
        properties: { ...eq }
      }));

      const fc = { type: 'FeatureCollection' as const, features: this.currentFeatures };
      const src = this.map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (src) src.setData(fc);
      // Keep the heatmap's non-clustered source in sync too.
      const rawSrc = this.map.getSource(SOURCE_RAW) as GeoJSONSource | undefined;
      if (rawSrc) rawSrc.setData(fc);
    });
  }

  private subscribeToTheme(): void {
    this.themeService.theme$.pipe(takeUntil(this.destroy$)).subscribe(theme => {
      // Theme switch follows the user's app theme unless they've explicitly
      // chosen satellite (preserve user intent)
      if (this.selectedStyle === 'satellite_road_labels') return;
      const next: MapStyle = theme === 'dark' ? 'night' : 'road';
      if (next !== this.selectedStyle) {
        this.setMapStyle(next);
        this.cdr.markForCheck();   // selectedStyle changed programmatically (OnPush)
      }
    });
  }

  private subscribeToZoom(): void {
    this.stateService.zoomTo$.pipe(takeUntil(this.destroy$)).subscribe(eq => {
      if (!this.mapReady) return;
      // Triggered from inside the zone (list click). Run the animation outside
      // so its rAF frames don't each fire change detection.
      this.ngZone.runOutsideAngular(() => {
        this.popup.remove();
        this.map.easeTo({
          center: [eq.coordinates.longitude, eq.coordinates.latitude],
          zoom: 8,
          duration: 600
        });
        setTimeout(() => this.openPopupFor(eq), 700);
      });
    });
  }

  // ── Interaction handlers ─────────────────────────────────────

  private onMarkerClick(e: MapMouseEvent & { features?: MapGeoJSONFeature[] }): void {
    const feature = e.features?.[0];
    if (!feature) return;
    const eq = feature.properties as unknown as Earthquake;
    const coords = (feature.geometry as Point).coordinates as [number, number];
    this.openPopupFor(eq, coords);   // pure DOM — fine outside the zone
    // Map runs outside Angular; re-enter the zone so this state change
    // propagates change detection to other components (e.g. list selection).
    this.ngZone.run(() => this.stateService.selectEarthquake(eq));
  }

  private onClusterClick(e: MapMouseEvent & { features?: MapGeoJSONFeature[] }): void {
    const feature = e.features?.[0];
    if (!feature) return;
    const clusterId = feature.properties!['cluster_id'] as number;
    const coords = (feature.geometry as Point).coordinates as [number, number];

    const src = this.map.getSource(SOURCE_ID) as GeoJSONSource;
    src.getClusterExpansionZoom(clusterId).then(zoom => {
      this.ngZone.runOutsideAngular(() =>
        this.map.easeTo({ center: coords, zoom: zoom ?? (this.map.getZoom() + 2), duration: 400 }));
    }).catch(() => {
      this.ngZone.runOutsideAngular(() =>
        this.map.easeTo({ center: coords, zoom: this.map.getZoom() + 2, duration: 400 }));
    });
  }

  private openPopupFor(eq: Earthquake, pos?: [number, number]): void {
    const position = pos ?? [eq.coordinates.longitude, eq.coordinates.latitude];
    const magClass =
      eq.magnitude < 3 ? 'minor' :
      eq.magnitude < 5 ? 'moderate' :
      eq.magnitude < 7 ? 'strong' : 'major';
    const magLabel =
      eq.magnitude < 3 ? 'Minor' :
      eq.magnitude < 5 ? 'Moderate' :
      eq.magnitude < 7 ? 'Strong' : 'Major';
    const timeStr = new Date(eq.time).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });
    const depthStr = eq.depth != null ? `${eq.depth.toFixed(1)} km` : 'N/A';

    const html = `
      <div class="map-popup">
        <div class="popup-mag popup-mag--${magClass}">
          <span class="popup-mag-val">M ${eq.magnitude.toFixed(1)}</span>
          <span class="popup-mag-label">${magLabel}</span>
        </div>
        <div class="popup-body">
          <p class="popup-place">📍 ${this.escapeHtml(eq.place)}</p>
          <p class="popup-time">🕐 ${timeStr}</p>
          <p class="popup-depth">📏 Depth: ${depthStr}</p>
        </div>
        ${eq.url ? `<a class="popup-link" href="${eq.url}" target="_blank" rel="noopener">View Details →</a>` : ''}
      </div>`;

    this.popup.setLngLat(position).setHTML(html).addTo(this.map);
  }

  private escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  }

  // ── Public control actions (template-bound) ──────────────────

  setMapStyle(style: MapStyle): void {
    if (!this.map || this.selectedStyle === style) return;
    this.selectedStyle = style;

    // setStyle() wipes custom sources/layers — re-install on styledata.
    // NOTE: do NOT re-wire map events here. Layer-bound listeners are
    // registered on the map instance (keyed by layer ID) and survive
    // setStyle(), so the handlers from the initial wireMapEvents() call
    // still apply to the re-created layers. Re-wiring would stack
    // duplicate handlers → duplicate popups / repeated state updates.
    this.map.setStyle(STYLE_URLS[style] as any);
    this.map.once('styledata', () => {
      this.installDataLayers();
    });
  }

  toggleHeatmap(): void {
    if (!this.mapReady) return;
    this.heatmapEnabled = !this.heatmapEnabled;
    const heatVis = this.heatmapEnabled ? 'visible' : 'none';
    const pointsVis = this.heatmapEnabled ? 'none' : 'visible';
    for (const id of HEATMAP_LAYER_IDS) this.map.setLayoutProperty(id, 'visibility', heatVis);
    this.map.setLayoutProperty(LAYER_CLUSTERS,        'visibility', pointsVis);
    this.map.setLayoutProperty(LAYER_CLUSTER_LABELS,  'visibility', pointsVis);
    this.map.setLayoutProperty(LAYER_POINTS,          'visibility', pointsVis);
  }

  fitToData(): void {
    if (!this.mapReady || !this.currentFeatures.length) return;
    const bounds = new LngLatBounds();
    for (const f of this.currentFeatures) {
      const [lng, lat] = (f.geometry as Point).coordinates as [number, number];
      bounds.extend([lng, lat]);
    }
    this.ngZone.runOutsideAngular(() =>
      this.map.fitBounds(bounds, { padding: 60, duration: 500, maxZoom: 8 }));
  }

  zoomIn():  void { this.ngZone.runOutsideAngular(() => this.map?.zoomIn({  duration: 250 })); }
  zoomOut(): void { this.ngZone.runOutsideAngular(() => this.map?.zoomOut({ duration: 250 })); }

  // ── Mobile responsiveness ────────────────────────────────────

  private observeContainerResize(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) this.map.resize();
    });
    this.resizeObserver.observe(this.mapContainerRef.nativeElement);
  }

  // ── Cleanup ──────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeObserver?.disconnect();
    this.popup?.remove();
    this.map?.remove();
  }
}
