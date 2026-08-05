import L from "leaflet";

/**
 * Leaflet resolves its default marker images relative to the CSS file, which
 * breaks under bundled assets. Point the icons at the CDN copies instead.
 * Call once from any client-only map component.
 */
export function fixDefaultMarkerIcons(): void {
  const proto = L.Icon.Default.prototype as L.Icon.Default & {
    _getIconUrl?: () => string;
  };
  delete proto._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}
