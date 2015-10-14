app.controller('AccountsController', ['api', 'notification', '$rootScope', function (api, notification, $rootScope) {
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
