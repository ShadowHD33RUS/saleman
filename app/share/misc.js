var saleman_misc = {
	removeElement: function(element, array) {
		for(var i = 0; i < array.length; i++) {
			if(element === array[i]) {
				array.splice(i,1);
			}
		}
	}
};