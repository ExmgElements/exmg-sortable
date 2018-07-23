import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {SortableMixin} from './exmg-sortable-mixin.js';

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
 *
 * @customElement
 * @polymer
 * @memberof Exmg
 * @appliesMixin Exmg.SortableMixin
 * @demo demo/index.html
 */
class SortableElement extends SortableMixin(PolymerElement) {
  static get is() {
    return 'exmg-sortable';
  }
  static get template() {
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
}
window.customElements.define(SortableElement.is, SortableElement);
