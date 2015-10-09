app.controller('SupportController', ['api', 'notification', function (api, notification) {
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

}]);