function loadApplication() {
	angular.bootstrap(document.body, ['saleman']);
	$('#appPreloader').css('display', 'none');
	$('#hiden').css('display', 'block');
}

function populateCurrentUser(response) {
	var r = {
		email: response.account.email,
		firstname: response.account.firstname,
		lastname: response.account.lastname,
		patron: response.account.patron,
		getFullName: function () {
			return this.lastname + ' ' + this.firstname + ' ' + this.patron;
		},
		isAdmin: response.account.admin,
		blocked: response.company.blocked,
		nextPayment: response.account.next_payment,
		companyKey: response.company.company_key,
		company: response.company.title,
		money: response.company.money,
		account_id: response.account.accountId
	};
	r.perms = {};
	jQuery.each(response.account, function (k, v) {
		var delim = k.indexOf('Permission');
		if (delim != -1) {
			r.perms[k.substring(0, delim)] = v;
		}
	});
		
	//Deprecated, will be removed next month
	r.cipherKey = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(r.email + r.getFullName()));

	return r;
}

jQuery(document).ready(function () {
	jQuery(".button-collapse").sideNav();
	// jQuery("#hiden").css('display', 'block');
	var appCache = localStorage.getItem('app_cache');
	if (appCache) {
		appCache = JSON.parse(appCache);
		if (appCache['tokens'] && appCache['tokens']['refresh']) {
			//We have some refresh token here
			$.ajax({
				url: 'http://185.87.49.173:8080/saleman/oauth/token?grant_type=refresh_token&client_id=web-client&refresh_token=' + appCache['tokens']['refresh'],
				dataType: 'json',
				contentType: 'application/json',
				success: function (data) {
					var currentUser = {
						accessToken: data.access_token,
						refreshToken: data.refresh_token,
						expiresIn: data.expires_in,
					};
					$.ajax({
						url: 'http://185.87.49.173:8080/saleman/api/account/getInfo?access_token=' + data.access_token,
						dataType: 'json',
						method: 'POST',
						contentType: 'application/json',
						success: function (data) {
							jQuery.extend(currentUser, saleman_misc.populateCurrentUser(data));
							angular.currentUser = currentUser;
							loadApplication();
						},
						error: function () {
							loadApplication();
						}
					});
				},
				error: function () {
					loadApplication();
				}
			})
		} else {
			loadApplication();
		}
	} else {
		loadApplication();
	}

});;/*
  LEARN HOW TO USE COMPOSERS AND COMPRESSORS FOR JAVASCRIPT
*/

