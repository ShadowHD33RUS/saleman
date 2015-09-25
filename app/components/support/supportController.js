app.controller('SupportController', ['api', 'notification', function(api, notification) {
    this.topic = "";
    this.message = "";
    this.email = api.getCurrentUser().email;
    this.send = function() {
        api.sendTechSupport("Пользователь "+api.getCurrentUser().email+" ("+api.getCurrentUser().getFullName()+") прислал письмо в тех. поддержку.\nEmail: "+this.email+"\nТема: "+this.topic+"\nСообщение: "+this.message);
    };
}]);