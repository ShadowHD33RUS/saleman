(function () {
    "use strict";
    var module = angular.module('converter', []);
    module.factory('script_converter', function () {
        var script_converter = {
            /**
            * Algorithm:
            * 1) Parse nodes
            * 2) Parse quick links
            * */
            convert: function (file, fileName, callback) {
                var reader = new FileReader(),
                    script = {
                        data: [],
                        cache: {},
                        answers: [],
                        name: fileName
                    };
                reader.onload = function () {
                    var xmlDoc = jQuery.parseXML(reader.result);
                    
                    //Receive all nodes from document
                    var nodes = xmlDoc.querySelectorAll('Pages > Item');
                    
                    //Used to generate id for answers
                    var genId = 0,
                        answerId = 0;
                    
                    //Parse nodes
                    jQuery.each(nodes, function (k, v) {
                        //Parse node with their answers
                        var currentNode = {};
                        
                        //Parse question
                        currentNode.id = 1 * v.getElementsByTagName('Id')[0].innerHTML;
                        
                        //Ахтунг!!! Говнокод!!!
                        if (currentNode.id === 0) currentNode.startPoint = true;

                        var text1 = v.getElementsByTagName('Text1');
                        var text2 = v.getElementsByTagName('Text2');
                        currentNode.text = (text1.length > 0 ? text1[0].innerHTML : '') + '\n' + (text2.length > 0 ? text2[0].innerHTML : '');
                        currentNode.isAnswer = false;
                        currentNode.linksTo = [];

                        genId = genId <= currentNode.id ? currentNode.id + 1 : genId;
                        
                        //Parse answers
                        var answers = v.querySelectorAll('Answers > Item');
                        jQuery.each(answers, function (j, h) {
                            var ans = {};
                            ans.id = answerId++;
                            ans.text = h.getElementsByTagName('Text')[0].innerHTML;
                            ans.isAnswer = true;
                            var linkTo = 1 * h.getElementsByTagName('LinkID')[0].innerHTML;
                            if (linkTo >= 0) {
                                ans.linksTo = [linkTo];
                            } else {
                                ans.linksTo = [];
                            }

                            currentNode.linksTo.push(ans.id);
                            script.answers.push(ans);
                        });
                        
                        //Store script node in cache structure for easy access
                        script.cache[currentNode.id] = currentNode;
                    });
                    
                    //Parse quick links
                    var quickLinks = xmlDoc.querySelectorAll('QuickLink > Item');
                    jQuery.each(quickLinks, function (k, v) {
                        var lnk = {
                            id: answerId++,
                            text: v.getElementsByTagName('Text')[0].innerHTML,
                            isAnswer: true,
                            linksTo: [1 * v.getElementsByTagName('LinkID')[0].innerHTML],
                            quickLink: true
                        };
                        script.answers.push(lnk);
                    });
                    
                    //Add required id to all answers and update all question links to them
                    jQuery.each(script.cache, function (k, v) {
                        for (var j = 0; j < v.linksTo.length; j++) {
                            v.linksTo[j] += genId;
                        }
                        script.data.push(v);
                    });
                    jQuery.each(script.answers, function (k, v) {
                        v.id += genId;
                        script.data.push(v);
                    });
                    
                    //script data contains all required data to store script now
                    if (typeof callback === 'function') {
                        callback({
                            name: script.name,
                            data: script.data
                        });
                    } else {
                        console.error("Callback is not a function");
                    }
                };
                reader.readAsText(file);
            }
        };
        return script_converter;
    });
})();
