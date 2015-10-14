app.controller('ScriptRunController', ['api', '$rootScope', '$routeParams', 'notification', 'modal', function (api, $rootScope, $routeParams, notification, modal) {
	"use strict";
	//--------------------------------------------------------
    // Closure for this controller
    //--------------------------------------------------------
	
	var thisObj = this
	
	//--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
	
	this.ready = false;

	this.nodes = {}; //Index of nodes
	
	this.scriptId = -1;

	this.isLoading = true;

	this.client = new Model(Models.client({}));

	this.manager = {
		name: api.getCurrentUser().firstname
	};

	this.step = {
		questionId: -1,
		question: "Загрузка...",
		answers: []
	};

	this.quickLinks = [];
	
	
	//--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------
	
	this.selectAnswer = function (answer) {
		//Remove history about future
		if (this.hasNext()) {
			history.data.splice(history.current + 1, history.data.length - history.current - 1);
		}
		history.current = history.data.length - 1;
		if (answer.next) {
			populateStep(answer.next);
			if (this.step.answers.length === 0) {
				//If there are no answers
				this.step.answers = [{ text: 'Завершить выполнение скрипта' }];
			}
			history.data.push(saleman_misc.copyObj(this.step));
			history.current = history.data.length - 1;
		} else {
			//Script's run finished
			this.step.question = 'Выполнение скрипта завершено';
			this.step.answers = [];
			history.current++;
		}
	};

	this.hasNext = function () {
		if (history.data.length > (history.current + 1)) {
			return true;
		} else {
			return false;
		}
	};
	this.hasPrev = function () {
		if (history.data[history.current - 1]) {
			return true;
		} else {
			return false;
		}
	};

	this.next = function () {
		if (this.hasNext()) {
			var ans = history.data[++history.current];
			populateStep(ans.questionId);
		}
	};
	this.prev = function () {
		if (this.hasPrev()) {
			var ans = history.data[--history.current];
			populateStep(ans.questionId);
		}
	};

	this.setQuickLink = function (lnkId) {
		populateStep(saleman_misc.findFirstNotNullElement(this.nodes[lnkId].linksTo));
		history.data.push(saleman_misc.copyObj(this.step));
		history.current = history.data.length - 1;
	};

	this.saveClient = function () {
		this.client.validate();
		if (this.client.valid) {
			api.addClient(this.client.toJson());
		} else {
			notification.info('Данные в форме неверны');
		}
	};
	
	//--------------------------------------------------------
    // Private functions and variables
    //--------------------------------------------------------
	
	var history = {
		current: 0,
		data: []
	};

	function parseQuestion(txt) {
		var result = '',
			pointer = txt.indexOf('(('),
			prevPointer = 0;
		while (pointer != -1) {
			result += txt.substring(prevPointer, pointer);
			var end = txt.indexOf('))', pointer),
				expr = txt.substring(pointer + 2, end).toLowerCase();
			if (expr === 'имя клиента') {
				result += thisObj.client.firstname.data;
			} else if (expr === 'имя менеджера') {
				result += thisObj.manager.name;
			}
			prevPointer = end + 2;
			pointer = txt.indexOf('((', prevPointer);
			if (pointer === -1) {
				result += txt.substr(prevPointer);
				break;
			}
		}
		if (result.trim().length > 0)
			return result;
		else
			return txt;
	};

	function populateStep(nodeId) {
		thisObj.step.questionId = nodeId;
		thisObj.step.question = parseQuestion(thisObj.nodes[nodeId].text);
		thisObj.step.answers = [];
		jQuery.each(thisObj.nodes[nodeId].linksTo, function (k, v) {
			if (v) {
				var next = saleman_misc.findFirstNotNullElement(thisObj.nodes[v].linksTo);
				thisObj.step.answers.push({
					text: thisObj.nodes[v].text,
					next: (next ? next : false)
				});
			}
		});
	};


	//--------------------------------------------------------
    //Initialization code
    //--------------------------------------------------------

	if ($routeParams.scriptId) this.scriptId = $routeParams.scriptId * 1;
	if ($routeParams.clientId) this.client.id = $routeParams.clientId * 1;
	api.findScriptById(this.scriptId, function (script) {
		script.data = JSON.parse(script.script.json_string);
		thisObj.script = script;
		var entry = null;
		jQuery.each(script.data, function (idx, val) {
			thisObj.nodes[val.id] = val;
			if (val.startPoint) {
				entry = val.id;
			}
			if (val.quickLink) thisObj.quickLinks.push(val);
		});
		if (thisObj.client.id) {
			api.findClient(thisObj.client.id, function (resp) {
				thisObj.client.populate(resp.client.client);
				populateStep(entry);
				history.data.push(saleman_misc.copyObj(thisObj.step));
				history.current = history.data.length - 1;
				thisObj.isLoading = false;
				$rootScope.$digest();
			});
		} else {
			populateStep(entry);
			history.data.push(saleman_misc.copyObj(thisObj.step));
			history.current = history.data.length - 1;
			thisObj.isLoading = false;
			$rootScope.$digest();
		}
	});
}]);