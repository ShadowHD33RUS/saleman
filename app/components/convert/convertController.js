app.controller('ConvertController', ['api', 'notification', 'script_converter', function (api, notification, script_converter) {
    "use strict";
    //--------------------------------------------------------
    // Controller properties
    //--------------------------------------------------------
    
    this.apiSupport = false;
    
    
    //--------------------------------------------------------
    // Controller methods
    //--------------------------------------------------------
    
    this.importScript = function () {
        var f = jQuery('#oldFile')[0];
        for (var i = 0; i < f.files.length; i++) {
            var filename = jQuery('#oldFile').parent().parent().find('input[type="text"]').val().substr(0, 20);
            script_converter.convert(f.files[i], filename, function (script) {
                if (script) {
                    api.addScript(script, function () {
                        notification.info('Импортирование завершено');
                    });
                }
            });
        }
    };
    
    
    //--------------------------------------------------------
    //Initialization code
    //--------------------------------------------------------
    
    //Check for needed File API support
    if (window.File && window.FileReader) {
        this.apiSupport = true;
    } else {
        notification.info("Импорт не будет работать. Обновите ваш браузер");
    }

}]);