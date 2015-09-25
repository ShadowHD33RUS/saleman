(function () {
    
    //Constants
    var WAIT_TIME = 500;
    var MAX_CLIENTS = 30;
    var urlRoot = 'http://185.87.49.173:8080/saleman';

    //Test data

    //var users = [
    //  {email: 'admin@admin.ru', password: 'admin', name: 'Богдан', surname: "Уразакаев", patron: "Егорович" }
    //];
    //var clients = [
    //  {id: 1, surname: 'Уразакаев', name: 'Богдан', patron: 'Егорович', phone: '+79004819024', email: 'bogdan.urazakaew@gmail.com'},
    //  {id: 2, surname: 'Иванов', name: 'Иван', patron: 'Иванович', phone: '+79004819024', email: 'bogdan.urazakaew@gmail.com'},
    //  {id: 3, surname: 'Петров', name: 'Сергей', patron: 'Сидорович', phone: '+79004819024', email: 'bogdan.urazakaew@gmail.com'},
    //  {id: 4, surname: 'Валункин', name: 'Петр', patron: 'Иванович', phone: '+79004819024', email: 'bogdan.urazakaew@gmail.com'},
    //  {id: 5, surname: 'Мелькунов', name: 'Иван', patron: 'Давыдович', phone: '+79004819024', email: 'bogdan.urazakaew@gmail.com'},
    //];
    var scripts = [];

    var currentUser = null;

    // Load data from local storage, if exist
    //var p = localStorage.getItem("__clients");
    //if(p !== null) clients = JSON.parse(p);
    //
    //p = localStorage.getItem("__users");
    //if(p !== null) users = JSON.parse(p);
    //
    p = localStorage.getItem("__scripts");
    if(p !== null) scripts = JSON.parse(p);
    //
    //var maxId = clients.length;

    

    var api = angular.module('api', ['notify']);
    api.factory('api', ['notification', function (notification) {
        
        //Reusable code
        var errorHandler = function (err) {
            notification.info(err.message + ' (' + err.statusCode + ')');
        };
        
        var sendRequest = function (url, options, resultText, validationText, resultCallback, errorCallback) {
            options.url = urlRoot + url;
            if(currentUser) {
                options.url += (url.indexOf('?') !== -1 ? '&' : '?') + 'access_token='+currentUser.accessToken;
            }
            options.success = function(res){
                var allGood = false;
                if(res.code) {
                    if(res.code === '1') {
                        if(resultText) notification.info(resultText);
                        allGood = true;
                    } else if(res.code === '2') {
                        notification.info('Произошла ошибка при обращении к серверу. Обратитесь в службу технической поддержки');
                    } else if(res.code === '3') {
                        notification.info(validationText ? validationText : 'Ошибка проверки данных. Проверьте правильность введеных вами данных');
                    } else if(res.code === '4') {
                        notification.info('У вас нет доступа для совершения этой операции. Обратитесь к администратору вашей системы');
                    }
                } else {
                    notification.info('Данные подтверждены');
                    allGood = true;
                }
                if(allGood && resultCallback)
                    resultCallback(res);
            };
            options.error = function () {
                if(errorCallback) {
                    errorCallback();
                }
            };
            options.dataType = 'json';
            options.contentType = 'application/json';
            if(options.data && options.data.json_string) {
                options.data.json_string = JSON.stringify(options.data.json_string).replace(/"/g, '\"');
            }
            options.data = JSON.stringify(options.data);
            if (!options.method) options.method = "POST";
            jQuery.ajax(options);
        };
        
        var refreshTokenTimerHandler = null;
        var refreshAccessToken = function(expires_in) {
            if(expires_in) {
                refreshTokenTimerHandler = setTimeout(refreshAccessToken, (expires_in-10) * 1000);
            } else {
                // newApi.login(currentUser.email, currentUser.password, function(result) {
                //     currentUser.accessToken = result.accessToken;
                //     currentUser.refreshToken = result.refreshToken;
                //     currentUser.expiresIn = result.expiresIn;
                //     refreshTokenTimerHandler = setTimeout(refreshAccessToken, (result.expiresIn-10) * 1000);
                // }, null, true);
                jQuery.ajax({
                    url: urlRoot + '/oauth/token?grant_type=refresh_token&client_id=web-client&refresh_token='+currentUser.refreshToken,
                    method: 'GET',
                    success: function(res){
                        currentUser.accessToken = res.access_token;
                        currentUser.refreshToken = res.refresh_token;
                        currentUser.expiresIn = res.expires_in;
                        refreshAccessToken(res.expires_in);
                    },
                    error: function() {
                        notification.notify('Невозможно соединиться с сервером');
                    }
                });
            }
        };
        
        var newApi = {};

        /*
         Authc/authz API section
         */

        newApi.register = function (user, callback, error) {
            sendRequest('/api/auth/register', {
                data: user
            }, 'Регистрация успешно прошла', 'Проверьте правильность введенных данных', callback, typeof error === 'function' ? error : errorHandler);
        };
        newApi.login = function (email, password, callback, error, hidden) {
            sendRequest('/oauth/token?grant_type=password&client_id=web-client&password=' + password + '&username=' + email, {
                    method: 'GET'
                }, null, null, function (result) {
                    if (!result.error) {
                        currentUser = {
                            email: email,
                            accessToken: result.access_token,
                            refreshToken: result.refresh_token,
                            expiresIn: result.expires_in,
                            password: password
                        };
                        refreshAccessToken(20);
                        sendRequest("/api/account/getInfo", {
                            data: ''
                        }, hidden ? null : 'Вход успешно выполнен', null, function(result) {
                            currentUser.firstname = result.account.firstname;
                            currentUser.lastname = result.account.lastname;
                            currentUser.patron = result.account.patron;
                            currentUser.getFullName = function() {
                                return this.lastname + ' ' + this.firstname + ' ' + this.patron;
                            };
                            //Parse permissions
                            currentUser.perms = {};
                            jQuery.each(result.account, function(k,v){
                                var delim = k.indexOf('Permission');
                                if(delim != -1) {
                                    currentUser.perms[k.substring(0, delim)] = v;
                                }
                            });
                            currentUser.isAdmin = result.account.admin;
                            currentUser.blocked = result.company.blocked;
                            currentUser.nextPayment = result.account.next_payment;
                            if(callback) callback(result);
                        }, errorHandler);
                    } else {
                        if(callback) callback(result);
                    }
                },
                typeof error === 'function' ? error : errorHandler
            );
        };
        newApi.logout = function (callback) {
            currentUser = null;
            clearTimeout(refreshTokenTimerHandler);
            notification.info("Вы вышли из приложения");
            callback();
        };
        newApi.isLoggedIn = function () {
            return currentUser !== null;
        };
        newApi.getCurrentUser = function () {
            return currentUser;
        };
        newApi.sendRecoverEmail = function(email) {
            sendRequest('/api/reestablishment/preReestablish?email='+email, {
                method: 'GET'
            }, 'На ваш email было выслано сообщение',
            'Проверьте правильность введенных данных');
        };

        /*
         Clients API section
         */

        newApi.getAllClients = function (callback, page) {
            if(!page) page = 0;
            sendRequest('/api/client/getClients', {
                data: {
                    "firstname":"",
                    "lastname":"",
                    "patron":"",
                    "count": MAX_CLIENTS,
                    "currentPosition":page
                }
            }, null, null, callback, errorHandler);
        };
        newApi.findClients = function (searchString, callback, page) {
            if(searchString.length === 0) {
                newApi.getAllClients(callback);
            } else {
                if(!page) page = 0;
                sendRequest('/api/client/getClients', {
                    data: {
                        "firstname": '',
                        "lastname": searchString,
                        "patron": '',
                        "count": MAX_CLIENTS,
                        "currentPosition": page
                    }
                }, null, null, callback, errorHandler);
            }
        };
        newApi.addClient = function (client, callback, hidden) {
            sendRequest('/api/client/createClient',{
                data: client
            }, hidden ? null : "Клиент сохранен в базу", "Неверные данные. Проверьте корректность введенных данных", callback, errorHandler);
        };
        newApi.updateClient = function (client, callback) {
            sendRequest('/api/client/updateClient', {
                data:client
            }, "Клиент сохранен в базу", "Неверные данные. Проверьте корректность введенных данных", callback, errorHandler);
        };
        newApi.removeClient = function (client, callback, undoCallback) {
            if(undoCallback)
                sendRequest('/api/client/removeClient', {
                    data: {client_id:client.client_id}
                }, null, "Невозможно удалить клиента. Обратитесь в службу поддержки", function(){
                    callback();
                    notification.infoWithAction("Клиент успешно удален", "Отмена", undoCallback);
                }, errorHandler);
            else
                sendRequest('/api/client/removeClient', {
                    data: {client_id:client.id}
                }, "Клиент успешно удален", "Невозможно удалить клиента. Обратитесь в службу поддержки", callback, errorHandler);
        };

        /*
         Scripts API section
         */

        newApi.findScripts = function (searchString, page, callback) {
            if(!page) page = 0;
            sendRequest("/api/script/getScripts", {
                data: {
                    "string":searchString,
                    count: MAX_CLIENTS,
                    currentPosition: page
                }
            }, null, "Произошла ошибка при выборке. Обратитесь в службу поддержки", callback, errorHandler);
        };
        newApi.findScriptById = function (id, callback) {
            sendRequest("/api/script/findById", {
                data: {script_id: id}
            }, null, "Невозможно получить скрипт. Пожалуйста, обратитесь в службу поддержки", 
            function(result) {
                result.script.script.json_string = result.script.script.json_string.replace(/\"/,'"');
                callback(result.script);
            }, errorHandler);
        };
        newApi.addScript = function (script, callback) {
            sendRequest("/api/script/createScript",{
                data: {
                    script_name: script.name,
                    json_string: script.data
                }
            }, "Скрипт успешно создан", "Не удалось создать скрипт. Обратитесь в службу поддержки", callback, errorHandler);
        };
        newApi.updateScript = function (script, callback) {
            sendRequest("/api/script/updateScript",{
                data: {
                    script_id: script.id || script.script_id || script.script.script_id,
                    script_name: script.name,
                    json_string: script.data
                }
            }, "Скрипт успешно обновлен", "Невозможно обновить скрипт. Пожалуйста, обратитесь в службу поддержки",
            callback, errorHandler);
        };
        newApi.removeScript = function (id, callback, undoCallback) {
            if(undoCallback) {
                sendRequest("/api/script/removeScript",{
                    data: {script_id: id}
                }, null, "Невозможно удалить скрипт. Обратитесь в службу поддержки",
                function(){
                    callback();
                    notification.infoWithAction("Скрипт успешно удален", "Отмена", undoCallback);
                }, errorHandler);
            } else {
                sendRequest("/api/script/removeScript",{
                    data: {script_id: id}
                }, null, "Невозможно удалить скрипт. Обратитесь в службу поддержки",
                callback, errorHandler);
            }
        };

        newApi.sendTechSupport = function(message, callback){
            sendRequest('/api/support/support', {
                data: {
                    message: message
                }
            }, "Ваш вопрос будет обработан в ближайшее время", null, callback, errorHandler);
        };

        newApi.createAccount = function(account, callback) {
            sendRequest('/api/account/createAccount', {data:account},
                'Аккаунт успешно создан',
                'Неверные данные',
                callback,
                errorHandler
            );
        };
        newApi.updateAccount = function(account, callback) {
            account.account_id = account.account_id || account.manager_id || account.id;
            sendRequest('/api/account/updateAccount', {data:account},
                'Аккаунт успешно обновлен',
                'Неверные данные',
                callback,
                errorHandler
            );
        };
        newApi.removeAccount = function(id, callback) {
            sendRequest('/api/account/removeAccount', {data:{account_id:id}},
                'Аккаунт успешно обновлен',
                'Неверные данные',
                callback,
                errorHandler
            );
        };
        newApi.findAccounts = function(page, callback) {
            sendRequest('/api/account/getManagers', {
                data: {
                    currentPosition: page && page >= 0 ? page : 0,
                    count: MAX_CLIENTS
                }
            }, null, null, callback, errorHandler);
        };
        newApi.getAccount = function(id, callback) {
            sendRequest('/api/account/findById', {data:{account_id: id}},
                'Аккаунт загружен',
                'Неверные данные',
                callback,
                errorHandler
            );
        };
        newApi.setPermission = function(id, perms, callback){
            var opts = {account_id:id};
            for(var i in perms) {
                opts[i] = perms[i];
            }
            sendRequest('api/permission/give', {data:opts}, 'Права доступа применены', null, callback, errorHandler);
        };
    
        return newApi;
    }]);
})
();
