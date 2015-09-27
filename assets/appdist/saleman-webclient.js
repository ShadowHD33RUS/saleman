/*
  LEARN HOW TO USE COMPOSERS AND COMPRESSORS FOR JAVASCRIPT
*/

var app = angular.module('saleman', ['ngRoute', 'api', 'notify']);

app.directive('viewDropdown', function () {
  return function (scope, element, attrs) {
    if(scope.$last) {
      jQuery('.dropdown-button').dropdown({
          inDuration: 300,
          outDuration: 225,
          constrain_width: false, // Does not change width of dropdown to that of the activator
          hover: true, // Activate on hover
          gutter: 0, // Spacing from edge
          belowOrigin: false // Displays dropdown below the button
        }
      );
    }
  }
});;

app.run(['$rootScope', '$location', 'api', 'notification', function($rootScope, $location, api, notification){
  
  $rootScope.$on("$routeChangeStart", function(event, next, current) {
    if(!api.isLoggedIn() && (
      (next.templateUrl !== "app/components/login/login.html") &&
      (next.templateUrl !== "app/components/registration/registration.html") &&
      (next.templateUrl !== "app/components/recover/recover.html")
      )) {
      notification.info('Необходимо войти в систему');
      $location.path("/login");
    } else {
      //Requested component
      var comp = next.templateUrl.substring(15, next.templateUrl.indexOf('/', 15));
      if(api.isLoggedIn() && api.getCurrentUser().blocked && (
        comp !== 'payment' ||
        comp !== 'accounts' ||
        comp !== 'clients'
        )) {
        notification.info('Ваш аккаунт заблокирован');
        notification.info('Пожалуйста, оплатите для дальнейшего пользования');
        $location.path('/payment');
      }
    }
  });
}]);


app.config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/login', {
      templateUrl: 'app/components/login/login.html',
      controller: 'LoginController',
      controllerAs: 'loginCtrl'
    })
    .when('/register', {
      templateUrl: 'app/components/registration/registration.html',
      controller: 'RegistrationController',
      controllerAs: 'regCtrl'
    })
    .when('/clients', {
      templateUrl: 'app/components/clients/clients.html',
      controller: 'ClientsController',
      controllerAs: 'clientsCtrl'
    })
    .when('/scripts', {
      templateUrl: 'app/components/scripts/scripts.html',
      controller: 'ScriptsController',
      controllerAs: 'scriptsCtrl'
    })
    .when('/scripttree/:scriptId', {
      templateUrl: 'app/components/script_editor/script_editor.html',
      controller: 'ScriptEditorController',
      controllerAs: 'editorCtrl'
    })
    .when('/scriptrun/:scriptId', {
      templateUrl: 'app/components/script_run/scriptrun.html',
      controller: 'ScriptRunController',
      controllerAs: 'scriptRunCtrl'
    })
    .when('/support', {
      templateUrl: 'app/components/support/support.html',
      controller: 'SupportController',
      controllerAs: 'supportCtrl'
    })
    .when('/convert', {
      templateUrl: 'app/components/convert/convert.html',
      controller: 'ConvertController',
      controllerAs: 'convertCtrl'
    })
    .when('/accounts', {
      templateUrl: 'app/components/accounts/accounts.html',
      controller: 'AccountsController',
      controllerAs: 'accountsCtrl'
    })
    .when('/recover', {
      templateUrl: 'app/components/recover/recover.html',
      controller: 'RecoverController',
      controllerAs: 'recoverCtrl'
    })
    .when('/notready', {
      templateUrl: 'app/components/notready/notready.html',
    })
    .otherwise({
      redirectTo: '/login'
    });
}]);;app.controller('AccountsController', ['api', 'notification', '$rootScope', function (api, notification, $rootScope) {
    var thisController = this;
    this.currentAccount = {
        first_name: '',
        last_name: '',
        patron: '',
        email: '',
        password: ''
    };
    this.perms = {
        scriptReadPermission: false,
        scriptEditPermission: false,
        clientReadPermission: false,
        clientEditPermission: false
    };
    
    this.searchString = '';
    this.accounts = [];
    this.filteredAccounts = [];

    this.save = function () {
        toggleEditBox(false);
        if (this.currentAccount.manager_id) {
            api.updateAccount(this.currentAccount, function (result) {
                if (result.code !== '1') {
                    toggleEditBox(true);
                } else {
                    api.setPermission(thisController.currentAccount.manager_id, thisController.perms, function () {
                        toggleEditBox(true);
                    });
                }
            }, function() {
                toggleEditBox(true);
            });
        } else {
            api.createAccount(this.currentAccount, function (result) {
                if (result.code !== '1') {
                    toggleEditBox(true);
                } else {
                    api.setPermission(result.account_id, thisController.perms, function () {
                        toggleEditBox(true);
                    });
                }
            });
        }

    };

    this.createNew = function () {
        this.currentAccount = {
            first_name: '',
            last_name: '',
            patron: '',
            email: '',
            password: ''
        };
        jQuery('#editor').find('label').removeClass('active');
        toggleEditBox(true);
        //$scope.$apply();
    };

    this.selectAccount = function (account) {
        toggleEditBox(false);
        this.currentAccount = account;
        api.getAccount(account.manager_id, function (result) {
            thisController.currentAccount.first_name = result.account.account.firstname;
            thisController.currentAccount.last_name = result.account.account.lastname;
            thisController.currentAccount.patron = result.account.account.patron;
            for (var i in thisController.perms) {
                thisController.perms[i] = result.account.account[i];
            }
            toggleEditBox(true);
            $rootScope.$digest();
        });
        //$scope.$apply();
    };

    this.doSearch = function () {
        thisController.filteredAccounts = [];
        jQuery.each(thisController.accounts, function (k, v) {
            if (v.email.toLowerCase().indexOf(thisController.searchString.toLowerCase()) !== -1)
                thisController.filteredAccounts.push(v);
        });
        //$scope.$apply();
    };

    this.isActive = function (account) {
        return account === this.currentAccount;
    };

    var toggleEditBox = function (switchOn) {
        if (switchOn) {
            jQuery('#editor').find('input').removeAttr('disabled');
            jQuery('#editor').find('label').addClass('active');
        } else {
            jQuery('#editor').find('input').attr('disabled', 'true');
        }
    };
    
    //Init
    toggleEditBox(false);
    thisController.filteredAccounts = api.findAccounts(0, function (result) {
        thisController.accounts = result.managers;
        thisController.filteredAccounts = thisController.accounts;
        $rootScope.$digest();
    });
    thisController.accounts = thisController.filteredAccounts;
}]);

