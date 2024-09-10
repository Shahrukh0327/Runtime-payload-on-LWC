/**
 * @description       :
 * @author            : Shahrukh Ahmed
 * @last modified on  : 29-08-2024
 * @last modified by  : Shahrukh Ahmed
 **/

import LightningDatatable from "lightning/datatable";
/*
    import all supporting components
*/
import customDataTypeTemplate from "./customDataType.html";

export default class CustomDatatable extends LightningDatatable {
  static customTypes = {
    lookup: {
      template: customDataTypeTemplate,
      typeAttributes: ["object", "valueId", "fieldName", "businessUnit", "lineItemId", "editable"]
    }
  };
}
