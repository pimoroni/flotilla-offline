var rockpool = rockpool || {};

rockpool.active_modules = [];
rockpool.rules = [];
rockpool.guid = 0;
rockpool.last_time = 0;
rockpool.tick_length = 100; // 100ms per tick

rockpool.palette = {
    red: '#D94D15',
    green: '#00b188',
    yellow: 'rgb(248,212,75)', // '#F0856F',
    blue: 'rgb(78, 192, 223)', //'#00A1BE',
    grey: '#888',
    navy: '#182b53',
    purple: '#9279b7',
    orange: '#f58670',
    empty: 'rgba(4, 72, 94, 1)' //rgba(0,55,72,0.6)'
}

rockpool.category = {
    generators: 'Generators',
    converters: 'Converters',
    deciders: 'Deciders',
    tools: 'Tools',
    keyboard: 'Keyboard',
    variables: 'Variables',
    empty: 'Empty',
    general: 'General'
};

rockpool.guid = 0;

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

rockpool.getGUID = function(){
    rockpool.guid++;
    return rockpool.guid;
}

rockpool.find = function(collection, name){
    for( var item in collection ){

        var instance = (typeof(collection[item]) === 'function') ? new collection[item] : collection[item];

        if( instance.name == name ){
            return instance;
        }
    }
}

rockpool.forRules = function(fn) {
    rockpool.rules = rockpool.rules.filter(function(rule){
        return !rule.deleted;
    });
    if(rockpool.rules.length == 0) return false;

    var total = rockpool.rules.length;

    while(total--){
        fn(rockpool.rules[total])
    }
}

rockpool.clear = function(){
    rockpool.forRules(function(rule){
        rule.kill();
    })
}

rockpool.updateActiveWidgets = function () {
    rockpool.forRules(function(r){r.updateLabels()})
}

rockpool.run = function () {
    rockpool.generatePalette('input');
    rockpool.generatePalette('output');
    rockpool.generatePalette('converter');
    rockpool.updatePalettes();

    rockpool.renderLoop();
    setInterval(rockpool.updateLoop, 100);
}

rockpool.getTime = function () {
    var d = new Date();
    return d.getTime();
}

rockpool.updateLoop = function() {
    rockpool.update();
    rockpool.sync();
};

rockpool.renderLoop = function () {
    requestAnimationFrame(rockpool.renderLoop);

    var now = rockpool.getTime();

    if( rockpool.last_time == 0 || now - rockpool.last_time > rockpool.tick_length ){

        rockpool.last_time = now;

        rockpool.forRules(function(r){
            r.redrawChart();
            //r.updateVisibility();
        })

        //rockpool.sync();

    }
}

rockpool.debug = function(msg) {
    console.log(msg); return false;
    if( !rockpool.debugwindow ){
        rockpool.debugwindow = $('<div></div>').css({
            position:'absolute',
            top:0,
            left:0,
            width:400,
            height:400,
            background:'#FFF',
            overflow:'hidden'
        }).appendTo('body');
    }

    rockpool.debugwindow.prepend('<div>' + msg + '</div>');
}

rockpool.update = function () {
    rockpool.time++;
    rockpool.forRules(function(r){
        r.update();
    })
}

rockpool.sync = function() {
    for( module in rockpool.active_modules ){
        rockpool.active_modules[module].sync();
    }
}

rockpool.respond = function () {
    rockpool.forRules(function(r){r.respond()})
    rockpool.positionModal();
}

rockpool.registerInput = function( host, channel, code, name, handler ) {
    console.log('Registering input:', [host,code,channel,name]);
    rockpool.inputs[[host,code,channel,name].join('_')] = handler;
}

rockpool.registerOutput = function( host, channel, code, name, handler ) {
    rockpool.outputs[[host,code,channel,name].join('_')] = handler;
}

/*
rockpool.registerConverter = function( host, channel, code, name, handler ) {
    rockpool.converters[[code,channel,name].join('_')] = handler;
}
*/

rockpool.getModule = function(host_idx, channel_idx, module_code) {
    var id = [host_idx,channel_idx,module_code].join('_');

    var module = rockpool.active_modules[id];

    if (!module) {
         if (typeof(rockpool.module_handlers[module_code]) !== "undefined")  {
            rockpool.active_modules[id] = new FlotillaModule(rockpool.module_handlers[module_code], host_idx, channel_idx, module_code);
        } else {
            return false;
        }
    }

    module = rockpool.active_modules[id];

    if( typeof( module ) === 'undefined' ){
        return false;
    }

    return module;
}