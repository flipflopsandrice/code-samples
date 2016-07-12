esOverview.directive('esLayoutSwitch', function() {
	return {
		restrict: 'A', // es-layout-switch attribute
 		link: function(scope, element, attrs) {
	 		/*
			 * Set switch options based on the es-layout-switch attribute
			 * Should be a array of objects with label properties
			 */
			 scope.switchOptions = attrs.esLayoutSwitch.split(',');
		},
		controller: ['$scope', '$element', 'EsManager', function($scope, $element, EsManager) {
			// Set layout view value to uri
			$scope.applyLayout = function(value) {
				EsManager.setLayout(value);
			};
		}]
	};
});
