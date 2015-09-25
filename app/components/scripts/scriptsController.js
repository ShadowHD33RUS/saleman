app.controller('ScriptsController', ['api', '$rootScope', 'notification', 'modal', function(api, $rootScope, notification, modal){
	var thisController = this;
	thisController.loaded = false;
	thisController.dataLoading = true;
	thisController.scripts = [];
	thisController.searchString = '';

	var updateList = function(page) {
		if(!page) page = 0;
		api.findScripts('', page, function(data) {
			thisController.scripts = data.scripts;
			thisController.loaded = true;
			thisController.dataLoading = false;
			$rootScope.$digest();
		});
	};

	this.doSearch = function() {
		api.findScripts(thisController.searchString, function(data){
			thisController.scripts = data.scripts;
			$rootScope.$digest();
		});
	};

	this.preDelete = function (idToDelete) {
		modal.okCancelDialog('Вы действительно хотите удалить данный скрипт? Это действие нельзя отменить!',
		function(){ // OK button in dialog
			thisController.dataLoading = true;
			api.removeScript(idToDelete, function() { // Action
				updateList();
			}, function() { // Undo action
				thisController.dataLoading = true;
				
			});
		}, null, "Внимание!");
	};
	
	updateList();
}]);