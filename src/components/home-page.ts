import m from 'mithril';
import L, { ILayerTree } from 'leaflet';
import 'leaflet.control.layers.tree/L.Control.Layers.Tree.css';
import 'leaflet.control.layers.tree';
import 'leaflet/dist/leaflet.css';
// import 'leaflet-hash';
import { ziekenhuisIconX, ziekenhuisIconV, verzorgingstehuisIcon } from '../utils';
import { IZiekenhuis } from '../models/ziekenhuis';
import { MeiosisComponent } from '../services/meiosis';
import { InfoPanel } from './info-panel';
import { Feature, Point } from 'geojson';

export const HomePage: MeiosisComponent = () => {
  let map: L.Map;
  let ziekenhuisLayer: L.GeoJSON;
  let verzorgingshuizenLayer: L.GeoJSON;
  let vvtLayer: L.GeoJSON;
  let ggzLayer: L.GeoJSON;
  let ghzLayer: L.GeoJSON;
  let waterLayer: L.GeoJSON;
  // let selectedHospitalLayer: L.Marker;

  return {
    view: ({ attrs: { state, actions } }) => {
      console.log(state);
      const { hospitals, selectedItem, selectedWaterItem, water, verzorgingshuizen, ggz, ghz, vvt } = state.app;

      if (water) {
        waterLayer.clearLayers();
        waterLayer.addData(water);
      }

      const props = selectedItem && selectedItem.properties;
      const waterProps = selectedWaterItem && selectedWaterItem.properties;
      console.table(waterProps);
      return [
        m(
          '.container',
          { style: 'position: fixed;' },
          m('#map', {
            style:
              'height: 100vh; width: 70vw; margin: 0; padding: 0; overflow: hidden; box-shadow: (0px 0px 20px rgba(0,0,0,.3))',
            oncreate: () => {
              map = L.map('map', {}).setView([52.14, 5.109], 8);
              L.control.scale({ imperial: false, metric: true }).addTo(map);
              // Add the PDOK map
              const pdokachtergrondkaartGrijs = new L.TileLayer(
                'https://geodata.nationaalgeoregister.nl/tiles/service/wmts/brtachtergrondkaartgrijs/EPSG:3857/{z}/{x}/{y}.png',
                {
                  minZoom: 3,
                  maxZoom: 18,
                  attribution: 'Map data: <a href="http://www.kadaster.nl">Kadaster</a>',
                }
              );
              // pdokachtergrondkaartGrijs.addTo(map);
              const pdokachtergrondkaart = new L.TileLayer(
                'https://geodata.nationaalgeoregister.nl/tiles/service/wmts/brtachtergrondkaart/EPSG:3857/{z}/{x}/{y}.png',
                {
                  minZoom: 3,
                  maxZoom: 18,
                  // tms: true,
                  attribution: 'Map data: <a href="http://www.kadaster.nl">Kadaster</a>',
                }
              );
              pdokachtergrondkaart.addTo(map);
              // Hash in URL
              // new (L as any).Hash(map);

              const pointToLayer = (feature: Feature<Point, any>, latlng: L.LatLng): L.Marker<any> => {
                return new L.Marker(latlng, {
                  icon: verzorgingstehuisIcon,
                  title: feature.properties.Name,
                });
              };

              const onEachFeature = (feature: Feature<Point, any>, layer: L.Layer) => {
                layer.on('click', () => {
                  actions.selectFeature(feature as Feature<Point>);
                });
              };

              vvtLayer = L.geoJSON(vvt, { pointToLayer, onEachFeature });
              ghzLayer = L.geoJSON(ghz, { pointToLayer, onEachFeature });
              ggzLayer = L.geoJSON(ggz, { pointToLayer, onEachFeature });
              verzorgingshuizenLayer = L.geoJSON(verzorgingshuizen, { pointToLayer, onEachFeature });

              ziekenhuisLayer = L.geoJSON<IZiekenhuis>(hospitals, {
                pointToLayer: (feature, latlng) => {
                  const { locatie, organisatie, active } = feature.properties;
                  const title = `${locatie} (${organisatie})`;
                  return new L.Marker(
                    latlng,
                    active === false
                      ? {
                          icon: ziekenhuisIconX,
                          title,
                        }
                      : {
                          icon: ziekenhuisIconV,
                          title,
                        }
                  );
                },
                onEachFeature,
              }).addTo(map);

              waterLayer = L.geoJSON(undefined, {
                pointToLayer: (f, latlng) =>
                  L.circleMarker(latlng, {
                    // color: 'black',
                    stroke: false,
                    fillColor: f.properties.cat === 0 ? 'green' : f.properties.cat === 1 ? 'orange' : 'red',
                    fillOpacity: 1,
                    radius: Math.min(10, f.properties.births / 10),
                  }),
                onEachFeature: (feature, layer) => {
                  layer.bindPopup(JSON.stringify(feature.properties, null, 2));
                  layer.on('click', () => {
                    actions.selectWaterFeature(feature);
                  });
                },
              }).addTo(map);

              const baseTree = {
                label: 'Achtergrondkaart',
                children: [
                  { label: 'grijs', layer: pdokachtergrondkaartGrijs },
                  { label: 'normaal', layer: pdokachtergrondkaart },
                ],
              } as ILayerTree;
              const overlayTree = {
                label: 'Kaartlagen',
                children: [
                  { label: 'Ziekenhuizen', layer: ziekenhuisLayer },
                  { label: 'Water', layer: waterLayer },
                  {
                    label: 'Tehuizen',
                    children: [
                      { label: 'vvt', layer: vvtLayer },
                      { label: 'ggz', layer: ggzLayer },
                      { label: 'ghz', layer: ghzLayer },
                      { label: 'verzorgingshuizen', layer: verzorgingshuizenLayer },
                    ],
                  },
                ],
              } as ILayerTree;
              L.control.layers.tree(baseTree, overlayTree).addTo(map);
            },
          })
        ),
        m(
          '.panel',
          {
            style: 'position: absolute; top: 0; left: 70vw; padding: 5px;',
          },
          [
            m(InfoPanel, { state, actions }),
            props && [
              m(
                'h2',
                m(
                  'label',
                  // m('input[type=checkbox]', {
                  //   checked: h.active,
                  //   onchange: () => actions.toggleHospitalActivity(h.id, ziekenhuisLayer),
                  // }),
                  props.locatie || props.Name
                )
              ),
            ],
            m('ul', waterProps && Object.keys(waterProps).map((key) => m('li', `${key}: ${waterProps[key]}`))),
          ]
        ),
      ];
    },
  };
};
