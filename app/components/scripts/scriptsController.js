app.controller('ScriptsController', ['api', '$rootScope', 'notification', 'modal', function(api, $rootScope, notification, modal){
	var thisController = this;
	thisController.loaded = false;
	thisController.dataLoading = true;
	thisController.searchString = '';
	thisController.scripts = [];

	this.doSearch = function() {
		thisController.dataLoading = true;
		thisController.scripts = api.findScripts(thisController.searchString, 0, function(data){
			thisController.scripts = data.scripts;
			thisController.dataLoading = false;
			$rootScope.$digest();
		});
		thisController.loaded = true;
	};

	this.preDelete = function (idToDelete) {
		modal.okCancelDialog('Вы действительно хотите удалить данный скрипт? Это действие нельзя отменить!',
		function(){ // OK button in dialog
			thisController.dataLoading = true;
			api.removeScript(idToDelete, function() { // Action
				thisController.doSearch();
				thisController.dataLoading = false;
			}, function() { // Undo action
				thisController.dataLoading = false;
			});
		}, null, "Внимание!");
	};
	
	this.doSearch();
}]);