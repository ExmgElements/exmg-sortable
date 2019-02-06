import { property, LitElement, PropertyValues } from '@polymer/lit-element';
import {addListener, removeListener} from '@polymer/polymer/lib/utils/gestures.js';

export class sortable extends LitElement {

  /**
   * Toggle for enabling/disabling dragging
   * @type {Boolean}
   */
  @property({type: Boolean})
  private _draggingDisabled: boolean = false;

  @property({type: String})
  public handleSelector: string = '.drag-handle';

  @property({type: String})
  public itemSelector: string = '.item';

  @property({type: Array})
  public items?: Array<any>;

  @property({type: Array})
  public cloneProperties: Array<string> = [];

  @property({type: Boolean})
  public animationEnabled: boolean = false;

  @property({type: String})
  public cloneClass: string = 'clone';

  @property({type: String})
  public draggedClass: string = 'dragged';

  private _pendingDragRequest: boolean = false;

  private _trackListener: (p0: Event) => void;

  private _current: HTMLElement | undefined;
  private _clone: HTMLElement | undefined;
  private _origin: HTMLElement | undefined;
  private _nodes: Array<HTMLElement> = [];
  private _animating: Array<HTMLElement> = [];
  private dx: number | undefined;
  private dy: number | undefined;
  private initialScrollTop: number = 0;

  constructor() {
    super();

    /* Save function references */
    this._update = this._update.bind(this);
    this._trackListener = e => this._handleTrack(e);

    /* Set attribute property to default value */
    this.draggingDisabled = false;

    /* Start request animation frame to handle mouse animations for dragging clone */
    requestAnimationFrame(this._update);
  }

  public connectedCallback(): void {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
  }

  public disconnectedCallback(): void {
    removeListener(this, 'track', this._trackListener);
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
  }

  public shouldUpdate(changedProperties: PropertyValues): boolean {
    /* restore dom before if items has changes */
    if(changedProperties && changedProperties.has('items') && this._pendingDragRequest) {
      this.reset();
    }
    return true;
  }


  /**
   * Tracks a pointer from touchstart/mousedown to touchend/mouseup. Note that the start state is fired following
   * the first actual move event following a touchstart/mousedown.
   *
   * @param {Event} trackEvent
   */
  private _handleTrack(e:Event): void {
    switch ((<any>e).detail.state) {
      case 'start':
        this._trackStart(e);
        break;
      case 'track':
        this._trackMove(e);
        break;
      case 'end':
        this._trackEnd();
        break;
    }
  }

  /**
   * Updates browser scrollpoistion if needed. Scroll position update will be triggered when dragging
   * position hits top or bottom of the screen.
   *
   * @param {number} scrolling

  _updateScrollposition(scrolling, dy) {
    if(!this.scrolling) {
      return;
    }
    const scrollTop = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop);
    window.scrollTo(0, scrollTop + scrolling);
    /* add correction for dy offset when scrolling
    dy += scrolling;
    scrolling = null;
  }
  */

  /**
   * Tracks a pointer from touchstart/mousedown to touchend/mouseup. Note that the start state is fired following
   * the first actual move event following a touchstart/mousedown.
   *
   * @param {long} currentTime
   */
  _update(): void {
    const {_current, _clone} = this;

    if (!_current || !_clone) {
      requestAnimationFrame(this._update);
      return;
    }

    /* if scrolling is set the page scrollposition needs to be updated */
    //this._updateScrollposition(this.scrolling, this.dy);

    Object.assign(_clone.style, {
      'transform': `translate3d(${this.dx}px, ${this.dy}px, 0)`
    });

    const target = this._hitTest(_clone, this._nodes)[0];
    if (target && (target !== _current) && this._isAnimating(target) === false) {
      this._insertAtTarget(_current, target);
    }

    requestAnimationFrame(this._update);
  }


