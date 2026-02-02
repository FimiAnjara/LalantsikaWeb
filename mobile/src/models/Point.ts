/**
 * Interface représentant un point géographique
 */
export interface Point {
  id_point?: number;
  latitude: number;
  longitude: number;
}

/**
 * Interface pour les coordonnées GeoJSON (compatible avec PostGIS GEOGRAPHY)
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Convertir Point en GeoJSON
 */
export const pointToGeoJSON = (point: Point): GeoPoint => {
  return {
    type: 'Point',
    coordinates: [point.longitude, point.latitude]
  };
};

/**
 * Convertir GeoJSON en Point
 */
export const geoJSONToPoint = (geoPoint: GeoPoint, id_point?: number): Point => {
  return {
    id_point,
    latitude: geoPoint.coordinates[1],
    longitude: geoPoint.coordinates[0]
  };
};

/**
 * Formater les coordonnées pour l'affichage
 */
export const formatCoordinates = (point: Point): string => {
  return `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
};

/**
 * Calculer la distance entre deux points (en km)
 * Utilise la formule de Haversine
 */
export const calculateDistance = (point1: Point, point2: Point): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);
