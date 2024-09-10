/**
 * @description       :
 * @author            : Shahrukh Ahmed
 * @last modified on  : 29-08-2024
 * @last modified by  : Shahrukh Ahmed
 **/
import { LightningElement, api, track, wire } from "lwc";
import { DateTime } from "c/luxon";
/**Apex Methods*/
import searchInvoiceWithInvoiceNumber from "@salesforce/apex/LWC_OrderInvoiceDiscController.searchInvoiceWithInvoiceNumber";
import searchInvoiceWithStartEndDate from "@salesforce/apex/LWC_OrderInvoiceDiscController.searchInvoiceWithStartEndDate";
import getLineItemColumnConfiguration from "@salesforce/apex/LWC_OrderInvoiceDiscController.getLineItemColumnConfiguration";
import getProduct from "@salesforce/apex/LWC_OrderInvoiceDiscController.getProduct";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import BUSINESS_UNIT from "@salesforce/schema/Case.BusinessUnit__c";
import AX_ACCOUNT_NUMBER from "@salesforce/schema/Case.Payer__r.AXAccountNumber__c";
import ALB_SAP_ID from "@salesforce/schema/Case.Payer__r.ALBSAPID__c";

const TODAY = DateTime.local();

export default class OrderInvoiceDiscrepancy extends LightningElement {
  @api recordId;
  @api tableName;
  @api title;
  @api searchNumberFieldLabel;
  @api searchDateFieldLabel;
  @track orderInvoiceWrapper = {};
  @track productList = [];
  invoiceNumber;
  selectedStartDate = TODAY.minus({ months: 1 }).toISODate();
  selectedEndDate = TODAY.toISODate();
  maxDate = TODAY.toISODate();
  minStartDate = TODAY.minus({ months: 3 }).toISODate();
  minEndDate = this.selectedStartDate;
  isError = false;
  showSpinner = false;
  type = "";

  invoiceDetailColumns = [];
  lineItemColumns = [];
  lineItemColumnsSet;
  lineItemColumnMap = {};
  errorMap = {};
  options = [
    { label: "--None--", value: "" },
    { label: "Invoice", value: "invoice" },
    { label: "Order", value: "order" }
  ];

  @api
  get objectArrayVariable() {
    return this.template.querySelector("c-order-invoice-table").objectArrayVariable;
  }

  @api
  get typeVariable() {
    return this.type;
  }

  @api
  get invoiceNumberVariable() {
    return this.template.querySelector("c-order-invoice-table").invoiceNumberVariable;
  }
  @api
  get invoiceOrderDate() {
    return this.template.querySelector("c-order-invoice-table").invoiceOrderDateVariable;
  }
  @wire(getRecord, {
    recordId: "$recordId",
    fields: [BUSINESS_UNIT, AX_ACCOUNT_NUMBER, ALB_SAP_ID]
  })
  case;

  get businessUnit() {
    return getFieldValue(this.case.data, BUSINESS_UNIT);
  }

  get axAccountNumber() {
    return getFieldValue(this.case.data, AX_ACCOUNT_NUMBER);
  }

  get albSapId() {
    return getFieldValue(this.case.data, ALB_SAP_ID);
  }

  get isNumberSearchDisabled() {
    return !this.invoiceNumber?.trim();
  }

  get isDateSearchDisabled() {
    return !this.selectedStartDate || !this.selectedEndDate || !this.isInvoiceDatesValidated || !this.type;
  }

  get isInvoiceDatesValidated() {
    return [...this.template.querySelectorAll(".date-input")].reduce(
      (validSoFar, dateInput) => validSoFar && dateInput.checkValidity(),
      true
    );
  }

  handleChange(event) {
    this.type = event.detail.value;
    this.template.querySelector("c-order-invoice-table").invoiceDetail([]);
  }

  handleInvoiceNumberChange(event) {
    this.invoiceNumber = event.detail.value;
  }

  handleStartDateChange(event) {
    this.selectedStartDate = event.detail.value;
    this.minEndDate = this.selectedStartDate;
    if (this.selectedStartDate > this.selectedEndDate) {
      this.selectedEndDate = this.selectedStartDate;
    }
    event.target.reportValidity();
  }

