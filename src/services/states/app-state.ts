import m from 'mithril';
import Stream from 'mithril/stream';
import { IAppModel, UpdateStream } from '../meiosis';
import { IZiekenhuis } from '../../models/ziekenhuis';
import ziekenhuizen from '../../data/ziekenhuizen.json';
import verzorgingshuizen from '../../data/verzorgingshuizen.json';
import ggz from '../../data/ggz.json';
import ghz from '../../data/ghz.json';
import vvt from '../../data/vvt.json';
import { createBoundingBox, createIcon, processWater, ziekenhuisIconX } from '../../utils';
import { FeatureCollection, Feature, Point } from 'geojson';
import { top10nl } from '..';

// Add curline
ziekenhuizen.features = ziekenhuizen.features.map((z: any) => ({
  ...z,
  properties: {
    ...z.properties,
    active: true,
  },
}));

/** Application state */

export interface IAppStateModel {
  app: Partial<{
    water?: FeatureCollection;
    vvt: FeatureCollection<Point>;
    ggz: FeatureCollection<Point>;
    ghz: FeatureCollection<Point>;
    /** Bounding box size */
    size: number;
    selectedItem: Feature<Point>;
    selectedWaterItem: Feature;
    verzorgingshuizen: FeatureCollection<Point>;
    hospitals: FeatureCollection<Point, IZiekenhuis>;
  }>;
}

export interface IAppStateActions {
  selectFeature: (f: Feature<Point>) => void;
  selectWaterFeature: (f: Feature) => void;
  toggleHospitalActivity: (id: number, layer?: L.GeoJSON) => void;
  setBoundingBoxSizeInMeter: (size: number) => void;
}

export interface IAppState {
  initial: IAppStateModel;
  actions: (us: UpdateStream, states: Stream<IAppModel>) => IAppStateActions;
}

export const appStateMgmt = {
  initial: {
    app: {
      size: 5000,
      vvt,
      ggz,
      ghz,
      verzorgingshuizen,
      hospitals: ziekenhuizen as GeoJSON.FeatureCollection<GeoJSON.Point, IZiekenhuis>,
      baseline: (ziekenhuizen as GeoJSON.FeatureCollection<GeoJSON.Point, IZiekenhuis>).features.reduce(
        (acc, cur) => {
          return [acc[0] + cur.properties.t25, acc[1] + cur.properties.t30, acc[2] + cur.properties.tOv] as [
            number,
            number,
            number
          ];
        },
        [0, 0, 0] as [number, number, number]
      ),
      isSearching: false,
      searchQuery: '',
    },
  } as IAppStateModel,
  actions: (update, states): IAppStateActions => {
    return {
      setBoundingBoxSizeInMeter: (size) => update({ app: { size } }),
      selectWaterFeature: (f) => {
        update({ app: { selectedWaterItem: f } });
        m.redraw();
      },
      selectFeature: async (f) => {
        const {
          app: { size = 5000 },
        } = states();
        console.log('selectFeature');
        const lat = f.geometry.coordinates[1];
        const lng = f.geometry.coordinates[0];
        const bbox = createBoundingBox(lat, lng, size);
        const geojson = await top10nl(bbox);
        // const geojson = await overpass(bbox);
        update({ app: { selectedItem: undefined } });
        update({ app: { selectedItem: f, water: processWater(lat, lng, geojson) } });
        // m.redraw();
      },
      toggleHospitalActivity: (id: number, layer?: L.GeoJSON) => {
        const {
          app: { hospitals },
        } = states();
        if (!hospitals) return;
        hospitals.features.some((h) => {
          if (h.properties.id === id) {
            h.properties.active = !h.properties.active;
            return true;
          }
          return false;
        });
        if (layer) {
          let i = 0;
          layer.eachLayer((l) => {
            const curHospital = hospitals.features[i].properties;
            if (curHospital.active) {
              (l as L.Marker).setIcon(createIcon('black')).setOpacity(1);
            } else {
              (l as L.Marker).setIcon(ziekenhuisIconX).setOpacity(0.3);
            }
            i++;
          });
        }
        return { app: { hospitals } };
      },
    } as IAppStateActions;
  },
} as IAppState;
