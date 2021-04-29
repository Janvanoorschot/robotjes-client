/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * User: jan
 * Date: 17/10/12
 * Time: 10:39 AM
 * Paints the background using tiles.
 */

(function($) {

    var defaults = {
        x:0,
        y:0,
//        velocityX:0,
//        velocityY:0,
//        relativeScale:1,
        initialized : false

    };

    /**
     * Paint a repeating pattern that fills the viewport
     * @param recording
     * @param viewport the scrolling window
     * @param image a image texture
     * @param relativeScale enlargement of the pattern
     * @param velocityX translation speed in px per frameUpdate
     * @param velocityY translation speed in px per frameUpdate
     * @returns {{}}
     */
    $.fn.rm.scrollingpatternpainter = function(recording, viewport, image, relativeScale, velocityX, velocityY) {
        var that = {};

        // set data
        for (var n in defaults) {
            that[n] = defaults[n];
        }
        that.recording = recording;

        // called as animation update
        that.prepare = function(){
            that.x = (that.x - velocityX) % image.width; 
            that.y = (that.y - velocityY) % image.height;
        };

        // public API (painter)
        that.draw = function(scenery) {
            if(that.x !=0) {
                scenery.paintInfinitePattern(viewport, image, relativeScale, that.x, that.y);
            } else {
                scenery.paintInfinitePattern(viewport, image, relativeScale, that.x, that.y);
            }
        };

        return that;
    };



})(jQuery);
