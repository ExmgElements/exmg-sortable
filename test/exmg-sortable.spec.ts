import {SortableElement} from '../exmg-sortable';
import {promisifyFlush} from './utils';

declare const fixture: <T extends HTMLElement = HTMLElement>(id: string, model?: object) => T;
declare const flush: (cb?: Function) => void;

const {assert} = chai;

suite('<exmg-sortable>', function () {
  let element: SortableElement;
  const flushCompleted = promisifyFlush(flush);

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

    test.only('external sortable host with custom handle sorting works properly', async () => {
      element = fixture('ExmgSortableListWithExternalHost');
      const hostSortableElement = fixture('ExmgSortableExternalHost');
      await flushCompleted();
      element.sortableHostNode = hostSortableElement;
      await flushCompleted();
      let done: Function;
      const donePromise = new Promise(resolve => {
        done = resolve;
      });

      element.addEventListener('dom-order-change', async (event: Event) => {
        const detail = (<CustomEvent>event).detail;
        assert.equal(detail.sourceIndex, 0, 'Source index should be 0');
        assert.equal(detail.targetIndex, 1, 'Target index should be 1');
        done();
      });

      const parent = hostSortableElement.querySelector('tbody');
      const draggedElem = hostSortableElement.querySelector('.handle span')!;
      const draggedElemClosestRow = draggedElem.closest('tr');

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

      parent!.insertBefore(draggedElemClosestRow!, hostSortableElement.querySelector('tr:nth-child(2)'));
      parent!.removeChild(hostSortableElement.querySelector('tr.cloned')!);
      await donePromise;
    });
  });

});
