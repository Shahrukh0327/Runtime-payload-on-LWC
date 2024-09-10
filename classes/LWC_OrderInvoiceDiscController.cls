/**
 * @description       :
 * @author            : Shahrukh Ahmed
 * @last modified on  : 29-08-2024
 * @last modified by  : Shahrukh Ahmed
 **/
public with sharing class LWC_OrderInvoiceDiscController {
	/**
	 * @description returns the Line item columns detail from InvoiceOrderConfiguration__mdt.
	 * @author Shahrukh Ahmed | 24-07-2024
	 * @param  tableName
	 * @param  type
	 * @return List<InvoiceOrderConfiguration__mdt>
	 **/
	@AuraEnabled(cacheable=true)
	public static List<InvoiceOrderConfiguration__mdt> getLineItemColumnConfiguration(String tableName, String type) {
		String formattedTableName = '%' + String.escapeSingleQuotes(tableName) + '%';
		String formattedType = '%' + String.escapeSingleQuotes(type) + '%';
		return [
			SELECT
				Id,
				Label,
				ColumnName__c,
				TableContext__c,
				ColumnFixedWidth__c,
				Lookup_Object__c,
				SAPColumn__c,
				DataType__c,
				IsEditable__c,
				DisplayOrder__c,
				IsActive__c
			FROM InvoiceOrderConfiguration__mdt
			WHERE Type__c LIKE :formattedType AND TableName__c LIKE :formattedTableName
			WITH SECURITY_ENFORCED
			ORDER BY DisplayOrder__c
		];
	}

	/**
	 * @description temporary menthod, returns List of products for mock response.
	 * @author Shahrukh Ahmed | 24-07-2024
	 * @return  Map<String, Product2>
	 **/
	@AuraEnabled(cacheable=true)
	public static Map<String, Product2> getProduct() {
		Map<String, Product2> productMap = new Map<String, Product2>();
		String productType = 'Case Product';
		List<Product2> products = [
			SELECT Id, Name, ProductCode, StockKeepingUnit
			FROM Product2
			WHERE Type__c = :productType
			WITH SECURITY_ENFORCED
		];

		for (Product2 product : products) {
			productMap.put(product.StockKeepingUnit, product);
		}

		return productMap;
	}

	/**
	 * @description returns Invoice/Order payload by Invoice/Order number.
	 * @author Shahrukh Ahmed | 24-07-2024
	 * @param invoiceRequest
	 * @param isMockResponse
	 * @return List<SAPOrderInvoiceDetails>
	 **/
	@AuraEnabled
	public static List<SAPOrderInvoiceDetails> searchInvoiceWithInvoiceNumber(
		InvoiceRequestWrapper invoiceRequest,
		Boolean isMockResponse
	) {
		if (isMockResponse) {
			List<SAPOrderInvoiceDetails> mockOrderInvoiceResponseList = prepareMockResponse();
			return mockOrderInvoiceResponseList;
		} else {
			HttpResponse res = getInvoiceNumber(invoiceRequest); // request , type
			if (res.getStatusCode() == 200) {
				Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
				String updatedJsonString = JSON.serialize(jsonMap.get('elements'));
				// Parse the JSON string into a List of SAPOrderInvoiceDetails objects
				List<SAPOrderInvoiceDetails> invoiceDetailsList = SAPOrderInvoiceDetails.parse(updatedJsonString);
				return invoiceDetailsList;
			}
		}
		return null;
	}

	/**
	 * @description returns Invoice/Order payload by Start date and End date.
	 * @author Shahrukh Ahmed | 24-07-2024
	 * @param invoiceRequest
	 * @param isMockResponse
	 * @return List<SAPOrderInvoiceDetails>
	 **/
	@AuraEnabled
	public static List<SAPOrderInvoiceDetails> searchInvoiceWithStartEndDate(
		InvoiceRequestWrapper invoiceRequest,
		Boolean isMockResponse
	) {
		if (isMockResponse) {
			List<SAPOrderInvoiceDetails> mockOrderInvoiceResponseList = prepareMockResponse();
			return mockOrderInvoiceResponseList;
		} else {
			HttpResponse res = getInvoiceNumber(invoiceRequest); // request , type
			if (res.getStatusCode() == 200) {
				Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
				String updatedJsonString = JSON.serialize(jsonMap.get('elements'));
				// Parse the JSON string into a List of SAPOrderInvoiceDetails objects
				List<SAPOrderInvoiceDetails> invoiceDetailsList = SAPOrderInvoiceDetails.parse(updatedJsonString);
				return invoiceDetailsList;
			}
		}
		return null;
	}

	/**
	 * @description returns mock Invoice/Order payload.
	 * @author Shahrukh Ahmed | 24-07-2024
	 * @return List<SAPOrderInvoiceDetails>
	 **/
	private static List<SAPOrderInvoiceDetails> prepareMockResponse() {
		List<SAPOrderInvoiceDetails> mockOrderInvoiceResponseList = new List<SAPOrderInvoiceDetails>();
		String[] mockResponses = new List<String>{
			'{"customer_account_number":"100497","invoice_number":"SI2598411","billing_date":"2024-05-07","purchase_order_number":"IO765826","net_value":1306.66,"invoice_line_items":[{"item_line_number":"0E-12","material_number":"700CANTCREAMN","quantity":1,"sales_unit":"EACH","unit_price":163.43,"unit_gst":24.51,"line_net_value":163.43,"total_gst":24.51,"total_price_with_gst":187.94,"plant":"LIN"},{"item_line_number":"1.000000000000","material_number":"C2507WCOLAVAN12","quantity":32,"sales_unit":"EACH","unit_price":22.25,"unit_gst":3.3375,"line_net_value":712,"total_gst":106.8,"total_price_with_gst":818.8,"plant":"LIN"},{"item_line_number":"2.000000000000","material_number":"C320LWLEMADE4X6","quantity":5,"sales_unit":"EACH","unit_price":52.16,"unit_gst":7.824,"line_net_value":260.8,"total_gst":39.12,"total_price_with_gst":299.92,"plant":"LIN"}]}',
			'{"customer_account_number":"100497","invoice_number":"SI2598417","billing_date":"2024-05-07","purchase_order_number":"IP330613","net_value":3919.05,"invoice_line_items":[{"item_line_number":"0E-12","material_number":"700CANTCREAMN","quantity":1,"sales_unit":"EACH","unit_price":158.53,"unit_gst":23.78,"line_net_value":158.53,"total_gst":23.78,"total_price_with_gst":182.31,"plant":"LIN"},{"item_line_number":"1.000000000000","material_number":"C2507CRUICEMELON12","quantity":6,"sales_unit":"EACH","unit_price":20.86,"unit_gst":3.1283333333,"line_net_value":125.16,"total_gst":18.77,"total_price_with_gst":143.93,"plant":"LIN"},{"item_line_number":"2.000000000000","material_number":"C2507WCOLAVAN12","quantity":32,"sales_unit":"EACH","unit_price":22.25,"unit_gst":3.336875,"line_net_value":712,"total_gst":106.78,"total_price_with_gst":818.78,"plant":"LIN"},{"item_line_number":"3.000000000000","material_number":"C320LWLEMADE4X6","quantity":2,"sales_unit":"EACH","unit_price":52.16,"unit_gst":7.825,"line_net_value":104.32,"total_gst":15.65,"total_price_with_gst":119.97,"plant":"LIN"},{"item_line_number":"4.000000000000","material_number":"C330BRB4HPALE4X6","quantity":1,"sales_unit":"EACH","unit_price":48.2,"unit_gst":7.23,"line_net_value":48.2,"total_gst":7.23,"total_price_with_gst":55.43,"plant":"LIN"},{"item_line_number":"5.000000000000","material_number":"C330BRB5HIPA4X6","quantity":1,"sales_unit":"EACH","unit_price":48.2,"unit_gst":7.23,"line_net_value":48.2,"total_gst":7.23,"total_price_with_gst":55.43,"plant":"LIN"},{"item_line_number":"6.000000000000","material_number":"C330BRB5MPALE4X6","quantity":1,"sales_unit":"EACH","unit_price":48.2,"unit_gst":7.23,"line_net_value":48.2,"total_gst":7.23,"total_price_with_gst":55.43,"plant":"LIN"},{"item_line_number":"7.000000000000","material_number":"C330BRB5PILSNER4X6","quantity":2,"sales_unit":"EACH","unit_price":48.2,"unit_gst":7.23,"line_net_value":96.4,"total_gst":14.46,"total_price_with_gst":110.86,"plant":"LIN"},{"item_line_number":"8.000000000000","material_number":"C330BRB6APALE4X6","quantity":2,"sales_unit":"EACH","unit_price":48.2,"unit_gst":7.23,"line_net_value":96.4,"total_gst":14.46,"total_price_with_gst":110.86,"plant":"LIN"},{"item_line_number":"9.000000000000","material_number":"C440NZLAG412","quantity":20,"sales_unit":"EACH","unit_price":19.47,"unit_gst":2.9205,"line_net_value":389.4,"total_gst":58.41,"total_price_with_gst":447.81,"plant":"LIN"},{"item_line_number":"10.000000000000","material_number":"C500CARLSBELEPHANT24","quantity":2,"sales_unit":"EACH","unit_price":80.16,"unit_gst":12.025,"line_net_value":160.32,"total_gst":24.05,"total_price_with_gst":184.37,"plant":"LIN"},{"item_line_number":"11.000000000000","material_number":"C500NZLAGSTRONG6X4","quantity":1,"sales_unit":"EACH","unit_price":68.4,"unit_gst":10.26,"line_net_value":68.4,"total_gst":10.26,"total_price_with_gst":78.66,"plant":"LIN"},{"item_line_number":"12.000000000000","material_number":"DP330PERONIZERO4X6","quantity":1,"sales_unit":"EACH","unit_price":47.28,"unit_gst":7.09,"line_net_value":47.28,"total_gst":7.09,"total_price_with_gst":54.37,"plant":"LIN"},{"item_line_number":"13.000000000000","material_number":"DP500ASAHI4X6","quantity":1,"sales_unit":"EACH","unit_price":80.4,"unit_gst":12.06,"line_net_value":80.4,"total_gst":12.06,"total_price_with_gst":92.46,"plant":"LIN"},{"item_line_number":"14.000000000000","material_number":"DPASAHIZERO4X6","quantity":1,"sales_unit":"EACH","unit_price":44.52,"unit_gst":6.68,"line_net_value":44.52,"total_gst":6.68,"total_price_with_gst":51.2,"plant":"LIN"},{"item_line_number":"15.000000000000","material_number":"DPW19CRBLKSVB23","quantity":1,"sales_unit":"EACH","unit_price":78.84,"unit_gst":11.83,"line_net_value":78.84,"total_gst":11.83,"total_price_with_gst":90.67,"plant":"LIN"},{"item_line_number":"16.000000000000","material_number":"DPW19CRCHA23","quantity":1,"sales_unit":"EACH","unit_price":78.84,"unit_gst":11.83,"line_net_value":78.84,"total_gst":11.83,"total_price_with_gst":90.67,"plant":"LIN"},{"item_line_number":"17.000000000000","material_number":"DPW19CRV2CSV21","quantity":1,"sales_unit":"EACH","unit_price":78.84,"unit_gst":11.83,"line_net_value":78.84,"total_gst":11.83,"total_price_with_gst":90.67,"plant":"LIN"},{"item_line_number":"18.000000000000","material_number":"DPWPWKHSHZ22","quantity":1,"sales_unit":"EACH","unit_price":80.24,"unit_gst":12.04,"line_net_value":80.24,"total_gst":12.04,"total_price_with_gst":92.28,"plant":"LIN"},{"item_line_number":"19.000000000000","material_number":"DPWWBV2YLSHZ21","quantity":1,"sales_unit":"EACH","unit_price":60.24,"unit_gst":9.04,"line_net_value":60.24,"total_gst":9.04,"total_price_with_gst":69.28,"plant":"LIN"},{"item_line_number":"20.000000000000","material_number":"EPWFMCHARD22","quantity":1,"sales_unit":"EACH","unit_price":80.28,"unit_gst":12.04,"line_net_value":80.28,"total_gst":12.04,"total_price_with_gst":92.32,"plant":"LIN"},{"item_line_number":"21.000000000000","material_number":"EPWFMCOPNR22","quantity":1,"sales_unit":"EACH","unit_price":108.42,"unit_gst":16.26,"line_net_value":108.42,"total_gst":16.26,"total_price_with_gst":124.68,"plant":"LIN"},{"item_line_number":"22.000000000000","material_number":"EPWFMPGR23","quantity":1,"sales_unit":"EACH","unit_price":80.28,"unit_gst":12.04,"line_net_value":80.28,"total_gst":12.04,"total_price_with_gst":92.32,"plant":"LIN"},{"item_line_number":"23.000000000000","material_number":"SCRU4RASP12","quantity":4,"sales_unit":"EACH","unit_price":20.86,"unit_gst":3.13,"line_net_value":83.44,"total_gst":12.52,"total_price_with_gst":95.96,"plant":"LIN"},{"item_line_number":"24.000000000000","material_number":"SPUREBLONDE12","quantity":24,"sales_unit":"EACH","unit_price":18.78,"unit_gst":2.8170833333,"line_net_value":450.72,"total_gst":67.61,"total_price_with_gst":518.33,"plant":"LIN"}]}'
		};

		for (String mockResponse : mockResponses) {
			SAPOrderInvoiceDetails mockOrderInvoiceResponse = (SAPOrderInvoiceDetails) JSON.deserializeStrict(
				mockResponse,
				SAPOrderInvoiceDetails.class
			);
			mockOrderInvoiceResponseList.add(mockOrderInvoiceResponse);
		}

		return mockOrderInvoiceResponseList;
	}

	/**
	 * @description Sends an HTTP request.
	 * @author Shahrukh | 01-08-2024
	 * @param invoiceRequest
	 * @return HttpResponse
	 **/
	public static HttpResponse getInvoiceNumber(InvoiceRequestWrapper invoiceRequest) {
		// Initialize the map to store query parameters
		Map<String, String> queryParams = new Map<String, String>();

		// Add common query parameters
		queryParams.put('accountNumber', invoiceRequest.accountNumber);
		queryParams.put('businessUnit', invoiceRequest.businessUnit);

		// Add conditional query parameters
		if (!String.isBlank(invoiceRequest.invoiceNumber)) {
			String invoiceKey = (invoiceRequest.type == 'order') ? 'orderNumber' : 'invoiceNumber';
			queryParams.put(invoiceKey, invoiceRequest.invoiceNumber);
		}

		if (!String.isBlank(invoiceRequest.selectedStartDate)) {
			String fromDateKey = (invoiceRequest.type == 'order') ? 'orderFromDate' : 'invoiceFromDate';
			String toDateKey = (invoiceRequest.type == 'order') ? 'orderToDate' : 'invoiceToDate';
			queryParams.put(fromDateKey, invoiceRequest.selectedStartDate);
			queryParams.put(toDateKey, invoiceRequest.selectedEndDate);
		}

		// Construct the query string
		List<String> queryParts = new List<String>();
		for (String key : queryParams.keySet()) {
			queryParts.add(key + '=\'' + queryParams.get(key) + '\'');
		}
		String query = invoiceRequest.type + '?' + String.join(queryParts, '&');

		// Initialize the HTTP request
		HttpRequest req = new HttpRequest();
		req.setEndpoint('callout:Denodo/' + query); // Base URL + API path + query parameters
		req.setMethod('GET');
		req.setTimeout(40000); // Timeout set to 40 seconds Note: Sometime it time out on 20 seconds
		HttpResponse res = new HttpResponse();
		try {
			// Send the HTTP request
			Http http = new Http();
			res = http.send(req);
		} catch (Exception e) {
			throw e;
		}

		// Return the response
		return res;
	}

	/**
	 * @description InvoiceRequestWrapper for HTTP request.
	 * @author Shahrukh | 01-08-2024
	 **/
	public class InvoiceRequestWrapper {
		/** @description   : accountNumber. **/
		@AuraEnabled
		public String accountNumber { get; set; }
		/** @description   : businessUnit. **/
		@AuraEnabled
		public String businessUnit { get; set; }
		/** @description   : invoiceNumber. **/
		@AuraEnabled
		public String invoiceNumber { get; set; }
		/** @description   : selectedStartDate. **/
		@AuraEnabled
		public String selectedStartDate { get; set; }
		/** @description   : selectedEndDate. **/
		@AuraEnabled
		public String selectedEndDate { get; set; }
		/** @description   : type. **/
		@AuraEnabled
		public String type { get; set; }
		/**
		 * @description InvoiceRequestWrapper No-argument constructor.
		 **/
		public InvoiceRequestWrapper() {
			accountNumber = '';
			businessUnit = '';
			type = '';
		}
	}
}
