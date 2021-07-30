/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Paints the 'sprite' componenents.
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
    $.fn.rm.spritepainter = function(recording) {
        var that = {};

        // set data
        for (n in defaults) {
            that[n] = defaults[n];
        }
        that.recording = recording;
        that.sprites = [];
        that.callbacks = [];

        // public API
        that.addSprite = function(sprite,callback) {
            // the callback is used to signal any listener that the sprite is without operation/minimation.
            that.sprites.push([sprite,callback]);
        };

        that.removeSprite = function(sprite) {
            that.sprites.forEach(function(spritedef,idx) {
                if(sprite == spritedef[0]) {
                    delete that.sprites[idx];
                    return;
                }
            });
        };

        // define duck-typed 'painter' public functions
        that.prepare = function(scenery) {
            that.callbacks.length = 0;
            that.sprites.forEach(function(spritedef) {
                var sprite = spritedef[0];
                var callback = spritedef[1];
                if('prepare' in sprite) {
                    if(!sprite.prepare(scenery)) {
                        // the sprite is done with the current operation/minimation,
                        // remember the callback and call it after the 'draw'
                        // ps: can not call the callback now, the sprite already prepared the next image which
                        //     needs to be drawn first in the draw phase.
                        that.callbacks.push(spritedef);
                    }
                }
            });
        };

        that.draw = function(scenery) {
            // give each sprite the possibility to draw the next image
            that.sprites.forEach(function(spritedef) {
                var sprite = spritedef[0];
                var callback = spritedef[1];
                if('draw' in sprite) {
                    sprite.draw(scenery);
                }
            });
            // when a callback has been prepared, notify any listener that a sprite has finished an operation.
            // (pushed during the prepare phase)
            that.callbacks.forEach(function(spritedef) {
                var sprite = spritedef[0];
                var callback = spritedef[1];
                if(callback) {
                    callback(0,sprite);
                }
            });
        };

        return that;
    };

})(jQuery);
