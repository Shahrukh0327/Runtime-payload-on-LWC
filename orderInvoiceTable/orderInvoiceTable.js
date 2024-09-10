/**
 * @description       :
 * @author            : Shahrukh Ahmed
 * @last modified on  : 29-08-2024
 * @last modified by  : Shahrukh Ahmed
 **/
import { LightningElement, api, track } from "lwc";

export default class OrderInvoiceTable extends LightningElement {
  @api tableName;
  @api type;
  @api invoiceDetailColumns;
  @api lineItemColumns;
  @api lineItemColumnsSet;
  @api lineItemColumnMap;
  @api productList;
  @track toastMessageMap = {};
  @track lineToastMessageMap = {};
  @track invoiceData = [];
  @track editCollection = []; // collection variable for Flow
  @track originalValues = [];
  @track pageSize = 5; // Number of records per page
  @track currentPage = 1; // Current page number
  @track selectedNumber = "";
  @track invoiceOrderDate;
  defaultSortDirection = "asc";
  sortDirection = "asc";
  sortedBy;
  isLoading = false;
  isToastMessage = false;
  isLineToastMessage = false;
  saveDraftValues = [];
  fieldMap = {
    invoice: {
      id: "invoice_number",
      date: "billing_date",
      lineItems: "invoice_line_items"
    },
    order: {
      id: "order_number",
      date: "order_date",
      lineItems: "order_line_items"
    }
  };

  @api invoiceDetail(invoiceDetails) {
    // clearing All property previous values
    this.clearAll();
    this.isLoading = true;
    // Initialize data with undoDisabled set to true for each line item
    this.invoiceData = JSON.parse(JSON.stringify(invoiceDetails)).map((invoice, invoiceIndex) => {
      // Initialize colsvalue as an empty array
      let colsvalue = [];

      // Check each column in invoiceDetailColumns
      this.invoiceDetailColumns.forEach((column) => {
        if (Object.prototype.hasOwnProperty.call(invoice, column.fieldName)) {
          colsvalue.push(invoice[column.fieldName]);
        }
      });
      return {
        ...invoice,
        columns: this.invoiceDetailColumns,
        colsvalue: colsvalue,
        id: invoice[this.fieldMap[this.type].id],
        iconName: "utility:chevronup",
        showLineItems: false,
        lineItems: invoice[this.fieldMap[this.type].lineItems].map((lineItem, lineItemIndex) => {
          // Create a copy of the lineItem to avoid mutating the original object
          let updatedLineItem = {
            ...lineItem,
            key: `${invoiceIndex}-${lineItemIndex}`,
            disableButton: true,
            productId: this.productList[lineItem.material_number]?.Id
          };

          // Check each column label and add it if not present
          this.lineItemColumns.forEach((column) => {
            if (!Object.prototype.hasOwnProperty.call(updatedLineItem, column.fieldName)) {
              updatedLineItem[column.fieldName] = "";
            }
          });

          return updatedLineItem;
        }),
        displayedLineItems: invoice[this.fieldMap[this.type].lineItems].slice(0, this.pageSize),
        pageSize: this.pageSize,
        currentPage: this.currentPage
      };
    });
    this.originalValues = JSON.parse(JSON.stringify(this.invoiceData));
    this.isLoading = false;
  }

  connectedCallback() {
    //  this.getLineItem();
  }

  clearAll() {
    this.isLineToastMessage = false;
    this.isToastMessage = false;
    this.editCollection = [];
  }

  handleLineItemVisibility(event) {
    if (event.currentTarget.dataset.id) {
      let invoice = this.invoiceData.find((inv) => inv.id === event.currentTarget.dataset.id);
      if (invoice) {
        // Set initial paginated data
        this.updatePaginatedData(invoice);
        invoice.showLineItems = !invoice.showLineItems;
        invoice.undoDisabled = true;
        invoice.iconName = invoice.iconName === "utility:chevronup" ? "utility:chevrondown" : "utility:chevronup";
      }
    }
  }
  handleNumber(event) {
    let invoice = this.invoiceData.find((inv) => inv.id === event.currentTarget.dataset.id);
    this.invoiceOrderDate = invoice[this.fieldMap[this.type].date];
    this.selectedNumber = event.currentTarget.dataset.id;
    this.isToastMessage = true;
    this.toastMessageMap.iconName = "utility:success";
    this.toastMessageMap.variant = "success";
    this.toastMessageMap.message = this.selectedNumber + " has added.";
    //this.showToast("Success!", this.selectedNumber + " has added", "success");
  }

