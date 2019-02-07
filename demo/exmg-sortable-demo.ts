import {LitElement, html, customElement, property} from 'lit-element';
import '@polymer/iron-ajax/iron-ajax.js';
import '../exmg-sortable.js';

@customElement('exmg-sortable-demo')
export class SortableDemo extends LitElement {
  @property({type: String})
  public dataUrl: string = '';

  @property({type: Array})
  public users: any[] = [];

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
      const movedElement = items[sourceIndex];

      movedElement.amountOfMoves = (movedElement.amountOfMoves || 0) + 1;

      items.splice(sourceIndex, 1);
      items.splice(targetIndex, 0, movedElement);

      this.users = items;
    }, 0);
  }

  private handleIronAjaxResponse(response: CustomEvent) {
    this.users = response.detail.xhr.response;
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
        background: #c0c0c0;
        opacity: 0.25;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.5) inset;
      }

      tr.clone {
        background: white;
        width: 100%;
        box-sizing: border-box;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
        opacity: 0.9;
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
        margin: 10px;
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

      <iron-ajax auto="" url="data/users.json" handle-as="json" @response="${this.handleIronAjaxResponse}"></iron-ajax>

      <h2>List</h2>
      <exmg-sortable
        orientation="vertical"
        animation-enabled
        animation-timing="{ &quot;duration&quot;: 200 }"
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
        item-selector="div.box"
        animation-enabled
        animation-timing="{ &quot;duration&quot;: 500 }"
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
    `;
  }
}