  handleEndDateChange(event) {
    this.selectedEndDate = event.detail.value;
    event.target.reportValidity();
  }

  //make apex method call with invoice number
  handleNumberSearch() {
    let accNum = "";

    if (!this.businessUnit) {
      this.isError = true;
      this.errorMap.iconName = "utility:error";
      this.errorMap.variant = "warning";
      this.errorMap.message = "Business Unit on Case is required to process your " + this.type + " request.";
      return;
    }

    if (this.businessUnit === "ABNZ" && !this.axAccountNumber) {
      this.isError = true;
      this.errorMap.iconName = "utility:error";
      this.errorMap.variant = "error";
      this.errorMap.message =
        "AX Account Number on Payer Account is required to process your " + this.type + " request.";
      return;
    }

    if (this.businessUnit === "ALB" && !this.albSapId) {
      this.isError = true;
      this.errorMap.iconName = "utility:error";
      this.errorMap.variant = "error";
      this.errorMap.message = "ALB SAP Id on Payer Account is required to process your " + this.type + " request.";
      return;
    }

    if (this.businessUnit === "ABNZ") {
      accNum = this.axAccountNumber;
    } else if (this.businessUnit === "ALB") {
      accNum = this.albSapId;
    }

    this.orderInvoiceWrapper.type = this.type;
    this.orderInvoiceWrapper.invoiceNumber = this.invoiceNumber;
    this.orderInvoiceWrapper.businessUnit = this.businessUnit;
    this.orderInvoiceWrapper.accountNumber = accNum;
    this.showSpinner = true;
    searchInvoiceWithInvoiceNumber({
      invoiceRequest: this.orderInvoiceWrapper,
      isMockResponse: false
    })
      .then((invoiceDetails) => {
        if (invoiceDetails.length > 0) {
          this.isError = false;
          this.template.querySelector("c-order-invoice-table").invoiceDetail(invoiceDetails);
        } else {
          this.isError = true;
          this.errorMap.iconName = "utility:error";
          this.errorMap.variant = "error";
          this.errorMap.message = "Payload: No " + this.type + " found for this " + this.type + " number";
        }
        this.showSpinner = false;
      })
      .catch((error) => {
        console.error(error);
        this.isError = true;
        this.errorMap.iconName = "utility:error";
        this.errorMap.variant = "error";
        this.errorMap.message =
          "Denodo: We're experiencing a technical issue with our data integration service. Please try again later or contact support if the problem persists.";
        this.showSpinner = false;
      });
  }

  //make apex method call with date range
  handleDateSearch() {
    let accNum = "";
    if (!this.businessUnit) {
      this.isError = true;
      this.errorMap.iconName = "utility:error";
      this.errorMap.variant = "error";
      this.errorMap.message = "Business Unit on Case is required to process your " + this.type + " request.";
      return;
    }
    if (this.businessUnit === "ABNZ" && !this.axAccountNumber) {
      this.isError = true;
      this.errorMap.iconName = "utility:error";
      this.errorMap.variant = "error";
      this.errorMap.message =
        "AX Account Number on Payer Account is required to process your " + this.type + " request.";
      return;
    }

    if (this.businessUnit === "ALB" && !this.albSapId) {
      this.isError = true;
      this.errorMap.iconName = "utility:error";
      this.errorMap.variant = "error";
      this.errorMap.message = "ALB SAP Id on Payer Account is required to process your " + this.type + " request.";
      return;
    }

    if (this.businessUnit === "ABNZ") {
      accNum = this.axAccountNumber;
    } else if (this.businessUnit === "ALB") {
      accNum = this.albSapId;
    }

    this.orderInvoiceWrapper.selectedStartDate = this.selectedStartDate;
    this.orderInvoiceWrapper.selectedEndDate = this.selectedEndDate;
    this.orderInvoiceWrapper.type = this.type;
    this.orderInvoiceWrapper.businessUnit = this.businessUnit;
    this.orderInvoiceWrapper.accountNumber = accNum;
    this.showSpinner = true;
    searchInvoiceWithStartEndDate({
      invoiceRequest: this.orderInvoiceWrapper,
      isMockResponse: false
    })
      .then((invoiceDetails) => {
        if (invoiceDetails.length > 0) {
          this.isError = false;
          this.template.querySelector("c-order-invoice-table").invoiceDetail(invoiceDetails);
        } else {
          this.isError = true;
          this.errorMap.iconName = "utility:error";
          this.errorMap.variant = "error";
          this.errorMap.message = "Payload: No " + this.type + " found for this date range";
        }
        this.showSpinner = false;
      })
      .catch((error) => {
        console.error(error);
        this.isError = true;
        this.errorMap.iconName = "utility:error";
        this.errorMap.variant = "error";
        this.errorMap.message =
          "Denodo: We're experiencing a technical issue with our data integration service. Please try again later or contact support if the problem persists.";
        this.showSpinner = false;
      });
  }
  @wire(getProduct)
  wiredRecords({ error, data }) {
    if (data) {
      this.productList = data;
    } else if (error) {
      this.productList = [];
      console.log("error: ", error);
    }
  }

