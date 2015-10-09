app.controller('ClientsController', ['api', '$rootScope', 'modal', 'notification', function (api, $rootScope, modal, notification) {
	"use strict";
	//--------------------------------------------------------
	// Closure for this controller
	//--------------------------------------------------------
	
	var thisController = this;
	
	
	//--------------------------------------------------------
	// Controller properties
	//--------------------------------------------------------
	
	this.loaded = false;

	this.dataLoading = false;

	this.clients = [];

	this.searchString = '';

	this.currentClient = {};

	this.clientModel = new Model({
		email: ModelConfig.email(false),
		firstname: ModelConfig.firstName(true),
		lastname: ModelConfig.lastName(false),
		patron: ModelConfig.patron(false),
		phone: ModelConfig.phone(false)
	});
	
	
	//--------------------------------------------------------
	// Controller methods
	//--------------------------------------------------------
	
	this.doSearch = function () {
		thisController.dataLoading = true;
		if (thisController.searchString.length > 0) {
			thisController.clients = api.findClients(thisController.searchString, function (cls) {
				thisController.clients = cls.clients;
				thisController.dataLoading = false;
				if (!thisController.loaded) thisController.loaded = true;
				$rootScope.$digest();
			});
		} else {
			thisController.clients = api.getAllClients(function (data) {
				thisController.clients = data.clients;
				thisController.dataLoading = false;
				if (!thisController.loaded) thisController.loaded = true;
				$rootScope.$digest();
			});
		}
		if (thisController.clients) {
			thisController.loaded = true;
		}
	};

	this.edit = function (cl) {
		for (var k in cl) {
			if (thisController.clientModel[k]) {
				thisController.clientModel[k].data = cl[k];
			}
		}
		thisController.clientModel.client_id = cl.client_id;
		jQuery('#clientModal').openModal();
	};

	this.save = function () {
		thisController.clientModel.validate();
		if (thisController.clientModel.valid) {
			jQuery('#clientModal').closeModal();
			this.dataLoading = true;
			if (thisController.clientModel.client_id)
				api.updateClient(thisController.clientModel.toJson([]), function () {
					thisController.dataLoading = false;
				});
			else
				api.addClient(thisController.clientModel.toJson([]), function (updated) {
					thisController.clients = updated;
					thisController.dataLoading = false;
					$rootScope.$digest();
				});
		} else {
			notification.info('Исправьте данные');
		}
	};
	this.create = function () {
		thisController.clientModel.clearData();
		delete thisController.clientModel.client_id;
		jQuery('#clientModal').openModal();
	};
	this.remove = function (cl) {
		var client = cl;
		modal.okCancelDialog("Вы уверены, что хотите удалить клиента?",
			function () {
				thisController.dataLoading = true;
				$rootScope.$digest();
				thisController.clients = api.removeClient(client, function () {
					thisController.doSearch();
				}, function () {
					thisController.dataLoading = true;
					client.id = undefined;
					api.addClient(client, function () {
						thisController.doSearch();
					}, true);
				});
			},
			null, "Внимание");
	};
	
	
	//--------------------------------------------------------
	// Initialization code
	//--------------------------------------------------------
	
	this.doSearch();
}]);