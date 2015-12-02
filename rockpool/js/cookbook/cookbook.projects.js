var projects = projects || {};

/*
 TODO: Allow requirements to be satisfied on any port
*/

var project = function(init){

    this.requires = this.requires || {};

    this.fn_loop = null;
    this.fn_setup = null;
    this.is_setup = false;
    this.tick_length = 1000;

    this.add_requirement = function(port,code){
        this.requires[port] = code;
    }

    this.on = function(port,code,event,fn){
        this[[code,port,event].join('_')] = fn;
    }

    this.loop = function(fn){
        this.fn_loop = fn;
    }

    this.setup = function(fn){
        this.fn_setup = fn;
    }

    this.run_loop_fn = function(modules){
        if( !this.is_setup && typeof( this.fn_setup ) === 'function' ){
            this.fn_setup.apply(this, modules);
            this.is_setup = true;
        }
        if( typeof( this.fn_loop ) === 'function' ){
            this.fn_loop.apply(this, modules);
        }
    }

    this.get = function(port,code){
        if (typeof(port) == "string"){
            code = port;
            port = 0;
            for( i in this.requires ){
                if( this.requires[i] == code ){
                    port = i;
                    break;
                }
            }
            return get_module(port, code);
        }
        else
        {
            return get_module(port, code);
        }
    }

    init.apply(this);

    return this;
}

projects['Slider-n-Number'] = new project(function(){
    this.add_requirement(6,'slider');
    this.add_requirement(7,'number');

    this.on(6, 'slider', 'change', function(my_slider){

        this.get('number').number = my_slider.position * 10;

    });

    this.loop(function(modules){
        // Do nothing
    })
})

/*
{
    'requires': {
        0:'slider',
        4:'switch'
    },

    'slider_0_change': function(my_slider){
        get_module(4,'switch').r = my_slider.position;
        get_module(5,'number').number = my_slider.position;
        get_module(2,'motor').speed = (0.5 - my_slider.position)*2;
    },
    'switch_4_change': function(my_switch){
        my_switch.g = my_switch.button;
    },
    'loop': function(modules){
        if( modules[4] ) {
            modules[4].b = Math.abs(Math.sin(millis()/1000));
        }
    }
}
*/

function similar(a, b, separation){
    if( a >= b-separation && a <= b+separation ){
        return true;
    }
    return false;
}