  /**
   * Initialized a drag and drop sequence if a child node was clicked that matches the itemSelector property. If a
   * handleSelector is defined, a node matching this selector must be clicked instead.
   *
   * @param {Event} trackEvent
   */
  _trackStart(e:Event) {
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

      this._current = node;
      this._nodes = Array.from(this.querySelectorAll(selector)) || [];
      this._clone = this._createClone(node);
      this._origin = node.nextSibling;
      this._animating = [];

      node.classList.add(this.draggedClass);
    }
  }

  /**
   * Ends the drag and drop sequence and updates the new node order to the instance's items for binding and
   * rendering purposes.
   *
   */
  private _trackEnd(): void {
    const {_current, _nodes} = this;

    if (!_current) {
      return;
    }

    const updated = Array.from(this.querySelectorAll(this.itemSelector));

    const sourceIndex = _nodes.indexOf(_current);
    const targetIndex = updated.indexOf(_current);

    if (sourceIndex !== targetIndex) {
      // this.draggingDisabled = true;
      this._pendingDragRequest = true;
      this.dispatchEvent(new CustomEvent('dom-order-change', {
        bubbles: true,
        composed: true,
        detail: {
          sourceIndex: sourceIndex,
          targetIndex: targetIndex
        }
      }));
    } else {
      this.reset();
    }
  }

  /**
   * Moves the active node's clone to follow the pointer. The node that the clone intersects with (via hitTest) is
   * the insert point for updated sorting.
   *
   * @param {Event} trackEvent
   */
  private _trackMove(e: Event): void {
    e.preventDefault();

    const {dx, dy} = (<any>e).detail;
    // const innerHeight = window.innerHeight;

    const scrollTop = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop);

    // const {sourceEvent} = (<any>event).detail;
    // const elementTop = sourceEvent.pageY - 35;
    // const elementBottom = sourceEvent.pageY + 35;

    // if((elementBottom - scrollTop) > innerHeight) {
    //    this.scrolling = 20;
    // } else if((elementTop - scrollTop) < 0) {
    //   this.scrolling = -20;
    // }

    this.dx = dx;
    /* Work arround for issue with first element being party offscreen when drag start */
    this.dy = dy - (this.initialScrollTop - scrollTop);

    console.log('_trackMove', dx, dy);
  }

  /**
   * Fast and simple hit test to check whether the center of a node intersects with the rectangle of any of the
   * given targets. Returns an array of matches.
   *
   * @param {HTMLElement} node
   * @param {Array} targets
   * @return {Array<HTMLElement>} matches
   */
  private _hitTest(node:HTMLElement, targets: Array<HTMLElement>): Array<HTMLElement> {
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
  private _isAnimating(node: HTMLElement): boolean {
    return this._animating.indexOf(node) > -1;
  }

  public reset() {
    if(this._clone !== undefined && this._clone.parentNode !== null) {
     this._clone.parentNode.removeChild(this._clone);
    }

    if(this._current && this._current.parentNode && this._origin) {
      this._current.classList.remove(this.draggedClass);
       this._current.parentNode.insertBefore(this._current, this._origin);
    }
    delete this._clone;
    delete this._current;

    this.draggingDisabled = false
    this._nodes = [];
    this._animating = [];
    this._pendingDragRequest = false;
  }

  /**
   * Triggers a CSS animation on a node with the given dx and dy. Used following dom updates to make it appear as
   * if nodes animate from their old to their new position in the dom.
   *
   * @param {Node} node
   * @param {number} dx
   * @param {number} dy
   */
  private _animateNode(node: HTMLElement, dx = 0, dy = 0): void {
    if (!node.animate) {
      return;
    }

    // keep a stack of currently animating nodes to exclude as drag & drop targets.
    const anims = this._animating;
    anims.push(node);

    Object.assign(node.style, {
      willChange: 'transform',
    });

    // animate from dx/dy (old node position) to none (new node position)
    node.animate([
      {transform: `translate3d(${dx}px, ${dy}px, 0)`},
      {transform: 'none'},
    ], {duration: 200, easing: 'ease-out'}).addEventListener('finish', () => {
      const index = anims.indexOf(node);
      Object.assign(node.style, {
        willChange: 'initial',
      });
      if (index > -1) {
        // splice out when done to unlock as a valid target
        anims.splice(index, 1);
      }
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
  private _insertAtTarget(node: Node, target: HTMLElement): void {
    let offsets: Array<any> = [];
    if (this.animationEnabled) {
      offsets = this._nodes.map(item => ({
        x: item.offsetLeft,
        y: item.offsetTop
      }));
    }

    const insert = (node.compareDocumentPosition(target) & 4) ? target.nextSibling : target;
    if(node && node.parentNode) {
      node.parentNode.insertBefore(node, insert);
    }

    if (this.animationEnabled) {
      this._nodes.forEach((node, i) => {
        const {x, y} = offsets[i];
        const dx = x - node.offsetLeft;
        const dy = y - node.offsetTop;
        if (dx !== 0 || dy !== 0) {
          this._animateNode(node, dx, dy);
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
  private _createClone(node: any): HTMLElement {
    const clone = node.cloneNode(true);

    /* Element properties will be lost on close so reattach */
    this.cloneProperties.map(cp => clone[cp] = node[cp]);

    const {offsetLeft: x, offsetTop: y} = node;
    this.dx = 0;
    this.dy = 0;

    this.initialScrollTop = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop);

    Object.assign(clone.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      willChange: 'transform,opacity',
    });

    clone.classList.add(this.cloneClass);

    return node.parentNode.appendChild(clone);
  }

  get draggingDisabled(): boolean {
    return this._draggingDisabled;
  }

  set draggingDisabled(draggingDisabled: boolean) {
    if (draggingDisabled) {
      removeListener(this, 'track', this._trackListener);
    } else {
      addListener(this, 'track', this._trackListener);
    }
    this._draggingDisabled = draggingDisabled;
  }

};
