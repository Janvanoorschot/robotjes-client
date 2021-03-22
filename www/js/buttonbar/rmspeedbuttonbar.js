/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Robomind specific Speed button bar.
 **/
(function($) {

    var defaults = {
        'id':'0'
    };

    /**
     * Functional constructor for robo.
     */
    $.fn.rm.rmspeedbuttonbar = function(node,movieplayer) {
        var that = {};

        // set that 'fixed' data
        for (n in defaults) {
            that[n] = defaults[n];
        }
        that.node = node;
        that.movieplayer = movieplayer;
        that.speeds = [1,8,50];

        initialize(that);

        that.update = function() {
            updateButtonImages(that);
        };


        return that;
    };

    function initialize(that) {
        // register for mode-changes of the movieplayer
        that.buttonSpeed = $('<div name="idButtonSpeed" style="opacity:0.999"><img src="'+appContext+'/assets/buttonSpeedMid.png"></div>');
        that.buttonSpeed.click(
            function(evt) {
                var speed = that.movieplayer.getSpeed();
                var runSpeed = calcRunSpeed(that,speed);
                runSpeed = (runSpeed+1)%3;
                that.movieplayer.setSpeed(that.speeds[runSpeed]);
            }
        );

        that.buttonSound = $('<div name="idButtonSound" style="opacity:0.999"><img src="'+appContext+'/assets/buttonSoundOn.png"></div>');
        that.buttonSound.click(
            function(evt) {
                that.movieplayer.setSoundEnabled(!that.movieplayer.isSoundEnabled());
            }
        );

        // put the nodes in the page
        that.node.append(that.buttonSpeed);
        that.node.append(that.buttonSound);
        that.movieplayer.setSpeed(that.movieplayer.getSpeed());
        that.movieplayer.setSoundEnabled(that.movieplayer.isSoundEnabled());
        updateButtonImages(that);
    }

    function updateButtonImages(that) {
        var imgSpeed = $("img",that.buttonSpeed)[0];
        var speed = that.movieplayer.getSpeed();
        var runSpeed = calcRunSpeed(that,speed);
        switch(runSpeed) {
            case 0:
                imgSpeed.src =   appContext + "/assets/buttonSpeedLow.png";
                break;
            case 1:
                imgSpeed.src =   appContext + "/assets/buttonSpeedMid.png";
                break;
            case 2:
                imgSpeed.src =   appContext + "/assets/buttonSpeedHigh.png";
                break;
        }

        var imgSound = $("img", that.buttonSound)[0];
        if(that.movieplayer.isSoundEnabled()) {
            imgSound.src =   appContext + "/assets/buttonSoundOn.png";
        }
        else{
            imgSound.src =   appContext + "/assets/buttonSoundOff.png";
        }

    }

    function calcRunSpeed(that,speed) {
        var runSpeed = 0;
        for(var ix=0; ix<that.speeds.length; ix++) {
            if(that.speeds[ix] == speed) {
                runSpeed = ix;
            }
        }
        return runSpeed
    }

})(jQuery);