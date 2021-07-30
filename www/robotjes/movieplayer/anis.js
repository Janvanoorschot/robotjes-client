/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Animated tiles.
 */

(function($) {
    /**
     * Draw an animated tile.
     */
    $.fn.rm.anitile = function(x,y,image,width,height,maxgen,iwidth) {
        var that = {};
        // set our vars
        that.x = x;
        that.y = y;
        that.image = image;
        that.width = width;
        that.height = height;
        that.maxgen = maxgen;
        that.iwidth = iwidth;
        that.gen = -1;

        that.draw = function(scenery) {
            // calculate generation number
            var gen;
            if(that.gen == -1) {
                gen = Math.floor(Math.random()*11) % that.maxgen;  // start at a random generation
            } else {
                gen = (that.gen + 1)%that.maxgen;
            }
            // if redraw required, do draw
            var redraw = false;
            if(scenery.isDirty(that.x,that.y,that.width,that.height)) {
                redraw = true;
            }

            if(that.gen==-1 || that.maxgen>1) {
                //console.log("("+that.x+")("+that.y+")("+that.width+")("+that.height+")");
                redraw = true;
            }
            if(redraw) {
                that.gen = gen;
                if(that.maxgen<=1) {
                    scenery.paintImage(that.x,that.y,that.image);
                    scenery.markDirty(that.x,that.y,that.width,that.height);
                } else {
                    scenery.paintMultiImage(that.x,that.y,that.image,that.iwidth, that.gen);
                    scenery.markDirty(that.x,that.y,that.width,that.height);
                }
            }
        }
        return that;
    };

    $.fn.rm.maptile = function(recording, x,y,image) {
        var isAni =((image.width % image.height) == 0)
        var maxgen = Math.floor(image.width/image.height);
        if(!isAni) {
            maxgen = 1
        }
        var tileHeight = Math.ceil(image.height/recording.tileSize);
        var tileWidth = tileHeight;
        var iwidth = image.height;
        return $.fn.rm.anitile(x,y,image,tileWidth, tileHeight,maxgen, iwidth);
    }

    $.fn.rm.painttile = function(recording,x,y,image) {
        var maxgen = 1;
        var tileHeight = Math.ceil(image.height/recording.tileSize);
        var tileWidth = Math.ceil(image.width/recording.tileSize);
        var iwidth = image.width;
        return $.fn.rm.anitile(x,y,image,tileWidth, tileHeight,maxgen,iwidth);
    }

})(jQuery);
