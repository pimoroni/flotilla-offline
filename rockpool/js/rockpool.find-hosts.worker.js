if (!String.prototype.includes) {
  String.prototype.includes = function() {'use strict';
    return String.prototype.indexOf.apply(this, arguments) !== -1;
  };
}

var FlotillaScanner = function(){

    this.attemptConnection = function(index){ 

        var obj = this;

        //var connection_timeout = 5750;
        //var query_timeout = 1000;

        if( index > this.scan_total || this.terminate ){
            this.progress = this.scan_total;
            this.callback_progress(this.scan_total);
            return false;
        }

        this.progress = index-1;
        this.callback_progress(index-1);

        var scan_ip = this.start + index;
        var host = this.host + '.' + scan_ip.toString();
        var timeout = null;

        var details = {dock_user: null, dock_name: null, dock_version: null, dock_serial: null};

        clearTimeout(timeout);
        var socket_attempt = new WebSocket("ws://" + host + ':' + this.port + "/");

        var timeout = setTimeout(function(){
            if( socket_attempt.readyState != socket_attempt.OPEN ){
                socket_attempt.onopen = function(){};
                // This will cause onerror and onclose to trigger
                socket_attempt.close();
            }
        },this.connection_timeout);

        socket_attempt.onopen = function() {
            clearTimeout(timeout);

            socket_attempt.send('hello');

            timeout = setTimeout(function(){
                console.log('Query timeout...');
                socket_attempt.onopen = function(){};
                // This will cause onerror and onclose to trigger
                socket_attempt.close();
            },this.query_timeout);
            //socket_attempt.close();
            //obj.callback_found(host);
        }
        socket_attempt.onmessage = function(event) {
            var message = event.data;
            console.log(message);
            if( message.includes('# Dock:') ){

                message = message.replace('# Host:','').split(',');
                details.dock_version = message[0];
                details.dock_serial = message[1];
                details.dock_user = message[2];
                details.dock_name = message[3];

                obj.callback_found(host, details);
                socket_attempt.close();

                clearTimeout(timeout);
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

    this.scan = function(host, connection_timeout, callback_progress, callback_found){
        var start_end   = host[3];
        this.connection_timeout = connection_timeout;
        this.start      = start_end[0];
        this.end        = start_end[1];
        this.scan_total = this.end - this.start;
        this.host       = host.slice(0,3).join('.');

        this.callback_found    = callback_found;
        this.callback_progress = callback_progress;

        this.attemptConnection(0);
    }

    this.port = '9395';
    this.progress = 0;
    this.terminate = false;
    this.connection_timeout = 750;
    this.query_timeout = 1000;
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

            /*if( 'connection_timeout' in event.data ){
                scanner.connection_timeout = event.data['connection_timeout'];
            }*/

            if( 'attempt_host' in event.data ){
                var host = event.data['attempt_host'];
                var connection_timeout = event.data['connection_timeout'];
                
                scanner.scan(
                    host, 
                    connection_timeout,
                    function(progress)    {postMessage({progress:progress})},
                    function(host,details){postMessage({found_host:host,details:details})}
                )
            }

            if( 'terminate' in event.data ){
                scanner.terminate = event.data['terminate'];
            }

        }

    })();

}
