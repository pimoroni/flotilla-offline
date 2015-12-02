var events = events || {};

var host = '192.168.1.140:9393'; //'127.0.0.1:9493'; //'192.168.1.140:9393'; //bplus:9393';

var socket = new WebSocket("ws://" + host + "/");

var do_update_server;

var start = new Date().getTime();

// Store the last packet of data sent to each module
var lastpacket = ['','','','','','','','']

// Slots for storing the 8 active modules
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
function randomf(min,max){
   return Math.random()*(max-min)+min;
}


function millis(){
    var now = new Date().getTime();
    if(!start){start = now}
    return now - start;
}

/*
    Allows you to request a specific module:

    get_module(n, <code>) = Gets module on port n, with code <code> or returns null if not available
    get_module(<code>)    = Gets first module with code <code>
    get_module(n)         = gets module on port n
*/
function get_module(port, code, create){

    if( typeof( port ) == "string" ){
        code = port;
        var found = false;
        for( port in active_modules ){
            if( active_modules[port] && active_modules[port].code == code ){
                found = true;
                break;
            }
        }
        if ( !found ) return null;
    }
 
    if( active_modules[port] && ( code == null || active_modules[port].code == code ) ){
        return active_modules[port];
    }
    else if(create)
    {
        if( !modules[code] ){
            return null;
        }
        var module = new modules[code];
        module.active = true;
        module.code = code;
        module.port = port;

        active_modules[port] = module;
        return module;
    }
    return null;
    
}



/*
    Loops through all active modules
    and sends their new values to
    the server.
*/
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
                    socket.send(packet + "\n");
                }

                lastpacket[i] = packet;
            }

        }
    }
}

function handle_events(code, port, module){

    var result = false;

    // Event binding for all modules of type
    if( events[code] && typeof( events[code] ) === 'function' ){
        result = events[code](module);
    }

    // Event binding for all modules on port
    if( events[port] && typeof( events[port] ) === 'function' ){
        result = events[port](module);
    }

    // Event binding for  modules of type on port
    var evt = [code,port].join('_');
    if( events[evt] && typeof( events[evt] ) === 'function' ){
        result = events[evt](module);
    }

    if( result ){
        clearTimeout(do_update_server);
        do_update_server = setTimeout(update_server(),50);
    }

}

socket.onmessage = function(event) { 
    var commands = event.data.split(', ');
    command = commands[0];
    var i = commands.length;
    while(i-- > 1){

        data = commands[i].split(':');

        var port = parseInt(data.shift());
        var addr = parseInt(data.shift());
        var code = module_map[addr];
        
        var module = get_module(port, code, true);
        if( !module ) return false;
        
        switch(command){
            case 'R':
                if( typeof(module.set) === 'function' ){
                    module.set(data);
                    handle_events(code,port,module);
                }
                module.active = true;
                break;
            case 'N':
                module.active = true;
                console.log(active_modules);
                break;
            case 'D':
                module.active = false;
                console.log(active_modules);
                break;
            default:
                break;
        }

    }
};

socket.onopen  = function()      { console.log('Connected!')         };
socket.onerror = function(event) { console.log('Socket Error',event) };