import {SortableElement} from '../exmg-sortable';
// import {promisifyFlush, onExmgTokenInputDeselected, onExmgTokenInputSelected} from './utils';

declare const fixture: <T extends HTMLElement = HTMLElement>(id: string, model?: object) => T;
declare const flush: (cb?: Function) => void;

const {assert} = chai;

suite('<exmg-sortable>', function () {
  let element: SortableElement;
  // const flushCompleted = promisifyFlush(flush);

  suite('element with children', function () {
    setup(() => {
      element = fixture('ExmgSortableList');
    });

    test('element has list of element ', async () => {
      const elementShadowRoot = element.shadowRoot!;
      // await flushCompleted();

      console.log('elementShadowRoot', elementShadowRoot);
      // const listBox = elementShadowRoot.querySelector('paper-listbox');
      // assert.isArray(listBox!.items, 'Should be an array');
      // assert.equal((listBox!.items || []).length, 10, 'Length should be 10 elements');
    });
  });

});
