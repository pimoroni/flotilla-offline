var rockpool = rockpool || {};

rockpool.prompt = function(content, close_on_click){
    if( close_on_click == null || typeof( close_on_click ) === 'undefined' ){
        close_on_click = true;
    }
    $.fancybox.open({
        openEffect  : 'none',
        closeEffect : 'none',
        modal       : true,
        content     : content,
        width       : '100%',
        margin      : [0, 0, 0, 0],
        beforeClose : function(){
            $('.greyout').removeClass('greyout');
        },
        afterClose : function(){
            $('.greyout').removeClass('greyout');
        }
        //helpers     : {overlay : {locked : false}}
    });
    $('.palette').on('click','.close', function(){ $.fancybox.close(); });
    $('body').on('click', function(){

        if( close_on_click ){
            $.fancybox.close();
            $('body').off('click');
        }

    })
}

rockpool.closePrompt = function(){
    $('.active.selected').removeClass('selected');
    $.fancybox.close();
}

rockpool.refreshPalette = function(type){

    rockpool.refreshConnectedModules($('.palette.' + type).find('.connected-modules'), type);

}

rockpool.refreshConnectedModules = function(obj, type){

    var dock_id = 0;

    var dom_channels = obj.find('div.channels');
    if(!dom_channels.length){
        dom_channels = $('<div>').addClass('channels icon-palette pure-g').appendTo(obj);

        for(x = 0; x<8; x++){
            $('<div><i></i><span>').appendTo(dom_channels);
        }
    }

    //$('.active-' + type + 's li').removeClass('on');

    for(channel_index = 0; channel_index<8; channel_index++){
        var module = rockpool.getActiveModule(dock_id, channel_index);
        var dom_module = dom_channels.find('> div:eq(' + channel_index + ')');
        if(module === false || module.active === false){
            dom_module
                .attr('class','color-grey disabled')
                .find('i')
                .attr('class','');
            dom_module.find('span').text('');
            dom_module.find('.popup').remove();
        }
        else
        {
            dom_module
                .attr('class','color-grey')
                .data({
                    'type': type,
                    'channel': channel_index
                })
                .find('i')
                .attr('class','icon-' + module.icon);

            dom_module.find('span').text(module.title);

            if( (type === 'input' && module.input_count > 0)
            ||  (type === 'output' && module.output_count > 0)){

                dom_module
                    .attr('class','color-' + module.color + ' active');
                    
                //$('.active-' + type + 's').find(' li:eq(' + channel_index + ')').addClass('on');
            }
        }
    }


}

rockpool.refreshVirtualModules = function(obj, type){

    var dom_virtual = obj.find('div.virtual');
    if(!dom_virtual.length){
        dom_virtual = $('<div>').addClass('virtual icon-palette pure-g').appendTo(obj);
    }
    dom_virtual.find('div').remove();

    var collection = rockpool.inputs;
    if(type == 'output'){
        collection = rockpool.outputs;
    }

    for(key in collection){
        var item = collection[key];

        if(item.type && item.type == 'module') continue;

        if(typeof(item) === "function") item = new item;


        if(item.advanced && !rockpool.enable_advanced) continue;

        var dom_item = $('<div><i><img></i><span>')
            .data({
                'type': type,
                'key':key
            })
            .addClass('active above color-navy')
            .appendTo(dom_virtual);
        dom_item.find('i').addClass('icon-' + item.icon);
        dom_item.find('span').text(item.name);
        /*if(item.icon){
            dom_item.find('img').attr('src','css/images/icons/icon-' + item.icon + '.png');
        }*/
    }

}

rockpool.refreshConverters = function(obj){

    var dom_converters = obj.find('div.modify');

    if(!dom_converters.length){
        dom_converters = $('<div>').addClass('modify icon-palette pure-g').appendTo(obj);
    }
    dom_converters.find('div').remove();

    var last_color = null;

    for(key in rockpool.converters){
        if(key == "noop") continue;

        var converter = typeof(rockpool.converters[key]) === "function" ? new rockpool.converters[key] : rockpool.converters[key];

        if( last_color != null && converter.color != last_color ){
            $('<hr>').appendTo(dom_converters);
        }
        last_color = converter.color;

        var dom_item = $('<div><i><img></i><span>')
            .data({
                'key':key
            })
            .addClass('active')
            .appendTo(dom_converters);
        dom_item.find('i').addClass('icon-' + converter.icon);
        dom_item.find('span').text(converter.name);
        /*if(converter.icon){
            dom_item.find('img').attr('src','css/images/icons/icon-' + converter.icon + '.png');
        }*/
        dom_item.addClass('color-' + converter.color);

    }

}

