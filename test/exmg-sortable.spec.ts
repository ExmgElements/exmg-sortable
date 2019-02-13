import {SortableElement} from '../exmg-sortable';

declare const fixture: <T extends HTMLElement = HTMLElement>(id: string, model?: object) => T;

const {assert} = chai;

suite('<exmg-sortable>', function () {
  let element: SortableElement;
  suite('element with children', function () {
    test('default sorting works properly', (done) => {
      element = fixture('ExmgSortableList');

      element.addEventListener('dom-order-change', (event: Event) => {
        const detail = (<CustomEvent>event).detail;
        assert.equal(detail.sourceIndex, 0, 'Source index should be 0');
        assert.equal(detail.targetIndex, 1, 'Target index should be 1');
        done();
      });

      const parent = element.querySelector('ul');
      const draggedElem = element.querySelectorAll('li')[0];

      const trackStartEvent = new CustomEvent(
        'track',
        {
          detail: {
            state: 'start',
          },
          bubbles: true,
        }
      );
      draggedElem.dispatchEvent(trackStartEvent);

      const trackMoveEvent = new CustomEvent(
        'track',
        {
          detail: {
            state: 'track',
            dx: 0,
            dy: 45,
          },
          bubbles: true,
        }
      );
      draggedElem.dispatchEvent(trackMoveEvent);

      const trackEndEvent = new CustomEvent(
        'track',
        {
          detail: {
            state: 'end',
          },
          bubbles: true,
        }
      );
      draggedElem.dispatchEvent(trackEndEvent);

      parent!.insertBefore(draggedElem, element.querySelectorAll('li')[2]);
      parent!.removeChild(element.querySelector('li.cloned')!);
    });

    test('custom handle sorting works properly', (done) => {
      element = fixture('ExmgSortableListWithCustomHandle');

      element.addEventListener('dom-order-change', (event: Event) => {
        const detail = (<CustomEvent>event).detail;
        assert.equal(detail.sourceIndex, 0, 'Source index should be 0');
        assert.equal(detail.targetIndex, 1, 'Target index should be 1');
        done();
      });

      const parent = element.querySelector('tbody');
      const draggedElem = element.querySelectorAll('.handle span')[0];
      const draggedElemClosestRow = draggedElem.closest('tr');

      console.log('draggedElem', draggedElem);
      const trackStartEvent = new CustomEvent(
        'track',
        {
          detail: {
            state: 'start',
          },
          bubbles: true,
        }
      );
      draggedElem.dispatchEvent(trackStartEvent);

      const trackMoveEvent = new CustomEvent(
        'track',
        {
          detail: {
            state: 'track',
            dx: 0,
            dy: 45,
          },
          bubbles: true,
        }
      );
      draggedElem.dispatchEvent(trackMoveEvent);

      const trackEndEvent = new CustomEvent(
        'track',
        {
          detail: {
            state: 'end',
          },
          bubbles: true,
        }
      );
      draggedElem.dispatchEvent(trackEndEvent);

      parent!.insertBefore(draggedElemClosestRow!, element.querySelectorAll('tr')[2]);
      parent!.removeChild(element.querySelector('tr.cloned')!);
    });
  });

});