  /**Wire Apex Call to Fetch Line Item Columns*/
  @wire(getLineItemColumnConfiguration, { tableName: "$tableName", type: "$type" })
  wiredLineItemColumnConfiguration(result) {
    this.invoiceDetailColumns = [];
    this.lineItemColumns = [];
    this.lineItemColumnsSet = [];
    this.lineItemColumnMap = [];

    this.showSpinner = false;
    if (result.data) {
      this.isError = false;
      console.log("lineItemConfigurations: ", result.data);
      this.prepareLineItemsColumns(result.data);
    } else if (result.error) {
      this.isError = true;
      this.errorMap.iconName = "utility:error";
      this.errorMap.variant = "error";
      this.errorMap.message = "Error while retrieving Line Item columns : " + result.error;
      this.showSpinner = false;
    }
  }
  prepareLineItemsColumns(lineItemConfigurations) {
    lineItemConfigurations.forEach((item) => {
      let column = {};

      // Assign column to the correct array based on Table_Context__c
      if (item.isActive__c) {
        if (item.TableContext__c === "Overview") {
          column = {
            columnName: item.Label,
            columnClass: "slds-size_2-of-12",
            fieldName: item.SAPColumn__c
          };
          this.invoiceDetailColumns.push(column);
        } else {
          column = {
            label: item.Label,
            fieldName: item.SAPColumn__c,
            editable: item.IsEditable__c,
            fixedWidth: item.ColumnFixedWidth__c,
            hideDefaultActions: true,
            type: item.DataType__c,
            cellAttributes: {
              alignment: "left",
              class: { fieldName: "rowColor" }
            }
          };
          if (item.DataType__c === "lookup") {
            column = {
              label: item.Label,
              fieldName: item.SAPColumn__c,
              editable: item.IsEditable__c,
              hideDefaultActions: true,
              fixedWidth: item.ColumnFixedWidth__c,
              type: item.DataType__c,
              wrapText: true,
              cellAttributes: {
                alignment: "left",
                class: { fieldName: "rowColor" }
              },
              typeAttributes: {
                object: item.Lookup_Object__c,
                label: item.Label,
                placeholder: "Select Record",
                valueId: { fieldName: item.SAPColumn__c },
                lineItemId: { fieldName: "key" },
                businessUnit: this.businessUnit,
                fieldName: item.SAPColumn__c,
                editable: item.IsEditable__c ? false : true
              }
            };
          }
          this.lineItemColumns.push(column);
        }
      }

      this.lineItemColumnMap[item.SAPColumn__c] = item.ColumnName__c;
    });

    this.invoiceDetailColumns.push({
      columnName: "Actions",
      sapColumnName: "",
      columnClass: "slds-size_1-of-12"
    });

    this.lineItemColumns.push({
      label: "Actions",
      type: "button-icon",
      fieldName: "Actions",
      cellAttributes: { alignment: "center" },
      typeAttributes: {
        iconName: "utility:undo",
        variant: "border-filled",
        name: "undo",
        title: "Undo",
        disabled: { fieldName: "disableButton" },
        value: "undo",
        iconPosition: "left",
        alternativeText: "Undo"
      }
    });

    this.lineItemColumnsSet = new Set(this.lineItemColumns.map((item) => item.fieldName));
  }
}
