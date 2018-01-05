var rockpool = rockpool || {};

rockpool.active_modules = {};
rockpool.rules = [];
rockpool.guid = 0;
rockpool.last_time = 0;
rockpool.tick_length = 100; // 100ms per tick
rockpool.debug_enabled = false;
rockpool.enable_advanced = false;

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
    general: 'General',
    maths: 'Maths',
    modify: 'Modify',
    compare: 'Compare'
};

rockpool.guid = 0;

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

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

rockpool.useAnimationFrame = false;

window.requestAnimationFrame(function(){rockpool.useAnimationFrame = true})

rockpool.channelToNumber = function(channel){
    return channel + 1;
}

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

    for(var idx = 0; idx < rockpool.rules.length; idx++)
    {
        fn(rockpool.rules[idx])
    }
}

rockpool.clear = function(){
    rockpool.forRules(function(rule){
        rule.kill();
    })
}

rockpool.updateActiveWidgets = function (module_key) {
    rockpool.forRules(function(r){r.updateLabels(module_key)})
}

rockpool.run = function () {
    if(rockpool.running) return;
    rockpool.running = true;
    
    rockpool.generatePalette('input');
    rockpool.generatePalette('output');
    rockpool.generatePalette('converter');
    rockpool.updatePalettes();

    if(rockpool.useAnimationFrame){
        rockpool.renderLoop();
    }
    setInterval(rockpool.updateLoop, 50);
}

rockpool.getTime = function () {
    var d = new Date();
    return d.getTime();
}

rockpool.updateLoop = function() {
    rockpool.update();
    rockpool.sync();
    if(!rockpool.useAnimationFrame){
        rockpool.renderLoop();
    }
};

