var rockpool = rockpool || {};

/*
 w = 87  u = 38
 s = 83  d = 40
 a = 65  l = 37
 d = 68  r = 39
*/

rockpool.time = 0;

rockpool.pressed={
    87: false,
    83: false,
    65: false,
    68: false,
    38: false,
    40: false,
    37: false,
    39: false
};

rockpool.inputs = {
    none: function () {
        this.name = "None"
        this.icon = "add"
        this.color = "red"

        this.category = rockpool.category.general
        this.get = function ( options ) { return 0 }
    },
    state: function() {
        this.name = "Value"
        this.icon = "value"
        this.color = "navy"

        this.options = [
                //{name:'Off',     value: 0.0, icon: "off" },
                {name:'Percentage', value: 0.5, ui: 'slider' },
                //{name:'On',      value: 1.0, icon: "on" }
            ]

        this.setValue = function(option,value){
            this.options[option].value = parseFloat(value);
        }

        this.raw = function(option, value){
            return (Math.round(value*100)) + '%';
        }

        this.getValue = function(option){
            return this.options[option].value;
        }

        this.get = function ( options ) {
            return (options && options.value) ? options.value : 0
        }
    },
    time: function() {
        this.name = "Time"
        this.sindex = 0;
        this.icon = "clock"
        this.color = "navy"
        this.advanced = true

        this.options = [
            {name:'Seconds'},
            {name:'Minutes'},
            {name:'Hours'}
        ];

        this.raw = function(){
            return new Date().toLocaleTimeString();
        }

        this.get = function(options){
            var type = ( options && options.name ) ? options.name : this.options[0].name;

            var d = new Date();

            switch(type){
                case 'Seconds':
                    return d.getSeconds() / 59;
                case 'Minutes':
                    return d.getMinutes() / 59;
                case 'Hours':
                    return d.getHours() / 23;

            }
        }
    },
    random: function() {
        this.name = "Random"
        this.sindex = 0;
        this.icon = "random"
        this.color = "navy"

        this.value = 0;
        this.lastSin = 0;

        this.options = [
            {name:'Slow', frequency:0.06},
            {name:'Medium', frequency:0.12},
            {name:'Fast', frequency:0.24},
            {name:'Custom', frequency:0.12, ui:'slider'}
        ];

        this.frequency = 0;
        this.phase = 0.0;

        this.getValue = function(option){
            return this.options[option].frequency;
        }

        this.setValue = function(option,value){
            this.options[option].frequency = parseFloat(value);
        }

        this.get = function(options){

            var time = rockpool.time;

            var frequency = ( options && options.frequency ) ? options.frequency : this.options[0].frequency;

            if(frequency != this.frequency){
                var c = (time * this.frequency + this.phase) % (2.0 * Math.PI);
                var n = (time * frequency) % (2.0 * Math.PI);

                this.phase = c - n;
                this.frequency = frequency;
            }

            var sin = ((Math.sin(time * this.frequency + this.phase) + 1.0) / 2.0);

            if (sin > 0.5 && this.lastSin <= 0.5 || sin <= 0.5 && this.lastSin > 0.5) {
                this.value = Math.random();
                this.lastSin = sin;
            }

            return this.value;

        }
    },
    wave: function() {
        this.name = "Wave"
        this.sindex = 0;
        this.icon = "sine"
        this.color = "navy"

        this.options = [
            {name:'Slow', frequency:0.06},
            {name:'Medium', frequency:0.12},
            {name:'Fast', frequency:0.24},
            {name:'Custom', frequency:0.12, ui:'slider'}
        ];

        this.frequency = 0;
        this.phase = 0.0;

        this.getValue = function(option){
            return this.options[option].frequency;
        }

        this.setValue = function(option,value){
            this.options[option].frequency = parseFloat(value);
        }

        this.get = function(options){

            var time = rockpool.time;

            var frequency = ( options && options.frequency ) ? options.frequency : this.options[0].frequency;

            if(frequency != this.frequency){
                var c = (time * this.frequency + this.phase) % (2.0 * Math.PI);
                var n = (time * frequency) % (2.0 * Math.PI);

                this.phase = c - n;
                this.frequency = frequency;
            }

            return (Math.sin(time * this.frequency + this.phase) + 1.0) / 2.0;

        }
    },
    square: function() {
        this.name = "Square"
        this.sindex = 0;
        this.icon = "square"
        this.color = "navy"

        this.options = [
            {name:'Slow', frequency:0.06},
            {name:'Medium', frequency:0.12},
            {name:'Fast', frequency:0.24},
            {name:'Custom', frequency:0.12, ui:'slider'}
        ];

        this.frequency = 0;
        this.phase = 0.0;

        this.getValue = function(option){
            return this.options[option].frequency;
        }

        this.setValue = function(option,value){
            this.options[option].frequency = parseFloat(value);
        }

        this.get = function(options){

            var time = rockpool.time;

            var frequency = ( options && options.frequency ) ? options.frequency : this.options[0].frequency;

            if(frequency != this.frequency){
                var c = (time * this.frequency + this.phase) % (2.0 * Math.PI);
                var n = (time * frequency) % (2.0 * Math.PI);

                this.phase = c - n;
                this.frequency = frequency;
            }

            return ((Math.sin(time * this.frequency + this.phase) + 1.0) / 2.0) > 0.5 ? 1.0 : 0.0;

        }
    }
}

