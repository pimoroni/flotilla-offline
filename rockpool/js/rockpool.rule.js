var rockpool = rockpool || {};

rockpool.rule = function (parent, widget_index) {

    this.deserialize = function(source){

        if( typeof(source) === 'string' ){
            source = JSON.parse(source);
        }

        //console.log("Setting input handler", source.input.key, source.input.option);


        if( !rockpool.inputs[source.input.key] ){
            rockpool.newInactiveModuleFromKey(source.input.key);
        }

        this.setInputHandler( source.input.key, source.input.option > -1 ? source.input.option : null );

        for(var x = 0; x < source.converters.length; x++){

            this.setHandler(x, source.converters[x].key);

        }

        if( !this.getOutput().isComparator() ){

            if( !rockpool.outputs[source.output.key] ){
                rockpool.newInactiveModuleFromKey(source.output.key);
            }

            this.setOutputHandler( source.output.key, source.output.option > -1 ? source.output.option : null );
        
        }

        for(var x = 0; x < source.converters.length; x++){
            if(source.converters[x].child){
                this.getConverter(x).child.deserialize(source.converters[x].child)
            }
        }
    }

    this.serialize = function(to_json){

        if(typeof(to_json) === 'undefined'){
            to_json = true;
        }

        var o = {
            enabled: this.enabled,
            input: {  
                key:    this.input.handler_key,
                option: this.input.options ? this.input.option_index : -1,
                value:  this.input.getValue()
            },
            output:{ 
                key:    this.output.handler_key,
                option: this.output.options ? this.output.option_index : -1
            },
            converters: []
        }

        this.converters.forEach(function(converter, idx){
            var c = {
                key:converter.handler_key
            }
            if( converter.isComparator() ){
                c.child = converter.child.serialize(false);
            }
            o.converters.push(c);
        })

        return to_json ? JSON.stringify(o) : o;

    }

    this.isChild = function() {
        return this.parent ? true : false;
    }

    this.updateVisibility = function () {
        this.visible = this.dom.filter(':in-viewport').length > 0;
    }

    this.respond = function () {
        this.updateVisibility();

        this.getInput().respond();
        this.converters.forEach(function(converter, idx){
            converter.respond();
            if(converter.isComparator()){
                converter.child.respond();
            }
        })
        this.getOutput().respond();

    }

    /*
        Return the child rule of a particular converter
    */
    this.getChild = function(idx){
        return this.getConverter(idx).isComparator() ? this.getConverter(idx).child : null
    }

    this.redrawRuleGroup = function(){
        this.group.find('.rule:eq(0)').data('obj').render();
    }

    this.addEventHandler = function(name, fn){
        this.events[name] = fn;
    }

    this.clearEventHandler = function(name){
        this.events[name] = null;
    }

    this.runEventHandler = function(name){
        if(typeof(this.events[name]) === 'function'){
            this.events[name](this);
        }
    }

    /*
        Set the handler object for a converter/comparator
        Or an input/output if idx = input or idx = output
    */
    this.setHandler = function(idx, key, option, value){
        if(idx == 'input'){
            this.setInputHandler(key, option, value)
            return;
        }
        if(idx == 'output'){
            this.setOutputHandler(key, option)
            return;
        }

        var converter = this.getConverter(idx)
        if(!converter) return false; // Converter out of range

        converter.setHandler(key);
        converter.inheritedRowSpanChild = 0;

        if( converter.isComparator() ){
            if(!converter.child){
                converter.child = new rockpool.rule(this, idx)
            }
            converter.child.output = converter;
            converter.child.start();
            converter.child.getOutput().update()
        } else {
            converter.killChild()
        }
        this.redrawRuleGroup();

        this.runEventHandler('on_set_converter' + idx + '_handler');
    }

    this.setInputHandler = function(key, option, value) {

        this.getInput().setHandler(key);

        if( typeof( option ) === "number" && this.getInput().hasOptions() ){
            this.getInput().setOptions(option,value);
        }
        else
        {
            this.getInput().options = null
        }
        this.getInput().update()
        if(typeof(this.getInput().handler.init) === 'function'){
            this.getInput().handler.init(this)
        }
        this.getInput().update(true);
        this.render();

        this.runEventHandler('on_set_input_handler');
        
        return true;
    }

    this.setOutputHandler = function(key, option) {

        var output = this.getOutput();

        if(output){
            output.stop(this.guid)
        }

        output.setHandler(key);

        //output.handler = handler
        if( typeof(option) === "number" && output.hasOptions() ){
            output.setOptions(option);
        }
        else
        {
            output.options = null
        }
        output.update(true)
        this.render();

        this.runEventHandler('on_set_output_handler');
    }

    this.updateDom = function(){
        if(this.input) this.input.dom_update_needed = true;
        this.converters.forEach(function(converter, idx){
            converter.dom_update_needed = true;
        })
        if(this.output) this.output.dom_update_needed = true;
    }

    this.getInput = function() {return this.input}

    this.getOutput = function() {return this.output}

    this.getConverter = function(idx) {return this.converters[idx]}

    this.updateLabels = function(module_key) {
        // module_key is the module which has triggered the update
        module_key = module_key || "NONE";

        if(this.isChild() && this.getOutput().handler.inheritFormatting){
            this.getInput().inheritFromModule = this.parent.getInput();
        }
        else
        {
            this.getInput().inheritFromModule = null;
        }

        this.getInput().update(this.getInput().handler_key.substr(0,module_key.length) === module_key);

        this.converters.forEach(function(converter, idx){
                converter.update();
            }
        )
        // Avoid recursion!
        if( !this.getOutput().isComparator() ){
            this.getOutput().update(this.getOutput().handler_key.substr(0,module_key.length) === module_key);
        }
    }

    this.kill = function () {
        this.dom.remove()
        this.getOutput().stop(this.guid)
        this.converters.forEach(function(converter, idx){
            converter.killChild()
        })
        this.deleted = true;
    }

    this.addConverter = function ( key ) {
        this.converters.push( new rockpool.widget( 'converter', this, key ) )
    }

    this.render = function (fn_callback) {
        if( this.deleted ) return false;
        if( !this.dom )
        {
            if( !(this.parent instanceof rockpool.rule) ){
                rockpool.rules.push(this);
            }

            this.group = this.isChild() ? this.parent.group : $('<span class="rulegroup">').appendTo('#rules');

            this.dom = $('<div class="rule pure-g">');

            this.dom.data('obj',this);

            this.dom_enabled = $('<div class="toggle"></div>').appendTo(this.dom);

            this.input = this.input ? this.input : new rockpool.widget( 'input', this, 'none' );

            var i = this.converter_count
            while(i--){
                this.addConverter('noop')
            }
            this.output = this.output ? this.output : new rockpool.widget( 'output', this, 'none' )

            if( !this.isChild() ){
                this.dom_delete =  $('<div class="delete"></div>').appendTo(this.dom)
                $('<i></i>').appendTo(this.dom_enabled);
                $('<i></i>').appendTo(this.dom_delete);
            }

            if( this.isChild() ){

                var potential_position = this.parent.dom;
                var skip = this.widget_index;

                // Fix for correct placement of widget 3 (index 2) child rules
                // when we already have 4 rules merging into one.
                if(this.widget_index == 2){
                    skip = 3;
                }

                while(skip-- && potential_position.next('.rule').length > 0){
                    if( potential_position.next('.rule').data('obj').widget_index > widget_index ){
                        break;
                    }
                    potential_position = potential_position.next('.rule');
                }

                potential_position.after(this.dom);


            }
            else
            {
                this.group.append(this.dom);

                this.dom_delete.on('click',function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    var rule = $(this).parent().data('obj') || $(this).parent().parent().data('obj') ;
                    rule.kill();
                })

                this.dom_enabled.on('click',function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    var rule = $(this).parent().data('obj') || $(this).parent().parent().data('obj') ;
                    rule.toggle();
                })
            }
            this.respond();
        }

        this.updateLabels();

        if(typeof fn_callback === "function"){
            fn_callback();
        }
    }

    this.redrawChart = function () {
        if( this.deleted ) return false;

        // || !this.visible
        if( !this.enabled ) {return false;}

        this.getInput().drawChart();
        this.converters.forEach( function(converter, idx){
            converter.drawChart();
            if(converter.isComparator()){
                converter.child.redrawChart();
            }
        })
    }

    this.update = function () {
        if( this.deleted ) return false;
        if( !this.enabled ) { return false; }
        if( !this.getInput() || !this.getOutput() ) { return false; }
        if( this.getInput().handler.name == "None" ) { return false; }

        var value = this.getInput().get();
        this.converters.forEach( function(converter, idx){
            if( converter.isComparator() ){
                converter.child.update();
            }
            value = converter.convert(value);
        } )

        this.getOutput().set(value, this.guid);
        this.lastValue = value;

    }

    this.toggle = function () {
        this.enabled = !this.enabled;

        this.converters.forEach( function(converter, idx ){
            if( converter.isComparator() ){
                converter.child.toggle();
            }
        });

        if( this.enabled ){
            this.group.removeClass('off');
            this.respond();
            this.lastValue = null;
        }
        else
        {
            this.group.addClass('off');
            this.getOutput().stop(this.guid);
        }
    }

    this.start = function(fn_callback){
        this.render(fn_callback);
    }

    this.enabled = true;
    this.dom = null;
    this.converter_count = typeof(widget_index) === "number" ? widget_index : 3;

    this.widget_index = widget_index;

    this.input = null;
    this.output = null;
    this.converters = [];

    this.events = [];

    this.lastValue = null;

    this.guid = rockpool.getGUID();

    this.deleted = false;
    this.visible = true;
    this.parent = null;

    if( parent instanceof rockpool.rule ){
        this.parent = parent;
    }
    else if( parent )
    {
        this.start();
        this.deserialize(parent);
    }
}
