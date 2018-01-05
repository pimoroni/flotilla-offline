if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

function decodeCp437(charArray){
    if(!(charArray instanceof ArrayBuffer)){return charArray;}

    charArray = new Uint8Array(charArray);

    var len = charArray.length;
    var buf = "";

    for(var x = 0; x < len; x++){
        var charCode = charArray[x];

        if(charCode < 128){
            buf += String.fromCharCode(charCode);
        }
        else if(charCode < 256){
            buf += String.fromCharCode([
               0xC7,   0xFC,   0xE9,   0xE2,   0xE4,   0xE0,   0xE5,   0xE7,
               0xEA,   0xEB,   0xE8,   0xEF,   0xEE,   0xEC,   0xC4,   0xC5,
               0xC9,   0xE6,   0xC6,   0xF4,   0xF6,   0xF2,   0xFB,   0xF9,
               0xFF,   0xD6,   0xDC,   0xA2,   0xA3,   0xA5,  0x20A7, 0x192,
               0xE1,   0xED,   0xF3,   0xFA,   0xF1,   0xD1,   0xAA,   0xBA,
               0xBF,  0x2310,  0xAC,   0xBD,   0xBC,   0xA1,   0xAB,   0xBB,
              0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x2561, 0x2562, 0x2556,
              0x2555, 0x2563, 0x2551, 0x2557, 0x255D, 0x255C, 0x255B, 0x2510,
              0x2514, 0x2534, 0x252C, 0x251C, 0x2500, 0x253C, 0x255E, 0x255F,
              0x255A, 0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256C, 0x2567,
              0x2568, 0x2564, 0x2565, 0x2559, 0x2558, 0x2552, 0x2553, 0x256B,
              0x256A, 0x2518, 0x250C, 0x2588, 0x2584, 0x258C, 0x2590, 0x2580,
              0x3B1,  0x3B2,  0x393,  0x3C0,  0x3A3,  0x3C3,  0x3BC,  0x3C4,
              0x3A6,  0x398,  0x3A9,  0x3B4,  0x221E, 0x3C6,  0x3B5,  0x2229,
              0x2261,  0xB1,  0x2265, 0x2264, 0x2320, 0x2321,  0xF7,  0x2248,
              0xB0,   0x2219,  0xB7,  0x221A, 0x207F,  0xB2,  0x25A0,  0xA0
           ][charCode-128])
        }
    }

    return buf;
}

var FlotillaScanner = function(){

    this.attemptConnection = function(index){ 

        var obj = this;

        if( index > this.scan_total || this.terminate ){
            this.progress = this.scan_total;
            this.callback_progress(this.scan_total);
            return false;
        }

        this.progress = index-1;
        this.callback_progress(index-1);

        var scan_ip;
        var host;

        if(this.start == 0 && this.end == 0){
            host = this.host;
        }
        else
        {
            scan_ip = this.start + index;
            host = this.host + '.' + scan_ip.toString();  
        }

        var timeout = null;

        var query_timeout = this.query_timeout;

        var details = {dock_user: null, dock_name: null, dock_version: null, dock_serial: null};

        clearTimeout(timeout);
        var socket_attempt =  new WebSocket("ws://" + host + ':' + this.port + "/");

        var timeout = setTimeout(function(){
            if( socket_attempt.readyState != socket_attempt.OPEN ){
                socket_attempt.onopen = function(){};
                // This will cause onerror and onclose to trigger
                socket_attempt.close();
            }
        },this.connection_timeout);
        socket_attempt.binaryType = 'arraybuffer';
        socket_attempt.onopen = function() {
            clearTimeout(timeout);

            socket_attempt.send('hello');

            timeout = setTimeout(function(){
                //console.log('Query timeout...',host);
                socket_attempt.onopen = function(){};
                // This will cause onerror and onclose to trigger
                socket_attempt.close();
            },query_timeout);
        }
        socket_attempt.onmessage = function(event) {
            var message = decodeCp437(event.data);

            if( message.includes('# Done') ){

                clearTimeout(timeout);
                socket_attempt.close();

            }
            if( message.includes('# Daemon:') ){

                message = message.replace('# Daemon: ','').split(',');
                daemon_details = {}
                daemon_details.daemon_version = parseFloat(message[0]);
                daemon_details.canonical_address = message[1];
                if( daemon_details.canonical_address == "" ) daemon_details.canonical_address = host;
                obj.callback_daemon(host, daemon_details);
                return;
                
            }
            if( message.includes('# Dock:') ){

                details = {};
                message = message.replace('# Dock: ','').split(',');
                details.dock_version = parseFloat(message[0]);
                details.dock_serial = message[1];
                details.dock_user = message[2];
                details.dock_name = message[3];
                details.dock_index = message[4];

                obj.callback_found(host, details);
                return;
                
            }
        }
        socket_attempt.onerror = function() {
            clearTimeout(timeout);
        }
        socket_attempt.onclose = function() {
            clearTimeout(timeout);
            obj.attemptConnection(index+1);
        }

    }

    this.stop = function(ref){
        this.terminate = true;
    }

    this.scan = function(host, connection_timeout, callback_progress, callback_found, callback_daemon){
        this.connection_timeout = connection_timeout;
        this.scan_total = this.end - this.start;

        if(typeof(host) === "string"){
            this.host   = host;
            this.start      = 0;
            this.end        = 0;
        }
        else
        {
            this.host   = host.slice(0,3).join('.');
            var start_end   = host[3];
            this.start      = start_end[0];
            this.end        = start_end[1];
        }

        this.callback_found    = callback_found;
        this.callback_progress = callback_progress;
        this.callback_daemon   = callback_daemon;

        this.attemptConnection(0);
    }

    this.port = '9395';
    this.progress = 0;
    this.terminate = false;
    this.connection_timeout = 750;
    this.query_timeout = 2000;
    this.addHost = null;
    this.host  = '';
    this.start = 0;
    this.end   = 0;
    this.scan_total = 0;
}

if( typeof(this.Window) !== "function" ){

    (function(){

        var scanner = new FlotillaScanner();

        onmessage = function(event){

            if( 'attempt_host' in event.data ){
                var host = event.data['attempt_host'];
                var connection_timeout = event.data['connection_timeout'];
                
                scanner.scan(
                    host, 
                    connection_timeout,
                    function(progress)    {postMessage({progress:progress})},
                    function(host,details){postMessage({found_host:host,details:details})},
                    function(host,details){postMessage({found_daemon:host,details:details})}
                )
            }

            if( 'terminate' in event.data ){
                scanner.terminate = event.data['terminate'];
            }

        }

    })();

}
