import {LitElement, html, customElement, property, PropertyValues} from 'lit-element';
import {addListener, removeListener} from '@polymer/polymer/lib/utils/gestures.js';

/**
 * Orientation map to limit dragging to horizontal or vertical.
 */
const orientationMap =  {
  horizontal: {x: 1, y: 0},
  vertical: {x: 0, y: 1},
};

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
export class SortableElement extends LitElement {

  @property({type: String, attribute: 'handle-selector'})
  public handleSelector?: string;

  @property({type: String, attribute: 'item-selector'})
  public itemSelector: string = 'li';

  @property({type: Array})
  public items?: any[];

  @property({type: Boolean, attribute: 'animation-enabled'})
  public animationEnabled: boolean = false;

  @property({type: String, attribute: 'clone-class'})
  public cloneClass: string = 'clone';

  @property({type: String})
  public draggedClass: string = 'dragged';

  @property({type: Object, attribute: 'animation-timing'})
  public animationTiming: any = {duration: 200, easing: 'ease-out'};

  @property({type: String})
  public orientation?: 'horizontal'|'vertical';

  private dragRequestPending: boolean = false;
  private draggedElement?: HTMLElement;
  private draggedElementClone?: HTMLElement;
  private draggedElementOrigin?: HTMLElement;
  private sortableNodes: HTMLElement[] = [];
  private animatedElements: HTMLElement[] = [];
  private initialScrollTop: number = 0;
  private animationPromise?: Promise<any>;

  constructor() {
    super();

    /* Save function references */
    this.handleTrack = this.handleTrack.bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    addListener(this, 'track', this.handleTrack);
  }

  disconnectedCallback(): void {
    removeListener(this, 'track', this.handleTrack);
  }

  protected shouldUpdate(changedProperties: PropertyValues): boolean {
    /* restore dom before if items has changes */
    if (changedProperties && changedProperties.has('items') && this.dragRequestPending) {
      this.reset();
    }
    return true;
  }

  /**
   * Tracks a pointer from touchstart/mousedown to touchend/mouseup. Note that the start state is fired following
   * the first actual move event following a touchstart/mousedown.
   */
  private handleTrack(e:Event): void {
    switch ((<CustomEvent>e).detail.state) {
      case 'start':
        this.dragRequestPending = true;
        this.trackStart(e);
        break;
      case 'track':
        this.trackMove(e);
        break;
      case 'end':
        this.dragRequestPending = false;
        if (this.animationPromise) {
          this.animationPromise.then(() => {
            this.trackEnd();
          });
        } else {
          this.trackEnd();
        }
        break;
    }
  }

  /**
   * Initialized a drag and drop sequence if a child node was clicked that matches the itemSelector property. If a
   * handleSelector is defined, a node matching this selector must be clicked instead.
   */
  private trackStart(e:Event): void {
    const handle = this.handleSelector;
    const targetElement = (<any>e).path[0];

    /* Look for closest handle */
    if (handle && !targetElement.closest(handle)) {
      return;
    }

    const selector = this.itemSelector;
    const node = targetElement.closest(selector);

    if (node) {
      e.preventDefault();

      this.draggedElement = node;
      this.sortableNodes = Array.from(this.querySelectorAll(selector)) || [];
      this.draggedElementClone = this.createClone(node);
      this.draggedElementOrigin = node.nextSibling;
      this.animatedElements = [];

      this.draggedElement!.classList.add(this.draggedClass);
    }
  }

  /**
   * Ends the drag and drop sequence and updates the new node order to the instance's items for binding and
   * rendering purposes.
   *
   */
  private trackEnd(): void {
    if (!this.draggedElement) {
      return;
    }

    const updated = Array.from(this.querySelectorAll(this.itemSelector));

    const sourceIndex = this.sortableNodes.indexOf(this.draggedElement);
    const targetIndex = updated.indexOf(this.draggedElement);

    if (sourceIndex !== targetIndex) {
      this.dispatchEvent(new CustomEvent('dom-order-change', {
        bubbles: true,
        composed: true,
        detail: {
          sourceIndex,
          targetIndex,
        },
      }));
    }

    this.reset();
  }

  /**
   * Moves the active node's clone to follow the pointer. The node that the clone intersects with (via hitTest) is
   * the insert point for updated sorting.
   */
  private trackMove(e: Event): void {
    e.preventDefault();

    let {dx, dy} = (<any>e).detail;
    const scrollTop = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop);

    if (this.orientation) {
      dx = dx * orientationMap[this.orientation].x;
      dy = dy * orientationMap[this.orientation].y;
    }

    /* Work around for issue with first element being party offscreen when drag start */
    dy = dy - (this.initialScrollTop - scrollTop);

    Object.assign(this.draggedElementClone!.style, {
      transform: `translate3d(${dx}px, ${dy}px, 0)`,
    });

