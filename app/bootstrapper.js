(function () {
	"use strict";
	var appFiles = {
		debug: [
			['assets/js/materialize.min.js'],
			[
				"assets/js/toast.js",
				"assets/js/tooltip.js",
				"assets/js/angular.min.js",
				"assets/js/fabric.min.js",
				"assets/js/treelib.js",
				"assets/js/aes.js",
			],
			[
				"assets/js/enc-base64-min.js",
				"assets/js/angular-route.min.js",
				"app/app.module.js",
				"app/app.route.js",
				"app/share/api/apiService.js",
				"app/share/navbar/navbarController.js",
				"app/share/notify/notifyService.js",
				"app/share/converter/converterService.js",
				"app/share/model.js",
				"app/share/misc.js"
			],
			[
				"app/components/clients/clientsController.js",
				"app/components/login/loginController.js",
				"app/components/registration/registrationController.js",
				"app/components/script_editor/scripteditorController.js",
				"app/components/script_run/scriptrunController.js",
				"app/components/scripts/scriptsController.js",
				"app/components/support/supportController.js",
				"app/components/convert/convertController.js",
				"app/components/accounts/accountsController.js",
				"app/components/recover/recoverController.js",
				"app/components/script_texteditor/script_texteditorController.js"
			]
		],
		production: [
			['assets/js/materialize.min.js'],
			["assets/js/saleman-webclient-libs.min.js"],
			["assets/js/saleman-webclient.min.js"]
		]
	};

	function loadApplication() {
		angular.bootstrap(document.body, ['saleman']);
		$('#appPreloader').css('display', 'none');
		$('#hiden').css('display', 'block');
	}

	function populateCurrentUser(response) {
		var r = {
			email: response.account.email,
			firstname: response.account.firstname,
			lastname: response.account.lastname,
			patron: response.account.patron,
			getFullName: function () {
				return this.lastname + ' ' + this.firstname + ' ' + this.patron;
			},
			isAdmin: response.account.admin,
			blocked: response.company.blocked,
			nextPayment: response.account.next_payment,
			companyKey: response.company.company_key,
			company: response.company.title,
			money: response.company.money,
			account_id: response.account.accountId
		};
		r.perms = {};
		jQuery.each(response.account, function (k, v) {
			var delim = k.indexOf('Permission');
			if (delim != -1) {
				r.perms[k.substring(0, delim)] = v;
			}
		});
		return r;
	}

	function init() {

		function authorize() {
			return $.ajax({
				url: 'http://185.87.49.173:8080/saleman/api/account/getInfo?access_token=' + appCache['tokens']['access'],
				dataType: 'json',
				method: 'POST',
				contentType: 'application/json',
			});
		}

		function authorizeHandler(data) {
			//Access token is valid. Populate currentUser with data
			var currentUser = {
				accessToken: appCache['tokens']['access'],
				refreshToken: appCache['tokens']['refresh'],
				expiresIn: new Date(appCache['tokens']['expiresIn']),
			};
			jQuery.extend(currentUser, saleman_misc.populateCurrentUser(data));
			angular.currentUser = currentUser;
			localStorage.setItem('app_cache', JSON.stringify(appCache));
			loadApplication();
		}

		jQuery(".button-collapse").sideNav();
		// jQuery("#hiden").css('display', 'block');
		var appCache = localStorage.getItem('app_cache');
		if (appCache) {
			appCache = JSON.parse(appCache);
			if (appCache['tokens'] && appCache['tokens']['refresh'] && appCache['tokens']['access'] && appCache['tokens']['expiresIn']) {
				//We have access token here. Let's check it
				authorize()
					.done(authorizeHandler)
					.fail(function () {
						//Try to use refresh token for restoring access token
						$.ajax({
							url: 'http://185.87.49.173:8080/saleman/oauth/token?grant_type=refresh_token&client_id=web-client&refresh_token=' + appCache['tokens']['refresh'],
							dataType: 'json',
							contentType: 'application/json',
						}).done(function (data) {
							//Access token restored. Reauthorize
							appCache['tokens']['access'] = data.access_token;
							appCache['tokens']['refresh'] = data.refresh_token;
							appCache['tokens']['expiresIn'] = data.expires_in;
							authorize().done(authorizeHandler).fail(function () {
								loadApplication();
							});
						}).fail(function () {
							//Can't restore access token
							loadApplication();
						});
					});
			} else {
				loadApplication();
			}
		} else {
			loadApplication();
		}
	}
	
	//Define boostrapper function
	function bootstrap(fileLists, level) {
		if (level === undefined) {
			level = 0;
		}
			
		//Load all files if fileLists[i] or fail
		
		//Loader
		var scriptLoadingPromises = jQuery.map(fileLists[level], function (url) {
			var dfd = jQuery.Deferred();
			jQuery.ajax({
				url: "/" + url,
				method: 'HEAD'
			}).done(function (data, status, jq) {
				var cached = localStorage.getItem(url + '_timestamp'),
					lastModified = new Date(jq.getResponseHeader('Last-Modified'));
				if ((cached === undefined) || ((new Date(cached)).getTime() !== lastModified.getTime())) {
					console.log("Updating cache for " + url);
					jQuery.ajax({
						url: "/" + url,
						dataType: "text"
					}).done(function (resp) {
						localStorage.setItem(url, resp);
						localStorage.setItem(url + '_timestamp', lastModified.toString());
						eval.call(window, resp);
						dfd.resolve();
					})
						.fail(function () {
							console.error("Cannot load script " + url);
							dfd.reject();
						});
				} else {
					eval.call(window, localStorage.getItem(url));
					console.log("Loading from cache for " + url);
					dfd.resolve();
				}
			}).fail(function () {
				console.log("Failed to request headers from server. Attempting to load script");
				//Try to load script
				jQuery.ajax({
					url: "/" + url,
					dataType: "script"
				}).done(function () {
					dfd.resolve();
				})
					.fail(function () {
						dfd.reject();
					});
			});
			return dfd.promise();
		});

		jQuery.when.apply(this, scriptLoadingPromises)
			.done(function () {
				console.log("Scripts of level " + level + " was loaded in " + (appConfig.debug ? 'debug' : 'production') + " mode");
				if (fileLists[level + 1] !== undefined) {
					bootstrap(fileLists, level + 1);
				} else {
					//Application loaded. Init code here
					console.log("Application loaded");
					init();
				}
				//TODO: implement cache in localStorage
			})
			.fail(function () {
				console.log("Cannot load scripts of level " + level + " in " + (appConfig.debug ? 'debug' : 'production') + " mode");
				alert("Приложение не было загружено. Возможно проблемы с соединением. Пожалуйста, попробуйте перезагрузить страницу");
			});

	}

	jQuery(document).ready(function () {
		if (appConfig.debug) {
			bootstrap(appFiles.debug)
		} else {
			bootstrap(appFiles.production);
		}
	});

})();