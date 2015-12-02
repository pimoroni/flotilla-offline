var FlotillaModule = function(settings, host_idx, channel_idx, module_code) {

    this.title 			= settings.title
    this.inputs			= []
    this.outputs		= []
    this.active 		= false
    this.data 			= {};
    this.output_data    = {};
    this.input_data     = {}; // Completely isolate input data from output, so devices don't update themselves
    this.last_data		= {};
    this.host           = host_idx;
    this.channel 		= channel_idx;
    this.code 			= module_code;

    this.do_average     = settings.average === false ? false : true

    this.getData 	= function() {
        return this.data;
    }

    this.sync 		= function() {
    	this.syncOutputs()
    	this.transmit()
    }

    this.changed = function() {
    	var changed = false;
    	for( k in this.data ){
    		if(this.data[k] != this.last_data[k]){
    			changed = true
    		}
        	this.last_data[k] = this.data[k];
    	}
    	return changed;
    }

    /*
		Sends data to server if it has changed since the last send
    */
    this.transmit 	= function() {
    	if(!this.changed() || !this.active) return false;

        if( settings.send && typeof(settings.send) === 'function' ){
            var packets = settings.send(this.data);

            var x = packets.length;
            while(x--){
                rockpool.sendHostUpdate(this.host, this.channel, this.code, packets[x]);
            }
            return true;
        }
        return false;
    }

    /*
		Updates all outputs with data from singleton output objects
    */
    this.syncOutputs  = function() {
		for( var k in this.outputs ){

      		for( var property in this.outputs[k].data ){

                if(!this.do_average){
                    this.data[property] = this.outputs[k].data[property];
                    continue;
                }

                if(!this.output_data[property]) this.output_data[property] = {}

                if( typeof( this.outputs[k].data[property] ) === 'object' && this.outputs[k].data[property] != null ){
                    this.outputs[k].data[property].avg = rockpool.helpers.objAvg
                    this.output_data[property][k] = this.outputs[k].data[property].avg()
                }else{
                    this.output_data[property][k] = this.outputs[k].data[property]
                }

      		}
      	}
        this.averageData();
    }

    /*
        Averages all multiple value outputs
    */
    this.averageData = function(){
        if(!this.do_average) return false;

        for( var pi in this.output_data ){

            var count = 0
            var total = 0
            for( var ki in this.output_data[pi] ){
                if(this.output_data[pi][ki] != 0){
                    total += this.output_data[pi][ki]
                    count++
                }
            }
            this.last_data[pi] = this.data[pi]
            this.data[pi] = count === 0 ? 0 : (total/count) 
        }
    }

    /*
		Updates all the singleton input objects with input data
    */
    this.syncInputs  = function() {
      	for( var k in this.inputs ){
      		for( var property in this.input_data ){ //inputs[k].data ){
      			this.inputs[k].data[property] = this.input_data[property]
      		}
      	}
    }

    this.receive    = function(data){
        if( settings.receive && typeof(settings.receive) === 'function'){
            this.update( settings.receive( data ) );
        }
    }

    /*
		Accepts data object from an external source
		with one or more valid keys
    */
    this.update 	= function(data) {
    	for( property in data ){
    		this.input_data[ property ] = data[ property ]
    	}
    	this.syncInputs()
        return true;
    }

    /*
    	Activates the module and registers all its
    	inputs and outputs with Rockpool
    */
    this.activate 	= function() {
      	this.active = true
        for( var k in this.inputs ){
            var input = this.inputs[k]
            input.active = true
        }
        for( var k in this.outputs ){
            var output = this.outputs[k]
            output.active = true
        }
    }

    this.deactivate = function() {
       	this.active = false
        for( var k in this.inputs ){
            var input = this.inputs[k]
            input.active = false
        }
        for( var k in this.outputs ){
            var output = this.outputs[k]
            output.active = false
        }
    }

    /*
        Set up inputs and outputs using the definitions in the settings object,
        settings will be one of the module definitions from rockpool.modules.js
    */
    for( var k in settings.inputs ){
        this.inputs[k] = new settings.inputs[k]
        this.inputs[k].type = "module"
        this.inputs[k].host = this.host
        this.inputs[k].channel = this.channel
        this.inputs[k].category = settings.title
        this.inputs[k].active = true
        rockpool.registerInput( this.host, this.channel, this.code, k, this.inputs[k] )
    }

    for( var k in settings.outputs ){
        this.outputs[k] = new settings.outputs[k]
        this.outputs[k].type = "module"
        this.outputs[k].host = this.host
        this.outputs[k].channel = this.channel
        this.outputs[k].category = settings.title
        this.outputs[k].active = false
        rockpool.registerOutput( this.host, this.channel, this.code, k, this.outputs[k] )
    }
};