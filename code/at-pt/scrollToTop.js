esOverview.directive('scrollToTop', ['$document', function ($document) {
    return {
        restrict: 'A', // scroll-to-top attribute
        link: function (scope, elm, attrs) {
            elm.bind("click", function () {
                var target = $(this).attr('scroll-to-top') || 'body',
                    $target = $(target);

                $('html, body').animate({
                    scrollTop: $target.offset().top
                }, 800);
            });
        }
    };
}]);
