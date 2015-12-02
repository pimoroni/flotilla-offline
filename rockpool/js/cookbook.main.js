var prompt = function(content, close_on_click){
    if( typeof(close_on_click) == 'undefined' ){
        close_on_click = true;
    }
    $.fancybox.open({
        openEffect  : 'none',
        closeEffect : 'none',
        modal       : true,
        content     : content,
        width       : '100%',
        margin      : [10, 10, 10, 10],
        beforeClose : function(){}
    });
    if( close_on_click ){
        $('.fancybox-overlay,.fancybox-wrap').on('click', function(){ $.fancybox.close() });
    }
    else
    {
        $('.fancybox-overlay,.fancybox-wrap').off('click');
    }
}

var rockpool = rockpool || {};
var projects = projects || {};

var host = '192.168.1.140:9393'; //'127.0.0.1:9493'; //'192.168.1.140:9393'; //bplus:9393';

// Store the active project
var active_project = null;
//console.log(projects);
//sactive_project = projects['Digi-Pet'];

//console.log = function(){};

var active_modules = {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
}


function random(min,max){
   return Math.floor(Math.random()*(max-min+1)+min);
}

function millis(){
    var now = new Date().getTime();
    if(!start){start = now}
    return now - start;
}

function get_module(port, code, create){
 
    if( active_modules[port] && active_modules[port].code == code ){
        return active_modules[port];
    }
    else if(create)
    {
        //console.log(code);
        if( !modules[code] ){
            //console.log('Module not found!', code);
            return null;
        }
        var module = new modules[code];
        module.active = true;
        module.code = code;
        module.channel = port;

        active_modules[port] = module;
        return module;
    }
    return null;
    
}

function update_project(){
    setTimeout(update_project, 200);

    /*if( active_project && typeof( active_project['on_loop'] ) === 'function' ){
        active_project['on_loop'](active_modules);
    }*/
    if( active_project ){
        active_project.run_loop_fn(active_modules);
    }

    clearTimeout(do_update_server);
    do_update_server = setTimeout(update_server(),50);
}
/*
function(my_slider){

var my_number = get_module(7,'number');

console.log('new value',my_slider,my_number);

my_number.number = my_slider.position * 1000;

}
*/
lastpacket = ['','','','','','','','']

function update_server(){
    var i = 8;
    while(i--){
        var module = active_modules[i];
        if( module && module.active == 1 && typeof( module.get ) === 'function' ){

            // W, PORT:DATA:DATA:DATA
            var data = module.get();
            var x = data.length;

            while(x--){
                var packet = [data[x]];
                packet.unshift(i);
                packet = 'W, ' + packet.join(':');

                if( packet != lastpacket[i] ){

                    //console.log('Sending packet', packet);
                    socket.send(packet + "\n");

                }

                lastpacket[i] = packet;
            }


        }
    }
}

