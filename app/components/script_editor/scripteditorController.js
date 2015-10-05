app.controller('ScriptEditorController', ['$rootScope', '$routeParams', 'api', 'notification', 'modal', '$location', function ($rootScope, $routeParams, api, notification, modal, $location) {
    
    // View variables
    
    this.scriptName = '';
    this.isLoading = true;
    this.quickLinks = [];

    this.removeQuickLink = function (lnk) {
        var newArray = [];
        jQuery.each(this.quickLinks, function (i, v) {
            if (lnk != v) {
                newArray.push(v);
            }
        });
        this.quickLinks = newArray;
        $rootScope.$digest();
    };

    var arrayIsEmpty = function (a) {
        for (var i = 0; i < a.length; i++) {
            if (a[i])
                return false
        }
        return true;
    };
    var thisObj = this;
    var c = jQuery('<canvas id="canv" width="' + jQuery('#treelib-holder').width() + '" height="500"></canvas>');
    jQuery('#treelib-holder').append(c);
    var cnv = new fabric.Canvas('canv', {
        selection: false,
        hoverCursor: 'pointer'
    });
    var d = new treelib.Diagram(cnv);
    var currentScript = null, isNew = false;
    var id = null;
    if ($routeParams.scriptId != '0') {
        id = $routeParams.scriptId * 1;
    }
    if (id) { // Load desired script
        api.findScriptById(id, function (script) {
            script.data = JSON.parse(script.script.json_string);
            currentScript = script;
            d.loadFromJson(currentScript.data);
            d.init();
            thisObj.quickLinks = d.getQuickLinks();
            thisObj.scriptName = currentScript.script.script_name;
            thisObj.isLoading = false;
            $rootScope.$digest();
        });
        this.scriptId = id;
    } else { // Create new script
        thisObj.isLoading = false;
        var currentScript = {
            name: 'Новый скрипт',
            data: [
                {
                    id: 1,
                    text: 'Точка входа',
                    isAnswer: false,
                    startPoint: true,
                    linksTo: [2, 3]
                },
                {
                    id: 2,
                    text: 'Вариант ответа 1',
                    isAnswer: true,
                    linksTo: [4]
                },
                {
                    id: 3,
                    text: 'Вариант ответа 2',
                    isAnswer: true,
                    linksTo: [4]
                },
                {
                    id: 4,
                    text: 'Выход из скрипта',
                    isAnswer: false,
                    linksTo: []
                }
            ]
        };
        d.loadFromJson(currentScript.data);
        d.init();
        d.buildTree();
        thisObj.quickLinks = d.getQuickLinks();
        isNew = true;
        thisObj.scriptName = currentScript.name;
    }
    var
        currentSelection = null,
        isPanning = false,
        prevMousePos = null,
        origin = new fabric.Point(0, 0),
        zoomPoint = new fabric.Point(0, 0),
        nodeGap = 20;

    var onWheel = function (e) {
        e = e || window.event;
        var delta = e.deltaY || e.detail || e.wheelDelta;
        e.preventDefault();
        if (delta < 0) {
            cnv.zoomToPoint(zoomPoint, cnv.getZoom() * 1.1);
            origin.x *= 1.1;
            origin.y *= 1.1;
        } else {
            cnv.zoomToPoint(zoomPoint, cnv.getZoom() / 1.1);
            origin.x *= 1.1;
            origin.y *= 1.1;
        }
    };
    var scriptAddingComplete = function(){
        $location.path('/scripttextedit/'+thisObj.scriptId);
        $rootScope.$digest();
    };
    this.switchToTextMode = function() {
        jQuery('#saveScript').click();
        if(this.scriptId >= 0) {
            $location.path('/scripttextedit/'+thisObj.scriptId);
            $rootScope.$digest();
        }
    };

    cnv.on("mouse:down", function (ev) {
        var editor = jQuery('#textEditor');
        if (ev.target) {
            if (ev.target.treelib_type === treelib.NODE) {
                if (ev.e.shiftKey && currentSelection != null) {
                    var result = d.connect(currentSelection.treelib_model, ev.target.treelib_model);
                    if (result === 1) {
                        modal.info('Нельзя соединить уже соединенные объекты','Ошибка');
                    } else if (result === 2) {
                        modal.info('Объекты одного типа нельзя соединять - вопросы с ответами, ответы с вопросами', 'Ошибка');
                    } else if (result === 3) {
                        modal.info("Узел уже ссылается на другой скрипт", "Ошибка");
                    }
                } else {
                    editor.removeAttr("disabled");
                    editor.val(ev.target.treelib_model.getText());
                }
            }
            currentSelection = ev.target;
        } else {
            editor.attr("disabled", '');
            editor.val('');
            isPanning = true;
            currentSelection = null;
        }
    });
    cnv.on("mouse:move", function (ev) {
        if (!isPanning) {
            var coords = cnv.getPointer(ev.e);
            zoomPoint.x = coords.x;
            zoomPoint.y = coords.y;
        }
    });
    if (jQuery("#treelib-holder")[0].addEventListener) {
        if ('onwheel' in document) {
            // IE9+, FF17+, Ch31+
            jQuery("#treelib-holder")[0].addEventListener("wheel", onWheel);
        } else if ('onmousewheel' in document) {
            // устаревший вариант события
            jQuery("#treelib-holder")[0].addEventListener("mousewheel", onWheel);
        } else {
            // Firefox < 17
            jQuery("#treelib-holder")[0].addEventListener("MozMousePixelScroll", onWheel);
        }
    } else { // IE8-
        jQuery("#treelib-holder")[0].attachEvent("onmousewheel", onWheel);
    }
    jQuery(window).mouseup(function () {
        isPanning = false;
        prevMousePos = null;
    });
    jQuery(window).mousemove(function (event) {
        if (isPanning) {
            if (prevMousePos !== null) {
                origin.x = event.pageX - prevMousePos[0];
                origin.y = event.pageY - prevMousePos[1];
                cnv.relativePan(origin);
            }
            prevMousePos = [event.pageX, event.pageY];
        }
    });
    jQuery('#textEditor').keyup(function () {
        if (currentSelection) {
            currentSelection.treelib_model.setText(jQuery('#textEditor').val());
        }
    });
    jQuery(window).keydown(function (e) {
        if (currentSelection && e.keyCode === 46) {
            if (!d.remove(currentSelection.treelib_model)) {
                modal.info("В дереве скрипта должен оставаться хотя бы один вопрос", "Ошибка");
            }
            currentSelection = null;
        }
    });
    jQuery("#buildTree").click(function () {
        if (currentSelection &&
            currentSelection.treelib_type === treelib.NODE) {
            d.buildTree(currentSelection.treelib_model.id);
        } else {
            d.buildTree();
        }
        //d.refresh();
    });
    jQuery('#addNew').click(function (e) {
        e.preventDefault();
        if (currentSelection && currentSelection.treelib_type === treelib.NODE) {
            if ((!currentSelection.treelib_model.isAnswer || arrayIsEmpty(currentSelection.treelib_model.children))) {
                if(!currentSelection.treelib_model.nextScript) {
                    var n = new treelib.Node({
                        id: d.generateId(),
                        text: 'Новый элемент',
                        isAnswer: !currentSelection.treelib_model.isAnswer,
                        linksTo: []
                    });
                    d.add(n);
                    d.connect(currentSelection.treelib_model, n);
                    d.buildTree(currentSelection.treelib_model.id);
                    //d.refresh();
                } else {
                    modal.info("Выбранный объект ссылается на другой скрипт", "Ошибка");
                }
            } else {
                modal.info("У объекта типа 'ответ' может быть только одна выходная стрелка", "Ошибка");
            }
        } else {
            modal.info("Для создания нового объекта необходимо выбрать какой-либо из уже существующих на диаграмме", "Ошибка");
        }
    });
    jQuery('#saveScript').click(function (e) {
        currentScript.data = d.saveToJson();
        currentScript.name = thisObj.scriptName;
        //TODO: Block all UI
        console.log(e);
        if (isNew) {
            api.addScript(currentScript, function(result){
                currentScript.id = result.script_id;
                thisObj.scriptId = result.script_id;
                scriptAddingComplete();
                isNew = false;
                //TODO: Unblock all UI
            });
        } else {
            api.updateScript(currentScript, function(){
                //TODO: Unblock all UI
            });
        }
    });
    jQuery('#addToFast').click(function () {
        if (currentSelection &&
            currentSelection.treelib_type === treelib.NODE) {
            if (currentSelection.treelib_model.setQuickLink(true)) {
                thisObj.quickLinks.push(currentSelection.treelib_model);
                $rootScope.$digest();
            } else {
                //Current selection must be an answer, not connection or question
                modal.info("Нужно выбрать узел с ответом клиента, а не с вопросом менеджера", "Ошибка");
            }
        } else {
            //Need current selection for action
            modal.info("Необходимо выбрать узел", "Ошибка");
        }
    });
    jQuery('#transition').click(function() {
        notification.info("Простите, данная функция временно не поддерживается");
    });
}]);