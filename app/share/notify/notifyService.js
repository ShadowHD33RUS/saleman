(function () {
    "use strict";
    //--------------------------------------------------------
    // Service variables
    //--------------------------------------------------------
    
    var notificationTimer = 4000,
        modalId = "notifyModal",
        defaultModalHeader = "Внимание",
        defaultOkButton = "OK",
        defaultCancelButton = "Отмена",
        notificationId = 0,
        currentlyDisplayedToasts = {};
    
    
    //--------------------------------------------------------
    // Private functions
    //--------------------------------------------------------
    
    function findModal() {
        var modal = jQuery('#' + modalId);
        if (modal.length === 0) {
            return createModal();
        } else {
            return modal;
        }
    }

    function createModal() {
        var modal = jQuery('<div id="' + modalId + '" class="modal modal-fixed-footer"><div class="modal-content"><h4 id="' + modalId +
            'Header">MODAL HEADER</h4><span id="' + modalId + 'Body">BODY</span></div><div class="modal-footer" id="' + modalId + 'Footer"></div></div>');
        jQuery(document.body).append(modal);
        return modal;
    }

    function setModalHeader(modal, content) {
        modal.find('#' + modalId + 'Header').html('').html(content);
    }

    function setModalBody(modal, content) {
        modal.find('#' + modalId + 'Body').html('').html(content);
    }

    function setModalFooter(modal, buttons) {
        modal.find('#' + modalId + 'Footer').html('');
        jQuery.each(buttons, function (k, v) {
            jQuery('<a id="button' + k + '" class="btn modal-action modal-close">' + v.text + '</a>').appendTo(modal.find('#' + modalId + 'Footer')).click(v.callback);
        });
    }
    
    
    //--------------------------------------------------------
    // Notification service definition
    //--------------------------------------------------------
    
    var module = angular.module('notify', []);
    module.factory('notification', function () {
        var notification = {
            info: function (text) {
                if (!currentlyDisplayedToasts[text]) {
                    currentlyDisplayedToasts[text] = true;
                    Materialize.toast(text, notificationTimer, '', function () {
                        delete currentlyDisplayedToasts[text];
                    });
                }
            },
            infoWithAction: function (bodyText, actionText, actionCallback) {
                var closeFunc = Materialize.toast('<span>' + bodyText + '</span><a class="btn-flat yellow-text" id="not' + notificationId + '">' + actionText + '</a>', notificationTimer);
                jQuery('#not' + notificationId++).click(function () {
                    actionCallback();
                    closeFunc();
                });
            }
        };
        return notification;
    });
    
    
    //--------------------------------------------------------
    // Modal service definition
    //--------------------------------------------------------
    
    module.factory('modal', function () {
        var notification = {
            info: function (text, header) {
                var modal = findModal();
                setModalBody(modal, text);
                if (header) {
                    setModalHeader(modal, header);
                } else {
                    setModalHeader(modal, defaultModalHeader);
                }
                setModalFooter(modal, [{ text: defaultOkButton, callback: jQuery.noop }]);
                modal.openModal();
            },
            okCancelDialog: function (text, okCallback, cancelCallback, header, okText, cancelText) {
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
                if (header) setModalHeader(modal, header);
                setModalFooter(modal, btns);
                modal.openModal();
            },

        };
        return notification;
    });
})();
