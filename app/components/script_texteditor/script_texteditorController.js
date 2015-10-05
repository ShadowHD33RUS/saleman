app.controller('ScriptTextEditorController', ['api', '$rootScope', '$routeParams', 'notification', 'modal', '$scope', '$location', function (api, $rootScope, $routeParams, notification, modal, $scope, $location) {
	
	//Public variables
	
	this.isLoading = false;
	this.quickLinks = [];
	this.step = {
		questionId: -1,
		question: '',
		answers: []
	};
	this.scriptId = -1;
	
	this.newAnswer = {
		id: -1,
		text: 'Новый ответ',
		linkTo: -1,
		filtered: [],
		search: '',
		clear: function() {
			this.text = 'Новый ответ';
			this.linkTo = -1;
			this.filtered = [];
			this.search = '';
			this.id = -1;
		}
	};
	this.scriptName = '123';
	
	//Private variables and functions
	
	var script = {},
		history = {
			current: -1,
			data: []
		};
		
	var populateStep = function(nodeId) {
		var scriptNode = script.nodes[nodeId];
		var step = {
			questionId: nodeId,
			question: scriptNode.text,
			answers: []
		};
		jQuery.each(scriptNode.linksTo, function(k,v){
			if(v && script.nodes[v]) {
				var nextNode = script.nodes[v],
					answerNext = findFirstNotNullElement(nextNode.linksTo);
				step.answers.push({
					id: nextNode.id,
					text: nextNode.text,
					next: answerNext ? answerNext : false
				});
			}
		});
		//Save current step data before we change it
		if(thisObj.step.questionId > 0) {
			script.nodes[thisObj.step.questionId].text = thisObj.step.question;
			jQuery.each(thisObj.step.answers, function(k,v){
				script.nodes[v.id].text = v.text;
			});
		}
		thisObj.step = step;
		//See if we need digest here
		// $rootScope.$digest();
		setTimeout(function(){
			jQuery('.dropdown-button').dropdown({
				inDuration: 300,
				outDuration: 225,
				constrain_width: false, // Does not change width of dropdown to that of the activator
				hover: false, // Activate on hover
				gutter: 0, // Spacing from edge
				belowOrigin: false, // Displays dropdown below the button
				alignment: 'left' // Displays dropdown with edge aligned to the left of button
			});
			jQuery('[data-tooltip]').filter(':not([data-tooltip-id])').tooltip({delay:100});
		},0);
	};
	var createAnswer = function() {
		//Generate valid id for node
		var validId = -1,
			answer;
		for(var i in script.nodes) {
			i = parseInt(i);
			if(validId < i) {
				validId = i;
			}
		}
		//Create answer structure
		answer = {
			id: validId+1,
			isAnswer: true,
			linksTo: [],
			quickLink: false,
			startPoint: false,
			text: "Новый ответ"
		};
		return answer;
	}, createQuestion = function() {
		var question = createAnswer();
		question.text = 'Новый вопрос';
		question.isAnswer = false;
		return question;
	};
	
	// Public functions
	
	this.hasNext = function() {
		if(history.data.length > (history.current+1)) {
			return true;
		} else {
			return false;
		}
	};
	this.hasPrev = function() {
		if(history.data[history.current-1]) {
			return true;
		} else {
			return false;
		}
	};
	
	this.next = function() {
		if(this.hasNext()) {
			var ans = history.data[++history.current];
			populateStep(ans.questionId);
		}
	};
	this.prev = function() {
		if(this.hasPrev()) {
			var ans = history.data[--history.current];
			populateStep(ans.questionId);
		}
	};
	this.doSearch = function() {
		var a = [], b = this.newAnswer.search;
		for(var i in script.nodes) {
			if(script.nodes[i] && !script.nodes[i].isAnswer && script.nodes[i].text.toLowerCase().indexOf(b.toLowerCase()) !== -1) {
				a.push(script.nodes[i]);
			}
		}
		this.newAnswer.filtered = a;
	};
	this.saveScript = function(callback) {
		var result = {
			data: [],
			name: ''
		};
		jQuery.each(script.nodes, function(idx, val) {
			result.data.push(val);
		});
		result.name = this.scriptName	;
		if(thisObj.scriptId) {
			result.id = thisObj.scriptId;
			api.updateScript(result, function(){
				callback(result.id);
			});
		} else {
			api.addScript(result, function(res){
				callback(res.script_id);
			});
		}
	};
	this.switchToTree = function() {
		this.saveScript(function(id){
			$location.path('/scripttree/'+id);
			$rootScope.$digest();
		});
	};
	this.removeAnswer = function(answer) {
		delete script.nodes[answer.id];
		saleman_misc.removeElement(answer.id, script.nodes[this.step.questionId].linksTo);
		populateStep(this.step.questionId);
	};
	this.addAnswer = function() {
		this.newAnswer.clear();
		this.doSearch();
		jQuery('#modal').openModal();
		jQuery('#modal').find('label').removeClass('active');
	};
	this.editAnswer = function(answer) {
		this.newAnswer.clear();
		this.newAnswer.id = answer.id;
		this.newAnswer.text = answer.text;
		this.newAnswer.linkTo = answer.next ? answer.next : -1;
		if(answer.next)
			this.newAnswer.search = script.nodes[answer.next].text.substr(0, 20);
		this.doSearch();
		jQuery('#modal').openModal();
		jQuery('#modal').find('label').addClass('active');
	};
	this.selectQuestion = function(id) {
		this.newAnswer.linkTo = id;
		this.confirmAddAnswer();
	};
	this.questionActive = function(question) {
		return question.id === this.newAnswer.linkTo;
	};
	this.confirmAddAnswer = function() {
		var answer = createAnswer();
		if(this.newAnswer.id > 0) answer.id = this.newAnswer.id;
		answer.text = this.newAnswer.text;
		if(this.newAnswer.linkTo > 0)
			answer.linksTo.push(this.newAnswer.linkTo);
		script.nodes[answer.id] = answer;
		//Connect current question to newly created answer
		if(this.newAnswer.id <= 0)
			script.nodes[this.step.questionId].linksTo.push(answer.id);
		jQuery('#modal').closeModal();
		populateStep(this.step.questionId);
	};
	this.newQuestion = function(answer) {
		var q = createQuestion();
		script.nodes[q.id] = q;
		script.nodes[answer.id].linksTo.push(q.id);
		answer.next = q.id;
		this.selectAnswer(answer);
	};
	this.selectAnswer = function(answer) {
		if(this.hasNext()) {
			history.data.splice(history.current+1,history.data.length-history.current-1);
		}
		history.current = history.data.length-1;
		if(answer.next) {
			populateStep(answer.next);
			history.data.push(this.step);
			history.current = history.data.length-1;
		} else {
			notification.info("Нет дальнейшей связи для перехода");
		}
	};
	this.quick = function(answer) {
		if(answer.isQuick) {
			return 'Удалить из быстрых';
		} else {
			return 'Добавить в быстрые';
		}
	};
	this.canCreateNew = function(answer) {
		return (true && answer.next);
	};
	this.toggleQuick = function(answer) {
		if(answer.isQuick) {
			//Delete answer from array of quick links
			jQuery.each(thisObj.quickLinks, function(idx, val) {
				if(val.id === answer.id) {
					thisObj.quickLinks.splice(idx,1);
					return false;
				}
			});
		} else {
			//Push to array of quick links
			thisObj.quickLinks.push(answer);
		}
		answer.isQuick = !answer.isQuick;
	};
	
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
	
	//Initialization code
	var scriptId = $routeParams.id ? 1 * $routeParams.id : false;
	this.scriptId = scriptId ? scriptId : -1;
	var nodeId = $routeParams.nodeId ? 1 * $routeParams.nodeId : false;
	var thisObj = this;
	if(scriptId) {
		console.log('script fetching...');
		api.findScriptById(scriptId, function (fetchedScript) {
			fetchedScript.data = JSON.parse(fetchedScript.script.json_string);
			script = fetchedScript;
			thisObj.scriptName = script.script.script_name;
			script.nodes = {};
			var entry = null;
			jQuery.each(script.data, function (idx, val) {
				script.nodes[val.id] = val;
				if (val.startPoint) {
					entry = val.id;
				}
				if (val.quickLink) thisObj.quickLinks.push(val);
			});
			populateStep(entry);
			history.data.push(thisObj.step);
			history.current = history.data.length-1;
			thisObj.isLoading = false;
			$rootScope.$digest();
			console.log();
		});
	} else {
		//Not valid
		console.error("cannot extract necessary params from route");
	}
	$scope.$watchCollection('scriptEditCtrl.quickLinks', function(){
		setTimeout(function(){
			jQuery('h5 + div.collection').find('[data-tooltip]').filter(':not([data-tooltip-id])').tooltip({delay:100});
		},0);
		
	});
}]);