/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Robomind specific zoom button bar.
 **/
(function($) {

    var defaults = {
        'id':'0'
    };

    /**
     * Functional constructor for robo.
     */
    $.fn.rm.rmzoombuttonbar = function(node,movieplayer) {
        var that = {};

        // set that 'fixed' data
        for (n in defaults) {
            that[n] = defaults[n];
        }
        that.node = node;
        that.movieplayer = movieplayer;
        that.zoomState = 0.5;

        initialize(that);

        return that;
    };

    function initialize(that) {
        that.buttonZoomIn = $('<div name="idButtonZoomIn" style="opacity:0.999"><img src="' + appContext + '/assets/buttonZoomIn.png"></div>');
        that.buttonZoomOut = $('<div name="idButtonZoomOut" style="opacity:0.999"><img src="' + appContext + '/assets/buttonZoomOut.png"></div>');
        that.buttonZoomIn.click(
            function(evt) {
                that.movieplayer.zoomIn();
            }
        );
        that.buttonZoomOut.click(
            function(evt) {
                that.movieplayer.zoomOut();
            }
        );
        // put the nodes in the page
        that.node.append(that.buttonZoomIn);
        that.node.append(that.buttonZoomOut);
    }


})(jQuery);