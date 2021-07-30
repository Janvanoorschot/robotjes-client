/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Robomind specific Run/Stop/Step button bar.
 **/
(function($) {

    var defaults = {
        'id':'0'
    };

    /**
     * Functional constructor for robo.
     */
    $.fn.rm.rmrunbuttonbar = function(node,rootnode, movieplayer) {
        var that = {};

        // set that 'fixed' data
        for (n in defaults) {
            that[n] = defaults[n];
        }
        that.node = node;
        that.rootnode = rootnode;
        that.movieplayer = movieplayer;
        that.toolbarState = 'stopped';

        initialize(that);

        that.pubFunc = function() {
        };


        return that;
    };

    function initialize(that) {
        // register for mode-changes of the movieplayer
        $(that.rootnode).on('runmodechanged', function(event, data){
           var newmode = data.newmode;
            switch(newmode) {
                case "stopped":
                    that.toolbarState = "stopped";
                    updateButtonImages(that);
                    break;
                case "paused":
                    that.toolbarState = "paused";
                    updateButtonImages(that);
                    break;
                case "running":
                    that.toolbarState = "running";
                    updateButtonImages(that);
                    break;
            }
        });

        var ctx = document;
        that.buttonA = $('<div name="idButtonA" style="opacity:0.999"><img></div>');
        that.buttonB = $('<div name="idButtonB" style="opacity:0.9"><img></div>');
        that.buttonA.click(
            function(evt) {
                switch(that.toolbarState) {
                    case "stopped":
                        $(that.rootnode).triggerHandler('runmodechanged', {intent:'delayedstartrunning',source:'runbuttonbar',oldmode:'stopped',newmode:'running'});
                        break;
                    case "running":
                        $(that.rootnode).triggerHandler('runmodechanged', {intent:'stop',source:'runbuttonbar',oldmode:'running',newmode:'stopped'});
                        break;
                    case "paused":
                        $(that.rootnode).triggerHandler('runmodechanged', {intent:'cont',source:'runbuttonbar',oldmode:'paused',newmode:'running'});
                        break;
                }
            }
        );
        that.buttonB.click(
            function(evt) {
                switch(that.toolbarState) {
                    case "stopped":
                        $(that.rootnode).triggerHandler('runmodechanged', {intent:'delayedstartstepping',source:'runbuttonbar',oldmode:'stopped',newmode:'running'});
                        // that.rootnode.delayedStart(true);
                        break;
                    case "running":
                        $(that.rootnode).triggerHandler('runmodechanged', {intent:'pause',source:'runbuttonbar',oldmode:'running',newmode:'paused'});
                        break;
                    case "paused":
                        $(that.rootnode).triggerHandler('runmodechanged', {intent:'step',source:'runbuttonbar',oldmode:'paused',newmode:'paused'});
                        break;
                }
            }
        );
        // put the nodes in the page
        that.node.append(that.buttonA);
        that.node.append(that.buttonB);
        updateButtonImages(that);
    }

    function updateButtonImages(that) {
        var imgA = $("img",that.buttonA)[0];
        var imgB = $("img",that.buttonB)[0];
        switch(that.toolbarState) {
            case "stopped":
                imgA.src =   appContext + "/assets/buttonPlay.png";
                imgB.src =   appContext + "/assets/buttonStep.png";
                break;
            case "running":
                imgA.src =   appContext + "/assets/buttonStop.png";
                imgB.src =   appContext + "/assets/buttonPause.png";
                break;
            case "paused":
                imgA.src =   appContext + "/assets/buttonPlay.png";
                imgB.src =   appContext + "/assets/buttonStep.png";
                break;
        }
    }

})(jQuery);