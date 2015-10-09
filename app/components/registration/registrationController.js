app.controller('RegistrationController', ['$location', 'api', '$scope', 'notification', function ($location, api, $scope, notification) {
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
