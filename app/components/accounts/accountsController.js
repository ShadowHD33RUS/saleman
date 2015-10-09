app.controller('AccountsController', ['api', 'notification', '$rootScope', function (api, notification, $rootScope) {
    "use strict";
    //--------------------------------------------------------
    // Closure for this controller
    //--------------------------------------------------------
    
    var thisController = this;
    
    
    //--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
    
    this.model = new Model({
        account_id: { type: 'number' },
        firstname: ModelConfig.firstName(true),
        lastname: ModelConfig.lastName(false),
        patron: ModelConfig.patron(false),
        email: ModelConfig.email(true),
        password: ModelConfig.password(false)
    });

    this.perms = {
        scriptEditPermission: false,
        clientReadPermission: false,
        clientEditPermission: false
    };

    this.searchString = '';

    this.accounts = [];

    this.filteredAccounts = [];

    
    //--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------

    this.save = function () {
        toggleEditBox(false);
        if (this.model.account_id.data > 0) {
            api.updateAccount(this.model.toJson(), function (result) {
                if (result.code !== '1') {
                    toggleEditBox(true);
                } else {
                    api.setPermission(thisController.model.account_id.data, thisController.perms, function () {
                        toggleEditBox(true);
                    });
                }
            }, function () {
                toggleEditBox(true);
            });
        } else {
            api.createAccount(this.model.toJson(), function (result) {
                if (result.code !== '1') {
                    toggleEditBox(true);
                } else {
                    api.setPermission(result.account_id, thisController.perms, function () {
                        toggleEditBox(true);
                    });
                }
            });
        }

    };

    this.createNew = function () {
        this.model.clearData();
        jQuery('#editor').find('label').removeClass('active');
        toggleEditBox(true);
        //$scope.$apply();
    };

    this.selectAccount = function (account) {
        toggleEditBox(false);
        this.model.account_id.data = account.manager_id;
        this.model.populate(account);
        api.getAccount(account.manager_id, function (result) {
            thisController.model.populate(result.account.account);
            for (var i in thisController.perms) {
                thisController.perms[i] = result.account.account[i];
            }
            toggleEditBox(true);
            $rootScope.$digest();
        });
        //$scope.$apply();
    };

    this.doSearch = function () {
        thisController.filteredAccounts = [];
        jQuery.each(thisController.accounts, function (k, v) {
            if (v.email.toLowerCase().indexOf(thisController.searchString.toLowerCase()) !== -1)
                thisController.filteredAccounts.push(v);
        });
        //$scope.$apply();
    };

    this.isActive = function (account) {
        return account === this.currentAccount;
    };


    //--------------------------------------------------------
    // Private functions and variables
    //--------------------------------------------------------

    var toggleEditBox = function (switchOn) {
        if (switchOn) {
            jQuery('#editor').find('input').removeAttr('disabled');
            jQuery('#editor').find('label').addClass('active');
            jQuery('#editor').find('a.btn').removeClass('disabled');
        } else {
            jQuery('#editor').find('input').attr('disabled', 'true');
            jQuery('#editor').find('a.btn').addClass('disabled');
        }
    };
    
    
    //--------------------------------------------------------
    //Initialization code
    //--------------------------------------------------------
    
    toggleEditBox(false);
    thisController.filteredAccounts = api.findAccounts(0, function (result) {
        thisController.accounts = result.managers;
        thisController.filteredAccounts = thisController.accounts;
        $rootScope.$digest();
    });
    thisController.accounts = thisController.filteredAccounts;
}]);