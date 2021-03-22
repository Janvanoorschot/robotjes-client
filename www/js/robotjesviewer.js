'use strict';
(function($) {

    var defaults = {
        'id':'0',
        updateDuration:50
    };

    /**
     * Functional constructor for robo.
     */
    $.fn.rm = {}
    $.fn.robotjes = {};
    $.fn.robotjes.robotjesviewer = function(node) {
        var that = {};
        that.node = node;
        that.skin = null;
        that.images = {}
        $.getJSON("/challenge/skin")
            .then(function(skin) {
                that.skin = skin;
                return $.getJSON("/challenge/map")
                    .done(function (map) {
                        that.map = map;
                    })
            })
            .then(function() {
                return new Promise((resolve, reject) => {
                    var count = 0;
                    for (const [key, path] of Object.entries(that.skin)) {
                        count++;
                        var image = document.createElement("img");
                        image.onload = function () {
                            count--;
                            if (count <= 0) {
                                resolve(that.images);
                            }
                        };
                        image.onerror = function(evt) {
                            count--;
                            if(count<=0) {
                                reject(that.images);
                            }
                        }
                        that.images[key] = image
                        image.src = path;
                    }
                });
            })
            .then(function(images) {
                var moviePlayerNode = $('<div id="worldpane" class="worldpane" ><div id="worldsubpane" style="height: 100%; width: 100%;" class="animation"></div></div>');
                that.movieplayer =  $.fn.rm.movieplayer('movieplayer1',moviePlayerNode.find('#worldsubpane'), that, that.skin,that.images);
                that.node.append(moviePlayerNode);
            })
        return that;
    };

})(jQuery);