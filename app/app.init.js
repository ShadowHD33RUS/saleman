function loadApplication() {
	angular.bootstrap(document.body, ['saleman']);
	$('#appPreloader').css('display', 'none');
	$('#hiden').css('display', 'block');
}

jQuery(document).ready(function(){
	jQuery(".button-collapse").sideNav();
	// jQuery("#hiden").css('display', 'block');
	var appCache = localStorage.getItem('app_cache');
	if(appCache) {
	appCache = JSON.parse(appCache);
	if(appCache['tokens'] && appCache['tokens']['refresh']) {
		//We have some refresh token here
		$.ajax({
		url: 'http://185.87.49.173:8080/saleman/oauth/token?grant_type=refresh_token&client_id=web-client&refresh_token='+appCache['tokens']['refresh'],
		dataType: 'json',
		contentType: 'application/json',
		success: function(data) {
			var currentUser = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresIn: data.expires_in,
			};
			$.ajax({
			url: 'http://185.87.49.173:8080/saleman/api/account/getInfo?access_token='+data.access_token,
			dataType: 'json',
			method: 'POST',
			contentType: 'application/json',
			success: function(data) {
				currentUser.email = data.account.email,
				currentUser.firstname = data.account.firstname;
				currentUser.lastname = data.account.lastname;
				currentUser.patron = data.account.patron;
				currentUser.getFullName = function() {
					return this.lastname + ' ' + this.firstname + ' ' + this.patron;
				};
				//Parse permissions
				currentUser.perms = {};
				$.each(data.account, function(k,v){
					var delim = k.indexOf('Permission');
					if(delim != -1) {
						currentUser.perms[k.substring(0, delim)] = v;
					}
				});
				currentUser.isAdmin = data.account.admin;
				currentUser.blocked = data.company.blocked;
				currentUser.nextPayment = data.account.next_payment;
				//calculate cipher key
				var key = CryptoJS.enc.Utf8.parse(currentUser.email+currentUser.getFullName());
				currentUser.cipherKey = CryptoJS.enc.Base64.stringify(key);
				
				angular.currentUser = currentUser;
				loadApplication();
			},
			error: function() {
				loadApplication();
			}
			});
		},
		error: function() {
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