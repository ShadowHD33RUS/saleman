var saleman_misc = {

	removeElement: function (element, array) {
		for (var i = 0; i < array.length; i++) {
			if (element === array[i]) {
				array.splice(i, 1);
			}
		}
	},

	findFirstNotNullElement: function (arr) {
		var i = 0;
		for (; i < arr.length; i++) {
			if (arr[i] != null) {
				return arr[i]
			}
		}
	},

	copyObj: function (obj) {
		var result = {};
		for (var k in obj) {
			result[k] = obj[k];
		}
		return result;
	},

	populateCurrentUser: function (response) {
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
};