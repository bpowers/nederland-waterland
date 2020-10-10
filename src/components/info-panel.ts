import m from 'mithril';
import { MeiosisComponent } from '../services/meiosis';

export const InfoPanel: MeiosisComponent = () => {
  return {
    view: () => {
      return [m('h2', `Nederland-Waterland`)];
    },
  };
};
