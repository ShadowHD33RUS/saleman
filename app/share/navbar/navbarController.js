(function () {

	var menus = {
		'manager': [
			{ name: 'Скрипты', location: '#/scripts', showBlocked: false },
			{ name: 'База клиентов', location: '#/clients', showBlocked: false },
			{ name: 'Задачи', location: '#/notready', showBlocked: false },
			{ name: 'Тех. поддержка', location: '#/support', showBlocked: true },
			{ name: 'Импорт', location: '#/convert', showBlocked: false }
		],
		'admin': [
			{ name: 'Скрипты', location: '#/scripts', showBlocked: false },
			{ name: 'База клиентов', location: '#/clients', showBlocked: false },
			{ name: 'Задачи', location: '#/notready', showBlocked: false },
			{ name: 'Тех. поддержка', location: '#/support', showBlocked: true },
			{ name: 'Статистика', location: '#/notready', showBlocked: false },
			{ name: 'Импорт', location: '#/convert', showBlocked: false },
			{ name: 'Аккаунты', location: '#/accounts', showBlocked: true }
		],
		'system-admin': [
			{ name: 'Цены', location: '/#/home' },
			{ name: 'Статистика использования', location: '/#/home' },
			{ name: 'Сообщения', location: '/#/home' },
			{ name: 'Настройки приложения', location: '/#/home' },
		]
	};

	app.controller('NavbarController', ['api', '$rootScope', 'notification', '$location', function (api, $rootScope, notification, $location) {
		var thisController = this;
		var item = null;
		this.username = 'initial';
		this.currentMenu = null;
		
		$rootScope.$on('authChange', function () {
			thisController.loggedIn = api.isLoggedIn();
			thisController.username = thisController.loggedIn ? api.getCurrentUser().getFullName() : '';
			
			//Set current menu item for user
			thisController.currentMenu = api.getCurrentUser().isAdmin ? menus.admin : menus.manager;
			if(api.getCurrentUser().blocked) {
				for(var k = 0; k < thisController.currentMenu.length; k++) {
					if(thisController.currentMenu[k].showBlocked !== undefined && thisController.currentMenu[k] === false)
						thisController.currentMenu.splice(k,1);
				}
			}
			
			//Current selection in navbar menu is managed by location
			var currentPath = $location.path();
			if(currentPath.indexOf('login') !== -1) {
				$location.path('/scripts');
				item = thisController.currentMenu[0];
			} else {
				for(var k = 0; k < thisController.currentMenu.length; k++) {
					if(thisController.currentMenu[k].location.indexOf(currentPath) !== -1) {
						item = thisController.currentMenu[k];
						break;
					}
				}
			}
			
			$rootScope.$digest();
			$location.path("/scripts");
		});
		
		this.loggedIn = api.isLoggedIn();

		this.logout = function () {
			api.logout(function (params) {
				notification.info('Вы вышли из приложения');
				item = null;
				$rootScope.$broadcast('authChange', {});
			});
		};
		this.selectMenuItem = function (it) {
			item = it;
		};
		this.menuSelected = function (it) {
			return item === it;
		};
		
	}]);
})();