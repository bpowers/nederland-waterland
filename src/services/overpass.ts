import m, { buildQueryString } from 'mithril';
import osmtogeojson from 'osmtogeojson';
import { FeatureCollection, GeometryObject, GeoJsonProperties } from 'geojson';

/** Query the Overpass API */
const url = 'https://z.overpass-api.de/api/interpreter';

/**
 * Query constructor
 * bbox: lat/lon of bottom left and top right
 */
const query = (boundingBox: [number, number, number, number]) => {
  const bbox = boundingBox.join(',');
  return buildQueryString({
    data: `[out:json][timeout:30];
  (
    way["natural"="water"](${bbox});
    relation["natural"="water"](${bbox});
  );
  out body;
  >;
  out skel qt; 
  `,
  });
};

/**
 * Query Overpass to get OSM data
 * bbox: lat/lon of bottom left and top right
 */
export const overpass = async (
  bbox: [number, number, number, number]
): Promise<FeatureCollection<GeometryObject, GeoJsonProperties> | undefined> => {
  const body = query(bbox);
  const result = await m
    .request<any>({
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      url,
      body,
      serialize: (b: any) => b,
    })
    .catch(console.error);
  return result ? (osmtogeojson(result) as FeatureCollection<GeometryObject, GeoJsonProperties>) : undefined;
};