rockpool.renderLoop = function () {
    if (rockpool.useAnimationFrame) {
        requestAnimationFrame(rockpool.renderLoop);
    }

    var now = rockpool.getTime();

    if( rockpool.last_time == 0 || now - rockpool.last_time > rockpool.tick_length ){

        rockpool.last_time = now;

        rockpool.forRules(function(r){
            r.redrawChart();
        })

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
    for( var module in rockpool.active_modules ){
        rockpool.active_modules[module].sync();
    }
}

rockpool.respond = function () {
    rockpool.forRules(function(r){r.respond()})
}

rockpool.registerInput = function( host, channel, code, name, handler ) {
    if(rockpool.enable_debug){console.log('Registering input:', [host,code,channel,name]);}
    rockpool.inputs[[host,channel,code,name].join('_')] = handler;
}

rockpool.registerOutput = function( host, channel, code, name, handler ) {
    rockpool.outputs[[host,channel,code,name].join('_')] = handler;
}

rockpool.newInactiveModuleFromKey = function(key){
    key = key.split('_');
    var host_idx = parseInt(key[0]);
    var channel_idx = parseInt(key[1]);
    var module_code = key[2];
    var module = rockpool.getModule(host_idx, channel_idx, module_code);
    if(module !== false) module.deactivate();
    return module;
}

rockpool.getActiveModule = function(host_idx, channel_idx) {
    var id;

    for(x in rockpool.active_modules){
        if(x && x.startsWith([host_idx,channel_idx].join('_')) && rockpool.active_modules[x].active){
            id = x;
            break;
        }
    }
    if(id == ""){return false;}
    
    var module = rockpool.active_modules[id];

    if (!module) {
        return false;
    }

    module = rockpool.active_modules[id];

    if( typeof( module ) === 'undefined' ){
        return false;
    }
    
    return module;
}

rockpool.getModule = function(host_idx, channel_idx, module_code) {
    var id;

    if(typeof(module_code) === "undefined"){
        for(x in rockpool.active_modules){
            if(x && x.startsWith([host_idx,channel_idx].join('_'))){
                id = x;
                break;
            }
        }
        if(id == ""){return false;}
    }
    else{
        id = [host_idx,channel_idx,module_code].join('_');
    }

    var module = rockpool.active_modules[id];

    if (!module) {
         if (module_code && typeof(rockpool.module_handlers[module_code]) !== "undefined")  {
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

rockpool.initialize = function(){
    $(window).trigger('resize');

    $('.controls')
        .on('click','.add-rule',function(e){
            e.preventDefault();
            e.stopPropagation();
            rockpool.add('input',function(rule){
                rockpool.add('output',rule);
            });
        });
        /*.on('click','.add-input',function(e){
            e.preventDefault();
            e.stopPropagation();
            rockpool.add('input')
        })
        .on('click','.add-output',function(e){
            e.preventDefault();
            e.stopPropagation();
            rockpool.add('output')
        })
        .on('click','.add-conveter',function(e){
            e.preventDefault();
            e.stopPropagation();
            rockpool.add('converter')
        });*/


    $('.options,.mainnav').on('click','.active',function(e){
        e.preventDefault();
        e.stopPropagation();

        var action = $(this).data('action');

        switch(action){
            case 'help':
                window.open('http://flotil.la');
                break;
            case 'new':
                new rockpool.rule().start();
                break;
            case 'clear':
                var dom_container = $('<div class="confirm palette"><i class="close"></i><header><h1>are you sure?</h1></header><div class="choices"><p>this will delete all your rules!</p></div>');
    
                $('<i class="cancel"></i>').appendTo(dom_container.find('.choices'));
                $('<i class="confirm"></i>').appendTo(dom_container.find('.choices')).on('click',function(){
                    rockpool.clear();
                });

                rockpool.prompt(dom_container);
                //rockpool.clear();
                break;
            case 'load':
                rockpool.loadDialog();
                break;
            case 'dock':
                rockpool.personalise(rockpool.subscribed_to);
                //rockpool.manageDock();
                //rockpool.startDiscovery();
                break;
            case 'save':
                rockpool.saveDialog();
                break;
        }


        $(this).parents('.options').toggleClass('open');
    });

    /*$('.options .toggle').on('click',function(e){
        e.preventDefault();
        e.stopPropagation();

        $(this).parents('.options').toggleClass('open');

        if(rockpool.saveListLoad().length > 0){
            $(this).parents('.options').find('.icon-palette div').filter('[data-action="load"]').attr("class","active color-navy");
        }
        else
        {
            $(this).parents('.options').find('.icon-palette div').filter('[data-action="load"]').attr("class","disabled color-gray");
        }
    });*/

    /* resize chart canvases when the window resizes */
    $(window).resize(function () {
        rockpool.respond()
    });

    if(window.navigator.standalone){
        document.documentElement.requestFullscreen();
    }

    window.onbeforeunload = function(){
        rockpool.disconnect();
    }

    FastClick.attach(document.body);

    $.fancybox.defaults.padding = 0
    $.fancybox.defaults.margin = 0
    $.fancybox.defaults.modal = true
    $.fancybox.defaults.autoCenter = false
    $.fancybox.defaults.closeBtn = false
    $.fancybox.defaults.autoSize = false
    $.fancybox.defaults.width = "auto"
    $.fancybox.defaults.height = "auto"
    $.fancybox.defaults.scrolling = "no"
    $.fancybox.defaults.fitToView = false
    $.fancybox.defaults.fixed = true
    $.fancybox.defaults.topRatio = 0
    $.fancybox.defaults.leftRatio = 0
    
    $('[data-translate]').each(function(){
        $(this).html( rockpool.languify( $(this).html() ) );
    });

    //rockpool.addCommonTargets();
    /*
    rockpool.addScanTarget('127.0.0.1', 5000);
    rockpool.addScanTarget('raspberrypi', 5000);
    rockpool.addScanTarget('raspberrypi.local', 5000);

    rockpool.addPreviousTargets();
    rockpool.findHosts();
    */
    rockpool.startDiscovery();

    rockpool.on_connect = function(){
        if(rockpool.rules.length == 0){
            new rockpool.rule().start();
        }
    }
}