    const target = this.hitTest(this.draggedElementClone!, this.sortableNodes)[0];
    if (
      // if clone intersects with a valid target,
      target &&
      // other than its own origin,
      (target !== this.draggedElement) &&
      // and the target isn't currently animating, which causes false hit tests,
      this.isAnimating(target) === false
    ) {
      this.insertAtTarget(this.draggedElement!, target);
    }
  }

  /**
   * Fast and simple hit test to check whether the center of a node intersects with the rectangle of any of the
   * given targets. Returns an array of matches.
   *
   * @param {HTMLElement} node
   * @param {Array} targets
   * @return {Array<HTMLElement>} matches
   */
  private hitTest(node:HTMLElement, targets: HTMLElement[]): HTMLElement[] {
    const {left: l, top: t, width: w, height: h} = node.getBoundingClientRect();
    const x = l + (w / 2);
    const y = t + (h / 2);

    return targets.filter(item => {
      const {left, right, top, bottom} = item.getBoundingClientRect();
      return ! (x < left || x > right || y < top || y > bottom);
    });
  }

  /**
   * Returns a boolean indicating whether the node is currently in an animation.
   *
   * @param {HTMLElement} node
   * @returns {boolean} isAnimating
   */
  private isAnimating(node: HTMLElement): boolean {
    return this.animatedElements.indexOf(node) > -1;
  }

  private reset(): void {
    if (this.draggedElementClone !== undefined && this.draggedElementClone.parentNode !== null) {
      this.draggedElementClone.parentNode.removeChild(this.draggedElementClone);
    }

    if (this.draggedElement && this.draggedElement.parentNode && this.draggedElementOrigin) {
      this.draggedElement.classList.remove(this.draggedClass);
      this.draggedElement.parentNode.insertBefore(this.draggedElement, this.draggedElementOrigin);
    }

    delete this.draggedElementClone;
    delete this.draggedElement;

    this.sortableNodes = [];
    this.animatedElements = [];
    this.dragRequestPending = false;
  }

  /**
   * Triggers a CSS animation on a node with the given dx and dy. Used following dom updates to make it appear as
   * if nodes animate from their old to their new position in the dom.
   *
   * @param {Node} node
   * @param {number} dx
   * @param {number} dy
   */
  private animateNode(node: HTMLElement, dx = 0, dy = 0): void {
    if (!node.animate) {
      return;
    }

    // keep a stack of currently animating nodes to exclude as drag & drop targets.
    this.animatedElements.push(node);

    Object.assign(node.style, {
      willChange: 'transform',
    });

    // animate from dx/dy (old node position) to none (new node position)
    this.animationPromise = new Promise((resolve) => {
      node.animate([
        {transform: `translate3d(${dx}px, ${dy}px, 0)`},
        {transform: 'none'},
      ], this.animationTiming).addEventListener('finish', () => {
        const index = this.animatedElements.indexOf(node);
        Object.assign(node.style, {
          willChange: 'initial',
        });
        if (index !== -1) {
          // splice out when done to unlock as a valid target
          this.animatedElements.splice(index, 1);
        }

        resolve();
        delete this.animationPromise;
      });
    });
  }

  /**
   * Inserts node at target to update sibling sorting. If the node precedes the target, it is inserted after it;
   * If it follows the target, it is inserted before it. This ensures any node can be dragged from the very
   * beginning to the very end and vice versa. The animateNode function is called for all nodes that moved because
   * of this dom update.
   *
   * @param {Node} node
   * @param {Node} target
   */
  private insertAtTarget(node: Node, target: HTMLElement): void {
    let offsets: any[] = [];
    if (this.animationEnabled) {
      offsets = this.sortableNodes.map(item => ({
        x: item.offsetLeft,
        y: item.offsetTop,
      }));
    }

    const insert = (node.compareDocumentPosition(target) & 4) ? target.nextSibling : target;
    if (node && node.parentNode) {
      node.parentNode.insertBefore(node, insert);
    }

    if (this.animationEnabled) {
      this.sortableNodes.forEach((sortableNode, i) => {
        const {x, y} = offsets[i];
        const dx = x - sortableNode.offsetLeft;
        const dy = y - sortableNode.offsetTop;
        if (dx !== 0 || dy !== 0) {
          this.animateNode(sortableNode, dx, dy);
        }
      });
    }
  }

  /**
   * Clones a given node to visually drag around. The original node is left in the same flow as its siblings. Clone
   * styles are added onto the style object directly, since the ::slotted() selector can't universally target nodes
   * that may be nested an unknown amount of shadow dom levels deep.
   *
   * @param {HTMLElement} node
   * @return {Node} clone
   */
  private createClone(node: HTMLElement): HTMLElement {
    const clone = <any>node.cloneNode(true);

    const {offsetLeft: x, offsetTop: y} = node;

    this.initialScrollTop = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop);

    Object.assign(clone.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      willChange: 'transform,opacity',
    });

    clone.classList.add(this.cloneClass);

    return node.parentNode!.appendChild(clone);
  }

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
}
