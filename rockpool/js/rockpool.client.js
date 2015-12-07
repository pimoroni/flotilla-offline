var rockpool = rockpool || {};
rockpool.offline = true
rockpool.use_web_workers = false;

rockpool.port = "9395";
rockpool.connection_timeout = 500; // seems stable at (250 * number of ranges to scan)

rockpool.valid_hosts = [];
rockpool.attempt_list = [];

rockpool.host_picker = $('<div>').addClass('host-picker palette')
    .appendTo('.palettes')
    .on('click','.host',function(e){
        e.preventDefault();
        e.stopPropagation();
        rockpool.stopScan();
        var host = $(this).data('host');
        rockpool.closePrompt();
        rockpool.connect(host, rockpool.port);
    })
    .on('click','.custom a',function(e){
        e.preventDefault();
        e.stopPropagation();
        var host = $(this).parent().find('input').val();
        rockpool.stopScan();
        rockpool.closePrompt();
        rockpool.connect(host, rockpool.port);
    })
    .append('<header><h1>' + rockpool.languify('Pick Your Dock') + '</h1></header>')
    .append('<div class="progress"><strong>' + rockpool.languify('Scanning') + '</strong><span></span></div>')
    .append('<div class="custom"><p>Enter IP address:</p><input type="text" value="127.0.0.1"><a href="#">Connect<a></div>');

rockpool.addHost = function(host, details){
    console.log('Adding valid host', host, details);

    if( rockpool.valid_hosts.indexOf(host) == -1 ){
        rockpool.valid_hosts.push(host);
        $('<div><p>' + details.dock_name + '</p><small>' + host + '</small></div>').data('host',host).addClass('host').appendTo(rockpool.host_picker);
    }
}

rockpool.stopScan = function(){
    var x = rockpool.attempt_list.length;

    while(x--){
        var start_end = rockpool.attempt_list[x].target[3];
        var start     = start_end[0];
        var end       = start_end[1];

        rockpool.scan_workers[rockpool.attempt_list[x].target].stop(rockpool.scan_workers[rockpool.attempt_list[x].target]);
    }
}

rockpool.resetHosts = function(){
    rockpool.valid_hosts = [];
    rockpool.host_picker.find('.host').remove();
}

rockpool.addScanTarget = function(target, timeout){
    if( typeof(timeout) === "undefined" ){
        timeout = 750;
    }
    if( typeof(target) === 'string' ){
        var host = target.split('.');
        if(host.length < 4){
            return false;
        }
        if(host[3].indexOf('/') > -1){
            host[3] = host[3].split('/').map(function(value){return parseInt(value)});
        }
        else
        {
            host[3] = [host[3],host[3]]
        }
        host = host.map(
            function(value){
                if ( typeof(value) === "string" ){
                    return parseInt(value)
                }
                else
                {
                    return value.map(function(value){return parseInt(value)});
                }
            }
        );
        target = host;
    }
    rockpool.attempt_list.push({target:target, timeout:timeout});
}

rockpool.addPreviousTargets = function(){
    var history = rockpool.loadConnectionHistory();
    for(var host in history){
        console.log('Adding previous host: ' + history[host])
        rockpool.addScanTarget(history[host], 5000);
    }
}

rockpool.addCommonTargets = function(){
    rockpool.addScanTarget('127.0.0.1', 5000);
    rockpool.addScanTarget([192,168,0,[1,254]]);
    rockpool.addScanTarget([192,168,1,[1,254]]);
    rockpool.addScanTarget([10,0,1,[1,254]]);
    rockpool.addScanTarget([10,0,0,[1,254]]);
}

rockpool.findHosts = function(){

    var progress_total = 0;

    rockpool.resetHosts();

    rockpool.prompt(rockpool.host_picker, false);

    var history = rockpool.loadConnectionHistory();
    for(var host in history){
        rockpool.host_picker.find('.custom input').val(history[host]);
        break;
    }

    rockpool.scan_workers = {};

    var x = rockpool.attempt_list.length;

    while(x--){
        var start_end = rockpool.attempt_list[x].target[3];
        var start     = start_end[0];
        var end       = start_end[1];

        progress_total += (end-start);

        spawnWorker(rockpool.attempt_list[x]);
    }

    function stopOtherScans(subnet){
        for(var x = 0; x < rockpool.attempt_list.length; x++){
            if( rockpool.attempt_list[x].target.slice(0,3).join('.') != subnet ){

                var start_end = rockpool.attempt_list[x].target[3];
                var start     = start_end[0];
                var end       = start_end[1];

                console.log('Terminating redundant range due to subnet ' + rockpool.attempt_list[x].target)

                rockpool.scan_workers[rockpool.attempt_list[x].target].stop(rockpool.scan_workers[rockpool.attempt_list[x].target]);
            }
        }
    }

    function spawnWorker(attempt_host){
        var target    = attempt_host.target;
        var start_end = target[3];
        var start     = start_end[0];
        var end       = start_end[1];
        var total     = end-start;

        if( rockpool.use_web_workers ){
            rockpool.scan_workers[target] = new Worker("js/rockpool.find-hosts.worker.js");
            rockpool.scan_workers[target].progress = 0;
            rockpool.scan_workers[target].stop = function(obj){
                obj.postMessage({terminate:true});
            }
            rockpool.scan_workers[target].onmessage = function(msg){

                if( 'found_host' in msg.data ){
                    var host = msg.data['found_host'];
                    var details = msg.data['details'];
                    var successful_subnet = host.split('.').slice(0,3).join('.');
                    rockpool.addHost(host,details);
                    stopOtherScans(successful_subnet);
                }

                if( 'progress' in msg.data ){
                    rockpool.scan_workers[target].progress = parseInt(msg.data['progress']);

                    updateFindHostProgress();
                }

            }
            console.log('Target',target);
            rockpool.scan_workers[target].postMessage({
                attempt_host:target,
                connection_timeout:attempt_host.timeout
            });
        }
        else
        {
            console.log('Target',target);
            rockpool.scan_workers[target] = new FlotillaScanner();
            rockpool.scan_workers[target].scan(
                target,
                attempt_host.timeout,
                function(progress){updateFindHostProgress()},
                function(host, details)    {
                    var successful_subnet = host.split('.').slice(0,3).join('.');
                    rockpool.addHost(host, details);
                    stopOtherScans(successful_subnet);
                }
            );
        }
    }

    function updateFindHostProgress(){

        var progress = 0;

        for(var x = 0; x < rockpool.attempt_list.length; x++){
            if( typeof(rockpool.scan_workers[rockpool.attempt_list[x].target]) != 'undefined' ){
                progress += rockpool.scan_workers[rockpool.attempt_list[x].target].progress;
            }
        }

        rockpool.host_picker
            .find('.progress span')
            .css('width', ((progress/progress_total) * 100) + '%');

        if( progress == progress_total ){
            rockpool.host_picker.find('strong').html(rockpool.languify('Finished!'));
        }
        else
        {
            rockpool.host_picker.find('strong').html(rockpool.languify('Searching for Flotilla&hellip;'));
        }

    }
}

