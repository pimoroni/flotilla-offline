var rockpool = rockpool || {};

rockpool.rule = function (parent, widget_index) {

    this.deserialize = function(source){

        if( typeof(source) === 'string' ){
            source = JSON.parse(source);
        }

        this.setInputHandler( source.input.key, source.input.option > -1 ? source.input.option : null );

        for(var x = 0; x < source.converters.length; x++){

            this.setHandler(x, source.converters[x].key);

        }

        if( !this.getOutput().isComparator() ){

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
            input: {  
                key:    this.input.handler_key,
                option: this.input.option_index
            },
            output:{ 
                key:    this.output.handler_key,
                option: this.output.option_index
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
    */
    this.setHandler = function(idx, key){
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

    this.setInputHandler = function(key, option) {

        this.getInput().setHandler(key);

        if( typeof( option ) === "number" ){
            this.getInput().setOptions(option);
        }
        else
        {
            this.getInput().options = null
        }
        this.getInput().update()
        if(typeof(this.getInput().handler.init) === 'function'){
            this.getInput().handler.init(this)
        }
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
        if( typeof(option) === "number" ){
            output.setOptions(option);
        }
        else
        {
            output.options = null
        }
        output.update()
        this.render();

        this.runEventHandler('on_set_output_handler');
    }

    this.getInput = function() {return this.input}

    this.getOutput = function() {return this.output}

    this.getConverter = function(idx) {return this.converters[idx]}

    this.updateLabels = function() {
        this.getInput().update();
        this.converters.forEach(function(converter, idx){
                converter.update();
            }
        )
        // Avoid recursion!
        if( !this.getOutput().isComparator() ){
            this.getOutput().update();
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

    this.render = function () {
        if( this.deleted ) return false;
        if( !this.dom )
        {
            if( !(this.parent instanceof rockpool.rule) ){
                rockpool.rules.push(this);
            }

            this.group = this.isChild() ? this.parent.group : $('<span class="rulegroup">').appendTo('#rules');

            this.dom = $('<div class="rule pure-g">');

            this.dom.data('obj',this);

            this.dom_enabled = $('<div class="pure-u-1-12 center block toggle"></div>').appendTo(this.dom);

            this.input = this.input ? this.input : new rockpool.widget( 'input', this, 'low' )
            var i = this.converter_count
            while(i--){
                this.addConverter('noop')
            }
            this.output = this.output ? this.output : new rockpool.widget( 'output', this, 'none' )

            if( !this.isChild() ){
                this.dom_delete =  $('<div class="pure-u-1-12 center block delete"></div>').appendTo(this.dom)
                $('<i class="sprite sprite-channel-on"></i>').appendTo(this.dom_enabled);
                $('<i class="sprite sprite-channel-delete"></i>').appendTo(this.dom_delete);
            }

            if( this.isChild() ){

                var potential_position = this.parent.dom;
                var skip = this.widget_index;

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

                this.dom_delete.on('click',function(){
                    var rule = $(this).parent().data('obj') || $(this).parent().parent().data('obj') ;
                    rule.kill();
                })

                this.dom_enabled.on('click',function(){
                    var rule = $(this).parent().data('obj') || $(this).parent().parent().data('obj') ;
                    rule.toggle();
                })
            }
            this.respond();
        }

        this.updateLabels();
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

    this.start = function(){
        this.render();
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