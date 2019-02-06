import {LitElement, html, customElement} from 'lit-element';
import {SortableMixin} from './exmg-sortable-mixin';

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      derivedCtor.prototype[name] = baseCtor.prototype[name];
    });
  });
}

/**
 * The `<exmg-sortable>` element Enables drag and drop sorting of nodes in a list, table or any other set of
 * elements.
 *
 * ```html
 * <exmg-sortable item-selector="li" on-dom-order-change="_myChangeHandler">
 *  <ul>
 *    <template is="dom-repeat" items="[[foo]]">
 *      <li>[[item.bar]]</li>
 *    </template>
 *  </ul>
 * </exmg-sortable>
 * ```
 */
@customElement('exmg-sortable')
export class SortableElement extends SortableMixin {
  render() {
    return html`
      <style>
        :host {
          position: relative;
          display: block;
        }
      </style>
      <slot></slot>
    `;
  }

  constructor() {
    super();
    /* set drag properties */
    this.itemSelector = 'li';
    this.cloneProperties = ['index','item'];
  }
}
// applyMixins(SortableElement, [SortableMixin]);
