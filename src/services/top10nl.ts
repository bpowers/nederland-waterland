import m from 'mithril';
import { FeatureCollection, GeometryObject, GeoJsonProperties } from 'geojson';

// https://basisregistraties.arcgisonline.nl/arcgis/rest/services/BGT/BGT_objecttypen/FeatureServer/47/query?where=1%3D1&outFields=*&geometry=5.481%2C51.467%2C5.517%2C51.472&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=json
// 5.481%2C51.467%2C5.517%2C51.472
const createUrl = (bbox: number[]) =>
  `https://basisregistraties.arcgisonline.nl/arcgis/rest/services/BGT/BGT_objecttypen/FeatureServer/47/query?where=1%3D1&outFields=*&geometry=${bbox.join(
    '%2C'
  )}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&&f=geojson`;

/**
 * Query ESRI TOP10NL to get OSM data
 * bbox: lat/lon of bottom left and top right
 */
export const top10nl = async (
  bbox: [number, number, number, number]
): Promise<FeatureCollection<GeometryObject, GeoJsonProperties> | undefined> => {
  const [a, b, c, d] = bbox;
  const boundingBox = [b, a, d, c]; // swap lat/lon
  const url = createUrl(boundingBox);
  const result = await m
    .request<any>({
      url,
      serialize: (b: any) => b,
    })
    .catch(console.error);
  return result as FeatureCollection<GeometryObject, GeoJsonProperties>;
};
