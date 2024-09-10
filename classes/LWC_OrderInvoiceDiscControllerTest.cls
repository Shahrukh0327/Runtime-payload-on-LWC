/**
 * @description       : Test class for LWC_OrderInvoiceDiscController
 * @author            : Shahrukh Ahmed
 * @last modified on  : 12-08-2024
 * @last modified by  : Shahrukh Ahmed
 **/
@isTest
public class LWC_OrderInvoiceDiscControllerTest {
	@isTest
	static void getLineItemColumnConfigurationTest() {
		User thisUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];

		Test.startTest();

		System.runAs(thisUser) {
			List<InvoiceOrderConfiguration__mdt> invoiceRecords = LWC_OrderInvoiceDiscController.getLineItemColumnConfiguration(
				'invoice',
				'invoice'
			);

			Assert.isTrue(invoiceRecords.size() > 0, 'Custom Metadata should return some records.');
		}

		Test.stopTest();
	}

	@isTest
	static void searchInvoiceWithInvoiceNumberMockTest() {
		User thisUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
		LWC_OrderInvoiceDiscController.InvoiceRequestWrapper invoiceRequest = new LWC_OrderInvoiceDiscController.InvoiceRequestWrapper();
		invoiceRequest.accountNumber = '';
		Test.startTest();

		System.runAs(thisUser) {
			List<SAPOrderInvoiceDetails> invoiceDetail = LWC_OrderInvoiceDiscController.searchInvoiceWithInvoiceNumber(
				invoiceRequest,
				true
			);

			Assert.isTrue(invoiceDetail.size() > 0, 'The mock response should have some records.');
		}

		Test.stopTest();
	}

    @isTest
	static void searchInvoiceWithInvoiceNumberTest() {
		User thisUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];

        StaticResourceCalloutMock mock = new StaticResourceCalloutMock();
        mock.setStaticResource('invoiceNumberResponse');
        mock.setStatusCode(200);
        mock.setHeader('Content-Type', 'application/json');
        // Set the mock callout mode
        Test.setMock(HttpCalloutMock.class, mock);

        LWC_OrderInvoiceDiscController.InvoiceRequestWrapper req = new LWC_OrderInvoiceDiscController.InvoiceRequestWrapper();
        req.businessUnit='ABNZ';
        req.accountNumber='123456';
        req.invoiceNumber='SI99999';

		Test.startTest();

		System.runAs(thisUser) {
			List<SAPOrderInvoiceDetails> invoiceDetail = LWC_OrderInvoiceDiscController.searchInvoiceWithInvoiceNumber(req,false);
			Assert.isTrue(invoiceDetail.size() > 0, 'The mock response should have some records.');
		}

		Test.stopTest();
	}

    @isTest
	static void searchInvoiceWithInvoiceNumberDateTest() {
		User thisUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];

        StaticResourceCalloutMock mock = new StaticResourceCalloutMock();
        mock.setStaticResource('invoiceDateRangeResponse');
        mock.setStatusCode(200);
        mock.setHeader('Content-Type', 'application/json');
        // Set the mock callout mode
        Test.setMock(HttpCalloutMock.class, mock);

        LWC_OrderInvoiceDiscController.InvoiceRequestWrapper req = new LWC_OrderInvoiceDiscController.InvoiceRequestWrapper();
        req.businessUnit='ABNZ';
        req.accountNumber='123456';
        req.selectedStartDate='2024-01-06';
        req.selectedEndDate='2024-03-06';

		Test.startTest();

		System.runAs(thisUser) {
			List<SAPOrderInvoiceDetails> invoiceDetail = LWC_OrderInvoiceDiscController.searchInvoiceWithStartEndDate(req,false);
			Assert.isTrue(invoiceDetail.size() > 0, 'The mock response should have some records.');
		}

		Test.stopTest();
	}

	@isTest
	static void searchInvoiceWithStartEndDateTest() {
		User thisUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
		LWC_OrderInvoiceDiscController.InvoiceRequestWrapper invoiceRequest = new LWC_OrderInvoiceDiscController.InvoiceRequestWrapper();
		invoiceRequest.accountNumber = '';
		invoiceRequest.businessUnit = '';
		invoiceRequest.invoiceNumber = '';
		invoiceRequest.selectedStartDate = '';
		invoiceRequest.selectedEndDate = '';
		invoiceRequest.type = '';
		Test.startTest();

		System.runAs(thisUser) {
			List<SAPOrderInvoiceDetails> invoiceDetail = LWC_OrderInvoiceDiscController.searchInvoiceWithStartEndDate(invoiceRequest,true);
			Assert.isTrue(invoiceDetail.size() > 0, 'The mock response should have some records.');
		}

		Test.stopTest();
	}
	@isTest
	static void getProductTest() {
		User thisUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];

		Test.startTest();

		System.runAs(thisUser) {
			Map<String, Product2> productMap = LWC_OrderInvoiceDiscController.getProduct();
			Assert.isTrue(productMap.size() == 0, 'It will return zero records');
		}
		Test.stopTest();
	}
}