/*

4)Создание менеджера /api/account/createAccount

Запрос:
{
"first_name":"Иван",
"last_name":"Тимофеев",
"patron":"Олегович",
"email":"men1@yandex.ru",
"password":"4815162342lost"
}
Ответ:
{
    "code": "1",
    "message": "Account is created successfully",
    "account_id": 2
}

5) Обновление менеджера /api/account/updateAccount
Запрос:
{
"account_id":"2",
"first_name":"Вова",
"last_name":"Тимофеев",
"patron":"Олегович",
"email":"men1@yandex.ru",
"password":"4815162342lost"
}
Ответ:
{
    "code": "1",
    "message": "Account is updated successfully",
    "account_id": 2
}

6) Удаление менеджера /api/account/removeAccount
Запрос:
{
"account_id":"2"
}
Ответ:
{
    "code": "1",
    "message": "Account is removed successfully",
    "account_id": 2
}

7) Получение менеджера по id /api/account/findById
Запрос:
{
"account_id":"3"
}
Ответ:
{
    "code": "1",
    "message": "Connection is installed successfully",
    "account": {
        "account": {
            "accountId": 2,
            "email": "men1@yandex.ru",
            "firstname": "Иван",
            "lastname": "Тимофеев",
            "patron": "Олегович",
            "rolename": "ROLE_ADMIN",
            "admin": false,
            "clientReadPermission": true,
            "clientEditPermission": true,
            "scriptReadPermission": false,
            "scriptEditPermission": false,
            "logPermission": false,
            "paymentPermission": false,
            "taskPermission": false,
            "analiticsPermission": false
        },
        "creator": {
            "account_id": 1,
            "email": "kiberaction@yandex.ru"
        }
    }
}

8) Поиск менеджеров

Запрос:
{
"currentPosition":"0",
"count":"10"
}
Ответ:
{
    "code": "1",
    "message": "Connection is insatelled successfully",
    "count": 1,
    "currentPosition": 0,
    "managers": [{
        "manager_id": 2,
        "email": "men1@yandex.ru",
        "creator": {
            "account_id": 1,
            "email": "kiberaction@yandex.ru"
        }
    }]
}

*/;app.controller('ClientsController', ['api', '$rootScope', 'modal', 'notification', function(api, $rootScope, modal, notification){
	var thisController = this;
	thisController.loaded = false;
	thisController.dataLoading = false;
	thisController.clients = [];
	thisController.searchString = '';
	thisController.currentClient = {};
	thisController.clientModel = new Model({
		email: ModelConfig.email(false),
		firstname: ModelConfig.firstName(true),
		lastname: ModelConfig.lastName(false),
		patron: ModelConfig.patron(false),
		phone: ModelConfig.phone(false)
	});
	

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
		for(var k in cl) {
			if(thisController.clientModel[k]) {
				thisController.clientModel[k].data = cl[k];
			}
		}
		thisController.clientModel.client_id = cl.client_id;
		jQuery('#clientModal').openModal();
	};
	this.save = function() {
		thisController.clientModel.validate();
		if(thisController.clientModel.valid) {
			jQuery('#clientModal').closeModal();
			this.dataLoading = true;
			if(thisController.clientModel.client_id)
				api.updateClient(thisController.clientModel.toJson([]), function(){
					thisController.dataLoading = false;
				});
			else
				api.addClient(thisController.clientModel.toJson([]), function(updated){
					thisController.clients = updated;
					thisController.dataLoading = false;
					$rootScope.$digest();
				});
		} else {
			notification.info('Исправьте данные');
		}
	};
	this.create = function() {
		thisController.clientModel.clearData();
		delete thisController.clientModel.client_id;
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
}]);;app.controller('ConvertController', ['api', 'notification', function(api, notification){
    //Check for needed File API support
    this.apiSupport = false;
    if (window.File && window.FileReader) {
        this.apiSupport = true;
    } else {
        notification.info("Импорт не будет работать. Обновите ваш браузер");
    }
    /**
     * Algorhytm:
     * 1) Parse nodes
     * 2) Parse quick links
     * */
    this.importScript = function() {
        var f = jQuery('#oldFile')[0];
        for(var i = 0; i < f.files.length; i++) {
            var reader = new FileReader(),
            script = {
                data: [],
                cache: {},
                answers: [],
                name: jQuery('#oldFile').parent().parent().find('input[type="text"]').val()
            };
            reader.onload = function() {
                var xmlDoc = jQuery.parseXML(reader.result);
                
                //Receive all nodes from document
                var nodes = xmlDoc.querySelectorAll('Pages > Item');
                
                //Used to generate id for answers
                var genId = 0,
                answerId = 0;
                
                //Parse nodes
                jQuery.each(nodes, function(k, v) {
                    //Parse node with their answers
                    var currentNode = {};
                    
                    //Parse question
                    currentNode.id = 1*v.getElementsByTagName('Id')[0].innerHTML;
                    
                    //Ахтунг!!! Говнокод!!!
                    if(currentNode.id === 0) currentNode.startPoint = true;
                    
                    var text1 = v.getElementsByTagName('Text1');
                    var text2 = v.getElementsByTagName('Text2');
                    currentNode.text = (text1.length > 0 ? text1[0].innerHTML : '') + '\n' + (text2.length > 0 ? text2[0].innerHTML : '');
                    currentNode.isAnswer = false;
                    currentNode.linksTo = [];
                    
                    genId = genId <= currentNode.id ? currentNode.id + 1 : genId;
                    
                    //Parse answers
                    var answers = v.querySelectorAll('Answers > Item');
                    jQuery.each(answers, function(j, h) {
                        var ans = {};
                        ans.id = answerId++;
                        ans.text = h.getElementsByTagName('Text')[0].innerHTML;
                        ans.isAnswer = true;
                        var linkTo = 1*h.getElementsByTagName('LinkID')[0].innerHTML;
                        if(linkTo >= 0) {
                            ans.linksTo = [linkTo];
                        } else {
                            ans.linksTo = [];
                        }
                        
                        currentNode.linksTo.push(ans.id);
                        script.answers.push(ans);
                    });
                    
                    //Store script node in cache structure for easy access
                    script.cache[currentNode.id] = currentNode;
                });
                
                //Parse quick links
                var quickLinks = xmlDoc.querySelectorAll('QuickLink > Item');
                jQuery.each(quickLinks, function(k, v){
                    var lnk = {
                        id: answerId++,
                        text: v.getElementsByTagName('Text')[0].innerHTML,
                        isAnswer: true,
                        linksTo: [1*v.getElementsByTagName('LinkID')[0].innerHTML],
                        quickLink: true
                    };
                    script.answers.push(lnk);
                });
                
                //Add required id to all answers and update all question links to them
                jQuery.each(script.cache, function(k, v) {
                    for(var j = 0; j < v.linksTo.length; j++) {
                        v.linksTo[j] += genId;
                    }
                    script.data.push(v);
                });
                jQuery.each(script.answers, function(k, v) {
                   v.id += genId;
                   script.data.push(v);
                });
                
                //script data contains all required data to store script now
                api.addScript(script, function(res){
                    if(res.code === '1')
                        notification.info("Скрипт импортирован");
                });
            };
            reader.readAsText(f.files[i]);
        }
    };
}]);
/*
 jsonObj.id = val.id;
 jsonObj.text = val.text;
jsonObj.isAnswer = val.isAnswer;
jsonObj.startPoint = val.startPoint != null ? val.startPoint : false;
jsonObj.linksTo = val.children;
jsonObj.x = val.fabric.left;
jsonObj.y = val.fabric.top;
jsonObj.quickLink = val.getQuickLink();
*/;app.controller('LoginController', ['$location', 'api', '$scope', '$rootScope', '$timeout', 'notification', function ($location, api, $scope, $rootScope, $timeout, notification) {
    this.model = new Model({
      login: ModelConfig.email(true),
      password: ModelConfig.password(true)
    });
    this.validate = function() {
      this.model.validate();
    };
    this.doLogin = function () {
      if(this.model.valid === undefined)
        this.model.validate();
      if(this.model.valid) {
        $('#sendButton').addClass('disabled');
        api.login(this.model.login.data, this.model.password.data, function (data) {
            if(data.error) {
                notification.info("Неверная пара логин/пароль");
                $('#sendButton').removeClass('disabled');
            } else {
                $('#sendButton').removeClass('disabled');
                $location.path("/dialogs");
                $scope.$digest();
                $rootScope.$broadcast('authChange', {});
            }
        }, function (err) {
            notification.info("Ошибка сервера");
            $('#sendButton').removeClass('disabled');
        });
      } else {
        notification.info("Исправьте поля с красным цветом");
      }
    };
}]);
;app.controller('RecoverController', ['$location', 'api', '$scope', '$rootScope', '$timeout', 'notification', function ($location, api, $scope, $rootScope, $timeout, notification) {
    this.model = new Model({
      email: ModelConfig.email(true)
    });
    this.validate = function() {
      this.model.validate();
    };
    this.doRecover = function () {
      if(this.model.valid === undefined)
        this.model.validate();
      if(this.model.valid) {
        $('#sendButton').addClass('disabled');
        api.sendRecoverEmail(this.model.email.data);
      } else {
        notification.info("Исправьте поля с красным цветом");
      }
    };
}]);
;app.controller('RegistrationController', ['$location', 'api', '$scope', 'notification', function ($location, api, $scope, notification) {
    this.user = new Model({
      email: ModelConfig.email(true),
      password: ModelConfig.password(true),
      password2: ModelConfig.password_retype('password', true),
      first_name: ModelConfig.firstName(true),
      last_name: ModelConfig.lastName(true),
      patron: ModelConfig.patron(true)
    });
    this.user.validate();
    this.register = function () {
        if(this.user.valid) {
            $('#sendButton').addClass('disabled');
            var user = this.user.toJson(['password2']);
            api.register(user, function () {
                $('#sendButton').addClass('disabled');
                notification.info("Вы успешно зарегистрировались. Теперь можете войти в систему");
                $location.path('/login');
                $scope.$apply();
            }, function (err) {
                $('#sendButton').removeClass('disabled');
                notification.info("Сервер ответил ошибкой");
            });
        } else {
          notification.info("Исправьте поля с красным цветом");
        }
    };
}]);
;app.controller('ScriptEditorController', ['$rootScope', '$routeParams', 'api', 'notification', 'modal', function ($rootScope, $routeParams, api, notification, modal) {
    
    // View variables
    
    this.scriptName = '';
    this.isLoading = true;
    this.quickLinks = [];

    this.removeQuickLink = function (lnk) {
        var newArray = [];
        jQuery.each(this.quickLinks, function (i, v) {
            if (lnk != v) {
                newArray.push(v);
            }
        });
        this.quickLinks = newArray;
        $rootScope.$digest();
    };

    var arrayIsEmpty = function (a) {
        for (var i = 0; i < a.length; i++) {
            if (a[i])
                return false
        }
        return true;
    };
    var thisObj = this;
    var c = jQuery('<canvas id="canv" width="' + jQuery('#treelib-holder').width() + '" height="500"></canvas>');
    jQuery('#treelib-holder').append(c);
    var cnv = new fabric.Canvas('canv', {
        selection: false,
        hoverCursor: 'pointer'
    });
    var d = new treelib.Diagram(cnv);
    var currentScript = null, isNew = false;
    var id = null;
    if ($routeParams.scriptId != '0') {
        id = $routeParams.scriptId * 1;
    }
    if (id) { // Load desired script
        api.findScriptById(id, function (script) {
            script.data = JSON.parse(script.script.json_string);
            currentScript = script;
            d.loadFromJson(currentScript.data);
            d.init();
            thisObj.quickLinks = d.getQuickLinks();
            thisObj.scriptName = currentScript.script.script_name;
            thisObj.isLoading = false;
            $rootScope.$digest();
        });
    } else { // Create new script
        thisObj.isLoading = false;
        var currentScript = {
            name: 'Новый скрипт',
            data: [
                {
                    id: 1,
                    text: 'Точка входа',
                    isAnswer: false,
                    startPoint: true,
                    linksTo: [2, 3]
                },
                {
                    id: 2,
                    text: 'Вариант ответа 1',
                    isAnswer: true,
                    linksTo: [4]
                },
                {
                    id: 3,
                    text: 'Вариант ответа 2',
                    isAnswer: true,
                    linksTo: [4]
                },
                {
                    id: 4,
                    text: 'Выход из скрипта',
                    isAnswer: false,
                    linksTo: []
                }
            ]
        };
        d.loadFromJson(currentScript.data);
        d.init();
        d.buildTree();
        thisObj.quickLinks = d.getQuickLinks();
        isNew = true;
        thisObj.scriptName = currentScript.name;
    }
    var
        currentSelection = null,
        isPanning = false,
        prevMousePos = null,
        origin = new fabric.Point(0, 0),
        zoomPoint = new fabric.Point(0, 0),
        nodeGap = 20;

    var onWheel = function (e) {
        e = e || window.event;
        var delta = e.deltaY || e.detail || e.wheelDelta;
        e.preventDefault();
        if (delta < 0) {
            cnv.zoomToPoint(zoomPoint, cnv.getZoom() * 1.1);
            origin.x *= 1.1;
            origin.y *= 1.1;
        } else {
            cnv.zoomToPoint(zoomPoint, cnv.getZoom() / 1.1);
            origin.x *= 1.1;
            origin.y *= 1.1;
        }
    };

    cnv.on("mouse:down", function (ev) {
        var editor = jQuery('#textEditor');
        if (ev.target) {
            if (ev.target.treelib_type === treelib.NODE) {
                if (ev.e.shiftKey && currentSelection != null) {
                    var result = d.connect(currentSelection.treelib_model, ev.target.treelib_model);
                    if (result === 1) {
                        modal.info('Нельзя соединить уже соединенные объекты','Ошибка');
                    } else if (result === 2) {
                        modal.info('Объекты одного типа нельзя соединять - вопросы с ответами, ответы с вопросами', 'Ошибка');
                    } else if (result === 3) {
                        modal.info("Узел уже ссылается на другой скрипт", "Ошибка");
                    }
                } else {
                    editor.removeAttr("disabled");
                    editor.val(ev.target.treelib_model.getText());
                }
            }
            currentSelection = ev.target;
        } else {
            editor.attr("disabled", '');
            editor.val('');
            isPanning = true;
            currentSelection = null;
        }
    });
    cnv.on("mouse:move", function (ev) {
        if (!isPanning) {
            var coords = cnv.getPointer(ev.e);
            zoomPoint.x = coords.x;
            zoomPoint.y = coords.y;
        }
    });
    if (jQuery("#treelib-holder")[0].addEventListener) {
        if ('onwheel' in document) {
            // IE9+, FF17+, Ch31+
            jQuery("#treelib-holder")[0].addEventListener("wheel", onWheel);
        } else if ('onmousewheel' in document) {
            // устаревший вариант события
            jQuery("#treelib-holder")[0].addEventListener("mousewheel", onWheel);
        } else {
            // Firefox < 17
            jQuery("#treelib-holder")[0].addEventListener("MozMousePixelScroll", onWheel);
        }
    } else { // IE8-
        jQuery("#treelib-holder")[0].attachEvent("onmousewheel", onWheel);
    }
    jQuery(window).mouseup(function () {
        isPanning = false;
        prevMousePos = null;
    });
    jQuery(window).mousemove(function (event) {
        if (isPanning) {
            if (prevMousePos !== null) {
                origin.x = event.pageX - prevMousePos[0];
                origin.y = event.pageY - prevMousePos[1];
                cnv.relativePan(origin);
            }
            prevMousePos = [event.pageX, event.pageY];
        }
    });
    jQuery('#textEditor').keyup(function () {
        if (currentSelection) {
            currentSelection.treelib_model.setText(jQuery('#textEditor').val());
        }
    });
    jQuery(window).keydown(function (e) {
        if (currentSelection && e.keyCode === 46) {
            if (!d.remove(currentSelection.treelib_model)) {
                modal.info("В дереве скрипта должен оставаться хотя бы один вопрос", "Ошибка");
            }
            currentSelection = null;
        }
    });
    jQuery("#buildTree").click(function () {
        if (currentSelection &&
            currentSelection.treelib_type === treelib.NODE) {
            d.buildTree(currentSelection.treelib_model.id);
        } else {
            d.buildTree();
        }
        //d.refresh();
    });
    jQuery('#addNew').click(function (e) {
        e.preventDefault();
        if (currentSelection && currentSelection.treelib_type === treelib.NODE) {
            if ((!currentSelection.treelib_model.isAnswer || arrayIsEmpty(currentSelection.treelib_model.children))) {
                if(!currentSelection.treelib_model.nextScript) {
                    var n = new treelib.Node({
                        id: d.generateId(),
                        text: 'Новый элемент',
                        isAnswer: !currentSelection.treelib_model.isAnswer,
                        linksTo: []
                    });
                    d.add(n);
                    d.connect(currentSelection.treelib_model, n);
                    d.buildTree(currentSelection.treelib_model.id);
                    //d.refresh();
                } else {
                    modal.info("Выбранный объект ссылается на другой скрипт", "Ошибка");
                }
            } else {
                modal.info("У объекта типа 'ответ' может быть только одна выходная стрелка", "Ошибка");
            }
        } else {
            modal.info("Для создания нового объекта необходимо выбрать какой-либо из уже существующих на диаграмме", "Ошибка");
        }
    });
    jQuery('#saveScript').click(function (e) {
        currentScript.data = d.saveToJson();
        currentScript.name = thisObj.scriptName;
        //TODO: Block all UI
        if (isNew) {
            api.addScript(currentScript, function(result){
                currentScript.id = result.script_id;
                isNew = false;
                //TODO: Unblock all UI
            });
        } else {
            api.updateScript(currentScript, function(){
                //TODO: Unblock all UI
            });
        }
    });
    jQuery('#addToFast').click(function () {
        if (currentSelection &&
            currentSelection.treelib_type === treelib.NODE) {
            if (currentSelection.treelib_model.setQuickLink(true)) {
                thisObj.quickLinks.push(currentSelection.treelib_model);
                $rootScope.$digest();
            } else {
                //Current selection must be an answer, not connection or question
                modal.info("Нужно выбрать узел с ответом клиента, а не с вопросом менеджера", "Ошибка");
            }
        } else {
            //Need current selection for action
            modal.info("Необходимо выбрать узел", "Ошибка");
        }
    });
    jQuery('#transition').click(function() {
        notification.info("Простите, данная функция временно не поддерживается");
    });
}]);;app.controller('ScriptRunController', ['api', '$rootScope', '$routeParams', 'notification', 'modal', function(api, $rootScope, $routeParams, notification, modal) {
	this.ready = false;
	this.nodes = {}; //Index of nodes
	this.isLoading = true;
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
	var findFirstNotNullElement = function(arr) {
		var result = null;
		jQuery.each(arr, function(ke, va){
			if(va) {
				result = va;
				return false;
			}
		});
		return result;
	};
	var thisObj = this,
		id = $routeParams.scriptId,
		parseQuestion = function(txt){
			var result = '',
				pointer = txt.indexOf('(('),
				prevPointer = 0;
			while(pointer != -1) {
				result += txt.substring(prevPointer, pointer);
				var end = txt.indexOf('))', pointer),
					expr = txt.substring(pointer+2, end),
					del = expr.split('.');
				if(del.length === 2) {
					if(del[0] === 'manager') {
						if(del[1] === 'name') {
							result += thisObj.manager.name;
						}
					} else if(del[0]==='client') {
						if(del[1] === 'name') {
							result += thisObj.client.name;
						}
					}
				}
				prevPointer = end + 2;
				pointer = txt.indexOf('((', prevPointer);
				if(pointer === -1) {
					result += txt.substr(prevPointer);
					break;
				}
			}
			if(result.trim().length > 0)
				return result;
			else
				return txt;
		},
		populateStep = function (nodeId) {
		thisObj.step.question = parseQuestion(thisObj.nodes[nodeId].text);
		thisObj.step.answers = [];
		jQuery.each(thisObj.nodes[nodeId].linksTo, function (k,v) {
			if(v) {
				var next = findFirstNotNullElement(thisObj.nodes[v].linksTo);
				thisObj.step.answers.push({
					text: thisObj.nodes[v].text,
					next: (next ? next : false)
				});
			}
		});
	};

	if(id) id = id*1;
	api.findScriptById(id, function (script) {
		script.data = JSON.parse(script.script.json_string);
		thisObj.script = script;
		var entry = null;
		jQuery.each(script.data, function (idx, val) {
			thisObj.nodes[val.id] = val;
			if(val.startPoint) {
				entry = val.id;
			}
			if(val.quickLink) thisObj.quickLinks.push(val);
		});
		populateStep(entry);
		thisObj.isLoading = false;
		$rootScope.$digest();
	});

	this.selectAnswer = function (answer) {
		if(answer.next) {
			populateStep(answer.next);
			if(this.step.answers.length === 0) {
				this.step.answers = [{text: 'Завершить выполнение скрипта'}];
			}
		} else {
			this.step.question = 'Выполнение скрипта завершено';
			this.step.answers = [];
		}
	};
	this.setQuickLink = function(lnkId) {
		populateStep(findFirstNotNullElement(this.nodes[lnkId].linksTo));
	};
	this.saveClient = function() {
		var words = this.client.name.trim().split(" "),
			cl = {};
		if(words.length == 1) {
			cl.name = words[0];
 		} else if(words.length == 2) {
			cl.name = words[0];
			cl.patron = words[1];
		} else if(words.length == 3) {
			cl.surname = words[0];
			cl.name = words[1];
			cl.patron = words[2];
		} else {
			modal.info();
		}
		cl.phone = this.client.phone;
		cl.email = this.client.address;
		api.addClient(cl);
	};
}]);;app.controller('ScriptsController', ['api', '$rootScope', 'notification', 'modal', function(api, $rootScope, notification, modal){
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
}]);;app.controller('SupportController', ['api', 'notification', function(api, notification) {
    this.topic = "";
    this.message = "";
    this.email = api.getCurrentUser().email;
    this.send = function() {
        api.sendTechSupport("Пользователь "+api.getCurrentUser().email+" ("+api.getCurrentUser().getFullName()+") прислал письмо в тех. поддержку.\nEmail: "+this.email+"\nТема: "+this.topic+"\nСообщение: "+this.message);
    };
}]);;/*
	This is just big kostyl because basket.js doesn't suit for me - I have
	js files in different origins.
*/

