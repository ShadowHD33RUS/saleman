(function () {
    
    //Constants
    var MAX_CLIENTS = 30;
    var urlRoot = 'http://185.87.49.173:8080/saleman';

    var currentUser = null;

    //Cache data, persist in localstorage
    var cache = {
        __store: {},
        setItem: function(collection, dataId, data) {
            if(!this.__store[collection]) this.__store[collection] = {};
            this.__store[collection][dataId] = data;
            localStorage.setItem('app_cache', JSON.stringify(this.__store));
        },
        getItem: function(collection, dataId) {
            if(this.__store[collection] && this.__store[collection][dataId]) {
                return this.__store[collection][dataId];
            } else {
                return null;
            }
        },
        getItems: function(collection, count, page) {
            if(this.__store[collection]) {
                var result = [],
                    counter = 0,
                    flag = false;
                if(!count) count = MAX_CLIENTS;
                if(!page) page = 0;
                for(var k in this.__store[collection]) {
                    counter++;
                    if(counter > (count*page)){
                        flag = true;
                        counter = 1;
                    }
                    if(flag && counter <= count)
                        result.push(this.__store[collection][k]);
                }
                return result;
            } else {
                return null;
            }
        },
        removeItem: function(collection, dataId) {
            if(this.__store[collection] && this.__store[collection][dataId]) {
                delete this.__store[collection][dataId];
            } else {
                return null;
            }
            localStorage.setItem('app_cache', JSON.stringify(this.__store));
        },
        init: function() {
            this.__store = localStorage.getItem('app_cache');
            if(this.__store) {
                this.__store = JSON.parse(this.__store);
            } else {
                console.warn("Warning: no data in local storage");
                this.__store = {};
            }
        },
        clear: function() {
            this.__store = {};
            localStorage.clear();
        }
    };
    //Init cache
    cache.init();

    var api = angular.module('api', ['notify']);
    api.factory('api', ['notification', '$rootScope', function (notification, $rootScope) {
        
        //Reusable code
        var errorHandler = function (err) {
            notification.info(err.error + ' (' + err.error_description + ')');
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
                else if(!allGood && errorCallback) errorCallback(res.code, res.message);
            };
            options.error = function () {
                if(errorCallback) {
                    errorCallback();
                }
            };
            options.dataType = 'json';
            options.contentType = 'application/json';
            if(options.data && options.data.json_string) {
                //Cipher all new scripts and updates
                console.log('Encrypting script...');
                options.data.json_string = CryptoJS.AES.encrypt(JSON.stringify(options.data.json_string), currentUser.cipherKey).toString();
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
                jQuery.ajax({
                    url: urlRoot + '/oauth/token?grant_type=refresh_token&client_id=web-client&refresh_token='+currentUser.refreshToken,
                    method: 'GET',
                    success: function(res){
                        currentUser.accessToken = res.access_token;
                        currentUser.refreshToken = res.refresh_token;
                        currentUser.expiresIn = res.expires_in;
                        cache.setItem('tokens', 'refresh', res.refresh_token);
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
                            expiresIn: result.expires_in
                        };
                        cache.setItem('tokens', 'refresh', result.refresh_token);
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
                            var key = CryptoJS.enc.Utf8.parse(currentUser.email+currentUser.getFullName());
                            currentUser.cipherKey = CryptoJS.enc.Base64.stringify(key);
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
            cache.clear();
            callback();
        };
        newApi.isLoggedIn = function () {
            return newApi.getCurrentUser() !== null;
        };
        newApi.getCurrentUser = function () {
            if(!currentUser && angular.currentUser) {
                currentUser = angular.currentUser;
                delete angular.currentUser;
                $rootScope.$broadcast('authChange', {});
            }
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
            }, null, null, function(d){
                //Refresh data in cache
                d.clients.forEach(function(val, idx, arr){
                    cache.setItem('clients', val.client_id, val);
                });
                callback(d);
            }, errorHandler);
            return cache.getItems('clients', MAX_CLIENTS, page);
        };
        newApi.findClients = function (searchString, callback, page) {
            if(searchString.length === 0) {
                return newApi.getAllClients(callback);
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
                }, null, null, function(d){
                    //Refresh data in cache
                    d.clients.forEach(function(val, idx, arr){
                        cache.setItem('clients', val.client_id, val);
                    });
                    callback(d);
                }, errorHandler);
                var result = [],
                    composedFio = null,
                    cached = cache.getItems('clients');
                if(cached)
                    cached.forEach(function(val, idx, arr){
                        composedFio = val.lastname+' '+val.firstname+' '+val.patron;
                        if(composedFio.indexOf(searchString) != -1)
                            result.push(val);
                    });
                return result;
            }
        };
        newApi.addClient = function (client, callback, hidden) {
            sendRequest('/api/client/createClient',{
                data: client
            }, hidden ? null : "Клиент сохранен в базу", "Неверные данные. Проверьте корректность введенных данных", function(r){
                client.creator = {email: currentUser.email};
                client.client_id = r.client_id;
                cache.setItem('clients', r.client_id, client);
                callback(cache.getItems('clients'));
            }, errorHandler);
        };
        newApi.updateClient = function (client, callback) {
            cache.setItem('clients', client.client_id, client);
            sendRequest('/api/client/updateClient', {
                data:client
            }, "Клиент сохранен в базу", "Неверные данные. Проверьте корректность введенных данных", callback, errorHandler);
        };
        newApi.removeClient = function (client, callback, undoCallback) {
            cache.removeItem('clients', client.client_id);
            if(undoCallback)
                sendRequest('/api/client/removeClient', {
                    data: {client_id:client.client_id}
                }, null, "Невозможно удалить клиента. Обратитесь в службу поддержки", function(){
                    callback();
                    notification.infoWithAction("Клиент успешно удален", "Отмена", undoCallback);
                }, errorHandler);
            else {
                sendRequest('/api/client/removeClient', {
                    data: {client_id:client.id}
                }, "Клиент успешно удален", "Невозможно удалить клиента. Обратитесь в службу поддержки", callback, errorHandler);
            }
            return cache.getItems('clients');
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
                    'currentPosition': (page ? page : 0)
                }
            }, null, "Произошла ошибка при выборке. Обратитесь в службу поддержки", function(data){
                data.scripts.forEach(function(val, idx, arr){
                    cache.setItem('scripts', val.script_id, val);
                });
                callback(data);
            }, errorHandler);
            var result = [],
                cached = cache.getItems('scripts', MAX_CLIENTS, page);
            if(cached)
                cached.forEach(function(val, idx, arr) {
                    if((val.script_name || val.name).toLowerCase().indexOf(searchString.toLowerCase()) != -1) {
                        result.push(val);
                    }
                });
            return result;
        };
        newApi.findScriptById = function (id, callback) {
            sendRequest("/api/script/findById", {
                data: {script_id: id}
            }, null, "Невозможно получить скрипт. Пожалуйста, обратитесь в службу поддержки", 
            function(result) {
                if(result.script.script.json_string.charAt(0) === '[') {
                    console.log('Using old plain style for script...');
                    result.script.script.json_string = result.script.script.json_string.replace(/\"/,'"');
                } else {
                    console.log('Decrypting script...');
                    result.script.script.json_string = CryptoJS.AES.decrypt(result.script.script.json_string, currentUser.cipherKey).toString(CryptoJS.enc.Utf8);
                }
                callback(result.script);
            }, errorHandler);
        };
        newApi.addScript = function (script, callback) {
            sendRequest("/api/script/createScript",{
                data: {
                    script_name: script.name,
                    json_string: script.data
                }
            }, "Скрипт успешно создан", "Не удалось создать скрипт. Обратитесь в службу поддержки", function(res) {
                script.script_id = res.script_id;
                cache.setItem('scripts', res.script_id, script);
                callback(res);
            }, errorHandler);
        };
        newApi.updateScript = function (script, callback) {
            sendRequest("/api/script/updateScript",{
                data: {
                    script_id: script.id || script.script_id || script.script.script_id,
                    script_name: script.name,
                    json_string: script.data
                }
            }, "Скрипт успешно обновлен", "Невозможно обновить скрипт. Пожалуйста, обратитесь в службу поддержки",
            function(res) {
                cache.setItem('scripts', script.script_id, script);
                callback();
            }, errorHandler);
        };
        newApi.removeScript = function (id, callback, undoCallback) {
            cache.removeItem('scripts', id);
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
        
        /*
         Tech support API section
         */

        newApi.sendTechSupport = function(message, callback){
            sendRequest('/api/support/support', {
                data: {
                    message: message
                }
            }, "Ваш вопрос будет обработан в ближайшее время", null, callback, errorHandler);
        };

        /*
         Accounts API section
         */
        
        function mapToAccount(raw) {
            var result = {
                first_name: raw.first_name,
                last_name: raw.last_name,
                patron: raw.patron,
                email: raw.email,
            };
            if(raw.password && raw.password.length > 0) result.password = raw.password;
            if(raw.manager_id) result.account_id = raw.manager_id;
            return result;
        }

        newApi.createAccount = function(account, callback) {
            sendRequest('/api/account/createAccount', {data:mapToAccount(account)},
                'Аккаунт успешно создан',
                'Неверные данные',
                function(data){
                    cache.setItem('accounts', data.account_id, account);
                    callback(data);
                },
                errorHandler
            );
        };
        newApi.updateAccount = function(account, callback, errorCallback) {
            cache.setItem('accounts', account.account_id, account);
            sendRequest('/api/account/updateAccount', {data:mapToAccount(account)},
                'Аккаунт успешно обновлен',
                'Неверные данные',
                callback,
                errorCallback
            );
        };
        newApi.removeAccount = function(id, callback) {
            cache.removeItem('accounts', id);
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
            }, null, null, function(data) {
                data.managers.forEach(function(val, idx, arr){
                    cache.setItem('accounts', val.manager_id, val);
                });
                callback(data);
            }, errorHandler);
            return cache.getItems('accounts');
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
