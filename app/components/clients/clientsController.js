app.controller('ClientsController', ['api', '$rootScope', 'modal', function(api, $rootScope, modal){
	var thisController = this;
	thisController.loaded = false;
	thisController.dataLoading = false;
	thisController.clients = [];
	thisController.searchString = '';
	thisController.currentClient = {};

	this.doSearch = function() {
		thisController.dataLoading = true;
		if(thisController.searchString.length > 0) {
			thisController.clients = api.findClients(thisController.searchString, function(cls){
				thisController.clients = cls.clients;
				thisController.dataLoading = false;
				if(!thisController.loaded) thisController.loaded = true;
				$rootScope.$digest();
			});
		} else {
			thisController.clients = api.getAllClients(function(data) {
				thisController.clients = data.clients;
				thisController.dataLoading = false;
				if(!thisController.loaded) thisController.loaded = true;
				$rootScope.$digest();
			});
		}
		if(thisController.clients) {
			thisController.loaded = true;
		}
	};

	this.edit = function(cl) {
		thisController.currentClient = cl;
		jQuery('#clientModal').openModal();
	};
	this.save = function() {
		this.dataLoading = true;
		if(thisController.currentClient.client_id)
			api.updateClient(thisController.currentClient, function(){
				thisController.dataLoading = false;
			});
		else
			api.addClient(thisController.currentClient, function(updated){
				thisController.clients = updated;
				thisController.dataLoading = false;
				$rootScope.$digest();
			});
	};
	this.create = function() {
		thisController.currentClient = {
			fisrtname: '',
			lastname: '',
			patron: '',
			email: '',
			phone: ''
		};
		jQuery('#clientModal').openModal();
	};
	this.remove = function(cl) {
		var client = cl;
		modal.okCancelDialog("Вы уверены, что хотите удалить клиента?",
			function(){
				thisController.dataLoading = true;
				$rootScope.$digest();
				thisController.clients = api.removeClient(client, function(){
					thisController.doSearch();
				}, function() {
					thisController.dataLoading = true;
					client.id = undefined;
					api.addClient(client, function() {
						thisController.doSearch();
					}, true);
				});
			},
			null,"Внимание");
	};
	this.doSearch();
}]);