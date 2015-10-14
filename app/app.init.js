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
		
	//Deprecated, will be removed next month
	r.cipherKey = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(r.email + r.getFullName()));

	return r;
}

jQuery(document).ready(function () {
	jQuery(".button-collapse").sideNav();
	// jQuery("#hiden").css('display', 'block');
	var appCache = localStorage.getItem('app_cache');
	if (appCache) {
		appCache = JSON.parse(appCache);
		if (appCache['tokens'] && appCache['tokens']['refresh']) {
			//We have some refresh token here
			$.ajax({
				url: 'http://185.87.49.173:8080/saleman/oauth/token?grant_type=refresh_token&client_id=web-client&refresh_token=' + appCache['tokens']['refresh'],
				dataType: 'json',
				contentType: 'application/json',
				success: function (data) {
					var currentUser = {
						accessToken: data.access_token,
						refreshToken: data.refresh_token,
						expiresIn: data.expires_in,
					};
					$.ajax({
						url: 'http://185.87.49.173:8080/saleman/api/account/getInfo?access_token=' + data.access_token,
						dataType: 'json',
						method: 'POST',
						contentType: 'application/json',
						success: function (data) {
							jQuery.extend(currentUser, saleman_misc.populateCurrentUser(data));
							angular.currentUser = currentUser;
							loadApplication();
						},
						error: function () {
							loadApplication();
						}
					});
				},
				error: function () {
					loadApplication();
				}
			})
		} else {
			loadApplication();
		}
	} else {
		loadApplication();
	}

});