var scriptCache = {};
(function(){
	
})();;(function () {
    
    //Constants
    var MAX_CLIENTS = 30;
    var urlRoot = 'http://185.87.49.173:8080/saleman';

    var currentUser = null;

    //Cache data, persist in localstorage
    var cache = {
        __store: {},
        setItem: function(collection, dataId, data) {
            if(!this.__store[collection]) this.__store[collection] = {};
            this.__store[collection][dataId] = data;
            localStorage.setItem('app_cache', JSON.stringify(this.__store));
        },
        getItem: function(collection, dataId) {
            if(this.__store[collection] && this.__store[collection][dataId]) {
                return this.__store[collection][dataId];
            } else {
                return null;
            }
        },
        getItems: function(collection, count, page) {
            if(this.__store[collection]) {
                var result = [],
                    counter = 0,
                    flag = false;
                if(!count) count = MAX_CLIENTS;
                if(!page) page = 0;
                for(var k in this.__store[collection]) {
                    counter++;
                    if(counter > (count*page)){
                        flag = true;
                        counter = 1;
                    }
                    if(flag && counter <= count)
                        result.push(this.__store[collection][k]);
                }
                return result;
            } else {
                return null;
            }
        },
        removeItem: function(collection, dataId) {
            if(this.__store[collection] && this.__store[collection][dataId]) {
                delete this.__store[collection][dataId];
            } else {
                return null;
            }
            localStorage.setItem('app_cache', JSON.stringify(this.__store));
        },
        init: function() {
            this.__store = localStorage.getItem('app_cache');
            if(this.__store) {
                this.__store = JSON.parse(this.__store);
            } else {
                console.warn("Warning: no data in local storage");
                this.__store = {};
            }
        }
    };
    //Init cache
    cache.init();

    var api = angular.module('api', ['notify']);
    api.factory('api', ['notification', '$rootScope', function (notification, $rootScope) {
        
        //Reusable code
        var errorHandler = function (err) {
            notification.info(err.error + ' (' + err.error_description + ')');
        };
        
        var sendRequest = function (url, options, resultText, validationText, resultCallback, errorCallback) {
            options.url = urlRoot + url;
            if(currentUser) {
                options.url += (url.indexOf('?') !== -1 ? '&' : '?') + 'access_token='+currentUser.accessToken;
            }
            options.success = function(res){
                var allGood = false;
                if(res.code) {
                    if(res.code === '1') {
                        if(resultText) notification.info(resultText);
                        allGood = true;
                    } else if(res.code === '2') {
                        notification.info('Произошла ошибка при обращении к серверу. Обратитесь в службу технической поддержки');
                    } else if(res.code === '3') {
                        notification.info(validationText ? validationText : 'Ошибка проверки данных. Проверьте правильность введеных вами данных');
                    } else if(res.code === '4') {
                        notification.info('У вас нет доступа для совершения этой операции. Обратитесь к администратору вашей системы');
                    }
                } else {
                    notification.info('Данные подтверждены');
                    allGood = true;
                }
                if(allGood && resultCallback)
                    resultCallback(res);
                else if(!allGood && errorCallback) errorCallback(res.code, res.message);
            };
            options.error = function () {
                if(errorCallback) {
                    errorCallback();
                }
            };
            options.dataType = 'json';
            options.contentType = 'application/json';
            if(options.data && options.data.json_string) {
                options.data.json_string = JSON.stringify(options.data.json_string).replace(/"/g, '\"');
            }
            options.data = JSON.stringify(options.data);
            if (!options.method) options.method = "POST";
            jQuery.ajax(options);
        };
        
        var refreshTokenTimerHandler = null;
        var refreshAccessToken = function(expires_in) {
            if(expires_in) {
                refreshTokenTimerHandler = setTimeout(refreshAccessToken, (expires_in-10) * 1000);
            } else {
                jQuery.ajax({
                    url: urlRoot + '/oauth/token?grant_type=refresh_token&client_id=web-client&refresh_token='+currentUser.refreshToken,
                    method: 'GET',
                    success: function(res){
                        currentUser.accessToken = res.access_token;
                        currentUser.refreshToken = res.refresh_token;
                        currentUser.expiresIn = res.expires_in;
                        cache.setItem('tokens', 'refresh', res.refresh_token);
                        refreshAccessToken(res.expires_in);
                    },
                    error: function() {
                        notification.notify('Невозможно соединиться с сервером');
                    }
                });
            }
        };
        
        var newApi = {};

        /*
         Authc/authz API section
         */

        newApi.register = function (user, callback, error) {
            sendRequest('/api/auth/register', {
                data: user
            }, 'Регистрация успешно прошла', 'Проверьте правильность введенных данных', callback, typeof error === 'function' ? error : errorHandler);
        };
        newApi.login = function (email, password, callback, error, hidden) {
            sendRequest('/oauth/token?grant_type=password&client_id=web-client&password=' + password + '&username=' + email, {
                    method: 'GET'
                }, null, null, function (result) {
                    if (!result.error) {
                        currentUser = {
                            email: email,
                            accessToken: result.access_token,
                            refreshToken: result.refresh_token,
                            expiresIn: result.expires_in
                        };
                        cache.setItem('tokens', 'refresh', result.refresh_token);
                        refreshAccessToken(20);
                        sendRequest("/api/account/getInfo", {
                            data: ''
                        }, hidden ? null : 'Вход успешно выполнен', null, function(result) {
                            currentUser.firstname = result.account.firstname;
                            currentUser.lastname = result.account.lastname;
                            currentUser.patron = result.account.patron;
                            currentUser.getFullName = function() {
                                return this.lastname + ' ' + this.firstname + ' ' + this.patron;
                            };
                            //Parse permissions
                            currentUser.perms = {};
                            jQuery.each(result.account, function(k,v){
                                var delim = k.indexOf('Permission');
                                if(delim != -1) {
                                    currentUser.perms[k.substring(0, delim)] = v;
                                }
                            });
                            currentUser.isAdmin = result.account.admin;
                            currentUser.blocked = result.company.blocked;
                            currentUser.nextPayment = result.account.next_payment;
                            if(callback) callback(result);
                        }, errorHandler);
                    } else {
                        if(callback) callback(result);
                    }
                },
                typeof error === 'function' ? error : errorHandler
            );
        };
        newApi.logout = function (callback) {
            currentUser = null;
            clearTimeout(refreshTokenTimerHandler);
            notification.info("Вы вышли из приложения");
            cache.removeItem('tokens', 'refresh');
            callback();
        };
        newApi.isLoggedIn = function () {
            return newApi.getCurrentUser() !== null;
        };
        newApi.getCurrentUser = function () {
            if(!currentUser && angular.currentUser) {
                currentUser = angular.currentUser;
                delete angular.currentUser;
                $rootScope.$broadcast('authChange', {});
            }
            return currentUser;
        };
        newApi.sendRecoverEmail = function(email) {
            sendRequest('/api/reestablishment/preReestablish?email='+email, {
                method: 'GET'
            }, 'На ваш email было выслано сообщение',
            'Проверьте правильность введенных данных');
        };

        /*
         Clients API section
         */

        newApi.getAllClients = function (callback, page) {
            if(!page) page = 0;
            sendRequest('/api/client/getClients', {
                data: {
                    "firstname":"",
                    "lastname":"",
                    "patron":"",
                    "count": MAX_CLIENTS,
                    "currentPosition":page
                }
            }, null, null, function(d){
                //Refresh data in cache
                d.clients.forEach(function(val, idx, arr){
                    cache.setItem('clients', val.client_id, val);
                });
                callback(d);
            }, errorHandler);
            return cache.getItems('clients', MAX_CLIENTS, page);
        };
        newApi.findClients = function (searchString, callback, page) {
            if(searchString.length === 0) {
                return newApi.getAllClients(callback);
            } else {
                if(!page) page = 0;
                sendRequest('/api/client/getClients', {
                    data: {
                        "firstname": '',
                        "lastname": searchString,
                        "patron": '',
                        "count": MAX_CLIENTS,
                        "currentPosition": page
                    }
                }, null, null, function(d){
                    //Refresh data in cache
                    d.clients.forEach(function(val, idx, arr){
                        cache.setItem('clients', val.client_id, val);
                    });
                    callback(d);
                }, errorHandler);
                var result = [],
                    composedFio = null,
                    cached = cache.getItems('clients');
                if(cached)
                    cached.forEach(function(val, idx, arr){
                        composedFio = val.lastname+' '+val.firstname+' '+val.patron;
                        if(composedFio.indexOf(searchString) != -1)
                            result.push(val);
                    });
                return result;
            }
        };
        newApi.addClient = function (client, callback, hidden) {
            sendRequest('/api/client/createClient',{
                data: client
            }, hidden ? null : "Клиент сохранен в базу", "Неверные данные. Проверьте корректность введенных данных", function(r){
                client.creator = {email: currentUser.email};
                client.client_id = r.client_id;
                cache.setItem('clients', r.client_id, client);
                callback(cache.getItems('clients'));
            }, errorHandler);
        };
        newApi.updateClient = function (client, callback) {
            cache.setItem('clients', client.client_id, client);
            sendRequest('/api/client/updateClient', {
                data:client
            }, "Клиент сохранен в базу", "Неверные данные. Проверьте корректность введенных данных", callback, errorHandler);
        };
        newApi.removeClient = function (client, callback, undoCallback) {
            cache.removeItem('clients', client.client_id);
            if(undoCallback)
                sendRequest('/api/client/removeClient', {
                    data: {client_id:client.client_id}
                }, null, "Невозможно удалить клиента. Обратитесь в службу поддержки", function(){
                    callback();
                    notification.infoWithAction("Клиент успешно удален", "Отмена", undoCallback);
                }, errorHandler);
            else {
                sendRequest('/api/client/removeClient', {
                    data: {client_id:client.id}
                }, "Клиент успешно удален", "Невозможно удалить клиента. Обратитесь в службу поддержки", callback, errorHandler);
            }
            return cache.getItems('clients');
        };

        /*
         Scripts API section
         */

        newApi.findScripts = function (searchString, page, callback) {
            if(!page) page = 0;
            sendRequest("/api/script/getScripts", {
                data: {
                    "string":searchString,
                    count: MAX_CLIENTS,
                    'currentPosition': (page ? page : 0)
                }
            }, null, "Произошла ошибка при выборке. Обратитесь в службу поддержки", function(data){
                data.scripts.forEach(function(val, idx, arr){
                    cache.setItem('scripts', val.script_id, val);
                });
                callback(data);
            }, errorHandler);
            var result = [],
                cached = cache.getItems('scripts', MAX_CLIENTS, page);
            if(cached)
                cached.forEach(function(val, idx, arr) {
                    if((val.script_name || val.name).toLowerCase().indexOf(searchString.toLowerCase()) != -1) {
                        result.push(val);
                    }
                });
            return result;
        };
        newApi.findScriptById = function (id, callback) {
            sendRequest("/api/script/findById", {
                data: {script_id: id}
            }, null, "Невозможно получить скрипт. Пожалуйста, обратитесь в службу поддержки", 
            function(result) {
                result.script.script.json_string = result.script.script.json_string.replace(/\"/,'"');
                callback(result.script);
            }, errorHandler);
        };
        newApi.addScript = function (script, callback) {
            sendRequest("/api/script/createScript",{
                data: {
                    script_name: script.name,
                    json_string: script.data
                }
            }, "Скрипт успешно создан", "Не удалось создать скрипт. Обратитесь в службу поддержки", function(res) {
                script.script_id = res.script_id;
                cache.setItem('scripts', res.script_id, script);
                callback(res);
            }, errorHandler);
        };
        newApi.updateScript = function (script, callback) {
            sendRequest("/api/script/updateScript",{
                data: {
                    script_id: script.id || script.script_id || script.script.script_id,
                    script_name: script.name,
                    json_string: script.data
                }
            }, "Скрипт успешно обновлен", "Невозможно обновить скрипт. Пожалуйста, обратитесь в службу поддержки",
            function(res) {
                cache.setItem('scripts', script.script_id, script);
            }, errorHandler);
        };
        newApi.removeScript = function (id, callback, undoCallback) {
            cache.removeItem('scripts', id);
            if(undoCallback) {
                sendRequest("/api/script/removeScript",{
                    data: {script_id: id}
                }, null, "Невозможно удалить скрипт. Обратитесь в службу поддержки",
                function(){
                    callback();
                    notification.infoWithAction("Скрипт успешно удален", "Отмена", undoCallback);
                }, errorHandler);
            } else {
                sendRequest("/api/script/removeScript",{
                    data: {script_id: id}
                }, null, "Невозможно удалить скрипт. Обратитесь в службу поддержки",
                callback, errorHandler);
            }
        };
        
        /*
         Tech support API section
         */

        newApi.sendTechSupport = function(message, callback){
            sendRequest('/api/support/support', {
                data: {
                    message: message
                }
            }, "Ваш вопрос будет обработан в ближайшее время", null, callback, errorHandler);
        };

        /*
         Accounts API section
         */
        
        function mapToAccount(raw) {
            var result = {
                first_name: raw.first_name,
                last_name: raw.last_name,
                patron: raw.patron,
                email: raw.email,
            };
            if(raw.password && raw.password.length > 0) result.password = raw.password;
            if(raw.manager_id) result.account_id = raw.manager_id;
            return result;
        }

        newApi.createAccount = function(account, callback) {
            sendRequest('/api/account/createAccount', {data:mapToAccount(account)},
                'Аккаунт успешно создан',
                'Неверные данные',
                function(data){
                    cache.setItem('accounts', data.account_id, account);
                    callback(data);
                },
                errorHandler
            );
        };
        newApi.updateAccount = function(account, callback, errorCallback) {
            cache.setItem('accounts', account.account_id, account);
            sendRequest('/api/account/updateAccount', {data:mapToAccount(account)},
                'Аккаунт успешно обновлен',
                'Неверные данные',
                callback,
                errorCallback
            );
        };
        newApi.removeAccount = function(id, callback) {
            cache.removeItem('accounts', id);
            sendRequest('/api/account/removeAccount', {data:{account_id:id}},
                'Аккаунт успешно обновлен',
                'Неверные данные',
                callback,
                errorHandler
            );
        };
        newApi.findAccounts = function(page, callback) {
            sendRequest('/api/account/getManagers', {
                data: {
                    currentPosition: page && page >= 0 ? page : 0,
                    count: MAX_CLIENTS
                }
            }, null, null, function(data) {
                data.managers.forEach(function(val, idx, arr){
                    cache.setItem('accounts', val.manager_id, val);
                });
                callback(data);
            }, errorHandler);
            return cache.getItems('accounts');
        };
        newApi.getAccount = function(id, callback) {
            sendRequest('/api/account/findById', {data:{account_id: id}},
                'Аккаунт загружен',
                'Неверные данные',
                callback,
                errorHandler
            );
        };
        newApi.setPermission = function(id, perms, callback){
            var opts = {account_id:id};
            for(var i in perms) {
                opts[i] = perms[i];
            }
            sendRequest('api/permission/give', {data:opts}, 'Права доступа применены', null, callback, errorHandler);
        };
    
        return newApi;
    }]);
})
();
;/**
 * This library is written to validate data from forms for my application
 */
function Model(opts) {
  var cl = this,
  service = {};
  for(var i in opts) {
    if(opts[i] && opts[i].type) {
      //String
      service[i] = {};
      if(opts[i].type === 'string') {
        this[i] = {data: opts[i].initial ? opts[i].initial : '',valid:true};
      } //Number
      else if(opts[i].type === 'number') {
        this[i] = {data:opts[i].initial ? opts[i].initial : 0,valid:true};
      } //Date
      else if(opts[i].type === 'date') {
        this[i] = {data:opts[i].initial ? opts[i].initial : new Date(),valid:true};
      }
    } else {
      this[i] = {data:'',valid: true};
    }
  }
  this.validate = function() {
    var valresult = true;
    for(var i in opts) {
      this[i].valid = true;
      if(opts[i].required || (this[i].data.length > 0)) {
        if(opts[i].eq && this[i].data !== this[opts[i].eq].data) {
          this[i].valid = false;
          this[i].cause = 'eq';
          this[i].msg = opts[i].err ? opts[i].err : 'This field must be equal to '+i;
        } else if(opts[i].type === 'string') {
          if(opts[i].regexp) {
            if(!opts[i].regexp.test(this[i].data)) {
              this[i].valid = false;
              this[i].cause = 'regexp';
              this[i].msg = opts[i].err ? opts[i].err : 'Regexp is not matching';
            }
          } else {
            if(opts[i].min) {
              if(this[i].data.length < opts[i].min) {
                this[i].valid = false;
                this[i].cause = 'short';
                this[i].msg = opts[i].err ? opts[i].err : 'too short. min - '+(opts[i].min-1);
              }
            }
            if(opts[i].max) {
              if(this[i].data.length > opts[i].max) {
                this[i].valid = false;
                this[i].cause = 'long';
                this[i].msg = opts[i].err ? opts[i].err : 'too long. max - '+(opts[i].max+1);
              }
            }
          }
        } //Number
        else if(opts[i].type === 'number') {
          if(opts[i].min) {
            if(this[i].data < opts[i].min) {
              this[i].valid = false;
              this[i].cause = 'short';
              this[i].msg = opts[i].err ? opts[i].err : 'Number must be greater than '+(opts[i].min-1);
            }
          }
          if(opts[i].max) {
            if(this[i].data > opts[i].max) {
              this[i].valid = false;
              this[i].cause = 'long';
              this[i].msg = opts[i].err ? opts[i].err : 'Number must be less than '+(opts[i].max+1);
            }
          }
        }
        valresult = valresult & this[i].valid;
      } else {
        this[i].valid = true;
      }
    }
    this.valid = valresult;
    return this.valid;
  };
  this.toJson = function(excludeFields) {
    var result = {};
    jQuery.each(opts, function(k,v){
      if(!excludeFields || excludeFields[k] == null) {
        result[k] = cl[k].data;
      }
    });
    return result;
  };
  this.clearData = function() {
    jQuery.each(opts, function(k,v){
      if(v.type === 'string')
        cl[k].data = '';
      else if(v.type === 'number')
        cl[k].data = 0;
    });
  };
}

var ModelConfig = {
  email: function(req) {return {type: 'string', regexp: /.+@[a-z]+\.[a-z]+/, required: req, err: 'Пример: qwe@gmail.com'};},
  password: function(req) { return {type: 'string', min: 6, required: req, err: 'Минимум 6 символов'}; },
  password_retype: function(eq_field, req) { return {type: 'string', eq: eq_field, required: req, err: 'Пароли не совпадают'};},
  firstName: function(req) {return {type: 'string', min: 1, required: req, err: 'Обязательное'}; },
  lastName: function(req) {return {type: 'string', min: 1, required: req, err: 'Обязательное'}; },
  patron: function(req) {return {type: 'string', min: 1, required: req, err: 'Обязательное'}; },
  companyName: function(req) {return {type: 'string', min: 1, required: req, err: 'Обязательное'}; },
  description: function(req) {return {type: 'string', required: req, err: 'Обязательное'}; },
  phone: function(req) {return {type: 'string', regexp: /(\+7|7|8){0,1}[ -]?\d{3}[ -]?\d{3}[ -]?\d{2}[ -]?\d{2}/, required: req, err: 'Пример: 8 900 123 34 45'}; },
  website: function(req) {return {type: 'string', min:3, required: req}; }
};
;(function () {

	var menus = {
		'manager': [
			{ name: 'Скрипты', location: '#/scripts' },
			{ name: 'База клиентов', location: '#/clients' },
			{ name: 'Задачи', location: '#/notready' },
			{ name: 'Тех. поддержка', location: '#/support' },
			{ name: 'Импорт', location: '#/convert' }
		],
		'admin': [
			{ name: 'Скрипты', location: '#/scripts' },
			{ name: 'База клиентов', location: '#/clients' },
			{ name: 'Задачи', location: '#/notready' },
			{ name: 'Тех. поддержка', location: '#/support' },
			{ name: 'Статистика', location: '#/notready' },
			{ name: 'Импорт', location: '#/convert' },
			{ name: 'Аккаунты', location: '#/accounts' }
		],
		'system-admin': [
			{ name: 'Цены', location: '/#/home' },
			{ name: 'Статистика использования', location: '/#/home' },
			{ name: 'Сообщения', location: '/#/home' },
			{ name: 'Настройки приложения', location: '/#/home' },
		]
	};

	app.controller('NavbarController', ['api', '$rootScope', 'notification', '$location', function (api, $rootScope, notification, $location) {
		var thisController = this;
		var item = null;
		this.username = 'initial';
		this.currentMenu = null;
		
		$rootScope.$on('authChange', function () {
			thisController.loggedIn = api.isLoggedIn();
			thisController.username = thisController.loggedIn ? api.getCurrentUser().getFullName() : '';
			//Set current menu item for user
			thisController.currentMenu = api.getCurrentUser().isAdmin ? menus.admin : menus.manager;
			//TODO: Refactor this to be managed by location
			item = thisController.currentMenu[0];
			$rootScope.$digest();
			$location.path("/scripts");
		});
		
		this.loggedIn = api.isLoggedIn();

		this.logout = function () {
			api.logout(function (params) {
				notification.info('Вы вышли из приложения');
				$rootScope.$broadcast('authChange', {});
			});
		};
		this.selectMenuItem = function (it) {
			item = it;
		};
		this.menuSelected = function (it) {
			return item === it;
		};
		
	}]);
})();;(function () {
    
    //Constants
    
    var notificationTimer = 4000;
    var modalId = "notifyModal";
    
    var defaultModalHeader = "Внимание",
    defaultOkButton = "OK",
    defaultCancelButton = "Отмена";
    
    //Variables
    
    var notificationId = 0;
    
    //Reusable private code
    
    var findModal = function() {
        var modal = jQuery('#'+modalId);
        if(modal.length === 0) {
            return createModal();
        } else {
            return modal;
        }
    };
    var createModal = function() {
        var modal = jQuery('<div id="'+modalId+'" class="modal modal-fixed-footer"><div class="modal-content"><h4 id="'+modalId+
        'Header">MODAL HEADER</h4><span id="'+modalId+'Body">BODY</span></div><div class="modal-footer" id="'+modalId+'Footer"></div></div>');
        jQuery(document.body).append(modal);
        return modal;
    };
    var setModalHeader = function(modal, content) {
        modal.find('#'+modalId+'Header').html('').html(content);
    };
    var setModalBody = function(modal, content) {
        modal.find('#'+modalId+'Body').html('').html(content);
    };
    var setModalFooter = function(modal, buttons) {
        modal.find('#'+modalId+'Footer').html('');
        jQuery.each(buttons, function(k, v) {
            jQuery('<a id="button'+k+'" class="btn modal-action modal-close">'+v.text+'</a>').appendTo(modal.find('#'+modalId+'Footer')).click(v.callback);
        });
    };
    
    // Service definition
    
    var module = angular.module('notify', []);
    module.factory('notification', function () {
        var notification = {
            info: function(text) {
                Materialize.toast(text, notificationTimer);
            },
            infoWithAction: function(bodyText, actionText, actionCallback) {
                var closeFunc = Materialize.toast('<span>'+bodyText+'</span><a class="btn-flat yellow-text" id="not'+notificationId+'">'+actionText+'<a>', notificationTimer);
                jQuery('#not'+notificationId++).click(function(){
                    actionCallback();
                    closeFunc();
                });
            }
        };
        return notification;
    });
    module.factory('modal', function () {
        var notification = {
            info: function(text, header) {
                var modal = findModal();
                setModalBody(modal, text);
                if(header) {
                    setModalHeader(modal, header);
                } else {
                    setModalHeader(modal, defaultModalHeader);
                }
                setModalFooter(modal, [{text:defaultOkButton,callback:jQuery.noop}]);
                modal.openModal();
            },
            okCancelDialog: function(text, okCallback, cancelCallback, header, okText, cancelText) {
                var modal = findModal(),
                btns = [
                    {
                        text: okText ? okText : defaultOkButton,
                        callback: okCallback ? okCallback : jQuery.noop
                    },
                    {
                        text: cancelText ? cancelText : defaultCancelButton,
                        callback: cancelCallback ? cancelCallback : jQuery.noop
                    }];
                setModalBody(modal, text);
                if(header) setModalHeader(modal, header);
                setModalFooter(modal, btns);
                modal.openModal();
            },
            
        };
        return notification;
    });
})
();