projects['Digi-Pet'] = new project(function(){

    this.modes = {
        'normal': 0, // Will roam around freely
        'hungry': 1, // Will ask for a random fruit, show something of same colour
        'toilet': 2, // Will go to the toilet, tap to clean up, or plug in a slider and sweep back-n-forth
        'game':   3, // Playing hide and seek 
    }

    this.foods = [
        {'name':'apple', 'compare':function(r,g,b){
            if( r > g && r > b ){
                return true; // Red apple?
                console.log( 'Red apple! ' );
            }
            if( g > r && g > b ){
                return true; // Green apple?
                console.log( 'Greeeeen apple! ' );
            }
            return false;
        }},
        {'name':'orange', 'compare':function(r,g,b){
            if( r > g && r > b ){
                console.log( 'Oraanngeeee! ' );
                return true;
            }
            return false;
        }},
        {'name':'bannana','compare':function(r,g,b){
            if( r > b && g > b && similar(r,g,10) ){
                console.log( 'Bannanananan! ' );
                return true; // Kinda yellow?
            }
            return false;
        }}
    ];

    this.alive      = false
    this.mode       = this.modes['normal'];
    this.mode_start = 0

    this.age        = 0
    this.hunger     = 0
    this.weight     = 0
    this.happy      = 0
    this.clean      = 0
    this.health     = 0

    this.poo        = false
    this.poo_x      = 0
    this.poo_y      = 0

    this.max_stat   = 10


    this.start_time = 0;
    this.ticks      = 0;

    this.food       = null;
    this.wants_food = null;


    this.add_requirement(7, 'number');
    this.add_requirement(6, 'slider');
    this.add_requirement(4, 'colour');

    this.fail = function(){
        if( this.health <= 0 ){
            this.alive = false
        }
    }

    this.grow = function(){

        //if( this.weight <= 0 ) this.adjust_health(-1);
        //if( this.happy  <= 0 ) this.adjust_health(-1);
        //if( this.clean  <= 0 ) this.adjust_health(-1);

        if( this.hunger >= this.max_stat * 0.9 ) this.adjust_health(-2);

        // Overweight or malnourished equals bad health
        if( this.weight == 0 || this.weight > this.max_stat*0.8 ) this.adjust_health(-1);

        // Good health equals happiness
        if( this.health > this.max_stat*0.8) this.adjust_health(1);

        // Sadness equals bad health
        if( this.happy == 0 ) this.adjust_health(-1);

        // Dirtyness equals bad health and happiness
        if( this.clean == 0 ) {
            this.adjust_health(-1);
            this.adjust_happy(-1);
        }

        this.age++;
        this.adjust_weight(1);
        this.adjust_happy(-1);
        this.adjust_hunger(2);

        this.fail();

    }

    this.tick = function(){


        this.ticks++;

        //console.log('mode', this.mode, this.modes['normal']);

        switch( this.mode ){
            case this.modes['normal']:
                var dir_switch = random(1,5);
                //console.log('dir_switch',dir_switch);
                if( dir_switch == 1 ){

                    //console.log('Changing direction!');
                    this.pet_x_dir = random(-1,1);
                    this.pet_y_dir = random(-1,1);

                }

                if( this.food && this.ticks % 2 ){
                    this.feed();
                }

                var mode_switch = random(1,15);
                console.log('mode switch:',mode_switch);
                switch( mode_switch ){
                    case 1:
                    case 2:
                    case 3:
                        if( this.hunger > 3 ){
                            this.mode = this.modes['hungry'];
                        }
                        break;
                    case 6:
                        if( this.hunger < 3 ){
                            this.mode = this.modes['toilet'];
                        }
                        break;
                }

                // Hunger and happiness entropy over time
                if( this.ticks % 10 == 0 && random(0,1) ){

                    this.adjust_hunger(1);
                    this.adjust_happy(-1);

                    if( this.poo ){
                        this.adjust_clean(-1);
                    }

                    // Overweight, eek!
                    if( this.weight == this.max_stat ){
                        this.adjust_health(-1);
                    }

                }
                break;
            case this.modes['toilet']:

                if( this.poo ){
                    this.mode = this.modes['normal'];
                    break;
                };


                if( this.mode_start == 0 ){
                    this.mode_start = millis();

                    this.adjust_hunger(1);
                    this.adjust_happy(1);

                    this.pet_x_dir = 0;
                    this.pet_y_dir = 0;
                }

                console.log('STRAIN!!!!');

                if( millis() - this.mode_start > 1000 ){ 

                    console.log('PLOP!');

                    this.poo   = true;
                    this.poo_x = this.pet_x;
                    this.poo_y = this.pet_y;

                    this.mode  = this.modes['normal'];

                }

                break;
            case this.modes['hungry']:

                if( this.mode_start == 0 ){
                    this.mode_start = millis();
                    // Setup this mode

                    this.pet_x_dir = 0;
                    this.pet_y_dir = -1;

                    // Hungry hungry hippo!
                    this.adjust_hunger(1);


                    this.wants_food = random(0,this.foods.length);
                    console.log('I WANT A ' + this.foods[this.wants_food].name);

                    console.log('HUNGRY!');
                }

                if( this.pet_y > 10 ){
                    this.pet_y_dir == 0;
                }
                console.log('FEED ME!');


                if( this.food != null ){
                    this.mode = this.modes['normal'];
                    this.adjust_hunger(-2);
                    this.mode_start = 0;
                    this.food = null
                }

                    // Successful feeding in this mode counts for 2 hunger instead of 1


                if( millis() - this.mode_start > 30000 ){ // 30 seconds
                    this.mode_start = 0;
                    this.mode = this.modes['normal'];

                    // Eep, we didn't feed the poor soul
                    // Extra hunger ensues!
                    this.adjust_hunger(1);

                    console.log('END HUNGRY!');
                }

                break;
        }

        if( this.ticks == 120 ){
            this.grow();
            this.ticks = 0;
        }

        /*console.log([
            '<3',this.happy,
            'HP',this.health,
            'Hunger',this.hunger,
            'Clean',this.clean,
            'Weight',this.weight,
            'Age',this.age
        ].join(" : "));*/

        this.update_bar('health',this.health);
        this.update_bar('hunger',this.hunger);
        this.update_bar('clean',this.clean);
        this.update_bar('weight',this.weight);
        this.update_bar('happy',this.happy);
        this.update_bar('age',this.age);
    }

    this.update_bar = function(bar,value){
        this.bars.find('.'+bar).css('width',Math.round(100*(value/10)) + '%');
    }

    this.adjust_weight = function(val){
        this.weight += val;
        if( this.weight < 0  ) this.weight = 0;
        if( this.weight > this.max_stat ) this.weight = this.max_stat;
    }

    this.adjust_happy = function(val){
        this.happy += val;
        if( this.happy < 0  ) this.happy = 0;
        if( this.happy > this.max_stat ) this.happy = this.max_stat;
    }

    this.adjust_hunger = function(val){
        this.hunger += val;
        if( this.hunger < 0  ) this.hunger = 0;
        if( this.hunger > this.max_stat ) this.hunger = this.max_stat;
    }

    this.adjust_clean = function(val){
        this.clean += val;
        if( this.clean < 0  ) this.clean = 0;
        if( this.clean > this.max_stat ) this.clean = this.max_stat;
    }

    this.adjust_health = function(val){
        this.health += val;
        if( this.health < 0  ) this.health = 0;
        if( this.health > this.max_stat ) this.health = this.max_stat;
    }

    this.play = function(){

        // Playing promotes happiness and weight loss
        this.adjust_happy(1);
        this.adjust_weight(-1);
        this.adjust_hunger(1);

    }

    this.snack = function(){

        // Snacking promotes weight gain & happiness
        this.adjust_weight(1);
        this.adjust_happy(1);

    }

    this.feed = function(){

        // Feeding promotes weight gain
        this.adjust_hunger(-1);
        this.adjust_weight(1);

    }

    this.medicine = function(){

        if( this.health < 10 ){
            this.health += 1;
        }

    }

    this.last_sweep_position = 0;
    this.sweeps = 0;


    this.fn_sweep = function(my_dial){

        console.log(my_dial.position);

        var p = my_dial.position;

        if( this.poo ){

            if( p == 0 && this.last_sweep_position == 1 ){
                console.log('SWEEEP!!!!');
                this.sweeps++;
                this.last_sweep_position = 0;
            }
            if( p == 1 ){
                this.last_sweep_position = 1;
            }

            if( this.sweeps > 3 ){
                console.log('ALL GONE!!!');
                this.poo = false;
                this.adjust_clean(1);
                this.dom.find('.poop').fadeOut('slow');
                this.sweeps = 0;
            }

        }
        else
        {
            if( p == 0 && this.last_sweep_position == 1 ){
                this.medicine();
            }
            if( p == 1 ){
                this.last_sweep_position = 1;
            }

        }



    };

    this.on(3, 'dial', 'change', this.fn_sweep);

    this.on(6, 'slider', 'change', this.fn_sweep);

    this.on(1, 'switch', 'change', function(my_switch){

        console.log("BUTTON!!!", my_switch.button);

    });

    this.on(4, 'colour', 'change', function(){

        var r = Math.round( this.get('colour').r * 255 );
        var g = Math.round( this.get('colour').g * 255 );
        var b = Math.round( this.get('colour').b * 255 );

        if( this.foods[2]['compare'](r,g,b) ){
            this.food = this.foods[2]['name'];
        }

        if( this.bars ){
            this.bars.find('.color').css({
                backgroundColor:'rgb(' + [r,g,b].join(',') + ')',
                width:'100%'
            });
        }

    });

    this.loop(function(modules){
        var now_time = millis();

        //console.log(this.dom.is(':visible'));

        this.pet_x += this.pet_x_dir;
        this.pet_y  += this.pet_y_dir;

        if( this.pet_x > this.pet_max_x ){
            this.pet_x = this.pet_max_x;
            this.pet_x_dir *= 1;
        }
        if( this.pet_x < 0 ){
            this.pet_x = 0;
            this.pet_x_dir *= 1;
        }

        if( this.pet_y > this.pet_max_y ){
            this.pet_y = this.pet_max_y;
            this.pet_y_dir *= 1;
        }
        if( this.pet_y < 0 ){
            this.pet_y = 0;
            this.pet_y_dir *= 1;
        }

        if( this.poo ){

            var poop = this.dom.find('.poop');

            if( poop.length == 0 ){
                poop = $('<div>').addClass('poop').appendTo(this.dom).css({
                    position:'absolute',
                    display:'block',
                    background:'#91450E'
                });
            }

            //console.log('Poo size: ',Math.round(40 - ( 10 * (this.poo_x / this.pet_max_y) ) ) );
            poop.fadeIn().css({
                left:this.poo_x,
                bottom:this.poo_y,
                width:Math.round(20 - ( 5 * (this.poo_y / this.pet_max_y) ) ) + 'px',
                height:Math.round(20 - ( 5 * (this.poo_y / this.pet_max_y) ) ) + 'px'
            });

        }
        
        console.log(this.pet_y,this.pet_y/this.pet_max_y);
        this.pet_size = 1.0 - ( 0.2 * (this.pet_y / this.pet_max_y) );

//(0.3 * (this.age / 20)) -

        this.pet.css({
            transform:"translate(" + this.pet_x + "px,-" + this.pet_y + "px) scale(" + this.pet_size + ")"
        });

        if (now_time - this.last_tick >= this.tick_length){
            this.tick();
            this.last_tick = now_time;
        }

        this.get('number').number = this.health/10;
    });

    this.setup(function(){
        this.pet_max_x = 690;
        this.pet_max_y = 80;

        this.pet_x_dir = 1;
        this.pet_y_dir = 1;

        this.pet_x = 400;
        this.pet_y = 0;

        this.pet_size = 1.0; //0.5 + (0.4 * (this.age / 20)) - ( (this.pet_y / this.pet_max_y) * 0.4 );


        this.dom = $('<div>').css({
            width:800,
            height:566,
            background:"url('css/recipe/projects/pet/backdrop.png')",
            backgroundSize:'800px 566px'
        });
        this.pet = $('<div>').css({
            position:'absolute',
            left:0,
            bottom:0,
            width:113,
            height:134,
            transition:'0.2s all',
            background:"url('css/recipe/projects/pet/character.png')",
            backgroundSize:'113px 134px',
            transformOrigin:'bottom left',
            transform:"translate(" + this.pet_x + "px,-" + this.pet_y + "px) scale(" + this.pet_size + ")"
        }).appendTo(this.dom);
        $('<div>')
            .addClass('close')
            .on('click',function(){$.fancybox.close()})
            .css({
                position:'absolute',
                right:15,
                top:12,
                width:46,
                height:46,
                borderRadius:'50%',
                cursor:'pointer'
            })
            .appendTo(this.dom);
        bar_css = {display:'block',height:20,backgroundColor:'rgba(255,255,255,0.9)'};
        this.bars = $('<div>')
            .css({width:200})
            .appendTo(this.dom)
            .append($('<div>').css(bar_css).addClass('health').text('HP'))
            .append($('<div>').css(bar_css).addClass('hunger').text('Hunger'))
            .append($('<div>').css(bar_css).addClass('clean').text('Clean'))
            .append($('<div>').css(bar_css).addClass('happy').text('Happy'))
            .append($('<div>').css(bar_css).addClass('weight').text('Weight'))
            .append($('<div>').css(bar_css).addClass('age').text('Age'))
            .append($('<div>').css(bar_css).addClass('color').text('Color'));
        prompt(this.dom, false);
        this.alive  = true
        this.hunger = 0
        this.happy  = 5
        this.age    = 1
        this.clean  = 5
        this.weight = 1
        this.health = 5
        this.last_tick = this.start_time = millis();
    })

});