import {LitElement, html, customElement, property} from 'lit-element';
import '@polymer/iron-ajax/iron-ajax.js';
import '../exmg-sortable.js';

@customElement('exmg-sortable-demo')
export class SortableDemo extends LitElement {
  @property({type: String})
  public dataUrl: string = '';

  @property({type: Array})
  public users: any[] = [{
    "index": 2,
    "firstName": "Peter",
    "lastName": "Neder",
    "email": "peter@email.com"
  },{
    "index": 3,
    "firstName": "Marloes",
    "lastName": "Haut",
    "email": "marloes@email.com"
  },{
    "index": 1,
    "firstName": "Mark",
    "lastName": "Smiths",
    "email": "mark@email.com"
  },{
    "index": 4,
    "firstName": "Peter-Paul",
    "lastName": "Elf",
    "email": "pp@email.com"
  }];

  constructor() {
    super();

    this.orderChange = this.orderChange.bind(this);
  }

  /**
   * Simple order update: splices the data array to change physical rendering order.
   */
  private orderChange(e: CustomEvent) {
    setTimeout(() => {
      const {sourceIndex, targetIndex} = e.detail;
      const items = [...this.users];
      items.splice(targetIndex, 0, items.splice(sourceIndex, 1)[0]);
      this.users = items;
    }, 0);
  }

  render() {
    return html`
      <style>
      ul, li {
        margin-left: 0;
        padding-left: 0;
      }

      li {
        display: flex;
        padding: 10px 15px;
        border-bottom: 1px solid silver;
      }

      li.clone {
        background: white;
        width: 100%;
        box-sizing: border-box;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
        opacity: 0.9;
      }

      li.dragged {
        background: #c0c0c0;
        opacity: 0.25;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.5) inset;
      }

      li > strong {
        flex-grow: 1;
      }

      li > span {
        width: 30%;
      }

      table {
        border-collapse: collapse;
        width: 100%;
      }

      td, th {
        padding: 10px 15px;
        border-bottom: 1px solid silver;
      }

      tr.dragged {
        background: #f0f0f0;
      }

      tr.clone {
        opacity: 0;
      }

      td.handle {
        padding: 0;
        vertical-align: middle;
      }
        td.handle span {
          display: block;
          background: gray;
          width: 20px;
          height: 20px;
        }

      .boxes {
          margin-top: 2em;
          overflow: hidden;
      }

      .box {
        float: left;
        width: 150px;
        height: 150px;
        padding: 10px;
        margin: 20px;
        box-sizing: border-box;
        background: #f0f0f0;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
      }

      .box.dragged {
        opacity: 0;
      }

      </style>

      <h2>List</h2>
      <exmg-sortable
        .items=${this.users}
        item-selector="li"
        orientation="vertical"
        @dom-order-change="${this.orderChange}"
      >
        <ul>
          ${this.users.map((user) => {
            return html`
              <li>
                  <strong>${user.firstName}</strong>
                  <span>${user.lastName}</span>
                  <span>${user.email}</span>
              </li>
            `;
          })}
        </ul>
      </exmg-sortable>

      <h2>Cards</h2>
      <exmg-sortable
        .items=${this.users}
        handle-selector="div.box"
        item-selector="div.box"
        @dom-order-change="${this.orderChange}"
      >
        <div class="boxes">
          ${this.users.map((user) => {
            return html`
              <div class="box">
                ${user.firstName}
              </div>
            `;
          })}
        </div>
      </exmg-sortable>

      <h2>Table</h2>
      <exmg-sortable
        item-selector="tr"
        handle-selector=".handle span"
        @dom-order-change="${this.orderChange}"
      >
        <table>
          ${this.users.map((user) => {
            return html`
              <tr>
                <td class="handle"><span></span></td>
                <td>${user.firstName}</td>
                <td>${user.lastName}</td>
                <td>${user.email}</td>
              </tr>
            `;
          })}
        </table>
      </exmg-sortable>

      <h2>Manipulate sorted data</h2>
      <exmg-sortable item-selector="div.box" on-dom-order-change="_usersOrderChange">
        <div class="boxes">
          <template is="dom-repeat" items="[[usersList]]" sort="_sortByIndex">
            <div class="box">
              [[item.firstName]] ([[item.index]])
            </div>
          </template>
        </div>
      </exmg-sortable>
    `;
  }
}