rockpool.loadConnectionHistory = function(){

    var history = rockpool.getPersistentValue('host_history',[]);

    if( typeof(history) === "string" ){
        history = history.split(',');
    }

    return history;

}

rockpool.addToConnectionHistory = function(host){

    var history = rockpool.loadConnectionHistory();

    if( history.indexOf( host ) == -1 ){
        history.unshift( host );
    }
    
    rockpool.setPersistentValue('host_history', history);

}

rockpool.isConnected = function(){
    if(!rockpool.socket){ return false; }
    return rockpool.socket.readyState == rockpool.socket.OPEN;
}

rockpool.connect = function(host, port){

    var prompt = $("<div>")
        .addClass('host-picker palette')
        .append('<header><h1>' + rockpool.languify('Connecting...') + '</h1></header>');

    rockpool.prompt(prompt,false);

    rockpool.socket = new WebSocket("ws://" + host + ':' + port + "/");
    rockpool.socket.onopen = function() { 
        console.log('Successfully connected to ' + host); rockpool.socket.send('ready'); 

        rockpool.addToConnectionHistory(host);

        rockpool.enable_keyboard();
        if(typeof(rockpool.on_connect) === "function"){
            rockpool.on_connect();
        }
        rockpool.closePrompt();
    };
    rockpool.socket.onmessage = function(event) { rockpool.parseCommand(event.data); return; };
    rockpool.socket.onerror = function(event) {
        console.log('Socket Error',event);
        rockpool.closePrompt();
        rockpool.findHosts();
     };
    rockpool.run();
}

rockpool.sendHostUpdate = function(host, channel, code, data){

    var packet = ['s', channel, data.join(',')].join(' ');
    packet = 'h:' + host + ' d:' + packet;
    if( rockpool.isConnected() ){
        console.log('Sending packet:', packet)
        rockpool.socket.send(packet);
    }
    else
    {  
        console.log('Unable to send ( No connection to host ):', packet)
    }

}

rockpool.addressLookup = function(module_addr){
    for( var module_name in rockpool.module_handlers ){
        if(module_addr = rockpool.module_handlers[module_name].address){
            return module_name;
        }
    }
    return -1;
}

rockpool.parseCommand = function(data_in){

    if(data_in == 'update'){
        //rockpool.update();
        //rockpool.sync();
        return;
    }

    if(data_in[0] == '#'){
        console.log('Debug: ', data_in);
        return false;
    }
    
    packet = data_in.split(/[$h|\ d]\:/);
    packet.shift();

    var host    = parseInt(packet[0].trim());
    data_in = packet[1].trim();

    if(data_in[0] == '#'){
        console.log('Debug: ', data_in);
        return false;
    }

    if(data_in[0] == 'H'){
        if( data_in[1] == 'F' ){
            console.log('Flotilla Host Found!');
        }
        else
        {
            console.log('Flotilla Host Lost!');
        }
        return true;
    }

    data = data_in.replace('  ',' ').replace(/,/g,' ').replace('/',' ').split(' ');
    if(data.length < 2){
        console.log('Invalid message: ', data_in);
        return false;
    }

    var command = data.shift().trim();
    var channel = parseInt(data.shift().trim());
    var device = data.shift().trim();

    if(!isNaN(device)){
        device = rockpool.addressLookup(device);
    }

    switch(command){
        case 'u': // Update
            var module = rockpool.getModule(host, channel, device);
            module.receive(data);
            if( module.active == false ){
                module.activate();
                rockpool.updatePalettes();
                rockpool.updateActiveWidgets();
            }
            return true;
        case 'd': // Disconnect
            var module = rockpool.getModule(host, channel, device);
            if( !module ) return false;
            module.deactivate();
            rockpool.updatePalettes();
            rockpool.updateActiveWidgets();
            return true;
        case 'c': // Connect
            var module = rockpool.getModule(host, channel, device);
            if( !module ) return false;
            module.activate();
            rockpool.updatePalettes();
            rockpool.updateActiveWidgets();
            return true;
    }

}