rockpool.generatePalette = function(type){
    var dom_palette = $('.palette.' + type);

    if( dom_palette.length == 0 ){
        dom_palette = $('<div>').addClass('palette').addClass(type).appendTo('.palettes');
        $('<i>').addClass('close').appendTo(dom_palette);
    }

    if(type == 'input' || type == 'output'){

        var dom_connected_modules = $('<div>').addClass('connected-modules');
        rockpool.refreshConnectedModules(dom_connected_modules,type);
        dom_connected_modules.appendTo(dom_palette);

        var dom_virtual_modules = $('<div>').addClass('virtual-modules');
        rockpool.refreshVirtualModules(dom_virtual_modules,type);
        dom_virtual_modules.appendTo(dom_palette);

        return;
    }

    if(type == 'converter'){

        var dom_converters = $('<div>').addClass('modifiers');
        rockpool.refreshConverters(dom_converters);
        dom_converters.appendTo(dom_palette);

    }

}

rockpool.add = function(type, rule, index){
    var dom_palette = $('.palette.' + type);
    var callback = null;

    if(!dom_palette.length) return;

    dom_palette.find('.popup').hide();

    if(!(rule instanceof rockpool.rule)){
        if(typeof rule === "function"){
            callback = rule;
            rule = null;
        }
    }


    // Type is "input" or "output"
    dom_palette
    .off('click')
    .on('click','.modify .active', function(e){
        e.stopPropagation();

        var key = $(this).data('key');

        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
        rule.start();
        rule.setHandler(index,key);
        rockpool.closePrompt();
            if(typeof callback === "function") callback(rule);


    })
    .on('click','.virtual .active', function(e){
        e.stopPropagation();

        var key = $(this).data('key');
        var type = $(this).data('type');


        var collection = rockpool.inputs;
        if(type == 'output'){
            collection = rockpool.outputs;
        }

        var module = typeof(collection[key]) === "function" ? new collection[key] : collection[key];

        if(module.options
         && module.options.length > 0){
            // Needs configuration
            rockpool.virtualConfigureMenu($(this), type, rule, key, module, callback);
        }
        else
        {
            rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
            rule.start();
            rule.setHandler(type,key);
            rockpool.closePrompt();
            if(typeof callback === "function") callback(rule);
        }

    })
    .on('click','.channels .active', function(e){
        e.stopPropagation();

        var dock_id = 0;
        var channel_index = $(this).data('channel');
        var type = $(this).data('type');

        var module = rockpool.getActiveModule(dock_id, channel_index);


        if(module.needsConfiguration(type))
        {
            rockpool.moduleConfigureMenu($(this), type, rule, null, module, callback);
        }
        else
        {
            rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
            rule.start();
            var io_key =  type == 'input' ? module.firstInput().key : module.firstOutput().key;

            rule.setHandler(type,[module.key,io_key].join('_'));
            rockpool.closePrompt();
            if(typeof callback === "function") callback(rule);
        }
    });

    rockpool.prompt(dom_palette, true);
}

rockpool.converterConfigureMenu = function(target, rule, widget_index){
    var dom_popup = target.find('.popup.converter-config');

    var popup_close = function(){
        dom_popup.hide();
        target.removeClass('selected');
        $('body').off('click').removeClass('blackedout');
    }


    if(dom_popup.length == 0){

        var dom_popup = $('<div><ul>').addClass('popup converter-config').addClass(key).appendTo(target);

        var dom_menu = dom_popup.find('ul');

        $('<li>').text('change').addClass('change button').appendTo(dom_menu);
        $('<li>').text('remove').addClass('remove button').appendTo(dom_menu);

        dom_popup
        .on('click','.remove',function(e){
            e.stopPropagation();
            popup_close();
            rule.setHandler(widget_index,'noop');
        })
        .on('click','.change',function(e){
            e.stopPropagation();
            popup_close();
            rockpool.add('converter',rule,widget_index);
        });
    }

    $('.popup').hide();

    dom_popup.css('display','inline-block');

    target.addClass('selected');

    $('body').addClass('blackedout').on('click',function(){
        popup_close();
    });
  
}

