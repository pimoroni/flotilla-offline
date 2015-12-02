var rockpool = rockpool || {};

rockpool.prompt = function(content, close_on_click){
    rockpool.closeModal();

    if( close_on_click = null || typeof( close_on_click ) === 'undefined' ){
        close_on_click = true;
    }
    $.fancybox.open({
        openEffect  : 'none',
        closeEffect : 'none',
        modal       : true,
        content     : content,
        width       : '100%',
        margin      : [10, 10, 10, 10],
        beforeClose : function(){rockpool.closeModal()}
        //helpers     : {overlay : {locked : false}}
    });
    $('.fancybox-overlay,.fancybox-wrap').on('click', function(){

        if( close_on_click ){
            if(!rockpool.closeModal()){
                $.fancybox.close()
            }
        }

    }).on('scroll',function () {
        rockpool.positionModal();
    })
}

rockpool.closePrompt = function(){
    $.fancybox.close();
}

rockpool.modal_activator = null
rockpool.modal_element = null
rockpool.modal = function(content){
    rockpool.closeModal();
    rockpool.modal_element = $('<div>').addClass('modal').append(content).append('<span class="arrow"></span>').hide();

    var icons = content.find('li').length

    rockpool.modal_element.data({
        offset_left: 0,
        offset_top: 0
    });

    if(icons > 0 && icons < 5){
        rockpool.modal_element.css({
            width:90*icons
        })
    }

    if($('.fancybox-outer').filter(':visible').length){
       rockpool.modal_element.appendTo('.fancybox-outer').fadeIn('fast');
    }
    else
    {
       rockpool.modal_element.appendTo('body').fadeIn('fast');
    }

    if ( rockpool.modal_element.parents().find('.fancybox-wrap').length ){
        var wrap = rockpool.modal_element.parents().find('.fancybox-wrap');

        rockpool.modal_element.data({
            offset_left: -wrap.offset().left,
            offset_top: -wrap.offset().top
        });
    }

    rockpool.positionModal();
}
rockpool.positionModal = function(){
    if(!rockpool.modal_element) return false;

    var arrow_width = 50;

    var overlay_top = $('.fancybox-lock .fancybox-overlay').scrollTop() ? $('.fancybox-lock .fancybox-overlay').scrollTop() : 0;

    var activator_top = rockpool.modal_activator.offset().top + overlay_top;

    var activator_left = rockpool.modal_activator.offset().left;

    //var content = rockpool.modal_element.first('div');

    //var icon_width = content.find('li').width();
    var activator_height = rockpool.modal_activator.height();
    var activator_width = rockpool.modal_activator.width();


    var height = rockpool.modal_element.height() + parseInt(rockpool.modal_element.css('border-width').replace('px','')) * 2;
    var width = rockpool.modal_element.width() + parseInt(rockpool.modal_element.css('border-width').replace('px','')) * 2;

    var window_width = $(window).width();
    var window_height = $(window).height();


    var offset_left = rockpool.modal_element.data('offset_left');
    var offset_top = rockpool.modal_element.data('offset_top');;
    /*

        Start by placing the dialogue box below

    */

    var pos_left = activator_left - (width/2) + (activator_width/2);
    var pos_top  = activator_top  + (activator_height) + (arrow_width/2);

    var arrow_left = (width/2) - (arrow_width/2);
    var arrow_top  = -arrow_width;

    var arrow_position = 'top';

    var margin = 20;


    // We will ALWAYS have room below to place this box, so never shift it to the sides
    if( pos_top + height + margin <= window_height ){
        // POSITION: BELOW

        if( pos_left + width + margin > window_width ){

            pos_left = window_width - width - margin;

        }else if( pos_left - margin < 0 ){

            pos_left = margin;
        }

        arrow_left = activator_left - pos_left + (activator_width/2) - (arrow_width/2);

    }
    // There's no room below, PANIC!!!! 
    else{
        
        pos_top = activator_top - 10;

        if( activator_left + activator_width + width + margin <= window_width ){
            // POSITION: RIGHT 
            pos_left = activator_left + activator_width + (arrow_width/2);
            arrow_position = 'left';
            arrow_left = -50;
            arrow_top  = activator_top - pos_top + (activator_height/2) - (arrow_width/2);  

        }else if( activator_left - margin - width > 0 ){
            // POSITION: LEFT 
            pos_left = activator_left - margin - width;
            arrow_position = 'right';
            arrow_left = width;
            arrow_top  = activator_top - pos_top + (activator_height/2) - (arrow_width/2);  

        }else{
            // AMAGAD IT WONT FIT ANYWHERE, WE'RE DOOMED!!!! 
            arrow_position = 'hidden'
        }

        if( rockpool.modal_activator.offset().top - 10 + height + margin > window_height ){
            pos_top = window_height - height - margin + overlay_top;
            arrow_top = activator_top- pos_top + (activator_height/2) - (arrow_width/2);  
        }

    }


    rockpool.modal_element.css({
        left: (offset_left + pos_left) + 'px',
        top: (offset_top + pos_top) + 'px'
    }).find('.arrow').css({
        left: arrow_left,
        top: arrow_top
    })
    .removeClass('left')
    .removeClass('right')
    .removeClass('top')
    .addClass(arrow_position);

    return true;


}
rockpool.closeModal = function(){
    if(!rockpool.modal_element) return false;
    rockpool.modal_element.fadeOut('fast',function(){$(this).remove();})
    rockpool.modal_element = null;
    return true;
}

