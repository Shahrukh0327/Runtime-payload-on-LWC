/**
 * @description       :
 * @author            : Shahrukh Ahmed
 * @last modified on  : 30-08-2024
 * @last modified by  : Shahrukh Ahmed
 **/
import { api, LightningElement } from "lwc";

export default class CustomLookup extends LightningElement {
  @api objectApi;
  @api lineItemId;
  @api fieldName;
  @api editable;
  @api businessUnit;
  receivedValue;
  matchingInfo = {
    primaryField: { fieldPath: "Name" },
    additionalFields: [{ fieldPath: "Description" }]
  };
  displayInfo = {
    primaryField: "Name",
    additionalFields: ["StockKeepingUnit"]
  };
  get filter() {
    return {
      criteria: [
        {
          fieldPath: "Type__c",
          operator: "like",
          value: "Case Product%"
        },
        {
          fieldPath: "BusinessUnit__c",
          operator: "eq",
          value: this.businessUnit
        },
        {
          fieldPath: "IsActive",
          operator: "eq",
          value: true
        }
      ],
      filterLogic: "1 AND 2 AND 3"
    };
  }
  @api
  set value(value) {
    this.receivedValue = value;
    if (!this.receivedValue) {
      this.template.querySelector("lightning-record-picker")?.clearSelection();
    }
  }
  get value() {
    return this.receivedValue;
  }

  handleChange(event) {
    const recordPickerEvent = new CustomEvent("recordpicker", {
      composed: true,
      bubbles: true,
      cancelable: true,
      detail: {
        lineItemId: this.lineItemId,
        fieldName: this.fieldName,
        value: event.detail.recordId ? event.detail.recordId : ""
      }
    });
    this.dispatchEvent(recordPickerEvent);
  }
}
