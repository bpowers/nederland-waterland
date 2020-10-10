declare module '@turf/centroid' {
  import { Feature, Point } from 'geojson';

  const centroid: (f: Feature) => Feature<Point>;
  export default centroid;
}
