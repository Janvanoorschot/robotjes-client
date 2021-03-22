/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Responsible for painting a layered picture using several sub-painters.
 * It maintainse a 'dirty' mask using a 'scenery'.
 * User: jan
 * Date: 17-1-13
 * Time: 14:22
 */
(function ($) {

    var defaults = {
    };

    /**
     * Functional constructor for 'painter' object
     * @return the completed object
     */
    $.fn.rm.painter = function (recording,ctx,viewport) {
        var that = {};

        // bootstrapInitialize data from defaults and constructor arguments
        for (var n in defaults) {
            that[n] = defaults[n];
        }
        that.recording = recording;
        that.ctx = ctx;
        that.viewport = viewport;
        that.isDirty = true;

        initialize(that);

        // public API

        that.subPainter = function(name) {
            return that.painterByName[name];
        };
        that.prepare = function() {
            prepare(that);
        };

        that.update = function() {
            update(that);
        };
        that.draw = function() {
            draw(that);
        };
        that.dirty = function() {
            that.isDirty = true;
        };

        return that;
    };

    function initialize(that) {
        // get map dimensions in tiles
        that.width = that.recording.mapWidth;
        that.height = that.recording.mapHeight;
        // create the scenery
        that.scenery = $.fn.rm.scenery(
            that.ctx,
            that.width,
            that.height,
            200,200,
            0,0,that.width,that.height
        );
        that.scenery.initialize(true);

        // create the painters and remember them in-order
        // var bgPainter = $.fn.rm.bgpainter(that.recording);
        var bgPainter = $.fn.rm.scrollingpatternpainter(that.recording, that.viewport, that.recording.images['bg'], 1, 0, 0);

        // create the required painters
        var mapPainter = $.fn.rm.mappainter(that.recording);
        var extra0Painter = $.fn.rm.extrapainter(that.recording,0);
        var beaconPainter = $.fn.rm.beaconpainter(that.recording);
        var paintPainter = $.fn.rm.paintpainter(that.recording);
        var extra1Painter = $.fn.rm.extrapainter(that.recording,1);
        var spritePainter = $.fn.rm.spritepainter(that.recording);
        var gridPainter = $.fn.rm.scrollingpatternpainter(that.recording, that.viewport, that.recording.images['grid'], 1, 0, 0);
        var extra2Painter = $.fn.rm.extrapainter(that.recording,2);
        that.painters = [bgPainter,extra0Painter,mapPainter,paintPainter,beaconPainter,extra1Painter,spritePainter,gridPainter,extra2Painter];
        that.painterByName = {
            "background":bgPainter,
            "extra0":extra0Painter,
            "map":mapPainter,
            "paint":paintPainter,
            "beacon":beaconPainter,
            "extra1":extra1Painter,
            "sprite":spritePainter,
            "grid":gridPainter,
            "extra2":extra2Painter
        };

        // if requested, create the optional painters
        if(!$.fn.rm.sessionstate.hasOwnProperty('noeffects') || ($.fn.rm.sessionstate.hasOwnProperty('noeffects') && ! $.fn.rm.sessionstate.noeffects)) {
            var cloudPainter = $.fn.rm.scrollingpatternpainter(that.recording, that.viewport, that.recording.images['clouds512'], 10, 0.2, -0.1);
            that.painters.push(cloudPainter);
            that.painterByName.cloud = cloudPainter;
        }

        update(that);
    }

    function update(that) {
        that.scenery.initialize(that.isDirty);
        that.isDirty = false;
        that.painters.forEach( function(painter) {
            if('prepare' in painter) {
                painter.prepare(that.scenery);
            }
        });
        that.painters.forEach( function(painter) {
            if('draw' in painter) {
                painter.draw(that.scenery);
            }
        });
    }

})(jQuery);



