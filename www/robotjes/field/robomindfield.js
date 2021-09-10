/**
 * The Robomind Field viewer.
 **/
(function($) {
    "use strict";
    /*global jQuery */

    let defaults = {
        'id':'0',
        updateDuration:1000
    };

    $.fn.robotjes.fieldview = function(node, url="") {
        let that = {};

        // set that 'fixed' data
        for (let n in defaults) {
            that[n] = defaults[n];
        }

        that.node = node;
        that.url = url;

        // timer state
        that.timer = null;
        that.timerListeners = [];
        that.timerTicks = 0;
        that.recordingDelta = (5*1000)/50;  // every 5 seconds (in sync with status_keeper)

        // screen components
        that.status = null;
        that.viewer = null;

        // state: possible states:
        //      state_uuid_unknown
        //      state_running
        //      state_stopped
        //      state_error
        that.uuid = null;
        that.state = "state_uuid_unknown";

        // collected data
        that.game_id = null;
        that.player_id = null;
        that.game_tick = 0;

        that.assignUUID = function(uuid) {
            that.uuid = uuid;
            toStateRegistered(that);
        }

        that.someTimer = function(timerTick) {
        };

        populate(that);
        that.timerListeners.push(timerHandler);
        startTimer(that);

        return that;
    };

    function populate(that) {
        // create the panes that are used in the different states
        var fieldnode = $(`
            <div class="field">
                <div class="fieldbanner"></div>
                <div class="fieldstatus"></div>
                <div class="fieldviewer"></div>
            </div>
        `);
        that.node.append(fieldnode);
        that.node.resize();
    }

    function timerHandler(that, timerTick) {
        // collect Bubble info about the UUID we are tracing
        let url ="/field/status";
        $.ajax({
            method: "GET",
            url: url,
            async: true,
            dataType: 'json'
        })
            .done(function(data) {
                // data.known
                // data.done
                // data.firsttime
                switch(that.state) {
                    case 'state_uuid_unknown':
                        if(data.uuid != "") {
                            toStateRunning(that, data);
                        } else {
                            keepStateUuidUnknown(that, data);
                        }
                        break;
                    case 'state_registered':
                        switch(data.status) {
                            case 'unknown':
                                toStateError(that, data);
                                break;
                            case 'registered':
                                keepStateRegistered(that, data);
                                break;
                            case 'confirmed':
                                toStateRunning(that, data);
                                break;
                            case 'stopped':
                                toStateStopped(that, data);
                                break;
                        }
                        break;
                    case 'state_running':
                        switch(data.status) {
                            case 'unknown':
                                toStateError(that, data);
                                break;
                            case 'registered':
                                toStateError(that, data);
                                break;
                            case 'confirmed':
                                keepStateRunning(that, data);
                                break;
                            case 'stopped':
                                toStateStopped(that, data);
                                break;
                        }
                        break;
                    case 'state_stopped':
                        keepStateStopped(that, data);
                        break;
                    case 'state_error':
                        keepStateError(that, data);
                        break;
                }
            })
            .fail(function(data) {
                toStateError(that, data);
            });
        // given a uuid, get the Bubble status of our Challenge
        if(that.uuid) {
            // collect Bubble info about the UUID we are tracing
            let url = that.url + '/info/'+that.uuid;
            $.ajax({
                method: "GET",
                url: url,
                async: true,
                dataType: 'json'
            })
                .done(function(data) {
                    switch(that.state) {
                        case 'state_registered':
                            switch(data.status) {
                                case 'unknown':
                                    toStateError(that, data);
                                    break;
                                case 'registered':
                                    keepStateRegistered(that, data);
                                    break;
                                case 'confirmed':
                                    toStateRunning(that, data);
                                    break;
                                case 'stopped':
                                    toStateStopped(that, data);
                                    break;
                            }
                            break;
                        case 'state_running':
                            switch(data.status) {
                                case 'unknown':
                                    toStateError(that, data);
                                    break;
                                case 'registered':
                                    toStateError(that, data);
                                    break;
                                case 'confirmed':
                                    keepStateRunning(that, data);
                                    break;
                                case 'stopped':
                                    toStateStopped(that, data);
                                    break;
                            }
                            break;
                        case 'state_stopped':
                            keepStateStopped(that, data);
                            break;
                        case 'state_error':
                            keepStateError(that, data);
                            break;
                    }
                })
                .fail(function(data) {
                    console.log("e1");
                    toStateError(that, data);
                });
        }
    }

    function toStateUuidUnknown(that) {

    }

    function keepStateUuidUnknown(that) {

    }

    function toStateRegistered(that) {
        var bannernode = that.node.find('.field .fieldbanner');
        bannernode.append(`<p>Waiting to enter the Game.</p>`);
        bannernode.append(`<p>UUID: ${that.uuid}</p>`);
        var statusnode = that.node.find('.field .fieldstatus');
        statusnode.empty();
        var viewnode = that.node.find('.field .fieldviewer');
        statusnode.empty();
        that.state = 'state_registered';
    }

    function keepStateRegistered(that, data) {
        // do nothing (maybe spinner?)
    }

    function toStateRunning(that, data) {
        that.game_id = data.game_id;
        that.player_id = data.player_id;
        var bannernode = that.node.find('.field .fieldbanner');
        bannernode.empty();
        bannernode.append(`<p>Game Running.</p>`);
        var statusnode = that.node.find('.field .fieldstatus');
        statusnode.empty();
        that.status = $.fn.robotjes.robotjesstatus(statusnode, data);
        var viewernode = that.node.find('.field .fieldviewer');
        viewernode.empty();
        that.viewer = $.fn.robotjes.robotjesviewer(viewernode, that.game_id, that.player_id, that.url);
        viewernode.resize();
        that.state = 'state_running';
    }

    function keepStateRunning(that, data) {
    }

    function toStateStopped(that, data) {
        //  data layout:
        //  {
        //     "status": "stopped",
        //         "player_id": "cd2afde5-1889-4d5a-801e-dc7d6bdd86cc",
        //         "game_id": "15b5ee62-0909-4f05-83fc-2cd54248696a",
        //         "player_status": {
        //         "game_status": {
        //             "game_id": "15b5ee62-0909-4f05-83fc-2cd54248696a",
        //                 "game_name": "eat_three",
        //                 "status": {
        //                 "game_tick": 761,
        //                     "isStarted": true,
        //                     "isStopped": false,
        //                     "isSuccess": true
        //             }
        //         },
        //         "player_result": {
        //             "player_id": "cd2afde5-1889-4d5a-801e-dc7d6bdd86cc",
        //                 "active": false,
        //                 "success": false,
        //                 "timestamp": "2021-08-29T12:29:37.405350"
        //         },
        //         "player_status": {
        //             "player_id": "cd2afde5-1889-4d5a-801e-dc7d6bdd86cc",
        //                 "player_name": "Jan Admin",
        //                 "robos": {
        //                 "f674fd01-f925-4b68-b5c9-c77b1cb2a665": {
        //                     "pos": [
        //                         7,
        //                         11
        //                     ],
        //                         "load": 0,
        //                         "dir": 270,
        //                         "recording": [
        //                         [
        //                             759,
        //                             "right",
        //                             [
        //                                 1
        //                             ],
        //                             true
        //                         ],
        //                         [
        //                             760,
        //                             "right",
        //                             [
        //                                 1
        //                             ],
        //                             true
        //                         ],
        //                         [
        //                             761,
        //                             "right",
        //                             [
        //                                 1
        //                             ],
        //                             true
        //                         ]
        //                     ],
        //                         "fog_of_war": {
        //                         "left": [
        //                             null,
        //                             null,
        //                             null,
        //                             null
        //                         ],
        //                             "front": [
        //                             null,
        //                             null,
        //                             null,
        //                             null
        //                         ],
        //                             "right": [
        //                             null,
        //                             null,
        //                             null,
        //                             null
        //                         ]
        //                     }
        //                 }
        //             }
        //         },
        //         "game_tick": 761
        //     }
        // }
        that.state = 'state_stopped';
    }

    function keepStateStopped(that, data) {

    }

    function toStateError(that, data) {
        that.state = 'state_error';
    }

    function keepStateError(that, data) {

    }

    function startTimer(that) {
        stopTimer(that);
        that.timerTicks = 0;
        // start the (repeated) timer on which pulse the simulation will be driven.
        that.timer = setInterval(function() {
            try {
                tickTimer(that, that.timerTicks);
            } catch(err) {
                // noop
                console.log("error during timer handling: ["+err+"]");
            } finally {
                that.timerTicks++;
            }
        },that.updateDuration);
    }

    function stopTimer(that) {
        if(that.timer != null) {
            clearInterval(that.timer);
            that.timer = null;
        }
    }

    function tickTimer(that, timerTick) {
        that.timerListeners.forEach( function(listener) {
            listener(that, timerTick);
        });
    }

})(jQuery);