app.controller('ScriptsController', ['api', '$rootScope', 'notification', 'modal', function (api, $rootScope, notification, modal) {
	"use strict";
	//--------------------------------------------------------
    // Closure for this controller
    //--------------------------------------------------------
	
	var thisController = this;
	
	
	//--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
	
	this.loaded = false;

	this.dataLoading = true;

	this.searchString = '';

	this.scripts = [];


	//--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------

	this.doSearch = function () {
		this.dataLoading = true;
		this.scripts = api.findScripts(this.searchString, 0, function (data) {
			thisController.scripts = data.scripts;
			thisController.dataLoading = false;
			$rootScope.$digest();
		});
		this.loaded = true;
	};

	this.preDelete = function (idToDelete) {
		modal.okCancelDialog('Вы действительно хотите удалить данный скрипт? Это действие нельзя отменить!',
			function () { // OK button in dialog
				thisController.dataLoading = true;
				api.removeScript(idToDelete, function () { // Action
					thisController.doSearch();
					thisController.dataLoading = false;
				}, function () { // Undo action
					thisController.dataLoading = false;
				});
			}, null, "Внимание!");
	};
	
	
	//--------------------------------------------------------
    //Initialization code
    //--------------------------------------------------------
	
	this.doSearch();
}]);