rockpool.virtualConfigureMenu = function(target, type, rule, key, module, callback){

    var dom_popup = target.find('.popup.' + key);
    if(dom_popup.length == 0){

        var dom_popup = $('<div><ul>').addClass('popup').addClass(key).appendTo(target);

        var dom_menu = dom_popup.find('ul');

        for(var idx in module.options){

            var option = module.options[idx];

            if(option.ui == 'slider'){

                var dom_option = $('<li>')
                    .addClass('slider')
                    .data({
                        'key':key,
                        'idx':idx
                    })
                    .appendTo(dom_menu);

                var dom_slider = $('<div>').appendTo(dom_option);
                var dom_slider_label = $('<strong>').text(option.name).appendTo(dom_option);

                if(type == 'input'){
                    var percent = NaN;

                    if(rule && rule.getInput().handler.options[idx]){
                        percent = rule.getInput().handler.options[idx].value;
                    }
                    
                    if(!isNaN(percent)){
                       dom_option.data('value', percent);
                       dom_option.find('strong').text(Math.round(percent*100.0) + '%');
                       dom_option.find('div').css({width:Math.round(percent*100.0) + '%'});
                    }
                }

            }
            else
            {

                $('<li>')
                    .data({
                        'key':key,
                        'idx':idx
                    })
                    .addClass('option')
                    .text(option.name)
                    .appendTo(dom_menu);

            }

        }

    }

    function update_slider(e,obj){

        var slider_overscale = 1.2; // Ensure the slider reaches the edges of the bounding box before the cursor does

        var left = e.pageX - $(obj).offset().left;
        var width = $(obj).width();
        
        var offset_center = Math.min(left/width,1.0) - 0.5;
        var percent = Math.max(Math.min((offset_center * slider_overscale) + 0.5,1.0),0.0);

        var idx = parseInt($(obj).data('idx'));
        $(obj).data('value',Math.round(percent*1000.0) / 1000.0);

        $(obj).find('div').css({width:Math.round(percent*100.0) + '%'});

        var text = Math.round(percent*100.0) + '%';

        if(rule){
            text = rule.getInput().getFormattedValue(percent).split('<small>')[0];
            rule.getInput().handler.options[idx].value = percent;
        }

        $(obj).find('strong').html(text);
    }

    var slider = dom_popup.find('.slider');
    slider.find('span').remove();

    for(var x = 1; x < 10; x++){
        tick = $('<span>');
        tick.css({
            left:(slider.width()/10) * x
        });

        tick.appendTo(slider);
    }

    var popup_close = function(){
        dom_popup.hide();
        target.removeClass('selected');
        $('body').off('click').removeClass('blackedout');

        if(!target.hasClass('block')){
            $('body').on('click', function(){
                $.fancybox.close();
                $('body').off('click');
            });
        }
        
        if(typeof callback === "function") callback(rule);
    }

    $('.popup').hide();
    dom_popup
    .off('click')
    .off('mouseup')
    .off('mousemove')
    .off('mousedown')
    .off('mousewheel')
    .css('display','inline-block')
    .on('click','.slider',function(e){
        e.stopPropagation();
    })
    .on('mousedown','.slider',function(e){
        e.stopPropagation();

        $(this).data('sliding',true);

        update_slider(e,this);
    })
    .on('mousemove','.slider',function(e){
        e.stopPropagation();

        if(!$(this).data('sliding')) return;

        update_slider(e,this);
    })
    .on('mouseup','.slider',function(e){
        e.stopPropagation();

        $(this).data('sliding',false);

        var key = $(this).data('key');
        var idx = parseInt($(this).data('idx'));
        var value = $(this).data('value');

        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
        rule.start();
        rule.setHandler(type,key,idx,value);
        rockpool.closePrompt();
        popup_close();

    })
    .on('click','.option',function(e){
        e.stopPropagation();

        var key = $(this).data('key');
        var idx = parseInt($(this).data('idx'));

        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
        rule.start();
        rule.setHandler(type,key,idx);
        rockpool.closePrompt();
        popup_close();
    });

    if(target.hasClass('block')){
        target.addClass('selected');

        $('body').addClass('blackedout').on('click',function(){
            popup_close();
        });

        $('<li>').text('change').addClass('change button').prependTo(dom_menu);

        dom_popup.on('click','.change',function(e){
            e.stopPropagation();
            popup_close();
            rockpool.add(type,rule,target.index() - 2);

        });
    }
    else
    {

        var dom_palette = $('.palette.' + type);
        dom_palette.addClass('greyout').find('.selected').removeClass('selected');
        target.addClass('selected');

        dom_popup.css({'margin-left': -(dom_popup.width()/2) + 36});

        if(dom_popup.offset().left < 0){
            var margin = parseFloat(dom_popup.css('margin-left').replace('px',''));
            margin -= dom_popup.offset().left;
            dom_popup.css('margin-left', margin);
        }
        if(dom_popup.offset().left + dom_popup.width() > $(window).width()){
            var margin = parseFloat(dom_popup.css('margin-left').replace('px',''));
            margin += ($(window).width() - (dom_popup.offset().left + dom_popup.width()))
            dom_popup.css('margin-left', margin);
        }

        /*$('.fancybox-overlay').off('click').on('click',function(e){
            e.stopPropagation();
            e.preventDefault();
            popup_close();
            dom_palette.removeClass('greyout');
            $('.fancybox-overlay').off('click');
        })*/

        $('body').off('click').on('click',function(e){
            e.preventDefault();
            e.stopPropagation();
            popup_close();
            dom_palette.removeClass('greyout');
        })

    }


}

