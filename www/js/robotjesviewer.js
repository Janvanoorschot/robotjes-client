'use strict';
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

        that.skin = null;
        that.images = {}
        $.getJSON("/challenge/skin")
            .done(function(skin) {
                var count = 0;
                for (const [key, path] of Object.entries(skin)) {
                    count++;
                    var image = document.createElement("img");
                    image.onload = function () {
                        count--;
                        if (count <= 0) {
                            return that.images;
                        }
                    };
                    image.onerror = function(evt) {
                        count--;
                        if(count<=0) {
                            return that.images;
                        }
                    }
                    that.images[key] = image
                    image.src = path
                }
            })
            .done(function(images) {
                console.log("yes!!!");
            })
        return that;
    };

    function loadSkin(that) {
    }

})(jQuery);