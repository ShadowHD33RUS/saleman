app.controller('ScriptRunController', ['api', '$rootScope', '$routeParams', 'notification', 'modal', function (api, $rootScope, $routeParams, notification, modal) {
	this.ready = false;
	this.nodes = {}; //Index of nodes
	this.isLoading = true;

	var clientModel = new Model(Models.client({}));

	this.manager = {
		name: api.getCurrentUser().firstname
	};
	this.client = {
		name: '',
		phone: '',
		address: ''
	};
	this.step = {
		question: "Загрузка...",
		answers: []
	};
	this.quickLinks = [];
	var findFirstNotNullElement = function (arr) {
		var result = null;
		jQuery.each(arr, function (ke, va) {
			if (va) {
				result = va;
				return false;
			}
		});
		return result;
	};
	var thisObj = this,
		id = $routeParams.scriptId,
		parseQuestion = function (txt) {
			var result = '',
				pointer = txt.indexOf('(('),
				prevPointer = 0;
			while (pointer != -1) {
				result += txt.substring(prevPointer, pointer);
				var end = txt.indexOf('))', pointer),
					expr = txt.substring(pointer + 2, end),
					del = expr.split('.');
				if (del.length === 2) {
					if (del[0] === 'manager') {
						if (del[1] === 'name') {
							result += thisObj.manager.name;
						}
					} else if (del[0] === 'client') {
						if (del[1] === 'name') {
							result += thisObj.client.name;
						}
					}
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
		},
		populateStep = function (nodeId) {
			thisObj.step.question = parseQuestion(thisObj.nodes[nodeId].text);
			thisObj.step.answers = [];
			jQuery.each(thisObj.nodes[nodeId].linksTo, function (k, v) {
				if (v) {
					var next = findFirstNotNullElement(thisObj.nodes[v].linksTo);
					thisObj.step.answers.push({
						text: thisObj.nodes[v].text,
						next: (next ? next : false)
					});
				}
			});
		};

	if (id) id = id * 1;
	api.findScriptById(id, function (script) {
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
		populateStep(entry);
		thisObj.isLoading = false;
		$rootScope.$digest();
	});

	this.selectAnswer = function (answer) {
		if (answer.next) {
			populateStep(answer.next);
			if (this.step.answers.length === 0) {
				this.step.answers = [{ text: 'Завершить выполнение скрипта' }];
			}
		} else {
			this.step.question = 'Выполнение скрипта завершено';
			this.step.answers = [];
		}
	};
	this.setQuickLink = function (lnkId) {
		populateStep(findFirstNotNullElement(this.nodes[lnkId].linksTo));
	};
	this.saveClient = function () {
		var words = this.client.name.trim().split(" ");
		if (words.length == 1) {
			//Firstname only
			clientModel.firstname.data = words[0];
		} else if (words.length == 2) {
			//Firstname and patron
			clientModel.firstname.data = words[0];
			clientModel.patron.data = words[1];
		} else if (words.length == 3) {
			//Full fio
			clientModel.lastname.data = words[0];
			clientModel.firstname.data = words[1];
			clientModel.patron.data = words[2];
		} else {
			modal.info('В поле "Имя клиента" должно быть либо имя, либо имя-отчество, либо фамилия-имя-отчество');
		}
		clientModel.phone.data = this.client.phone;
		clientModel.email.data = this.client.address;
		clientModel.validate();
		if(clientModel.valid) {
			api.addClient(clientModel.toJson());
		} else {
			notification.info('Данные в форме неверны');
		}
	};
}]);