  handlePageChange(event) {
    if (event.currentTarget.dataset.id) {
      let invoice = this.invoiceData.find((inv) => inv.id === event.currentTarget.dataset.id);
      invoice.currentPage = event.detail.value;
      if (invoice) {
        this.updatePaginatedData(invoice);
      }
    }
  }

  handleCellChange(event) {
    this.isLineToastMessage = false;
    let isEditInvoice = this.editCollection.find(
      (inv) => inv[this.fieldMap[this.type].id] === event.currentTarget.dataset.id
    );

    if (this.editCollection.length === 0 || isEditInvoice || this.tableName === "Stock Transfer") {
      console.log("first time or find the same invoice or table is Stock Transfer: ");

      let changedInvoiceLineItem = this.invoiceData.find((inv) => inv.id === event.currentTarget.dataset.id);
      if (!changedInvoiceLineItem) {
        console.log("Invoice not found");
        return;
      }

      event.detail.draftValues.forEach((changedRow) => {
        let lineItem = changedInvoiceLineItem.lineItems.find((item) => item.key === changedRow.key);
        if (!lineItem.productId) {
          this.isLineToastMessage = true;
          this.saveDraftValues = [];
          this.lineToastMessageMap.iconName = "utility:warning";
          this.lineToastMessageMap.variant = "warning";
          this.lineToastMessageMap.message =
            "You cannot make changes to this line item because the required product is missing";
          return;
        }
        // Enable the undo button for this row
        lineItem.disableButton = false;

        let id = changedInvoiceLineItem.id;
        this.invoiceOrderDate = changedInvoiceLineItem[this.fieldMap[this.type].date];
        this.selectedNumber = id;
        // Dynamically update properties if they exist in change
        let isChangeFound = false;
        Object.keys(changedRow).forEach((prop) => {
          if (this.lineItemColumnsSet.has(prop) && Object.prototype.hasOwnProperty.call(changedRow, prop)) {
            let columnDataType = typeof lineItem[prop];
            if (columnDataType === "number" && lineItem[prop] !== parseFloat(changedRow[prop])) {
              isChangeFound = true;
              lineItem.rowColor = "slds-cell-edit slds-is-edited";
              lineItem[prop] = parseFloat(changedRow[prop]);
            } else if (lineItem[prop] !== changedRow[prop]) {
              isChangeFound = true;
              lineItem.rowColor = "slds-cell-edit slds-is-edited";
              lineItem[prop] = changedRow[prop];
            }
          }
        });

        if (isChangeFound) {
          this.updateEditCollectionItem(id, lineItem);
        }

        this.saveDraftValues.push(event.detail.draftValues);
      });
    } else {
      this.isLineToastMessage = true;
      this.lineToastMessageMap.iconName = "utility:warning";
      this.lineToastMessageMap.variant = "warning";
      this.lineToastMessageMap.message = "You can Edit only one " + this.type + " at a time.";
      this.saveDraftValues = [];
    }
  }

  handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;

