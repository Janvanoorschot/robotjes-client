(function($) {

    var defaults = {
        'id':'0',
        updateDuration:50
    };

    /**
     * Functional constructor for robo.
     */
    $.fn.robotjes = {};
    $.fn.robotjes.robotjesviewer = function(node,skin,images,challengeId,language) {
        var that = {};

        skin = loadSkin(that);

        return that;
    };

    function loadSkin(that) {
        let skin = $.getJSON("/challenge/skin")
            .done(function(data) {
                console.log(data);
            })
    }

})(jQuery);