rockpool.configureWidget = function(key, rule, type){

    var categories = {}
    var palette = $('<div class="palette">') //<header><h1>' + handler.name + '</h1></header></div>')
    var handler;
    
    switch(type){
        case 'input':
            handler = (typeof(rockpool.inputs[key]) === 'function') ? new rockpool.inputs[key] : rockpool.inputs[key];
            break;
        case 'output':
            handler = (typeof(rockpool.outputs[key]) === 'function') ? new rockpool.outputs[key] : rockpool.outputs[key];
            break;
    }

    if(handler.category){
        palette.addClass(handler.category.toLowerCase())
    }
    
    for(var idx in handler.options){
        var opt = handler.options[idx]
        if( !categories[opt.category] ) categories[opt.category] = $('<div><h2>' + rockpool.languify(opt.category) + '</h2><ul></ul></div>').appendTo(palette)
        var d = $('<li><span class="icon"><img src=""></span><span class="label">' + rockpool.languify(opt.name) + '</span></li>').data('seq', idx)

        var bgColor = opt.bgColor ? opt.bgColor : handler.bgColor;
        var icon = opt.icon ? opt.icon : handler.icon;

        if(opt.type){d.addClass(item.type)}
        if(bgColor){d.find('.icon').css({color:bgColor}) }
        if(icon){d.find('img').attr('src',icon)}else{d.find('img').remove()}

        d.appendTo(categories[opt.category].find('ul'))
    }

    rockpool.modal(palette)

    palette.on('click','li',function(){
        var option = parseInt($(this).data('seq'))
        rockpool.closeModal()
        $.fancybox.close()

        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule()
        rule.start();

        switch(type){
            case 'input':
                rule.setInputHandler(key, option);
                break;
            case 'output':
                rule.setOutputHandler(key, option);
                break;
            case 'converter':

                break;
        }
     

        //rockpool.redraw()
        //rule.render()
    })
}

rockpool.generatePalette = function(type){

    var list = $('.palette.' + type);

    if( list.length == 0 ){
        var title = (type == 'input') ? 'Inputs' : ((type == 'output') ? 'Outputs' : 'Converters')
        list = $('<div><header><h1>' + rockpool.languify(title) + '</h1></header>').addClass('palette').addClass(type).appendTo('.palettes')
    }

    list.find('div').remove()

    var categories = {}

    switch(type){
        case 'input':
            var collection = rockpool.inputs;
            break;
        case 'output':
            var collection = rockpool.outputs;
            break;
        case 'converter':
            var collection = rockpool.converters;
            break;
    }

    for(var k in collection){
        var item = (typeof(collection[k]) === 'function') ? new collection[k] : collection[k]
        var d = $('<li data-key="' + k + '"><span class="icon"><img src=""></span><span class="label">' + rockpool.languify(item.name) + '</span></li>')

        var channel = (item.channel != null) ? item.channel : -1;

        var active = (item.type == "module") ? item.active : true;


        if(!active) continue

        if(item.options){d.addClass('hasOptions')}
        if(item.type){d.addClass(item.type)}
        if(item.bgColor){d.find('.icon').css({color:item.bgColor}) }
        if(item.icon){d.find('img').attr('src',item.icon)}else{d.find('img').remove()}

            var category = item.category ? item.category : 'General'

        if(!categories[channel]){ categories[channel] = {} }

        if(!categories[channel][category]){
            var channel_label = channel > -1 ? '<span>' + item.channel + '</span>' : ''
            categories[channel][category] = $('<div><h2>' + channel_label + rockpool.languify(category) + '</h2><ul></ul></div>').addClass(item.type).addClass(category.toLowerCase()).appendTo(list)
        }

        d.appendTo(categories[channel][category].find('ul'))
    }

}

