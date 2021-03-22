/**
 * Mount functionality
 */
(function($) {

    $.fn.rm.ccMouseWheel = function(element, handler) {

        var handlerWrapper = function(e){
            preventDefault(e);
            var delta = fixWheelValue(e); handler(delta, e)
        };

        if (element.addEventListener) {
            // IE9, Chrome, Safari, Opera
            element.addEventListener("mousewheel", handlerWrapper, false);
            // Firefox
            element.addEventListener("DOMMouseScroll", handlerWrapper, false);
        }
        else{
            // IE 6/7/8
            element.attachEvent("onmousewheel", handlerWrapper);
        }

        function fixWheelValue(e) {
            // cross-browser wheel delta
            e = window.event || e; // old IE support
            return Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        }
    };

    $.fn.rm.ccMousePosition = function getCursorPosition(e) {
        e = e || window.event;
        var cursor = {x:0, y:0};
        if (e.pageX || e.pageY) {
            cursor.x = e.pageX;
            cursor.y = e.pageY;
        }
        else {
            cursor.x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
            cursor.y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
        }
        return cursor;
    };

    // left: 37, up: 38, right: 39, down: 40,
    // spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
    var keys = [37, 38, 39, 40];

    function preventDefault(e) {
      e = e || window.event;
      if (e.preventDefault)
          e.preventDefault();
      e.returnValue = false;
    }

    function keydown(e) {
        for (var i = keys.length; i--;) {
            if (e.keyCode === keys[i]) {
                preventDefault(e);
                return;
            }
        }
    }

    function wheel(e) {
      preventDefault(e);
    }

    $.fn.rm.disableScroll = function() {
      if (window.addEventListener) {
          window.addEventListener('DOMMouseScroll', wheel, false);
      }
      window.onmousewheel = document.onmousewheel = wheel;
      document.onkeydown = keydown;
    }

    $.fn.rm.enableScroll = function() {
        if (window.removeEventListener) {
            window.removeEventListener('DOMMouseScroll', wheel, false);
        }
        window.onmousewheel = document.onmousewheel = document.onkeydown = null;
    }

    /**
     * $.fn.rm.mouseDragTracker(domElem);
     * https://github.com/juniperoserra/jsMouseDragTracker
     * @param element
     * @return {{}}
     */
    $.fn.rm.mouseDragTracker = function(element) {
        var that = {};

        var buttonState = [];
        var mousePressedInElement = [];

        var dragStateChangedFunction = undefined;
        var dragMoveChangedFunction = undefined;

        // location state
        var startX = 0;
        var startY = 0;

        var lastMouseX = 0;
        var lastMouseY = 0;

        var mouseX = 0;
        var mouseY = 0;

        function getButtonState( buttonNumber )
        {
            // Takes care of the case where the array index hasn't been assigned yet
            return ( buttonState[buttonNumber] === true );
        }

        function getMousePressedInElement( buttonNumber )
        {
            // Takes care of the case where the array index hasn't been assigned yet
            return ( mousePressedInElement[buttonNumber] === true );
        }

        function whichButton(evt)
        {
            return evt.which;
        }

        function makeStateChangeAnnouncerWrapper( wrappedFunc ){
            var stateChangeAnnouncerWrapper = function( evt ){
                var previousDragState = that.isDragging(whichButton(evt));

                wrappedFunc(evt);

                if (dragStateChangedFunction != undefined && previousDragState != that.isDragging(whichButton(evt))) {
                    dragStateChangedFunction( that, whichButton(evt) );
                }
            }
            return stateChangeAnnouncerWrapper;
        }

        function makeMoveChangeAnnouncerWrapper( wrappedFunc ){
            // setTimeout, to fix FF. See: https://bugzilla.mozilla.org/show_bug.cgi?id=732621
            var moveChangeAnnouncerWrapper = function( evt ){
                setTimeout(function(){
                    wrappedFunc(evt);
                    if (dragMoveChangedFunction != undefined && that.isDragging(whichButton(evt))) {
                        dragMoveChangedFunction( that, whichButton(evt) );
                    }
                }, 0);
            };
            return moveChangeAnnouncerWrapper;
        }

        // add listeners to both document and element
        document.addEventListener("mouseup", makeStateChangeAnnouncerWrapper( function(evt) {
            // enable text selection
            document.onselectstart = function(){ return true; }
            buttonState[whichButton(evt)] = false;
            mousePressedInElement[whichButton(evt)] = false;
            element.style.cursor = "default";
        } ), false);


        document.addEventListener("mousedown", makeStateChangeAnnouncerWrapper( function(e) {
            buttonState[whichButton(e)] = true;
            if(that.isDraggingLeftButton()){
                // disable text selection
                document.onselectstart = function(){ return false; };

                pos = jQuery.fn.rm.ccMousePosition(e);
                startX = lastMouseX = mouseX = pos.x;
                startY = lastMouseY = mouseY = pos.y;
                element.style.cursor = "move";
            }
        } ), false);

        element.addEventListener("mousedown", makeStateChangeAnnouncerWrapper( function(e) {
            mousePressedInElement[whichButton(e)] = true;
            if(that.isDraggingLeftButton()){
                // disable text selection
                document.onselectstart = function(){ return false; };

                pos = jQuery.fn.rm.ccMousePosition(e);
                startX = lastMouseX = mouseX = pos.x;
                startY = lastMouseY = mouseY = pos.y;
                element.style.cursor = "move";
            }
        } ), false);

        var mouseMoveListener = makeMoveChangeAnnouncerWrapper(function (e) {
            if (that.isDraggingLeftButton()) {
                lastMouseX = mouseX;
                lastMouseY = mouseY;
                pos = jQuery.fn.rm.ccMousePosition(e);
                mouseX = pos.x;
                mouseY = pos.y;
            }
        });
        element.addEventListener("mousemove", mouseMoveListener, false);
        document.addEventListener("mousemove", mouseMoveListener, false);

        element.addEventListener("contextmenu", function(evt) {
            if (that.contextMenuEnabled){
                return true;
            }
            else{
                if (evt.preventDefault)
                    evt.preventDefault();
                else
                    evt.returnValue= false;
            }
            return false;
        }, false );


        // public API
        that.isDragging = function ( buttonNumber ){
            return getButtonState(buttonNumber) && getMousePressedInElement( buttonNumber );
        };

        that.isDraggingLeftButton = function (){
            return getButtonState(1) && getMousePressedInElement(1);
        };

        that.setDragStateChangedFunction = function ( func ){
            dragStateChangedFunction = func;
        }

        that.setMoveStateChangedFunction = function ( func ){
            dragMoveChangedFunction = func;
        }

        that.startX = function (){
            return startX;
        }

        that.startY = function (){
            return startY;
        }

        that.mouseX = function (){
            return mouseX;
        }

        that.mouseY = function (){
            return mouseY;
        }

        that.dxStart = function (){
            return startX - mouseX;
        }

        that.dyStart = function (){
            return startY - mouseY;
        }

        that.dx = function (){
            return lastMouseX - mouseX;
        }

        that.dy = function (){
            return lastMouseY - mouseY;
        }


        // Not recommended to set this to true. Can result in stuck drags.
        that.contextMenuEnabled = false;

        return that;
    };

})(jQuery);
