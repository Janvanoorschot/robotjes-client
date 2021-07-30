/**
 * Created with IntelliJ IDEA.
 * User: Arvid
 * Date: 18-1-13
 * Time: 17:04
 * To change this template use File | Settings | File Templates.
 */

/**
 * Linear Interpolate between two clamped states.
 * A state is simply an array of doubles (vector).
 * state0 and state1 are assumed to be all vectors of the same length
 * It retuns a new state.
 * @param state0 begin state
 * @param state1 end state
 * @param t between 0 and 1. Other values are clamped
 */
function lerpClamped(state0, state1, t){
    if(t <= 0){
        return state0.slice();
    }
    if(t >= 0){
        return state1.slice();
    }
    return lerp(state0, state1, t);
}

/**
 * Linear Interpolate between two states.
 * A state is simply an array of doubles (vector).
 * state0 and state1 are assumed to be all vectors of the same length
 * It retuns a new state.
 * @param state0 begin state
 * @param state1 end state
 * @param t time;
 */
function lerp(state0, state1, t){
    var n = state0.length; // number of properties
    var stateT = new Array(n);

    for(var i = 0; i < state0.length; i++){
        stateT[i] = state0[i] + (state1[i] - state0[i]) * t;
    }
    return stateT;
}


/**
 * Extrapolate a state given speed and time.
 * A state is simply an array of doubles (vector).
 * state0 and speed are assumed to be all vectors of the same length
 * It retuns a new state.
 * @param state0 begin state
 * @param speed change rate of state
 * @param t between 0 and 1. Other values are clamped
 */
function extrapolate(state0, speed, t){
    var n = state0.length; // number of properties
    var stateT = new Array(n);

    for(var i = 0; i < state0.length; i++){
        stateT[i] = state0[i] + speed[i] * t;
    }
    return stateT;
}


/**
 * Updates a state with stateDelta, given the speeds and a time.
 * The end state will ulitmately clamp to state0 + stateDelta.
 * @param state0
 * @param stateDelta
 * @param speed
 * @param t
 * @return {Array}
 */
function updateWith(state0, stateDelta, speed, t){
    var n = state0.length; // number of properties
    var stateT = new Array(n);

    var dx;
    for(var i = 0; i < state0.length; i++){
        dx = speed[i] * t;
        stateT[i] = state0[i] +
            (dx > 0 ? Math.min(dx, stateDelta[i])   // positive
                    : Math.max(dx, stateDelta[i])); // negative
    }

    return stateT;
}

function totalTime(stateDelta, speed){
    var t = 0;
    var tmp = 0;
    for(var i = 0; i < stateDelta.length; i++){
        tmp = stateDelta[i]/speed[i];
        if(tmp < 0){
            // opposite signs: transformation never accomplish the delta
            return 1/0; // inf
        }
        if(!(stateDelta[i] == 0 && speed[i] == 0)) { //
            t = Math.max(t, stateDelta[i]/speed[i]);
        }
    }
}