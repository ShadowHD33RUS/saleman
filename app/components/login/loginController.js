app.controller('LoginController', ['$location', 'api', '$scope', '$rootScope', '$timeout', 'notification', function ($location, api, $scope, $rootScope, $timeout, notification) {
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
