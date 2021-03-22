/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Paints the 'extra' componenents, which are spread over three canvas layers.
 *
 * @author jan
 * @since GOL1.0
 */
(function($) {

    var defaults = {
    };

    /**
     * Functional constructor for the painter.
     */
    $.fn.rm.extrapainter = function(recording,layer) {
        var that = {};

        // set data
        for (n in defaults) {
            that[n] = defaults[n];
        }
        that.recording = recording;
        that.layer = layer;

        initialize(that);

        // define duck-typed 'painter' public functions
        that.draw = function(scenery) {
            that.anis.forEach( function(anitile) {
                anitile.draw(scenery)
            });
        };

        return that;
    };

    function initialize(that) {
        loadExtras(that);
        that.anis = []
        // for each 'extra' component in the map, find the different images
        for(var i in that.recording.extraLines()) {
            var name = that.recording.extraLines()[i].id;
            var x = that.recording.extraLines()[i].x;
            var y = that.recording.extraLines()[i].y;
            var img = that.extras[name][that.layer];
            if(img!=null) {
                // we have images and location, create an extra-animation
                var ani = $.fn.rm.maptile(that.recording,x,y,img);
                that.anis.push(ani);
            }
        }
    }

    /**
     * search and collect the 'extras' in the images
     */
    function loadExtras(that) {
        var extras = {};
        Object.keys( that.recording.images ).map(function( iname ) {
            var image = that.recording.images[iname];
            var re = /^extra-([a-zA-Z_]+)([012])/;
            var arr = re.exec(iname);
            if(arr && arr.length > 0) {
                var name = arr[1];
                var ix = parseInt(arr[2]);
                var imgs = extras[name];
                if(imgs == null) {
                    imgs = [null,null,null];
                    extras[name] = imgs;
                }
                imgs[ix] = image;
            }
        });
        that.extras = extras;
    }


})(jQuery);
