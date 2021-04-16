/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * The scenery is responsible for the actual drawing of the canvas.
 *
 * The scenery is used during each pane refresh, en each refresh consists of two
 * phases, the 'prepare' phase and the 'draw' phase.
 * In the 'prepare' phase, only the 'markDirty' should be made to the scenery.
 * This 'markDirty' call signals that the content of a tile is dirtied, and all
 * layers should redraw their content of that tile.
 * In the 'draw' phase, the layer-painters can call both the 'isDirty' call of
 * the scenery to check if a tile should be redrawed, and the 'drawXXX' calls to
 * actually draw the new content.
 *
 * This is the place to implement a 'viewport', although the relevant
 * parameters are ingnored at the moment.
 *
 * @author jan
 * @since GOL1.0
 */
(function($) {

    var defaults = {
    };


    /**
     * Functional constructor.
     */
    $.fn.rm.scenery =
        function(
            ctx,
            width,height,
            tileWidth,tileHeight,
            viewportX,viewportY,viewportWidth,viewportHeight) {
            var that = {};

            // set data (defaults and constructor args)
            for (n in defaults) {
                that[n] = defaults[n];
            }
            that.ctx = ctx;
            that.width = width;
            that.height = height;
            that.tileWidth = tileWidth;
            that.tileHeight = tileHeight;
            that.viewportX = viewportX;
            that.viewportY = viewportY;
            that.viewportWidth = viewportWidth;
            that.viewportHeight = viewportHeight;

            // initialise the scenery
            that.redraw = true;
            that.dirty = makeDirtyMatrix(width,height);

            // public API for tile-fillers

            that.initialize = function(redraw) {
                that.redraw = redraw;
                if(that.redraw) {
                    // clear the background (required by the translator)
                    ctx.save();
                    ctx.setTransform(1,0,0,1,0,0);
                    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
                    ctx.restore();
                }
                cleanDirtyMatrix(that.dirty,width,height);
            }

            /**
             * Checks if one of the tiles in the tile-matrix is dirty. If so, the image needs to be redrawn
             * @param tx  x of upper-left tile
             * @param ty  y of upper-left tile
             * @param tw width in number of tiles
             * @param th height in number of tiles
             * @return true iff one of the tiles in the tile-matrix is dirty.
             */
            that.isDirty = function(tx,ty,tw,th) {
                if(that.redraw) {
                    return true;
                } else {
                    return checkDirty(that,tx,ty,tw,th)
                }
            }

            /**
             * Signals that an existing image needs to be removed from this scenery.
             * This call can only be made in the "prepare" phase. The image was 'painted' in the previous scenery.
             * The result of this call will be that all layers, from lowest to highest, will
             * be forced to redraw their content on this tile(s).
             * @param tx x of upper-left tile
             * @param ty y of upper-left tile
             * @param tw width in number of tiles
             * @param th height in number of tiles
             */
            that.markDirty = function(tx,ty,tw,th) {
                markDirty(that,tx,ty,tw,th)
            }

            /**
             * Order the image to be drawn.
             * The scenery will mark all the toughed tiles as 'dirty' so the higher layers will also 'paint'
             * their content.
             * @param tx x of upper-left tile
             * @param ty y of upper-left tile
             * @param image
             */
            that.paintImage = function(tx,ty,image) {
                doPaintImage(that,tx,ty,image);
            }

            /**
             * Order one sub-image of the multi-image to be drawn.
             * The scenery will mark all the toughed tiles as 'dirty' so the higher layers will also 'paint'
             * their content.
             * @param tx x of upper-left tile
             * @param ty y of upper-left tile
             * @param image
             * @param iwidth width of one sub-image
             * @param gen sequence number (generation) of the sub-image
             */
            that.paintMultiImage = function(tx,ty,image,iwidth,gen) {
                doPaintMultiImage(that,tx,ty,image,iwidth,gen);
            }

            /**
             * Order one sub-image of a super-image/canvas to be drawn (only the background?).
             * @param tx x of upper-left tile
             * @param ty y of upper-left tile
             * @param image
             * @param iwidth width of one sub-image
             * @param xgen sequence number (generation) in the x direction of the sub-image
             * @param ygen sequence number (generation) in the y direction of the sub-image
             */
            that.paintSuperImage = function(tx,ty,image,iwidth,xgen,ygen) {
                doPaintSuperImage(that,tx,ty,image,iwidth,xgen,ygen);
            }

            /**
             * Paint a repeating pattern that fills the viewport
             * @param viewport the scrolling window
             * @param image a image texture
             * @param relativeScale enlargement of the pattern
             * @param offsetX pattern horizontal offset/phase
             * @param offsetY pattern vertical offset/phase
             */
             that.paintInfinitePattern = function(viewport,image,relativeScale, offsetX, offsetY) {
                doPaintInfinitePattern(that,viewport,image,relativeScale, offsetX, offsetY)
            }

            /**
             * Gets the width of one tile in pixels.
             * This leaks information about the pixel-world. However this information is needed by the
             * animated tiles and the droid.
             * @return width in pixels of one tile
             */
            that.getTileWidth = function() {
                return that.tileWidth;
            }

            /**
             * Gets the height of one tile in pixels.
             * This leaks information about the pixel-world. However this information is needed by the
             * animated tiles and the droid.
             * @return width in pixels of one tile
             */
            that.getTileHeight = function() {
                return that.tileHeight;
            }

            // return the completed object
            return that;
    };

    function makeDirtyMatrix(x,y) {
        // create the dirty matrix
        var result = new Array();
        for(var i=0; i<x; i++) {
            result[i] = new Array();
            for(var j=0;j<y;j++) {
                result[i][j] = false;
            }
        }
        return result;
    }

    function cleanDirtyMatrix(dirty,x,y) {
        for(var i=0; i<x; i++) {
            for(var j=0;j<y;j++) {
                dirty[i][j] = false;
            }
        }
    }

    function markDirty(that,tx,ty,tw,th) {
        for(var i=tx; i<tx+tw; i++) {
            for(var j=ty;j<ty+th;j++) {
                if(i< that.dirty.length && j < that.dirty[0].length) {
                    that.dirty[i][j] = true;
                }
            }
        }
    }

    function checkDirty(that,tx,ty,tw,th) {
        var h = that.dirty.length;
        var w = that.dirty[0].length;
        for(var i=tx; i<tx+tw; i++) {
            for(var j=ty;j<ty+th;j++) {
                if(i< that.dirty.length && j < that.dirty[0].length) {
                    if(that.dirty[i][j]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function doPaintImage(that,tx,ty,image) {
        var x = tx * that.tileWidth;
        var y = ty * that.tileHeight;
        that.ctx.drawImage(image,x,y)
    }

    function doPaintMultiImage(that,tx,ty,image,iwidth,gen) {
        var sx = gen * iwidth;
        var sy = 0;
        var swidth = iwidth;
        var sheight = image.height;
        var x = tx * that.tileWidth;
        var y = ty * that.tileHeight;
        var width = iwidth;
        var height = image.height;
        that.ctx.drawImage(image,sx,sy,swidth,sheight,x,y,width,height)
    }

    function doPaintSuperImage(that,tx,ty,image,iwidth,xgen,ygen) {
        var sx = xgen * iwidth;
        var sy = ygen * iwidth;
        var swidth = iwidth;
        var sheight = iwidth;
        var x = tx * that.tileWidth;
        var y = ty * that.tileHeight;
        var width = iwidth;
        var height =iwidth;
        that.ctx.drawImage(image,sx,sy,swidth,sheight,x,y,width,height)
    }

    function doPaintInfinitePattern(that,viewport,image,relativeScale, offsetX, offsetY) {
        var ctx =  that.ctx;
        var scale = viewport.getScale() * relativeScale;
        var trans = viewport.getTranslation();
        var tx = trans.x + offsetX;
        var ty = trans.y + offsetY;
        ctx.save();
            var bgW = image.width;
            var bgH = image.height;
            ctx.setTransform(scale,0,0,scale,-(tx%bgW + bgW)*scale,-(ty%bgH + bgH)*scale);
            ctx.fillStyle = that.ctx.createPattern(image, 'repeat');
            ctx.fillRect(0,0,(ctx.canvas.width )/scale+ 2*bgW, (ctx.canvas.height )/scale+ 2*bgH);
        ctx.restore();
        that.redraw = true;
    }



    function clearCanvas(that) {
        that.ctx.save();
        that.ctx.setTransform(1,0,0,1,0,0);
        that.ctx.clearRect(0,0,that.ctx.canvas.width,that.ctx.canvas.height);
        that.ctx.restore();
    }

})(jQuery);
