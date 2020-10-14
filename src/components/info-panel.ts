import m from 'mithril';
import { MeiosisComponent } from '../services/meiosis';

export const InfoPanel: MeiosisComponent = () => {
  return {
    view: ({
      attrs: {
        state: {
          app: { size },
        },
        actions: { setBoundingBoxSizeInMeter },
      },
    }) => {
      return [
        m('h2', `Nederland-Waterland`),
        m('label[for=size]', [
          'Afmeting bounding box in meter:',
          m('input[id=size][type=number][min=100][max=10000]', {
            value: size,
            onchange: (e: any) => {
              setBoundingBoxSizeInMeter(+e.target.value);
            },
          }),
        ]),
        ,
      ];
    },
  };
};
