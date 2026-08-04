import type { ObservedTraceLine, VehicleMarker, ZappMapProvider } from "./types";

type MapLibreModule = typeof import("maplibre-gl");
type MapLibreMap = import("maplibre-gl").Map;
type MapLibreMarker = import("maplibre-gl").Marker;

export class MapLibreProvider implements ZappMapProvider {
  providerId = "maplibre";
  capabilities = {
    markers: true,
    clustering: true,
    routeLines: true,
    geofences: true,
    replay: true,
    observedTrace: true,
    fitBounds: true,
    offlineRegions: "not_configured" as const,
  };
  private map: MapLibreMap | null = null;
  private maplibre: MapLibreModule | null = null;
  private markers = new Map<string, MapLibreMarker>();
  private latestCoordinates: Array<[number, number]> = [];
  private clusteredSelection: ((id: string) => void) | null = null;
  private clusterHandlersInstalled = false;

  async initialize(
    container: HTMLElement,
    options: { styleUrl: string; center: [number, number]; zoom: number; signal?: AbortSignal },
  ) {
    if (this.map) return;
    this.maplibre = await import("maplibre-gl");
    if (options.signal?.aborted) return;
    this.map = new this.maplibre.Map({
      container,
      style: options.styleUrl,
      center: options.center,
      zoom: options.zoom,
      attributionControl: { compact: true },
    });
    this.map.addControl(
      new this.maplibre.NavigationControl({ visualizePitch: false }),
      "top-right",
    );
    await new Promise<void>((resolve) => {
      this.map?.once("load", () => resolve());
    });
    if (options.signal?.aborted) this.destroy();
  }

  destroy() {
    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();
    this.map?.remove();
    this.map = null;
    this.latestCoordinates = [];
    this.clusteredSelection = null;
    this.clusterHandlersInstalled = false;
  }

  updateActiveVehicleMarkers(markers: VehicleMarker[], onSelect: (id: string) => void) {
    if (!this.map || !this.maplibre) return;
    this.latestCoordinates = markers.map((marker) => [marker.longitude, marker.latitude]);
    if (markers.length >= 50) {
      this.markers.forEach((marker) => marker.remove());
      this.markers.clear();
      this.updateClusterLayer(markers, onSelect);
      return;
    }
    this.clearClusterLayer();
    const activeIds = new Set(markers.map((marker) => marker.id));
    for (const [id, marker] of this.markers) {
      if (!activeIds.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }
    for (const marker of markers) {
      const popupHtml = `<strong>${escapeHtml(marker.registration)}</strong><br/>${escapeHtml(marker.driverName)} · ${escapeHtml(marker.jobReference)}<br/>${escapeHtml(marker.latestLocationAge)} · ${marker.speedKph === null ? "speed unavailable" : `${Math.round(marker.speedKph)} km/h`}<br/>${escapeHtml(marker.qualityStatus)} · ${escapeHtml(marker.trackingState)}`;
      const existing = this.markers.get(marker.id);
      if (existing) {
        existing.setLngLat([marker.longitude, marker.latitude]);
        existing.setPopup(new this.maplibre.Popup({ offset: 18 }).setHTML(popupHtml));
        continue;
      }
      const element = document.createElement("button");
      element.type = "button";
      element.className =
        "h-5 w-5 rounded-full border-2 border-white bg-primary shadow-lg outline-none ring-2 ring-primary/40";
      element.setAttribute("aria-label", `Select ${marker.registration}`);
      element.addEventListener("click", () => onSelect(marker.id));
      const next = new this.maplibre.Marker({ element })
        .setLngLat([marker.longitude, marker.latitude])
        .setPopup(new this.maplibre.Popup({ offset: 18 }).setHTML(popupHtml))
        .addTo(this.map);
      this.markers.set(marker.id, next);
    }
  }

  private updateClusterLayer(markers: VehicleMarker[], onSelect: (id: string) => void) {
    if (!this.map) return;
    this.clusteredSelection = onSelect;
    const data = {
      type: "FeatureCollection" as const,
      features: markers.map((marker) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [marker.longitude, marker.latitude],
        },
        properties: { id: marker.id, registration: marker.registration },
      })),
    };
    const existing = this.map.getSource("active-vehicle-clusters") as
      { setData: (next: unknown) => void } | undefined;
    if (existing) {
      existing.setData(data);
      return;
    }
    this.map.addSource("active-vehicle-clusters", {
      type: "geojson",
      data,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 48,
    });
    this.map.addLayer({
      id: "vehicle-clusters",
      type: "circle",
      source: "active-vehicle-clusters",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#2563eb",
        "circle-radius": ["step", ["get", "point_count"], 18, 100, 24, 250, 30],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
    this.map.addLayer({
      id: "vehicle-cluster-count",
      type: "symbol",
      source: "active-vehicle-clusters",
      filter: ["has", "point_count"],
      layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
      paint: { "text-color": "#ffffff" },
    });
    this.map.addLayer({
      id: "unclustered-vehicles",
      type: "circle",
      source: "active-vehicle-clusters",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#2563eb",
        "circle-radius": 7,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
    if (!this.clusterHandlersInstalled) {
      this.map.on("click", "unclustered-vehicles", (event) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === "string") this.clusteredSelection?.(id);
      });
      this.clusterHandlersInstalled = true;
    }
  }

  private clearClusterLayer() {
    if (!this.map) return;
    for (const id of ["vehicle-cluster-count", "vehicle-clusters", "unclustered-vehicles"])
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    if (this.map.getSource("active-vehicle-clusters"))
      this.map.removeSource("active-vehicle-clusters");
  }

  renderObservedTrace(trace: ObservedTraceLine | null) {
    if (!this.map) return;
    if (!trace || trace.points.length < 2) {
      this.clearTrace();
      return;
    }
    const source = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: trace.points.map((point) => [point.longitude, point.latitude]),
      },
      properties: {},
    };
    if (this.map.getSource("observed-trace")) {
      (
        this.map.getSource("observed-trace") as unknown as { setData: (data: unknown) => void }
      ).setData(source);
    } else {
      this.map.addSource("observed-trace", { type: "geojson", data: source });
      this.map.addLayer({
        id: "observed-trace-line",
        type: "line",
        source: "observed-trace",
        paint: {
          "line-color": "#f5c542",
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });
    }
  }

  clearTrace() {
    if (!this.map) return;
    if (this.map.getLayer("observed-trace-line")) this.map.removeLayer("observed-trace-line");
    if (this.map.getSource("observed-trace")) this.map.removeSource("observed-trace");
  }

  fitBounds() {
    if (!this.map || !this.maplibre) return;
    const coordinates = this.latestCoordinates;
    if (coordinates.length === 0) return;
    const bounds = coordinates.reduce(
      (next, coordinate) => next.extend(coordinate),
      new this.maplibre.LngLatBounds(coordinates[0], coordinates[0]),
    );
    this.map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 500 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}