rockpool.moduleConfigureMenu = function(target, type, rule, index, module, callback){

    var options = module.getOptions(type);
    var dom_popup = target.find('.popup.' + module.key);

    var popup_close = function(){
        dom_popup.hide();
        target.removeClass('selected');
        $('body').off('click').removeClass('blackedout');

        if(!target.hasClass('block')){
            $('body').on('click', function(){
                $.fancybox.close();
                $('body').off('click');
            });
        }
        
        if(typeof callback === "function") callback(rule);
    }

    if(dom_popup.length == 0){

        var dom_popup = $('<div><ul>').addClass('popup').addClass(module.key).appendTo(target);

        var dom_menu = dom_popup.find('ul');

        for(var idx in options){
            var option = options[idx];

            $('<li>')
                .data({
                    'key':option.key,
                    'idx':option.option
                })
                .addClass('option')
                .text(option.title)
                .appendTo(dom_menu);
        }

    }

    $('.popup').hide();
    dom_popup.off('click').css('display','inline-block').on('click','.option',function(e){
        e.stopPropagation();

        var key = $(this).data('key');
        var idx = parseInt($(this).data('idx'));

        rule = rule instanceof rockpool.rule ? rule : new rockpool.rule();
        rule.start();
        rule.setHandler(type,key,idx);

        rockpool.closePrompt();
        popup_close();

    });

    if(target.hasClass('block')){
        target.addClass('selected');

        $('body')
        .addClass('blackedout')
        .on('click',function(){
            popup_close();
        });

        $('<li>').text('change').addClass('change button').appendTo(dom_menu);
            dom_popup.on('click','.change',function(e){
            e.stopPropagation();
            popup_close();
            rockpool.add(type,rule,target.index() - 2);
        });
    }
    else
    {
        var dom_palette = $('.palette.' + type);
        dom_palette.addClass('greyout').find('.selected').removeClass('selected');
        target.addClass('selected');

        dom_popup.css({'margin-left': -(dom_popup.width()/2) + 36});

        if(dom_popup.offset().left < 0){
            var margin = parseFloat(dom_popup.css('margin-left').replace('px',''));
            margin -= dom_popup.offset().left;
            dom_popup.css('margin-left', margin);
        }
        if(dom_popup.offset().left + dom_popup.width() > $(window).width()){
            var margin = parseFloat(dom_popup.css('margin-left').replace('px',''));
            margin += ($(window).width() - (dom_popup.offset().left + dom_popup.width()))
            dom_popup.css('margin-left', margin);
        }

        $('body').off('click').on('click',function(e){
            e.preventDefault();
            e.stopPropagation();
            popup_close();
            dom_palette.removeClass('greyout');
        })
    }
}


rockpool.updatePalettes = function() {
    rockpool.refreshPalette('input')
    rockpool.refreshPalette('output')
}
