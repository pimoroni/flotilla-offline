var FlotillaModule = function(settings, host_idx, channel_idx, module_code) {

    this.title 			= settings.title
    this.icon           = settings.icon
    this.color          = settings.color ? settings.color : 'grey'
    this.inputs			= {}
    this.outputs		= {}
    this.active 		= false
    this.data 			= {};
    this.output_data    = {};
    this.input_data     = {}; // Completely isolate input data from output, so devices don't update themselves
    this.last_data		= {};
    this.host           = host_idx;
    this.channel 		= channel_idx;
    this.code 			= module_code;

    this.input_count    = 0;
    this.output_count   = 0;

    this.do_average     = settings.average === false ? false : true

    this.key = [host_idx,channel_idx,module_code].join('_');

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
                rockpool.sendHostUpdate(this.host, this.channel+1, this.code, packets[x]);
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

                    //console.log(this.key,this.outputs[k].data[property]);
                    this.outputs[k].data[property].avg = rockpool.helpers.objAvg
                    this.output_data[property][k] = this.outputs[k].data[property].avg()

                }else{

                    if( this.outputs[k].defaults && this.outputs[k].defaults[property] && this.outputs[k].data[property] == null ){
                        this.output_data[property][k] = this.outputs[k].defaults[property];
                    }
                    else
                    {
                        this.output_data[property][k] = this.outputs[k].data[property]
                    }

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
            this.inputs[k].active = true
        }
        for( var k in this.outputs ){
            this.outputs[k].active = true
        }
    }

    this.deactivate = function() {
       	this.active = false
        for( var k in this.inputs ){
            this.inputs[k].active = false
        }
        for( var k in this.outputs ){
            this.outputs[k].active = false
        }
    }

    this.firstInput = function(){
        for( var k in this.inputs ){
            return this.inputs[k];
        }
    }

    this.firstOutput = function(){
        for( var k in this.outputs ){
            return this.outputs[k];
        }
    }

    this.needsInputConfiguration = function(){
        if(this.input_count == 1){
            if(this.firstInput().options && this.firstInput().options.length > 1){
                return true; // Module has 1 input, but that input has options
            }
            return false; // Module has only 1 input, with no options
        }
        return true; // Module has more than one input
    }

    this.needsOutputConfiguration = function(){
        if(this.output_count == 1){
            if(this.firstOutput().options && this.firstOutput().options.length > 1){
                return true; // Module has 1 output, but that output has options
            }
            return false; // Module has only 1 output, with no options
        }
        return true; // Module has more than one output
    }

    this.needsConfiguration = function(type){
        switch(type){
            case 'input':
                return this.needsInputConfiguration();
            case 'output':
                return this.needsOutputConfiguration();
        }
    }

    this.getOptions = function(type){
        var options = [];
        var collection = this.inputs;
        if(type == 'output') collection = this.outputs;

        for(var io_key in collection){
            var io = collection[io_key];
            if(io.options && io.options.length > 0){
                for(var option_key in io.options){
                    options.push({
                        'key':   [this.key,io_key].join('_'),
                        'option':option_key,
                        'title': io.options[option_key].name
                    })
                }
            }
            else
            {
                options.push({
                    'key':   [this.key,io_key].join('_'),
                    'option':0,
                    'title': io.name
                })
            }
        }

        return options;
    }
    /*
        Set up inputs and outputs using the definitions in the settings object,
        settings will be one of the module definitions from rockpool.modules.js
    */
    for( var k in settings.inputs ){
        this.inputs[k] = new settings.inputs[k]
        this.inputs[k].key = k
        this.inputs[k].type = "module"
        this.inputs[k].host = this.host
        this.inputs[k].color = this.color
        this.inputs[k].icon = this.inputs[k].icon ? this.inputs[k].icon : this.icon
        this.inputs[k].channel = this.channel
        this.inputs[k].category = settings.title
        this.inputs[k].active = true
        rockpool.registerInput( this.host, this.channel, this.code, k, this.inputs[k] )

        this.input_count++;
    }

    for( var k in settings.outputs ){
        this.outputs[k] = new settings.outputs[k]
        this.outputs[k].key = k
        this.outputs[k].type = "module"
        this.outputs[k].host = this.host
        this.outputs[k].color = this.color
        this.outputs[k].icon = this.outputs[k].icon ? this.outputs[k].icon : this.icon
        this.outputs[k].channel = this.channel
        this.outputs[k].category = settings.title
        this.outputs[k].active = false
        rockpool.registerOutput( this.host, this.channel, this.code, k, this.outputs[k] )

        this.output_count++;
    }
};