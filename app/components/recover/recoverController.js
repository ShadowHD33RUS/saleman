app.controller('RecoverController', ['$location', 'api', '$scope', '$rootScope', '$timeout', 'notification', function ($location, api, $scope, $rootScope, $timeout, notification) {
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
