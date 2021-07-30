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
        tileCount:2
    };

    /**
     * Functional constructor for the painter.
     * @param recording
     */
    $.fn.rm.bgpainter = function(recording) {
        var that = {};

        // set data
        for (n in defaults) {
            that[n] = defaults[n];
        }
        that.recording = recording;

        initialize(that);

        // public API (painter)
        that.draw = function(scenery) {
            for(var y=0; y< that.recording.mapHeight; y++) {
                for(var x=0; x < that.recording.mapWidth; x++) {
                    if(scenery.isDirty(x,y,1,1)) {
                        scenery.paintSuperImage(x,y,that.canvas,that.recording.tileSize,x%that.repeatCount, y%that.repeatCount);
                    }
                }
            }
        };

        return that;
    };

    function initialize(that) {
        // create an invisible canvas on which we will create the repeating background
        var bgImage = that.recording.images['bg']
        that.bgTileSize = bgImage.width;
        that.repeatCount = Math.floor(that.tileCount * (that.bgTileSize/that.recording.tileSize));
        var canvas = document.createElement('canvas');
        canvas.width = that.bgTileSize*that.tileCount;
        canvas.height = that.bgTileSize*that.tileCount;
        var ctx= canvas.getContext('2d');
        var pattern = ctx.createPattern(bgImage,'repeat');
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = pattern;
        ctx.fill();
        // remember this canvas/context and use it as a 'multi-image' for the scenery
        that.canvas = canvas;
    }

})(jQuery);
