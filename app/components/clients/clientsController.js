app.controller('ClientsController', ['api', '$rootScope', 'modal', 'notification', '$location', function (api, $rootScope, modal, notification, $location) {
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
	
	this.scriptSearch = '';
	
	this.scripts = [];

	this.currentClient = {};

	this.clientModel = new Model({
		email: ModelConfig.email(false),
		firstname: ModelConfig.firstName(true),
		lastname: ModelConfig.lastName(false),
		patron: ModelConfig.patron(false),
		phone: ModelConfig.phone(false)
	});
	
	
	//--------------------------------------------------------
	// Private properties and functions
	//--------------------------------------------------------
	
	var scriptSearchTimeout = null;
	
	function searchScripts() {
		thisController.scripts = api.findScripts(thisController.scriptSearch, 0, function(data) {
			thisController.scripts = data.scripts;
			$rootScope.$digest();
		});
		$rootScope.$digest();
	}
	
	
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
	
	this.doScriptSearch = function(){
		if(scriptSearchTimeout != null) {
			clearTimeout(scriptSearchTimeout);
		}
		scriptSearchTimeout = setTimeout(searchScripts, 400);
	};

	this.edit = function (cl) {
		thisController.clientModel.populate(cl);
		thisController.clientModel.id = cl.client_id;
		jQuery('#clientModal').openModal();
	};

	this.save = function () {
		thisController.clientModel.validate();
		if (thisController.clientModel.valid) {
			jQuery('#clientModal').closeModal();
			this.dataLoading = true;
			if (thisController.clientModel.id) {
				var cl = thisController.clientModel.toJson([]);
				cl.client_id = thisController.clientModel.id;
				api.updateClient(cl, function () {
					thisController.doSearch();
				});
			} else {
				api.addClient(thisController.clientModel.toJson([]), function (updated) {
					thisController.clients = updated;
					thisController.dataLoading = false;
					$rootScope.$digest();
				});
			}
		} else {
			notification.info('Исправьте данные');
		}
	};
	this.create = function () {
		thisController.clientModel.clearData();
		delete thisController.clientModel.id;
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
	
	this.preRunScript = function(client) {
		this.currentClient.fio = client.firstname + " " + client.lastname + " " + client.patron;
		this.currentClient.id = client.client_id;
		this.doScriptSearch();
		jQuery('#scriptList').openModal();
	};
	
	this.runScript = function(scriptId){
		jQuery('#scriptList').closeModal();
		$location.path('/scriptrun/'+scriptId+"/"+this.currentClient.id);
	};
	
	
	//--------------------------------------------------------
	// Initialization code
	//--------------------------------------------------------
	
	this.doSearch();
}]);