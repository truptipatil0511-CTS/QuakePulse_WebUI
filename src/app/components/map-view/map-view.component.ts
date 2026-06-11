import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, ChangeDetectorRef
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as atlas from 'azure-maps-control';
import { EarthquakeService } from '../../services/earthquake.service';
import { ThemeService } from '../../services/theme.service';
import { AppStateService } from '../../services/app-state.service';
import { Earthquake, MapStyle } from '../../models/earthquake.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss'],
  standalone: false
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

  mapReady = false;
  hasKey = !!environment.azureMapsKey;
  heatmapEnabled = false;
  loading$!: Observable<boolean>;
  selectedStyle: MapStyle = 'road';

  private map!: atlas.Map;
  private dataSource!: atlas.source.DataSource;
  private heatMapLayer!: atlas.layer.HeatMapLayer;
  private bubbleLayer!: atlas.layer.BubbleLayer;
  private clusterLayer!: atlas.layer.BubbleLayer;
  private clusterLabelLayer!: atlas.layer.SymbolLayer;
  private popup!: atlas.Popup;
  private destroy$ = new Subject<void>();

  constructor(
    private earthquakeService: EarthquakeService,
    private themeService: ThemeService,
    private stateService: AppStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading$ = this.earthquakeService.loading$;
  }

  ngAfterViewInit(): void {
    if (!this.hasKey) return;
    this.initMap();
  }

  private initMap(): void {
    this.map = new atlas.Map(this.mapContainerRef.nativeElement, {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: environment.azureMapsKey
      },
      center: [0, 20],
      zoom: 2,
      style: this.themeService.isDark ? 'night' : 'road',
      language: 'en-US',
      showFeedbackLink: false,
      showLogo: false
    });

    this.map.events.add('ready', () => {
      this.mapReady = true;
      this.setupLayers();
      this.setupPopup();
      this.subscribeToData();
      this.subscribeToZoom();
      this.cdr.detectChanges();
    });
  }

  private setupLayers(): void {
    this.dataSource = new atlas.source.DataSource('quakes', {
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 14,
      clusterProperties: {
        maxMag: ['max', ['get', 'magnitude']]
      }
    });
    this.map.sources.add(this.dataSource);

    // Cluster circles
    this.clusterLayer = new atlas.layer.BubbleLayer(this.dataSource, 'clusters', {
      radius: ['step', ['get', 'point_count'], 22, 10, 32, 50, 42],
      color: ['step', ['get', 'maxMag'],
        '#2ECC71', 3, '#F39C12', 5, '#E74C3C', 7, '#922B21'
      ],
      strokeColor: 'rgba(255,255,255,0.5)',
      strokeWidth: 2,
      filter: ['has', 'point_count']
    });

    // Cluster count labels
    this.clusterLabelLayer = new atlas.layer.SymbolLayer(this.dataSource, 'cluster-labels', {
      iconOptions: { image: 'none' },
      textOptions: {
        textField: ['get', 'point_count_abbreviated'],
        color: '#ffffff',
        font: ['StandardFont-Bold'],
        size: 12,
        offset: [0, 0.4]
      },
      filter: ['has', 'point_count']
    });

    // Individual earthquake bubbles
    this.bubbleLayer = new atlas.layer.BubbleLayer(this.dataSource, 'quake-points', {
      radius: ['interpolate', ['linear'], ['get', 'magnitude'], 1, 5, 5, 10, 8, 18],
      color: ['case',
        ['<', ['get', 'magnitude'], 3], '#2ECC71',
        ['<', ['get', 'magnitude'], 5], '#F39C12',
        ['<', ['get', 'magnitude'], 7], '#E74C3C',
        '#922B21'
      ],
      strokeColor: 'rgba(255,255,255,0.8)',
      strokeWidth: 1.5,
      filter: ['!', ['has', 'point_count']]
    });

    // Heatmap layer (hidden by default)
    this.heatMapLayer = new atlas.layer.HeatMapLayer(this.dataSource, 'heatmap', {
      weight: ['interpolate', ['linear'], ['get', 'magnitude'], 0, 0, 10, 1],
      intensity: 0.6,
      opacity: 0.8,
      radius: 30,
      visible: false
    });

    this.map.layers.add([this.heatMapLayer, this.clusterLayer, this.clusterLabelLayer, this.bubbleLayer]);

    // Events
    this.map.events.add('click', this.bubbleLayer, (e: atlas.MapMouseEvent) => this.onMarkerClick(e));
    this.map.events.add('click', this.clusterLayer, (e: atlas.MapMouseEvent) => this.onClusterClick(e));
    this.map.events.add('mousemove', this.bubbleLayer, () => { this.map.getCanvasContainer().style.cursor = 'pointer'; });
    this.map.events.add('mouseleave', this.bubbleLayer, () => { this.map.getCanvasContainer().style.cursor = ''; });
  }

  private setupPopup(): void {
    this.popup = new atlas.Popup({
      pixelOffset: [0, -12],
      closeButton: true,
      fillColor: 'transparent'
    });
    this.map.popups.add(this.popup);
  }

  private subscribeToData(): void {
    this.earthquakeService.earthquakes$.pipe(takeUntil(this.destroy$)).subscribe(eqs => {
      if (!this.dataSource) return;
      this.dataSource.clear();
      const features = eqs.map(eq =>
        new atlas.data.Feature(
          new atlas.data.Point([eq.coordinates.longitude, eq.coordinates.latitude]),
          { ...eq }
        )
      );
      this.dataSource.add(features);
    });

    this.themeService.theme$.pipe(takeUntil(this.destroy$)).subscribe(theme => {
      if (this.mapReady) this.map.setStyle({ style: theme === 'dark' ? 'night' : 'road' });
    });
  }

  private subscribeToZoom(): void {
    this.stateService.zoomTo$.pipe(takeUntil(this.destroy$)).subscribe(eq => {
      if (!this.mapReady) return;
      this.popup.close();
      this.map.setCamera({
        center: [eq.coordinates.longitude, eq.coordinates.latitude],
        zoom: 8,
        type: 'ease',
        duration: 600
      });
      setTimeout(() => this.openPopupFor(eq), 700);
    });
  }

  private onMarkerClick(e: atlas.MapMouseEvent): void {
    if (!e.shapes?.length) return;
    const shape = e.shapes[0] as atlas.Shape;
    const props = shape.getProperties() as Earthquake;
    const geo = shape.toJson().geometry as atlas.data.Point;
    this.openPopupFor(props, geo.coordinates as [number, number]);
    this.stateService.selectEarthquake(props);
  }

  private onClusterClick(e: atlas.MapMouseEvent): void {
    if (!e.shapes?.length) return;
    const cluster = e.shapes[0] as atlas.Shape;
    const geo = cluster.toJson().geometry as atlas.data.Point;
    this.map.setCamera({
      center: geo.coordinates as atlas.data.Position,
      zoom: (this.map.getCamera().zoom ?? 3) + 2,
      type: 'ease',
      duration: 400
    });
  }

  private openPopupFor(eq: Earthquake, pos?: [number, number]): void {
    const position = pos ?? [eq.coordinates.longitude, eq.coordinates.latitude];
    const magClass = eq.magnitude < 3 ? 'minor' : eq.magnitude < 5 ? 'moderate' : eq.magnitude < 7 ? 'strong' : 'major';
    const magLabel = eq.magnitude < 3 ? 'Minor' : eq.magnitude < 5 ? 'Moderate' : eq.magnitude < 7 ? 'Strong' : 'Major';
    const timeStr = new Date(eq.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    const depthStr = eq.depth != null ? `${eq.depth} km` : 'N/A';

    this.popup.setOptions({
      position,
      content: `
        <div class="map-popup">
          <div class="popup-mag popup-mag--${magClass}">
            <span class="popup-mag-val">M ${eq.magnitude.toFixed(1)}</span>
            <span class="popup-mag-label">${magLabel}</span>
          </div>
          <div class="popup-body">
            <p class="popup-place">📍 ${eq.place}</p>
            <p class="popup-time">🕐 ${timeStr}</p>
            <p class="popup-depth">📏 Depth: ${depthStr}</p>
          </div>
          ${eq.url ? `<a class="popup-link" href="${eq.url}" target="_blank" rel="noopener">View Details →</a>` : ''}
        </div>`
    });
    this.popup.open(this.map);
  }

  setMapStyle(style: MapStyle): void {
    this.selectedStyle = style;
    if (this.mapReady) this.map.setStyle({ style });
  }

  toggleHeatmap(): void {
    this.heatmapEnabled = !this.heatmapEnabled;
    if (this.mapReady && this.heatMapLayer) {
      this.heatMapLayer.setOptions({ visible: this.heatmapEnabled });
      this.bubbleLayer.setOptions({ visible: !this.heatmapEnabled });
      this.clusterLayer.setOptions({ visible: !this.heatmapEnabled });
      this.clusterLabelLayer.setOptions({ visible: !this.heatmapEnabled });
    }
  }

  fitToData(): void {
    if (!this.mapReady || !this.dataSource) return;
    const shapes = this.dataSource.getShapes();
    if (!shapes.length) return;
    const positions = shapes.map(s => (s.toJson().geometry as atlas.data.Point).coordinates as atlas.data.Position);
    const bbox = atlas.data.BoundingBox.fromPositions(positions);
    this.map.setCamera({ bounds: bbox, padding: 60, type: 'ease', duration: 500 });
  }

  zoomIn(): void { if (this.mapReady) this.map.setCamera({ zoom: (this.map.getCamera().zoom ?? 3) + 1, type: 'ease', duration: 300 }); }
  zoomOut(): void { if (this.mapReady) this.map.setCamera({ zoom: (this.map.getCamera().zoom ?? 3) - 1, type: 'ease', duration: 300 }); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) this.map.dispose();
  }
}
