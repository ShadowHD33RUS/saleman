app.controller('ClientsController', ['api', '$rootScope', 'modal', function(api, $rootScope, modal){
	var thisController = this;
	thisController.loaded = false;
	thisController.dataLoading = false;
	thisController.clients = [];
	thisController.searchString = '';
	thisController.clientsCached = [];
	thisController.currentClient = {};
	
	var updateList = function() {
		api.getAllClients(function(data) {
			thisController.clients = data.clients;
			thisController.loaded = true;
			thisController.dataLoading = false;
			$rootScope.$digest();
		});
	};

	this.doSearch = function() {
		thisController.dataLoading = true;
		if(thisController.searchString.length > 0) {
			api.findClients(thisController.searchString, function(cls){
				thisController.clients = cls.clients;
				thisController.dataLoading = false;
				$rootScope.$digest();
			});
		} else {
			api.getAllClients(function(data) {
				thisController.clients = data.clients;
				thisController.dataLoading = false;
				$rootScope.$digest();
			});
		}
	};

	this.edit = function(cl) {
		thisController.currentClient = cl;
		jQuery('#clientModal').openModal();
	};
	this.save = function() {
		if(thisController.currentClient.client_id)
			api.updateClient(thisController.currentClient);
		else
			api.addClient(thisController.currentClient);
		updateList();
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
				api.removeClient(client, function(){
					updateList();
				}, function() {
					thisController.dataLoading = true;
					client.id = undefined;
					api.addClient(client, function() {
						updateList();
					}, true);
				});
			},
			null,"Внимание");
	};
	updateList();
}]);