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
    
    this.transactionHistory = [
        {"title": "Yandex money", "date": Date.now(), 'sum': 80}
    ];
    
    
    //--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------

    


    //--------------------------------------------------------
    // Private functions and variables
    //--------------------------------------------------------

    
    
    
    //--------------------------------------------------------
    //Initialization code
    //--------------------------------------------------------
    
    
}]);