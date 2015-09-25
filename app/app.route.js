

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
}]);