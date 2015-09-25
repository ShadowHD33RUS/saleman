(function () {
    
    //Constants
    
    var notificationTimer = 4000;
    var modalId = "notifyModal";
    
    var defaultModalHeader = "Внимание",
    defaultOkButton = "OK",
    defaultCancelButton = "Отмена";
    
    //Variables
    
    var notificationId = 0;
    
    //Reusable private code
    
    var findModal = function() {
        var modal = jQuery('#'+modalId);
        if(modal.length === 0) {
            return createModal();
        } else {
            return modal;
        }
    };
    var createModal = function() {
        var modal = jQuery('<div id="'+modalId+'" class="modal modal-fixed-footer"><div class="modal-content"><h4 id="'+modalId+
        'Header">MODAL HEADER</h4><span id="'+modalId+'Body">BODY</span></div><div class="modal-footer" id="'+modalId+'Footer"></div></div>');
        jQuery(document.body).append(modal);
        return modal;
    };
    var setModalHeader = function(modal, content) {
        modal.find('#'+modalId+'Header').html('').html(content);
    };
    var setModalBody = function(modal, content) {
        modal.find('#'+modalId+'Body').html('').html(content);
    };
    var setModalFooter = function(modal, buttons) {
        modal.find('#'+modalId+'Footer').html('');
        jQuery.each(buttons, function(k, v) {
            jQuery('<a id="button'+k+'" class="btn modal-action modal-close">'+v.text+'</a>').appendTo(modal.find('#'+modalId+'Footer')).click(v.callback);
        });
    };
    
    // Service definition
    
    var module = angular.module('notify', []);
    module.factory('notification', function () {
        var notification = {
            info: function(text) {
                Materialize.toast(text, notificationTimer);
            },
            infoWithAction: function(bodyText, actionText, actionCallback) {
                var closeFunc = Materialize.toast('<span>'+bodyText+'</span><a class="btn-flat yellow-text" id="not'+notificationId+'">'+actionText+'<a>', notificationTimer);
                jQuery('#not'+notificationId++).click(function(){
                    actionCallback();
                    closeFunc();
                });
            }
        };
        return notification;
    });
    module.factory('modal', function () {
        var notification = {
            info: function(text, header) {
                var modal = findModal();
                setModalBody(modal, text);
                if(header) {
                    setModalHeader(modal, header);
                } else {
                    setModalHeader(modal, defaultModalHeader);
                }
                setModalFooter(modal, [{text:defaultOkButton,callback:jQuery.noop}]);
                modal.openModal();
            },
            okCancelDialog: function(text, okCallback, cancelCallback, header, okText, cancelText) {
                var modal = findModal(),
                btns = [
                    {
                        text: okText ? okText : defaultOkButton,
                        callback: okCallback ? okCallback : jQuery.noop
                    },
                    {
                        text: cancelText ? cancelText : defaultCancelButton,
                        callback: cancelCallback ? cancelCallback : jQuery.noop
                    }];
                setModalBody(modal, text);
                if(header) setModalHeader(modal, header);
                setModalFooter(modal, btns);
                modal.openModal();
            },
            
        };
        return notification;
    });
})
();
