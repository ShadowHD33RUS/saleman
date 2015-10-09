/*
  LEARN HOW TO USE COMPOSERS AND COMPRESSORS FOR JAVASCRIPT
*/

var app = angular.module('saleman', ['ngRoute', 'api', 'notify', 'converter']);

app.directive('viewDropdown', function () {
  return function (scope, element, attrs) {
    if(scope.$last) {
      jQuery('.dropdown-button').dropdown({
          inDuration: 300,
          outDuration: 225,
          constrain_width: false, // Does not change width of dropdown to that of the activator
          hover: true, // Activate on hover
          gutter: 0, // Spacing from edge
          belowOrigin: false // Displays dropdown below the button
        }
      );
    }
  }
});