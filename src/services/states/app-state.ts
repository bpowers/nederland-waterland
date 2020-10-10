import m from 'mithril';
import Stream from 'mithril/stream';
import { IAppModel, UpdateStream } from '../meiosis';
import { IZiekenhuis } from '../../models/ziekenhuis';
import ziekenhuizen from '../../data/ziekenhuizen.json';
import { createBoundingBox, createIcon, processWater, ziekenhuisIconX } from '../../utils';
import { overpass } from '../overpass';
import { FeatureCollection, Point } from 'geojson';

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
    map: L.Map;
    water?: FeatureCollection;
    hospitals: FeatureCollection<Point, IZiekenhuis>;
    selectedHospitalId: number;
  }>;
}

export interface IAppStateActions {
  selectHospital: (id: number) => void;
  toggleHospitalActivity: (id: number, layer?: L.GeoJSON) => void;
}

export interface IAppState {
  initial: IAppStateModel;
  actions: (us: UpdateStream, states: Stream<IAppModel>) => IAppStateActions;
}

export const appStateMgmt = {
  initial: {
    app: {
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
      selectHospital: async (selectedHospitalId) => {
        console.log('selectHospital');
        const {
          app: { hospitals },
        } = states();
        if (!hospitals) return;
        const selected = hospitals.features.filter((h) => h.properties.id === selectedHospitalId).shift();
        if (!selected) return;
        const lat = selected.geometry.coordinates[1];
        const lng = selected.geometry.coordinates[0];
        const bbox = createBoundingBox(lat, lng, 5000);
        const geojson = await overpass(bbox);
        update({ app: { selectedHospitalId, water: processWater(lat, lng, geojson) } });
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