var app = angular.module('saleman', ['ngRoute', 'api', 'notify', 'converter']);

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
});;app.run(['$rootScope', '$location', 'api', 'notification', function($rootScope, $location, api, notification){
  
  $rootScope.$on("$routeChangeStart", function(event, next, current) {
    "use strict";
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
    .when('/scriptrun/:scriptId/:clientId', {
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
      templateUrl: 'app/components/notready/notready.html'
    })
    .when('/scripttextedit/:id', {
      templateUrl: 'app/components/script_texteditor/script_texteditor.html',
      controller: 'ScriptTextEditorController',
      controllerAs: 'scriptEditCtrl'
    })
    .when('/scripttextedit/:id/:nodeId', {
      templateUrl: 'app/components/script_texteditor/script_texteditor.html',
      controller: 'ScriptTextEditorController',
      controllerAs: 'scriptEditCtrl'
    })
    .otherwise({
      redirectTo: '/login'
    });
}]);;app.controller('AccountsController', ['api', 'notification', '$rootScope', function (api, notification, $rootScope) {
    "use strict";
    //--------------------------------------------------------
    // Closure for this controller
    //--------------------------------------------------------
    
    var thisController = this;
    
    
    //--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
    
    this.user = {
        fio: 'FIO',
        email: 'qwe@gmail.com',
        company: 'one shot',
        money: 100
    };
    
    this.userEditor = new Model({
        firstname: ModelConfig.firstName(true),
        lastname: ModelConfig.lastName(false),
        patron: ModelConfig.patron(false)
    });
    
    this.transactionHistory = [
        
    ];
    
    
    //--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------

    
    this.addMoney = function() {
        notification.info("Оплата временно недоступна");
        notification.info("О необходимости оплаты мы вас уведомим заранее");
    };

    this.changeFio = function() {
        jQuery('#ctrl_modal').openModal();
    };
    
    this.confirmChangeFio = function() {
        this.userEditor.validate();
        if(this.userEditor.valid) {
            var cuser = this.userEditor.toJson();
            cuser.account_id = user.account_id;
            api.updateAccount(cuser, function(){
                user.firstname = cuser.firstname;
                user.lastname = cuser.lastname;
                user.patron = cuser.patron;
                thisController.user.fio = user.getFullName();
                //notification.info("ФИО изменено");
                $rootScope.$digest();
            });
        } else {
            notification.info('Исправьте поля с красным цветом');
        }
    };
    

    //--------------------------------------------------------
    // Private functions and variables
    //--------------------------------------------------------

    
    var user = null;
    
    //--------------------------------------------------------
    //Initialization code
    //--------------------------------------------------------
    
    user = api.getCurrentUser();
    this.user.fio = user.getFullName();
    this.user.email = user.email;
    this.user.company = user.company;
    this.user.money = user.money;
    thisController.userEditor.populate(user);
}]);
;app.controller('ClientsController', ['api', '$rootScope', 'modal', 'notification', '$location', function (api, $rootScope, modal, notification, $location) {
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
}]);;app.controller('ConvertController', ['api', 'notification', 'script_converter', function (api, notification, script_converter) {
    "use strict";
    //--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
    
    this.apiSupport = false;
    
    
    //--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------
    
    this.importScript = function () {
        var f = jQuery('#oldFile')[0];
        for (var i = 0; i < f.files.length; i++) {
            var filename = jQuery('#oldFile').parent().parent().find('input[type="text"]').val().substr(0, 20);
            script_converter.convert(f.files[i], filename, function (script) {
                if (script) {
                    api.addScript(script, function () {
                        notification.info('Импортирование завершено');
                    });
                }
            });
        }
    };
    
    
    //--------------------------------------------------------
    //Initialization code
    //--------------------------------------------------------
    
    //Check for needed File API support
    if (window.File && window.FileReader) {
        this.apiSupport = true;
    } else {
        notification.info("Импорт не будет работать. Обновите ваш браузер");
    }

}]);;app.controller('LoginController', ['$location', 'api', '$scope', '$rootScope', '$timeout', 'notification', function ($location, api, $scope, $rootScope, $timeout, notification) {
    "use strict";
    //--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
    
    this.model = new Model({
        login: ModelConfig.email(true),
        password: ModelConfig.password(true)
    });
    
    
    //--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------
    
    this.validate = function () {
        this.model.validate();
    };

    this.doLogin = function () {
        if (this.model.valid === undefined)
            this.model.validate();
        if (this.model.valid) {
            $('#sendButton').addClass('disabled');
            api.login(this.model.login.data, this.model.password.data, function (data) {
                if (data.error) {
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
	"use strict";
	//--------------------------------------------------------
	// Controller properties
	//--------------------------------------------------------

	this.model = new Model({
		email: ModelConfig.email(true)
	});
	
	
	//--------------------------------------------------------
	// Controller methods
	//--------------------------------------------------------
	
	this.validate = function () {
		this.model.validate();
	};

	this.doRecover = function () {
		if (this.model.valid === undefined)
			this.model.validate();
		if (this.model.valid) {
			$('#sendButton').addClass('disabled');
			api.sendRecoverEmail(this.model.email.data);
		} else {
			notification.info("Исправьте поля с красным цветом");
		}
	};
	
	
	//--------------------------------------------------------
	// Initialization code
	//--------------------------------------------------------
	this.model.email.data = api.getCurrentUser().email;
}]);
;app.controller('RegistrationController', ['$location', 'api', '$scope', 'notification', function ($location, api, $scope, notification) {
    "use strict";
    //--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
    
    this.user = new Model({
        email: ModelConfig.email(true),
        password: ModelConfig.password(true),
        password2: ModelConfig.password_retype('password', true),
        first_name: ModelConfig.firstName(true),
        last_name: ModelConfig.lastName(true),
        patron: ModelConfig.patron(true)
    });
    
    
    //--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------
    
    this.register = function () {
        if (this.user.valid) {
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
    
    
    //--------------------------------------------------------
    // Initialization code
    //--------------------------------------------------------
    
    this.user.validate();
}]);
;app.controller('ScriptEditorController', ['$rootScope', '$routeParams', 'api', 'notification', 'modal', '$location', function ($rootScope, $routeParams, api, notification, modal, $location) {
    "use strict";
    //--------------------------------------------------------
    // Closure for this controller
    //--------------------------------------------------------
    
    var thisObj = this;
    
    
    //--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
    
    this.scriptName = '';

    this.isLoading = true;

    this.quickLinks = [];

    this.scriptId = -1;


    //--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------

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

    this.switchToTextMode = function () {
        jQuery('#saveScript').click();
        if (this.scriptId >= 0) {
            $location.path('/scripttextedit/' + thisObj.scriptId);
            $rootScope.$digest();
        }
    };

    this.addNew = function () {
        if (currentSelection && currentSelection.treelib_type === treelib.NODE) {
            if ((!currentSelection.treelib_model.isAnswer || arrayIsEmpty(currentSelection.treelib_model.children))) {
                if (!currentSelection.treelib_model.nextScript) {
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
    };

    this.saveScript = function () {
        currentScript.data = d.saveToJson();
        currentScript.name = thisObj.scriptName;
        //TODO: Block all UI
        if (isNew) {
            api.addScript(currentScript, function (result) {
                currentScript.id = result.script_id;
                thisObj.scriptId = result.script_id;
                scriptAddingComplete();
                isNew = false;
                //TODO: Unblock all UI
            });
        } else {
            api.updateScript(currentScript, function () {
                //TODO: Unblock all UI
            });
        }
    };

    this.addToFast = function () {
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
    };

    this.addTransition = function () {
        notification.info("Простите, данная функция временно не поддерживается");
    };

    this.buildTree = function () {
        if (currentSelection &&
            currentSelection.treelib_type === treelib.NODE) {
            d.buildTree(currentSelection.treelib_model.id);
        } else {
            d.buildTree();
        }
        //d.refresh();
    };


    //--------------------------------------------------------
    // Private functions and variables
    //--------------------------------------------------------
    
    var c = jQuery('<canvas id="canv" width="' + jQuery('#treelib-holder').width() + '" height="500"></canvas>'),
        cnv = null,
        d = null,
        currentScript = null,
        isNew = false,
        id = null,
        currentSelection = null,
        isPanning = false,
        prevMousePos = null,
        origin = new fabric.Point(0, 0),
        zoomPoint = new fabric.Point(0, 0),
        nodeGap = 20;

    function arrayIsEmpty(a) {
        for (var i = 0; i < a.length; i++) {
            if (a[i])
                return false
        }
        return true;
    }

    function onWheel(e) {
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
    }

    function scriptAddingComplete() {
        $location.path('/scripttextedit/' + thisObj.scriptId);
        $rootScope.$digest();
    }
    
    
    //--------------------------------------------------------
    //Initialization code
    //--------------------------------------------------------
    
    //Prepare treelib for initialization
    jQuery('#treelib-holder').append(c);
    cnv = new fabric.Canvas('canv', {
        selection: false,
        hoverCursor: 'pointer'
    });
    d = new treelib.Diagram(cnv);
    if ($routeParams.scriptId != '0') {
        this.scriptId = $routeParams.scriptId * 1;
    }
    if (this.scriptId > 0) { // Load desired script
        api.findScriptById(this.scriptId, function (script) {
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
        this.isLoading = false;
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
    cnv.on("mouse:down", function (ev) {
        var editor = jQuery('#textEditor');
        if (ev.target) {
            if (ev.target.treelib_type === treelib.NODE) {
                if (ev.e.shiftKey && currentSelection != null) {
                    var result = d.connect(currentSelection.treelib_model, ev.target.treelib_model);
                    if (result === 1) {
                        modal.info('Нельзя соединить уже соединенные объекты', 'Ошибка');
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
}]);;app.controller('ScriptRunController', ['api', '$rootScope', '$routeParams', 'notification', 'modal', function (api, $rootScope, $routeParams, notification, modal) {
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
}]);;app.controller('ScriptTextEditorController', ['api', '$rootScope', '$routeParams', 'notification', 'modal', '$scope', '$location', function (api, $rootScope, $routeParams, notification, modal, $scope, $location) {
	"use strict";
	//--------------------------------------------------------
    // Closure for this controller
    //--------------------------------------------------------
	
	var thisObj = this;
	
	//--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------

	this.isLoading = true;

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
		clear: function () {
			this.text = 'Новый ответ';
			this.linkTo = -1;
			this.filtered = [];
			this.search = '';
			this.id = -1;
		}
	};

	this.scriptName = '123';
	
	
	//--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------
	
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

	this.doSearch = function () {
		var a = [], b = this.newAnswer.search;
		for (var i in script.nodes) {
			if (script.nodes[i] && !script.nodes[i].isAnswer && script.nodes[i].text.toLowerCase().indexOf(b.toLowerCase()) !== -1) {
				a.push(script.nodes[i]);
			}
		}
		this.newAnswer.filtered = a;
	};

	this.saveScript = function (callback) {
		saveCurrentStep();
		var result = {
			data: [],
			name: ''
		};
		jQuery.each(script.nodes, function (idx, val) {
			result.data.push(val);
		});
		result.name = this.scriptName;
		if (thisObj.scriptId) {
			result.id = thisObj.scriptId;
			api.updateScript(result, function () {
				callback(result.id);
			});
		} else {
			api.addScript(result, function (res) {
				callback(res.script_id);
			});
		}
	};

	this.switchToTree = function () {
		this.saveScript(function (id) {
			$location.path('/scripttree/' + id);
			$rootScope.$digest();
		});
	};

	this.removeAnswer = function (answer) {
		delete script.nodes[answer.id];
		saleman_misc.removeElement(answer.id, script.nodes[this.step.questionId].linksTo);
		populateStep(this.step.questionId);
	};

	this.addAnswer = function () {
		this.newAnswer.clear();
		this.doSearch();
		jQuery('#modal').openModal();
		jQuery('#modal').find('label').removeClass('active');
	};

	this.editAnswer = function (answer) {
		this.newAnswer.clear();
		this.newAnswer.id = answer.id;
		this.newAnswer.text = answer.text;
		this.newAnswer.linkTo = answer.next ? answer.next : -1;
		if (answer.next)
			this.newAnswer.search = script.nodes[answer.next].text.substr(0, 20);
		this.doSearch();
		jQuery('#modal').openModal();
		jQuery('#modal').find('label').addClass('active');
	};

	this.selectQuestion = function (id) {
		this.newAnswer.linkTo = id;
		this.confirmAddAnswer();
	};

	this.questionActive = function (question) {
		return question.id === this.newAnswer.linkTo;
	};

	this.confirmAddAnswer = function () {
		var answer = createAnswer();
		if (this.newAnswer.id > 0) answer.id = this.newAnswer.id;
		answer.text = this.newAnswer.text;
		if (this.newAnswer.linkTo > 0)
			answer.linksTo.push(this.newAnswer.linkTo);
		script.nodes[answer.id] = answer;
		//Connect current question to newly created answer
		if (this.newAnswer.id <= 0)
			script.nodes[this.step.questionId].linksTo.push(answer.id);
		jQuery('#modal').closeModal();
		populateStep(this.step.questionId);
	};

	this.newQuestion = function (answer) {
		var q = createQuestion();
		script.nodes[q.id] = q;
		script.nodes[answer.id].linksTo.push(q.id);
		answer.next = q.id;
		this.selectAnswer(answer);
	};

	this.selectAnswer = function (answer) {
		if (this.hasNext()) {
			history.data.splice(history.current + 1, history.data.length - history.current - 1);
		}
		history.current = history.data.length - 1;
		if (answer.next) {
			populateStep(answer.next);
			history.data.push(this.step);
			history.current = history.data.length - 1;
		} else {
			notification.info("Нет дальнейшей связи для перехода");
		}
	};

	this.quick = function (answer) {
		if (answer.isQuick) {
			return 'Удалить из быстрых';
		} else {
			return 'Добавить в быстрые';
		}
	};

	this.canCreateNew = function (answer) {
		return (true && answer.next);
	};

	this.toggleQuick = function (answer) {
		if (answer.isQuick) {
			//Delete answer from array of quick links
			jQuery.each(thisObj.quickLinks, function (idx, val) {
				if (val.id === answer.id) {
					thisObj.quickLinks.splice(idx, 1);
					return false;
				}
			});
		} else {
			//Push to array of quick links
			thisObj.quickLinks.push(answer);
		}
		answer.isQuick = !answer.isQuick;
	};
	
	
	//--------------------------------------------------------
    // Private functions and variables
    //--------------------------------------------------------

	var script = {},
		history = {
			current: -1,
			data: []
		};

	function populateStep(nodeId) {
		var scriptNode = script.nodes[nodeId];
		var step = {
			questionId: nodeId,
			question: scriptNode.text,
			answers: []
		};
		jQuery.each(scriptNode.linksTo, function (k, v) {
			if (v && script.nodes[v]) {
				var nextNode = script.nodes[v],
					answerNext = saleman_misc.findFirstNotNullElement(nextNode.linksTo);
				step.answers.push({
					id: nextNode.id,
					text: nextNode.text,
					next: answerNext ? answerNext : false
				});
			}
		});
		saveCurrentStep();
		thisObj.step = step;
		setTimeout(function () {
			jQuery('.dropdown-button').dropdown({
				inDuration: 300,
				outDuration: 225,
				constrain_width: false,
				hover: false,
				gutter: 0,
				belowOrigin: false,
				alignment: 'left'
			});
			jQuery('[data-tooltip]').filter(':not([data-tooltip-id])').tooltip({ delay: 100 });
		}, 0);
	}

	function createAnswer() {
		//Generate valid id for node
		var validId = -1,
			answer;
		for (var i in script.nodes) {
			i = parseInt(i);
			if (validId < i) {
				validId = i;
			}
		}
		//Create answer structure
		answer = {
			id: validId + 1,
			isAnswer: true,
			linksTo: [],
			quickLink: false,
			startPoint: false,
			text: "Новый ответ"
		};
		return answer;
	}

	function createQuestion() {
		var question = createAnswer();
		question.text = 'Новый вопрос';
		question.isAnswer = false;
		return question;
	}
	
	function saveCurrentStep() {
		if (thisObj.step.questionId >= 0) {
			script.nodes[thisObj.step.questionId].text = thisObj.step.question;
			jQuery.each(thisObj.step.answers, function (k, v) {
				script.nodes[v.id].text = v.text;
			});
		}
	}

	
	//--------------------------------------------------------
    //Initialization code
    //--------------------------------------------------------
	
	this.scriptId = $routeParams.id * 1;
	if (this.scriptId) {
		console.log('script fetching...');
		api.findScriptById(this.scriptId, function (fetchedScript) {
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
			history.current = history.data.length - 1;
			thisObj.isLoading = false;
			$rootScope.$digest();
			console.log();
		});
	} else {
		//Not valid
		console.error("cannot extract necessary params from route");
	}
	$scope.$watchCollection('scriptEditCtrl.quickLinks', function () {
		setTimeout(function () {
			jQuery('h5 + div.collection').find('[data-tooltip]').filter(':not([data-tooltip-id])').tooltip({ delay: 100 });
		}, 0);

	});
}]);;app.controller('ScriptsController', ['api', '$rootScope', 'notification', 'modal', function (api, $rootScope, notification, modal) {
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
}]);;app.controller('SupportController', ['api', 'notification', function (api, notification) {
    "use strict";
    //--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
    
    this.topic = "";

    this.message = "";

    this.email = api.getCurrentUser().email;
    
    
    //--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------
    
    this.send = function () {
        api.sendTechSupport("Пользователь " + api.getCurrentUser().email + " (" + api.getCurrentUser().getFullName() + ") прислал письмо в тех. поддержку.\nEmail: " + this.email + "\nТема: " + this.topic + "\nСообщение: " + this.message);
    };

}]);;(function () {
    "use strict";
    //--------------------------------------------------------
    // Service variables
    //--------------------------------------------------------
    
    var MAX_CLIENTS = 30,
        urlRoot = 'http://185.87.49.173:8080/saleman',
        currentUser = null,
        cacheExpires = 300000, //In ms

        cache = {
            __store: {},
            setItem: function (collection, dataId, data) {
                if (!this.__store[collection]) this.__store[collection] = {};
                this.__store[collection][dataId] = data;
                localStorage.setItem('app_cache', JSON.stringify(this.__store));
            },
            getItem: function (collection, dataId) {
                if (this.__store[collection] && this.__store[collection][dataId]) {
                    return this.__store[collection][dataId];
                } else {
                    return null;
                }
            },
            getItems: function (collection, count, page) {
                if (this.__store[collection]) {
                    var result = [],
                        counter = 0,
                        flag = false;
                    if (!count) count = MAX_CLIENTS;
                    if (!page) page = 0;
                    for (var k in this.__store[collection]) {
                        counter++;
                        if (counter > (count * page)) {
                            flag = true;
                            counter = 1;
                        }
                        if (flag && counter <= count)
                            result.push(this.__store[collection][k]);
                    }
                    return result;
                } else {
                    return null;
                }
            },
            removeItem: function (collection, dataId) {
                if (this.__store[collection] && this.__store[collection][dataId]) {
                    delete this.__store[collection][dataId];
                } else {
                    return null;
                }
                localStorage.setItem('app_cache', JSON.stringify(this.__store));
            },
            init: function () {
                this.__store = localStorage.getItem('app_cache');
                if (this.__store) {
                    this.__store = JSON.parse(this.__store);
                } else {
                    console.warn("Warning: no data in local storage");
                    this.__store = {};
                }
            },
            clear: function () {
                this.__store = {};
                localStorage.clear();
            }
        };

    //--------------------------------------------------------
    // Service definition
    //--------------------------------------------------------
    

    var api = angular.module('api', ['notify']);
    api.factory('api', ['notification', '$rootScope', function (notification, $rootScope) {
        
        //========================================================
        // Private functions and vars
        //========================================================
        var refreshTokenTimerHandler = null;

        function errorHandler(err) {
            notification.info(err.error + ' (' + err.error_description + ')');
        }

        function sendRequest(url, options, resultText, validationText, resultCallback, errorCallback) {
            options.url = urlRoot + url;
            if (currentUser) {
                options.url += (url.indexOf('?') !== -1 ? '&' : '?') + 'access_token=' + currentUser.accessToken;
            }
            options.success = function (res) {
                var allGood = false;
                if (res.code) {
                    if (res.code === '1') {
                        if (resultText) notification.info(resultText);
                        allGood = true;
                    } else if (res.code === '2') {
                        notification.info('Произошла ошибка при обращении к серверу. Обратитесь в службу технической поддержки');
                    } else if (res.code === '3') {
                        notification.info(validationText ? validationText : 'Ошибка проверки данных. Проверьте правильность введеных вами данных');
                    } else if (res.code === '4') {
                        notification.info('У вас нет доступа для совершения этой операции. Обратитесь к администратору вашей системы');
                    }
                } else {
                    notification.info('Данные подтверждены');
                    allGood = true;
                }
                if (allGood && resultCallback)
                    resultCallback(res);
                else if (!allGood && errorCallback) errorCallback(res.code, res.message);
            };
            options.error = function () {
                if (errorCallback) {
                    errorCallback();
                }
            };
            options.dataType = 'json';
            options.contentType = 'application/json';
            if (options.data) {
                if(options.data.json_string) {
                    //Encrypt all new scripts and updates
                    console.log('Encrypting script...');
                    options.data.json_string = CryptoJS.AES.encrypt(JSON.stringify(options.data.json_string), currentUser.companyKey).toString();
                } else {
                    for(var clearKey in options.data) {
                        if(options.data[clearKey] == null || options.data[clearKey].length <= 0 && !(clearKey === 'search_string' || clearKey === 'string')) {
                            delete options.data[clearKey];
                        }
                    }
                }
            }
            options.data = JSON.stringify(options.data);
            if (!options.method) options.method = "POST";
            jQuery.ajax(options);
        }

        function refreshAccessToken(expires_in) {
            if (expires_in) {
                refreshTokenTimerHandler = setTimeout(refreshAccessToken, (expires_in - 10) * 1000);
            } else {
                jQuery.ajax({
                    url: urlRoot + '/oauth/token?grant_type=refresh_token&client_id=web-client&refresh_token=' + cache.getItem('tokens', 'refresh'),
                    method: 'GET',
                    success: function (res) {
                        currentUser.accessToken = res.access_token;
                        currentUser.refreshToken = res.refresh_token;
                        currentUser.expiresIn = res.expires_in;
                        cache.setItem('tokens', 'refresh', res.refresh_token);
                        refreshAccessToken(res.expires_in);
                    },
                    error: function () {
                        notification.notify('Невозможно соединиться с сервером');
                    }
                });
            }
        }

        function mapToAccount(raw) {
            var result = {
                first_name: raw.firstname,
                last_name: raw.lastname,
                patron: raw.patron,
                email: raw.email,
            };
            if (raw.password && raw.password.length > 0) result.password = raw.password;
            if (raw.account_id) result.account_id = raw.account_id;
            return result;
        }
        
        
        //========================================================
        // Constructing service object
        //========================================================
        var newApi = {};


        //========================================================
        // Authentification and authorization section
        //========================================================

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
                    refreshAccessToken(result.expires_in);
                    sendRequest("/api/account/getInfo", {
                        data: ''
                    }, hidden ? null : 'Вход успешно выполнен', null, function (result) {
                        jQuery.extend(currentUser, saleman_misc.populateCurrentUser(result));
                        if (callback) callback(result);
                    }, errorHandler);
                } else {
                    if (callback) callback(result);
                }
            },
                typeof error === 'function' ? error : errorHandler
                );
        };

        newApi.logout = function (callback) {
            currentUser = null;
            clearTimeout(refreshTokenTimerHandler);
            notification.info("Вы вышли из приложения");
            cache.clear();
            callback();
        };

        newApi.isLoggedIn = function () {
            return newApi.getCurrentUser() !== null;
        };

        newApi.getCurrentUser = function () {
            if (!currentUser && angular.currentUser) {
                currentUser = angular.currentUser;
                delete angular.currentUser;
                $rootScope.$broadcast('authChange', {});
            }
            return currentUser;
        };

        newApi.sendRecoverEmail = function (email) {
            sendRequest('/api/reestablishment/preReestablish?email=' + email, {
                method: 'GET'
            }, 'На ваш email было выслано сообщение',
                'Проверьте правильность введенных данных');
        };


        //========================================================
        // Clients API section
        //========================================================

        newApi.getAllClients = function (callback, page) {
            if (!page) page = 0;
            sendRequest('/api/client/getClients', {
                data: {
                    "search_string": '',
                    "count": MAX_CLIENTS,
                    "currentPosition": page
                }
            }, null, null, function (d) {
                //Refresh data in cache
                d.clients.forEach(function (val, idx, arr) {
                    cache.setItem('clients', val.client_id, val);
                });
                callback(d);
            }, errorHandler);
            return cache.getItems('clients', MAX_CLIENTS, page);
        };

        newApi.findClients = function (searchString, callback, page) {
            if (searchString.length === 0) {
                return newApi.getAllClients(callback);
            } else {
                if (!page) page = 0;
                sendRequest('/api/client/getClients', {
                    data: {
                        "search_string": searchString,
                        "count": MAX_CLIENTS,
                        "currentPosition": page
                    }
                }, null, null, function (d) {
                    //Refresh data in cache
                    d.clients.forEach(function (val, idx, arr) {
                        cache.setItem('clients', val.client_id, val);
                    });
                    callback(d);
                }, errorHandler);
                var result = [],
                    composedFio = null,
                    cached = cache.getItems('clients');
                if (cached)
                    cached.forEach(function (val, idx, arr) {
                        composedFio = val.lastname + ' ' + val.firstname + ' ' + val.patron;
                        if (composedFio.indexOf(searchString) != -1)
                            result.push(val);
                    });
                return result;
            }
        };
        
        newApi.findClient = function (id, callback) {
            sendRequest('/api/client/findById', {
                data: {
                    client_id: id
                }},
                null, null, callback, null);
        };

        newApi.addClient = function (client, callback, hidden) {
            sendRequest('/api/client/createClient', {
                data: client
            }, hidden ? null : "Клиент сохранен в базу", "Неверные данные. Проверьте корректность введенных данных", function (r) {
                client.creator = { email: currentUser.email };
                client.client_id = r.client_id;
                cache.setItem('clients', r.client_id, client);
                callback(cache.getItems('clients'));
            }, errorHandler);
        };

        newApi.updateClient = function (client, callback) {
            cache.setItem('clients', client.client_id, client);
            sendRequest('/api/client/updateClient', {
                data: client
            }, "Клиент сохранен в базу", "Неверные данные. Проверьте корректность введенных данных", callback, errorHandler);
        };

        newApi.removeClient = function (client, callback, undoCallback) {
            cache.removeItem('clients', client.client_id);
            if (undoCallback)
                sendRequest('/api/client/removeClient', {
                    data: { client_id: client.client_id }
                }, null, "Невозможно удалить клиента. Обратитесь в службу поддержки", function () {
                    callback();
                    notification.infoWithAction("Клиент успешно удален", "Отмена", undoCallback);
                }, errorHandler);
            else {
                sendRequest('/api/client/removeClient', {
                    data: { client_id: client.id }
                }, "Клиент успешно удален", "Невозможно удалить клиента. Обратитесь в службу поддержки", callback, errorHandler);
            }
            return cache.getItems('clients');
        };

        
        //========================================================
        // Scripts API section
        //========================================================

        newApi.findScripts = function (searchString, page, callback) {
            if (!page) page = 0;
            sendRequest("/api/script/getScripts", {
                data: {
                    "string": searchString,
                    count: MAX_CLIENTS,
                    'currentPosition': (page ? page : 0)
                }
            }, null, "Произошла ошибка при выборке. Обратитесь в службу поддержки", function (data) {
                data.scripts.forEach(function (val, idx, arr) {
                    cache.setItem('scripts', val.script_id, val);
                });
                callback(data);
            }, errorHandler);
            var result = [],
                cached = cache.getItems('scripts', MAX_CLIENTS, page);
            if (cached)
                cached.forEach(function (val, idx, arr) {
                    if ((val.script_name || val.name).toLowerCase().indexOf(searchString.toLowerCase()) != -1) {
                        result.push(val);
                    }
                });
            return result;
        };

        newApi.findScriptById = function (id, callback) {
            sendRequest("/api/script/findById", {
                data: { script_id: id }
            }, null, "Невозможно получить скрипт. Пожалуйста, обратитесь в службу поддержки",
                function (result) {
                    if (result.script.script.json_string.charAt(0) === '[') {
                        console.log('Using old plain style for script...');
                        result.script.script.json_string = result.script.script.json_string.replace(/\"/, '"');
                    } else {
                        console.log('Decrypting script...');
                        try {
                            result.script.script.json_string = CryptoJS.AES.decrypt(result.script.script.json_string, currentUser.cipherKey).toString(CryptoJS.enc.Utf8);
                            console.log("Using deprecated decrypt method");
                        } catch (error) {
                            result.script.script.json_string = CryptoJS.AES.decrypt(result.script.script.json_string, currentUser.companyKey).toString(CryptoJS.enc.Utf8);
                        }
                    }
                    callback(result.script);
                }, errorHandler);
        };

        newApi.addScript = function (script, callback) {
            sendRequest("/api/script/createScript", {
                data: {
                    script_name: script.name,
                    json_string: script.data
                }
            }, "Скрипт успешно создан", "Не удалось создать скрипт. Обратитесь в службу поддержки", function (res) {
                script.script_id = res.script_id;
                cache.setItem('scripts', res.script_id, script);
                callback(res);
            }, errorHandler);
        };

        newApi.updateScript = function (script, callback) {
            sendRequest("/api/script/updateScript", {
                data: {
                    script_id: script.id || script.script_id || script.script.script_id,
                    script_name: script.name,
                    json_string: script.data
                }
            }, "Скрипт успешно обновлен", "Невозможно обновить скрипт. Пожалуйста, обратитесь в службу поддержки",
                function (res) {
                    cache.setItem('scripts', script.script_id, script);
                    callback();
                }, errorHandler);
        };

        newApi.removeScript = function (id, callback, undoCallback) {
            cache.removeItem('scripts', id);
            if (undoCallback) {
                sendRequest("/api/script/removeScript", {
                    data: { script_id: id }
                }, null, "Невозможно удалить скрипт. Обратитесь в службу поддержки",
                    function () {
                        callback();
                        notification.infoWithAction("Скрипт успешно удален", "Отмена", undoCallback);
                    }, errorHandler);
            } else {
                sendRequest("/api/script/removeScript", {
                    data: { script_id: id }
                }, null, "Невозможно удалить скрипт. Обратитесь в службу поддержки",
                    callback, errorHandler);
            }
        };
        
        
        //========================================================
        // Support section
        //========================================================

        newApi.sendTechSupport = function (message, callback) {
            sendRequest('/api/support/support', {
                data: {
                    message: message
                }
            }, "Ваш вопрос будет обработан в ближайшее время", null, callback, errorHandler);
        };

        
        //========================================================
        // Accounts API section
        //========================================================

        newApi.createAccount = function (account, callback) {
            sendRequest('/api/account/createAccount', { data: mapToAccount(account) },
                'Аккаунт успешно создан',
                'Неверные данные',
                function (data) {
                    cache.setItem('accounts', data.account_id, account);
                    callback(data);
                },
                errorHandler
                );
        };

        newApi.updateAccount = function (account, callback, errorCallback) {
            cache.setItem('accounts', account.account_id, account);
            sendRequest('/api/account/updateAccount', { data: mapToAccount(account) },
                'Аккаунт успешно обновлен',
                'Неверные данные',
                callback,
                errorCallback
                );
        };

        newApi.removeAccount = function (id, callback) {
            cache.removeItem('accounts', id);
            sendRequest('/api/account/removeAccount', { data: { account_id: id } },
                'Аккаунт успешно обновлен',
                'Неверные данные',
                callback,
                errorHandler
                );
        };

        newApi.findAccounts = function (page, callback) {
            sendRequest('/api/account/getManagers', {
                data: {
                    "search_string": '',
                    currentPosition: page && page >= 0 ? page : 0,
                    count: MAX_CLIENTS
                }
            }, null, null, function (data) {
                data.managers.forEach(function (val, idx, arr) {
                    cache.setItem('accounts', val.manager_id, val);
                });
                callback(data);
            }, errorHandler);
            return cache.getItems('accounts');
        };

        newApi.getAccount = function (id, callback) {
            sendRequest('/api/account/findById', { data: { account_id: id } },
                'Аккаунт загружен',
                'Неверные данные',
                callback,
                errorHandler
                );
        };

        newApi.setPermission = function (id, perms, callback) {
            var opts = { account_id: id };
            for (var i in perms) {
                opts[i] = perms[i];
            }
            sendRequest('/api/permission/give', { data: opts }, 'Права доступа применены', null, callback, errorHandler);
        };

        return newApi;
    }]);

    cache.init();
    setInterval(function(){
        cache.clear();
    }, cacheExpires);
})();
;(function () {
    "use strict";
    var module = angular.module('converter', []);
    module.factory('script_converter', function () {
        var script_converter = {
            /**
            * Algorithm:
            * 1) Parse nodes
            * 2) Parse quick links
            * */
            convert: function (file, fileName, callback) {
                var reader = new FileReader(),
                    script = {
                        data: [],
                        cache: {},
                        answers: [],
                        name: fileName
                    };
                reader.onload = function () {
                    var xmlDoc = jQuery.parseXML(reader.result);
                    
                    //Receive all nodes from document
                    var nodes = xmlDoc.querySelectorAll('Pages > Item');
                    
                    //Used to generate id for answers
                    var genId = 0,
                        answerId = 0;
                    
                    //Parse nodes
                    jQuery.each(nodes, function (k, v) {
                        //Parse node with their answers
                        var currentNode = {};
                        
                        //Parse question
                        currentNode.id = 1 * v.getElementsByTagName('Id')[0].innerHTML;
                        
                        //Ахтунг!!! Говнокод!!!
                        if (currentNode.id === 0) currentNode.startPoint = true;

                        var text1 = v.getElementsByTagName('Text1');
                        var text2 = v.getElementsByTagName('Text2');
                        currentNode.text = (text1.length > 0 ? text1[0].innerHTML : '') + '\n' + (text2.length > 0 ? text2[0].innerHTML : '');
                        currentNode.isAnswer = false;
                        currentNode.linksTo = [];

                        genId = genId <= currentNode.id ? currentNode.id + 1 : genId;
                        
                        //Parse answers
                        var answers = v.querySelectorAll('Answers > Item');
                        jQuery.each(answers, function (j, h) {
                            var ans = {};
                            ans.id = answerId++;
                            ans.text = h.getElementsByTagName('Text')[0].innerHTML;
                            ans.isAnswer = true;
                            var linkTo = 1 * h.getElementsByTagName('LinkID')[0].innerHTML;
                            if (linkTo >= 0) {
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
                    jQuery.each(quickLinks, function (k, v) {
                        var lnk = {
                            id: answerId++,
                            text: v.getElementsByTagName('Text')[0].innerHTML,
                            isAnswer: true,
                            linksTo: [1 * v.getElementsByTagName('LinkID')[0].innerHTML],
                            quickLink: true
                        };
                        script.answers.push(lnk);
                    });
                    
                    //Add required id to all answers and update all question links to them
                    jQuery.each(script.cache, function (k, v) {
                        for (var j = 0; j < v.linksTo.length; j++) {
                            v.linksTo[j] += genId;
                        }
                        script.data.push(v);
                    });
                    jQuery.each(script.answers, function (k, v) {
                        v.id += genId;
                        script.data.push(v);
                    });
                    
                    //script data contains all required data to store script now
                    if (typeof callback === 'function') {
                        callback({
                            name: script.name,
                            data: script.data
                        });
                    } else {
                        console.error("Callback is not a function");
                    }
                };
                reader.readAsText(file);
            }
        };
        return script_converter;
    });
})();
;var saleman_misc = {

	removeElement: function (element, array) {
		for (var i = 0; i < array.length; i++) {
			if (element === array[i]) {
				array.splice(i, 1);
			}
		}
	},

	findFirstNotNullElement: function (arr) {
		var i = 0;
		for (; i < arr.length; i++) {
			if (arr[i] != null) {
				return arr[i]
			}
		}
	},

	copyObj: function (obj) {
		var result = {};
		for (var k in obj) {
			result[k] = obj[k];
		}
		return result;
	},

	populateCurrentUser: function (response) {
		var r = {
			email: response.account.email,
			firstname: response.account.firstname,
			lastname: response.account.lastname,
			patron: response.account.patron,
			getFullName: function () {
				return this.lastname + ' ' + this.firstname + ' ' + this.patron;
			},
			isAdmin: response.account.admin,
			blocked: response.company.blocked,
			nextPayment: response.account.next_payment,
			companyKey: response.company.company_key,
			company: response.company.title,
			money: response.company.money,
			account_id: response.account.accountId
		};
		r.perms = {};
		jQuery.each(response.account, function (k, v) {
			var delim = k.indexOf('Permission');
			if (delim != -1) {
				r.perms[k.substring(0, delim)] = v;
			}
		});
		
		//Deprecated, will be removed next month
		r.cipherKey = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(r.email + r.getFullName()));

		return r;
	}
};;/**
* This library is written to validate data from forms for my application
*/

function overrideLogic(src, opts) {
	for (var k in src) {
		if (opts[k] && typeof opts[k] === 'Object') {
			src[k] = opts[k];
		}
	}
}

function Model(opts) {
	"use strict";
	var thisModel = this,
		service = {};
		
	for (var i in opts) {
		if (opts[i] && opts[i].type) {
			//String
			service[i] = {};
			if (opts[i].type === 'string') {
				this[i] = { data: opts[i].initial ? opts[i].initial : '', valid: true };
			} //Number
			else if (opts[i].type === 'number') {
				this[i] = { data: opts[i].initial ? opts[i].initial : 0, valid: true };
			} //Date
			else if (opts[i].type === 'date') {
				this[i] = { data: opts[i].initial ? opts[i].initial : new Date(), valid: true };
			}
		} else {
			this[i] = { data: '', valid: true };
		}
	}
	
	this.validate = function () {
		var valresult = true;
		for (var i in opts) {
			this[i].valid = true;
			if (opts[i].required || (this[i].data.length > 0)) {
				if (opts[i].eq && this[i].data !== this[opts[i].eq].data) {
					this[i].valid = false;
					this[i].cause = 'eq';
					this[i].msg = opts[i].err ? opts[i].err : 'This field must be equal to ' + i;
				} else if (opts[i].type === 'string') {
					if (opts[i].regexp) {
						if (!opts[i].regexp.test(this[i].data)) {
							this[i].valid = false;
							this[i].cause = 'regexp';
							this[i].msg = opts[i].err ? opts[i].err : 'Regexp is not matching';
						}
					} else {
						if (opts[i].min) {
							if (this[i].data.length < opts[i].min) {
								this[i].valid = false;
								this[i].cause = 'short';
								this[i].msg = opts[i].err ? opts[i].err : 'too short. min - ' + (opts[i].min - 1);
							}
						}
						if (opts[i].max) {
							if (this[i].data.length > opts[i].max) {
								this[i].valid = false;
								this[i].cause = 'long';
								this[i].msg = opts[i].err ? opts[i].err : 'too long. max - ' + (opts[i].max + 1);
							}
						}
					}
				} //Number
				else if (opts[i].type === 'number') {
					if (opts[i].min) {
						if (this[i].data < opts[i].min) {
							this[i].valid = false;
							this[i].cause = 'short';
							this[i].msg = opts[i].err ? opts[i].err : 'Number must be greater than ' + (opts[i].min - 1);
						}
					}
					if (opts[i].max) {
						if (this[i].data > opts[i].max) {
							this[i].valid = false;
							this[i].cause = 'long';
							this[i].msg = opts[i].err ? opts[i].err : 'Number must be less than ' + (opts[i].max + 1);
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
	
	this.toJson = function (excludeFields) {
		var result = {};
		jQuery.each(opts, function (k, v) {
			if (!excludeFields || excludeFields[k] == null) {
				result[k] = thisModel[k].data;
			}
		});
		return result;
	};
	
	this.clearData = function () {
		jQuery.each(opts, function (k, v) {
			if (v.type === 'string')
				thisModel[k].data = '';
			else if (v.type === 'number')
				thisModel[k].data = 0;
		});
	};
	
	this.populate = function (genericObject) {
		for (var k in opts) {
			if (genericObject[k] && (typeof genericObject[k]).toLowerCase() === opts[k].type) {
				thisModel[k].data = genericObject[k];
			}
		}
	};
}

var ModelConfig = {
	email: function (req) { return { type: 'string', regexp: /.+@[a-z]+\.[a-z]+/, required: req, err: 'Пример: qwe@gmail.com' }; },
	password: function (req) { return { type: 'string', min: 6, required: req, err: 'Минимум 6 символов' }; },
	password_retype: function (eq_field, req) { return { type: 'string', eq: eq_field, required: req, err: 'Пароли не совпадают' }; },
	firstName: function (req) { return { type: 'string', min: 1, required: req, err: 'Обязательное' }; },
	lastName: function (req) { return { type: 'string', min: 1, required: req, err: 'Обязательное' }; },
	patron: function (req) { return { type: 'string', min: 1, required: req, err: 'Обязательное' }; },
	companyName: function (req) { return { type: 'string', min: 1, required: req, err: 'Обязательное' }; },
	description: function (req) { return { type: 'string', required: req, err: 'Обязательное' }; },
	phone: function (req) { return { type: 'string', regexp: /(\+7|7|8){0,1}[ -]?\d{3}[ -]?\d{3}[ -]?\d{2}[ -]?\d{2}/, required: req, err: 'Пример: 8 900 123 34 45' }; },
	website: function (req) { return { type: 'string', min: 3, required: req }; }
};

var Models = {
	client: function (overrideOpts) {
		var result = {
			firstname: ModelConfig.firstName(true),
			lastname: ModelConfig.lastName(false),
			patron: ModelConfig.patron(false),
			phone: ModelConfig.phone(false),
			email: ModelConfig.email(false),
		};
		overrideLogic(result, overrideOpts);
		return result;
	}
};;(function () {
	"use strict";
	app.controller('NavbarController', ['api', '$rootScope', 'notification', '$location', function (api, $rootScope, notification, $location) {
		
		//--------------------------------------------------------
		// Closure for this controller
		//--------------------------------------------------------

		var thisController = this;
		
		//--------------------------------------------------------
		// Controller properties
		//--------------------------------------------------------
		
		this.username = 'initial';

		this.currentMenu = null;

		this.loggedIn = api.isLoggedIn();
		
		
		//--------------------------------------------------------
		// Controller methods
		//--------------------------------------------------------

		this.logout = function () {
			api.logout(function (params) {
				notification.info('Вы вышли из приложения');
				item = null;
				$rootScope.$broadcast('authChange', {});
			});
		};
		this.selectMenuItem = function (it) {
			item = it;
		};
		this.menuSelected = function (it) {
			return item === it;
		};


		//--------------------------------------------------------
		// Private functions and variables
		//--------------------------------------------------------

		var item = null,
			menus = {
				'manager': [
					{ name: 'Скрипты', location: '#/scripts', showBlocked: false },
					{ name: 'База клиентов', location: '#/clients', showBlocked: false },
					{ name: 'Задачи', location: '#/notready', showBlocked: false },
					{ name: 'Тех. поддержка', location: '#/support', showBlocked: true },
					{ name: 'Импорт', location: '#/convert', showBlocked: false }
				],
				'admin': [
					{ name: 'Скрипты', location: '#/scripts', showBlocked: false },
					{ name: 'База клиентов', location: '#/clients', showBlocked: false },
					{ name: 'Задачи', location: '#/notready', showBlocked: false },
					{ name: 'Тех. поддержка', location: '#/support', showBlocked: true },
					{ name: 'Статистика', location: '#/notready', showBlocked: false },
					{ name: 'Импорт', location: '#/convert', showBlocked: false },
					{ name: 'Аккаунт', location: '#/accounts', showBlocked: true }
				],
				'system-admin': [
					{ name: 'Цены', location: '/#/home' },
					{ name: 'Статистика использования', location: '/#/home' },
					{ name: 'Сообщения', location: '/#/home' },
					{ name: 'Настройки приложения', location: '/#/home' },
				]
			};

		function changeData(flag) {
			thisController.loggedIn = api.isLoggedIn();
			thisController.username = thisController.loggedIn ? api.getCurrentUser().getFullName() : '';
			
			//Set current menu item for user
			thisController.currentMenu = api.getCurrentUser().isAdmin ? menus.admin : menus.manager;
			if (api.getCurrentUser().blocked) {
				for (var k = 0; k < thisController.currentMenu.length; k++) {
					if (thisController.currentMenu[k].showBlocked !== undefined && thisController.currentMenu[k] === false)
						thisController.currentMenu.splice(k, 1);
				}
			}
			//Current selection in navbar menu is managed by location
			var currentPath = $location.path();
			if (currentPath.indexOf('login') !== -1) {
				$location.path('/scripts');
				item = thisController.currentMenu[0];
			} else {
				for (var k = 0; k < thisController.currentMenu.length; k++) {
					if (thisController.currentMenu[k].location.indexOf(currentPath) !== -1) {
						item = thisController.currentMenu[k];
						break;
					}
				}
			}
			if(typeof flag === 'object') {
				$location.path("/scripts");
				$rootScope.$digest();
			}
			//$location.path("/scripts");
		}

		//--------------------------------------------------------
		//Initialization code
		//--------------------------------------------------------

		$rootScope.$on('authChange', changeData);

		if(this.loggedIn) {
			changeData(true);
		}
	}]);
})();;(function () {
    "use strict";
    //--------------------------------------------------------
    // Service variables
    //--------------------------------------------------------
    
    var notificationTimer = 4000,
        modalId = "notifyModal",
        defaultModalHeader = "Внимание",
        defaultOkButton = "OK",
        defaultCancelButton = "Отмена",
        notificationId = 0,
        currentlyDisplayedToasts = {};
    
    
    //--------------------------------------------------------
    // Private functions
    //--------------------------------------------------------
    
    function findModal() {
        var modal = jQuery('#' + modalId);
        if (modal.length === 0) {
            return createModal();
        } else {
            return modal;
        }
    }

    function createModal() {
        var modal = jQuery('<div id="' + modalId + '" class="modal modal-fixed-footer"><div class="modal-content"><h4 id="' + modalId +
            'Header">MODAL HEADER</h4><span id="' + modalId + 'Body">BODY</span></div><div class="modal-footer" id="' + modalId + 'Footer"></div></div>');
        jQuery(document.body).append(modal);
        return modal;
    }

    function setModalHeader(modal, content) {
        modal.find('#' + modalId + 'Header').html('').html(content);
    }

    function setModalBody(modal, content) {
        modal.find('#' + modalId + 'Body').html('').html(content);
    }

    function setModalFooter(modal, buttons) {
        modal.find('#' + modalId + 'Footer').html('');
        jQuery.each(buttons, function (k, v) {
            jQuery('<a id="button' + k + '" class="btn modal-action modal-close">' + v.text + '</a>').appendTo(modal.find('#' + modalId + 'Footer')).click(v.callback);
        });
    }
    
    
    //--------------------------------------------------------
    // Notification service definition
    //--------------------------------------------------------
    
    var module = angular.module('notify', []);
    module.factory('notification', function () {
        var notification = {
            info: function (text) {
                if (!currentlyDisplayedToasts[text]) {
                    currentlyDisplayedToasts[text] = true;
                    Materialize.toast(text, notificationTimer, '', function () {
                        delete currentlyDisplayedToasts[text];
                    });
                }
            },
            infoWithAction: function (bodyText, actionText, actionCallback) {
                var closeFunc = Materialize.toast('<span>' + bodyText + '</span><a class="btn-flat yellow-text" id="not' + notificationId + '">' + actionText + '</a>', notificationTimer);
                jQuery('#not' + notificationId++).click(function () {
                    actionCallback();
                    closeFunc();
                });
            }
        };
        return notification;
    });
    
    
    //--------------------------------------------------------
    // Modal service definition
    //--------------------------------------------------------
    
    module.factory('modal', function () {
        var notification = {
            info: function (text, header) {
                var modal = findModal();
                setModalBody(modal, text);
                if (header) {
                    setModalHeader(modal, header);
                } else {
                    setModalHeader(modal, defaultModalHeader);
                }
                setModalFooter(modal, [{ text: defaultOkButton, callback: jQuery.noop }]);
                modal.openModal();
            },
            okCancelDialog: function (text, okCallback, cancelCallback, header, okText, cancelText) {
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
                if (header) setModalHeader(modal, header);
                setModalFooter(modal, btns);
                modal.openModal();
            },

        };
        return notification;
    });
})();
