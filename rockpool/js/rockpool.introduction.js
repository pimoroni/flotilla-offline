var rockpool = rockpool || {};

rockpool.on_connect = function(){
    $('.palettes .palette.converter .deciders').hide();
    $('.palettes .palette.output .variables').hide();
    $('.palettes .palette.input .variables').hide();

    $('.palettes .palette.input > div.module').hide();
    $('.palettes .palette.output > div.module').hide();

    setTimeout(function(){

        rockpool.rules[0].input.tooltip('<p>Click to add an input!<br /><small>Inputs give us a signal to play with.</small></p>');

    }, 500);


    rockpool.rules[0].addEventHandler('on_set_input_handler',function(rule){
        setTimeout(function(){

            rule.output.tooltip("<p>Now, click to add an output!<br /><small>This is where we'll send our signal!</small></p>");

        }, 500);
    });

    rockpool.rules[0].addEventHandler('on_set_output_handler',function(rule){
        setTimeout(function(){

            rule.converters[1].tooltip("<p>Finally, add a converter!<br /><small>These can change our signal in some way.</small></p>");

        }, 500);
    });

    rockpool.rules[0].addEventHandler('on_set_converter1_handler',function(rule){
        rule.addEventHandler('on_set_converter1_handler',function(rule){

            rule.clearEventHandler('on_set_converter1_handler');
            setTimeout(function(){
                rule.getConverter(1).child.input.tooltip('<p>Now feed in another signal!</p>');
            }, 500);
        });
        setTimeout(function(){

            $('.palettes .palette.converter .converters').hide();
            $('.palettes .palette.converter .deciders').show();
            rule.converters[1].tooltip("<p>Great! Now let's try something more advanced.<br /><small>Add a decider...</small></p>");

        }, 500);
    });
}