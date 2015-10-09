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
	}
};