if(window.DeviceMotionEvent) {
    rockpool.tilt = {x:0.5,y:0.5,z:0.5};

    window.addEventListener('devicemotion', function(event) {

        var x = event.accelerationIncludingGravity.x;
        var y = event.accelerationIncludingGravity.y;
        var z = event.accelerationIncludingGravity.z;

        if(!rockpool.inputs.tilt && x + y + z != 0){
            rockpool.inputs.tilt = function() {
                this.name = "Tilt"
                this.icon = "motion"
                this.bgColor = rockpool.palette.blue
                this.category = 'Orientation'

                this.options = [
                    {category: 'Tilt', name: 'X', icon: "motion"},
                    {category: 'Tilt', name: 'Y', icon: "motion"},
                    {category: 'Tilt', name: 'Z', icon: "motion"},
                ]

                this.get = function(options){
                    switch(options.name){
                        case 'X':
                            return rockpool.tilt.x;
                        case 'Y':
                            return rockpool.tilt.y;
                        case 'Z':
                            return rockpool.tilt.z;
                    }
                }
            }
        }

        rockpool.tilt = {
            x: (Math.max(-1.0,Math.min(1.0,x / 9.5)) + 1.0) / 2,
            y: (Math.max(-1.0,Math.min(1.0,y / 9.5)) + 1.0) / 2,
            z: (Math.max(-1.0,Math.min(1.0,z / 9.5)) + 1.0) / 2
        }
    });
}


    $(window).on('keydown',function(e){
         rockpool.pressed[e.keyCode] = true;
    });

    $(window).on('keyup',function(e){
         rockpool.pressed[e.keyCode] = false;
    });

    rockpool.inputs.keyboard = function () {
        this.name = "Keyboard"
        this.keys = []
        this.icon = "keyboard"
        this.bgColor = rockpool.palette.blue
        this.category = 'Keys'

        this.options = [
                {category: 'Keyboard Key', name:"Up",     keys:[87, 38], icon: "keyboard-up"},
                {category: 'Keyboard Key', name:"Down",   keys:[83, 40], icon: "keyboard-down"},
                {category: 'Keyboard Key', name:"Left",   keys:[65, 37], icon: "keyboard-left"},
                {category: 'Keyboard Key', name:"Right",  keys:[68, 39], icon: "keyboard-right"}/*,
                {category: 'Keyboard Key', name:"0",      keys:[48], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"1",      keys:[49], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"2",      keys:[50], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"3",      keys:[51], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"4",      keys:[52], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"5",      keys:[53], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"6",      keys:[54], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"7",      keys:[55], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"8",      keys:[56], icon: "keyboard-number"},
                {category: 'Keyboard Key', name:"9",      keys:[57], icon: "keyboard-number"},*/
            ]
        this.get = function(options){
            var x = options ? options.keys.length : this.keys.length
            while(x--){
                if(rockpool.pressed[options ? options.keys[x] : this.keys[x]]){
                    return 1.0
                }
            }
            return 0.0
        }
    }