rockpool.add = function(type, rule, index){
	switch(type){
        case 'tool':
            var categories = {}

            var list = $('<div><h1>Tools</h1>').addClass('palette')

            for( var k in rockpool.tools ){
                var tool = new rockpool.tools[k]
                var d = $('<li data-key="' + k + '"><span class="icon"><img src=""></span><span class="label">' + k + '</span></li>')
                if(tool.bgColor){d.find('.icon').css({color:tool.bgColor}) }

                if(!categories[tool.category]){

                    var channel_title = tool.category? '<h2>' + rockpool.languify(tool.category) + '</h2>' : ''
                    categories[tool.category] = $('<div>' + channel_title + '<ul></ul></div>').appendTo(list)

                }

                categories[tool.category].find('ul').append(d)
            }

            rockpool.prompt(list)

            list.on('click','li',function(){
                $.fancybox.close()
                $(this).parent().remove()
                rockpool.tool($(this).data('key'))
            })

        break;
        case 'input':
        case 'output':
        case 'converter':

            var list = $('.palettes .palette.' + type).off('click');

            rockpool.prompt(list)

            list.on('click','ul',function(e){
                e.preventDefault()
                e.stopPropagation();
            })

            if( type == 'input' ){
                list.on('click','li',function(){

                    rockpool.modal_parent = list;
                    rockpool.modal_activator = $(this);

                    var k = $(this).data('key')

                    var handler = (typeof(rockpool.inputs[k]) === 'function') ? new rockpool.inputs[k] : rockpool.inputs[k];

                    if(handler.options){
                        rockpool.configureWidget(k,rule,type)
                    }
                    else{
                        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule()
                        rule.start();
                        rule.setInputHandler(k)
                        $.fancybox.close()
                    }
                })
            }else if (type == 'output'){
                list.on('click','li',function(){

                    rockpool.modal_parent = list;
                    rockpool.modal_activator = $(this);

                    var k = $(this).data('key')

                    var handler = (typeof(rockpool.outputs[k]) === 'function') ? new rockpool.outputs[k] : rockpool.outputs[k];

                    if(handler.options){
                        rockpool.configureWidget(k,rule,type)
                    }
                    else{
                        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule()
                        rule.start();
                        rule.setOutputHandler(k)
                        $.fancybox.close()
                    }
                })
            }else{
                list.on('click','li',function(){
                    var k = $(this).data('key')
                    $.fancybox.close()

                    rule = rule instanceof rockpool.rule ? rule : new rockpool.rule()
                    rule.start();
                    var widget_index = typeof(index) === 'number' ? index - 2 : Math.floor(rule.converter_count/2);
                    //(typeof(rockpool.converters[k]) === 'function') ? new rockpool.converters[k] : rockpool.converters[k]
                    rule.setHandler(widget_index, k)
                })
            }
        break;
    }
}


rockpool.updatePalettes = function() {

    var inputs = {}

    // Update inputs
    for(var k in rockpool.inputs){
        var input = (typeof(rockpool.inputs[k]) === 'function') ? new rockpool.inputs[k] : rockpool.inputs[k]

        if( input.type != 'variable' && (input.type != 'module' || input.active) ){

            var category = input.type === 'module' ? input.module_type : input.category;

            if( typeof(inputs[ category ]) != "number" ){ inputs[ category ] = 0 }

            inputs[ category ] += 1
        }
    }

    var outputs = {}

    // Update outputs
    for(var k in rockpool.outputs){
        var output = (typeof(rockpool.outputs[k]) === 'function') ? new rockpool.outputs[k] : rockpool.outputs[k]

        if( output.category != 'General' && output.type != 'variable' && (output.type != 'module' || output.active) ){

            var category = output.type === 'module' ? output.module_type : output.category;

            if( typeof(outputs[ category ]) != "number" ){ outputs[ category ] = 0 }

            outputs[ category ] += 1
        }
    }

    var converters = {}

    // Update converters
    for(var k in rockpool.converters){
        var output = (typeof(rockpool.converters[k]) === 'function') ? new rockpool.converters[k] : rockpool.converters[k]

        if( output.type != 'variable' && k != 'noop' ){
            if( typeof(converters[ output.category ]) != "number" ){ converters[ output.category ] = 0 }

            converters[output.category] += 1
        }
    }

    //console.log(inputs,outputs)

    //console.log('Updating counts...');

    var addInput = $('.add-input h2 .counts');
    if( addInput.length == 0 ){
        addInput = $('<div class="counts"></div>').appendTo('.add-input h2')
    }
    addInput.find('i').remove()
    for( var k in inputs ){
        $('<i>').addClass('sprite sprite-icon-add-input')
        .addClass(k.toLowerCase())
        .text(inputs[k])
        .appendTo(addInput)
    }

    var addOutput = $('.add-output h2 .counts');
    if( addOutput.length == 0 ){
        addOutput = $('<div class="counts"></div>').appendTo('.add-output h2')
    }
    addOutput.find('i').remove()
    for( var k in outputs ){
        $('<i>').addClass('sprite sprite-icon-add-output')
        .addClass(k.toLowerCase())
        .text(outputs[k])
        .appendTo(addOutput)
    }

    var addConverter = $('.add-converter h2 .counts');
    if( addConverter.length == 0 ){
        addConverter = $('<div class="counts"></div>').appendTo('.add-converter h2')
    }
    addConverter.find('i').remove()
    for( var k in converters ){
        $('<i>').addClass('sprite sprite-icon-add-' + k.toLowerCase().slice(0,-1))
        .addClass(k.toLowerCase())
        .text(converters[k])
        .appendTo(addConverter)
    }

    rockpool.generatePalette('input')
    rockpool.generatePalette('output')

}
