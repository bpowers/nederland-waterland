import m from 'mithril';
import { HomePage } from './components';
import { states, actions } from './services/meiosis';
import './css/styles.css';

m.mount(document.body, {
  view: () => {
    return m(HomePage, { state: states(), actions: actions });
  },
});