    if (actionName === "undo") {
      let changedInvoiceLineItem = this.invoiceData.find((inv) => inv.id === event.currentTarget.dataset.id);

      const originalValue = JSON.parse(JSON.stringify(this.originalValues));
      const originalInvoiceLineItem = originalValue.find((inv) => inv.id === event.currentTarget.dataset.id);
      const originallineItem = originalInvoiceLineItem.lineItems.find((item) => item.key === row.key);
      this.selectedNumber = "";
      this.invoiceOrderDate = "";
      // Find the index of the lineItem in changedInvoiceLineItem.lineItems
      let lineItemIndex = changedInvoiceLineItem.lineItems.findIndex((item) => item.key === row.key);

      // Find the index of the displayedLineItems in changedInvoiceLineItem.lineItems
      let displayedLineItemIndex = changedInvoiceLineItem.displayedLineItems.findIndex((item) => item.key === row.key);

      // If lineItem exists, replace it with originallineItem
      if (lineItemIndex !== -1) {
        // Disable the undo button for this row
        originallineItem.disableButton = true;
        changedInvoiceLineItem.lineItems[lineItemIndex] = originallineItem;
        changedInvoiceLineItem.displayedLineItems[displayedLineItemIndex] = originallineItem;
      }
      this.removeEditCollectionItem(event.currentTarget.dataset.id, originallineItem);

      this.saveDraftValues = [];
    }
  }

  handleRecordPicker(event) {
    this.saveDraftValues = [];
    this.saveDraftValues.push({
      key: event.detail.lineItemId,
      [event.detail.fieldName]: event.detail.value
    });
    this.isLineToastMessage = false;
    let isEditInvoice = this.editCollection.find(
      (inv) => inv[this.fieldMap[this.type].id] === event.currentTarget.dataset.id
    );

    if (this.editCollection.length === 0 || isEditInvoice || this.tableName === "Stock Transfer") {
      let changedInvoiceLineItem = this.invoiceData.find((inv) => inv.id === event.currentTarget.dataset.id);
      this.saveDraftValues.forEach((changedRow) => {
        let lineItem = changedInvoiceLineItem.lineItems.find((item) => item.key === changedRow.key);

        // Enable the undo button for this row
        lineItem.disableButton = false;

        let invoiceNumber = changedInvoiceLineItem.id;
        this.selectedNumber = invoiceNumber;
        this.invoiceOrderDate = changedInvoiceLineItem[this.fieldMap[this.type].date];
        if (lineItem) {
          Object.keys(changedRow).forEach((prop) => {
            if (this.lineItemColumnsSet.has(prop) && Object.prototype.hasOwnProperty.call(changedRow, prop)) {
              let columnDataType = typeof lineItem[prop];
              if (columnDataType === "number") {
                lineItem.rowColor = "slds-cell-edit slds-is-edited";
                lineItem[prop] = parseFloat(changedRow[prop]);
              } else {
                lineItem.rowColor = "slds-cell-edit slds-is-edited";
                lineItem[prop] = changedRow[prop];
              }
            }
          });
          this.updateEditCollectionItem(invoiceNumber, lineItem);
        }
      });
    } else {
      this.isLineToastMessage = true;
      this.lineToastMessageMap.iconName = "utility:warning";
      this.lineToastMessageMap.variant = "warning";
      this.lineToastMessageMap.message = "You can Edit only one " + this.type + " at a time.";
      this.saveDraftValues = [];
    }
  }

  updatePaginatedData(invoice) {
    if (invoice) {
      invoice.displayedLineItems = invoice.lineItems.slice(
        (invoice.currentPage - 1) * invoice.pageSize,
        invoice.currentPage * invoice.pageSize
      );
    }
  }

  updateEditCollectionItem(invoiceNumber, lineItem) {
    // Check if the entry already exists
    const existingIndex = this.editCollection.findIndex(
      (item) => item.key === lineItem.key && item[this.fieldMap[this.type].id] === invoiceNumber
    );
    let changedInvoiceLineItem = this.invoiceData.find((inv) => inv.id === invoiceNumber);

    const overviewCols = {};
    for (const sapField in changedInvoiceLineItem) {
      if (Object.hasOwn(changedInvoiceLineItem, sapField)) {
        const sfField = this.lineItemColumnMap[sapField];
        if (sfField) {
          overviewCols[sapField] = changedInvoiceLineItem[sapField];
        }
      }
    }

    if (existingIndex !== -1) {
      // Entry exists, update it
      this.editCollection[existingIndex] = {
        ...this.editCollection[existingIndex],
        ...lineItem,
        ...overviewCols
      };
    } else {
      // New entry, add it
      this.editCollection.push({
        ...lineItem,
        ...overviewCols
      });
    }
  }

  removeEditCollectionItem(invoiceNumber, lineItem) {
    // Check if the entry already exists
    const existingIndex = this.editCollection.findIndex(
      (item) => item.key === lineItem.key && item[this.fieldMap[this.type].id] === invoiceNumber
    );

    if (existingIndex !== -1) {
      // Remove the item from the collection
      this.editCollection.splice(existingIndex, 1);
    } else {
      console.log("Item not found in the collection");
    }
  }

  @api
  get invoiceNumberVariable() {
    return this.selectedNumber;
  }

  @api
  get invoiceOrderDateVariable() {
    return this.invoiceOrderDate;
  }
  @api
  get objectArrayVariable() {
    return this.editCollection.map((item) => {
      const record = {};
      for (const sapField in item) {
        if (Object.hasOwn(item, sapField)) {
          const sfField = this.lineItemColumnMap[sapField];
          if (sfField) {
            record[sfField] = item[sapField];
          }
        }
      }
      return record;
    });
  }

  onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    const cloneData = [...this.invoiceData];

    cloneData.sort(this.sortBy(sortedBy, sortDirection === "asc" ? 1 : -1));
    this.invoiceData = cloneData;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;
  }

  sortBy(field, reverse, primer) {
    const key = primer
      ? function (x) {
          return primer(x[field]);
        }
      : function (x) {
          return x[field];
        };

    return function (a, b) {
      a = key(a);
      b = key(b);
      return reverse * ((a > b) - (b > a));
    };
  }
}
