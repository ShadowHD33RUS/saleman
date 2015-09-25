app.controller('AccountsController', ['api', 'notification', '$rootScope', function(api, notification, $rootScope){
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
    
    this.save = function() {
        toggleEditBox(false);
        if(this.currentAccount.manager_id) {
            api.updateAccount(this.currentAccount, function(result){
                if(result.code !== '1') {
                    toggleEditBox(true);
                } else {
                    api.setPermission(thisController.currentAccount.manager_id, thisController.perms, function(){
                        toggleEditBox(true);
                    });
                }
            });
        } else {
            api.createAccount(this.currentAccount, function(result){
                if(result.code !== '1') {
                    toggleEditBox(true);
                } else {
                    api.setPermission(result.account_id, thisController.perms, function(){
                        toggleEditBox(true);
                    });
                }
            });
        }
        
    };
    
    this.createNew = function() {
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
    
    this.selectAccount = function(account) {
        toggleEditBox(false);
        this.currentAccount = account;
        api.getAccount(account.manager_id, function(result){
            thisController.currentAccount.first_name = result.account.account.firstname;
            thisController.currentAccount.last_name = result.account.account.lastname;
            thisController.currentAccount.patron = result.account.account.patron;
            for(var i in thisController.perms) {
                thisController.perms[i] = result.account.account[i];
            }
            toggleEditBox(true);
            $rootScope.$digest();
        });
        //$scope.$apply();
    };
    
    this.doSearch = function() {
        this.filteredAccounts = [];
        jQuery.each(this.accounts, function(k,v){
            if(v.toLowerCase().email.indexOf(this.searchString.toLowerCase()))
                this.filteredAccounts.push(v);
        });
        //$scope.$apply();
    };
    
    this.isActive = function(account) {
        return account === this.currentAccount;
    };
    
    var toggleEditBox = function(switchOn) {
        if(switchOn) {
            jQuery('#editor').find('input').removeAttr('disabled');
            jQuery('#editor').find('label').addClass('active');
        } else {
            jQuery('#editor').find('input').attr('disabled', 'true');
        }
    };
    
    //Init
    toggleEditBox(false);
    var thisController = this;
    api.findAccounts(0, function(result){
        thisController.accounts = result.managers;
        thisController.filteredAccounts = thisController.accounts;
        $rootScope.$digest();
    });
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

*/