function update_display(){
 
    var i = 8;
    var active = [];
    $('#new_handler option').remove();
    $('<option>').val('').text('Select&hellip;').appendTo('#new_handler');
    while(i--){
        if( active_modules[i] && active_modules[i].active ){
            active.push(active_modules[i]);

            if( active_modules[i].set && typeof( active_modules[i].set ) === 'function' ){
               $('<option>').val([active_modules[i].code,i,'change'].join('_')).text([active_modules[i].code,i,'Change'].join(' ')).appendTo('#new_handler');
            }
        }
        else
        {
            $('.module-list .module.channel_' + i).hide();
        }
    }
    //console.log('Active modules: ', active);

    // No modules are connected
    if( active.length == 0 ){ 
        //console.log('Idle');

        //$('.main .info-card').fadeOut();

        //$.fancybox.close()

        //$('.info-cards .mini').hide();    
        //$('.module-list .module.channel_' + i).hide();

        return;
    }
    // Multiple modules are connected, so display available recipes
    else
    {


    // One module is connected, so display its info card
    if( active.length == 1 ){
        //console.log('Info Card');

        var img_url = "css/recipe/" + active[0].code +  "-f.png";
        var card = $('<div>').addClass('info-card-pop');

        card.append($('<div>').addClass('info-card').css('background-image', "url('" + img_url + "')"));
        card.append($('<div>').addClass('info-card').css('background-image', "url('" + img_url.replace('-f','-b') + "')"));

        prompt(card);
    }
    else
    {
        //$.fancybox.close()
    }

        //$('.module-list .module').hide();

        for( var idx in active ){

            var module = active[idx];
            //console.log(module);

            var module_card = $('.module-list .module.channel_' + module.channel);

            if( module_card.length == 0 ){
                module_card = $('<div>')
                    .addClass('module')
                    .addClass('channel_' + module.channel)
                    .hide()
                    .appendTo('.module-list');
                $('<div>').addClass('channel').text(module.channel).appendTo(module_card);
                var icon = $('<span>').addClass('icon').appendTo(module_card);
                icon.append('<img src="" />');
                $('<h2>').appendTo(module_card);
            }

            module_card.data('background-image','css/recipe/' + module.code +  '-f.png').css('color',module.bgColor);
            module_card.find('img').attr('src','css/images/icons/icon-' + (module.icon || module.code) + '.png');
            module_card.find('h2').text(module.code);
            
            if( !module_card.is(':visible') ){
                module_card.fadeIn();
            }

        }

        /*console.log('Recipe Cards');

        $('.info-cards .mini').hide();

        for( var idx in active ){

            var module = active[idx];
            //console.log(module);

            var mini_card = $('.info-cards .mini .' + module.code);

            if( mini_card.length == 0 ){
                mini_card = $('<div>').addClass('mini').addClass(module.code).appendTo('.info-cards');
                mini_card.css({
                    backgroundImage: "url('css/recipe/" + module.code +  "-f.png')"
                });
            }

            mini_card.fadeIn();

        }*/

        //$('.main .info-card').fadeOut();
    }
    
    var module_count = 0;
    for( var index in projects ){
        var project = projects[index];
        if( project.requires ){

            module_count = project.requires.length; // Keep track of how many modules this project requires

            for( var channel in project.requires ){
                if( !active_modules[channel] || active_modules[channel].code != project.requires[channel] ){

                }
            }


        }
    }


}

var socket = new WebSocket("ws://" + host + "/");

var do_update_server;

socket.onmessage = function(event) { 
    var commands = event.data.split(', ');
    command = commands[0];
    var i = commands.length;
    while(i-- > 1){

        data = commands[i].split(':');
        //console.log('packet:' + data);

        var port = parseInt(data.shift());
        var addr = parseInt(data.shift());
        var code = module_map[addr];
        
        var module = get_module(port, code, true);
        if( !module ) return false;
        
        switch(command){
            case 'R':
                //console.log('New value', port, code, data, active_modules);
                if( typeof(module.set) === 'function' ){
                    module.set(data);
                }
                else
                {
                    break;
                }

                var evt = [code,port,'change'].join('_');
                //console.log(evt);

                if( active_project && typeof( active_project[evt] ) === 'function' ){
                    //console.log('Calling',evt,module);
                    active_project[evt](module);

                    clearTimeout(do_update_server);
                    do_update_server = setTimeout(update_server(),50);
                }

                module.active = true;
                break;
            case 'N':
                //console.log('New module', port, code, active_modules);
                module.active = true;
                break;
            case 'D':
                //console.log('Lost module', port, code, active_modules);
                module.active = false;
                break;
            default:
                //console.log('Unsupported command', command, data);
                break;
        }

    }
    update_display();
};

socket.onopen = function() { console.log('Connected!') };
socket.onerror = function(event) { console.log('Socket Error',event) };

var start = new Date().getTime();

setTimeout(update_project, 200);



$('.handlers').on('change','textarea',function(){

    //console.log('Updating handler...', $(this).attr('id'));

    try {
        var new_handler = eval('result = ' + $(this).val());
        active_project[$(this).attr('id')] = new_handler;
    }
    catch(ex) {
        //console.log(ex);
    }


})

$('#select_project').on('change',function(){

    var id = $(this).val();

    if( id == '' || !projects[id] ){ return false; }

    active_project = projects[id];

});

$('#new_handler').on('change',function(){

    var id = $(this).val();

    var ta = $('.handlers #' + id);

    if( ta.length == 0 ){

        ta = $('<textarea>')
        .attr('id',id)
        .appendTo('.handlers');

        if(  active_project[id] ){
            ta.text(active_project[id].toString());
        }else{
            ta.text("function(my_" + id.split('_')[0] + "){\n//Your code here\n}");
        }

    }

    ta.focus();

});