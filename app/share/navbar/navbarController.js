(function () {

	var menus = {
		'manager': [
			{ name: 'Скрипты', location: '#/scripts' },
			{ name: 'База клиентов', location: '#/clients' },
			{ name: 'Задачи', location: '#/notready' },
			{ name: 'Тех. поддержка', location: '#/support' },
			{ name: 'Импорт', location: '#/convert' }
		],
		'admin': [
			{ name: 'Скрипты', location: '#/scripts' },
			{ name: 'База клиентов', location: '#/clients' },
			{ name: 'Задачи', location: '#/notready' },
			{ name: 'Тех. поддержка', location: '#/support' },
			{ name: 'Статистика', location: '#/notready' },
			{ name: 'Импорт', location: '#/convert' },
			{ name: 'Аккаунты', location: '#/accounts' }
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
			item = thisController.currentMenu[0];
			//$rootScope.$digest();
			$location.path("/scripts");
		});
		
		this.loggedIn = api.isLoggedIn();

		this.logout = function () {
			api.logout(function (params) {
				notification.info('Вы вышли из приложения');
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