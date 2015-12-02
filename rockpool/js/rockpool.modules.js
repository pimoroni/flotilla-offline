var rockpool = rockpool || {};
rockpool.module_handlers = rockpool.module_handlers || {};

/*
#Flotilla Module Definitions

These are settings definitions which define the behaviour of
each Flotilla module. They include several key parameters
which define inputs, outputs, name and address.

Where applicable a definition should also include a 'send'
or 'receve' function which governs how data should be sent
to or receievd from the host transport.

'<handle>': {
    'title': '<Human-readable title>',
    'address': <i2c-address>,
    'receive': function(data){ return { <new key value data> } },
    'send':    function(data){ return [ <array of messages to send> ] },
    'inputs'  ...
    'outputs' ... 
}

Flotilla Module inputs and outputs

*/

rockpool.module_handlers['touch'] = {
    'title': 'Touch',
    'address': 0x2c,
    'receive': function(data){
        //console.log(data);
        //var button = parseInt(data[0]);
        //var state =  parseInt(data[1]) >= 1 ? 1.0 : 0.0;
        var result = {}
        for( var x = 0; x < 4; x++ ){
            result[x+1] = data[x] >= 1 ? 1.0 : 0.0;
        }
        //console.log(result);
        return result;
    },
    'inputs': {
        'button': function(){

            this.name = "Channel"
            this.module_type = 'blue'
            this.icon = "css/images/icons/icon-button.png"
            this.bgColor = rockpool.palette.blue
            this.data = {1:0.0,2:0.0,3:0.0,4:0.0}
            this.options = [
                {name: 'One',   channel: 1},
                {name: 'Two',   channel: 2},
                {name: 'Three', channel: 3},
                {name: 'Four',  channel: 4}
            ]

            this.get = function(options) {

                if(!options) return 0;

                return this.data[options.channel]

            }

        }
    }
}

rockpool.module_handlers['rainbow'] = {
    'title': 'Rainbow',
    'address': 0x54,
    'send': function(data){
        var grb = [Math.floor(data.r*255),Math.floor(data.g*255),Math.floor(data.b*255)];
        return [grb];
    },
    'outputs': {
        'LED': function() {
            this.name = "LED"
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-light.png"
            this.data = {r:{}, g:{}, b:{}}
            this.bgColor = rockpool.palette.green;

            this.options = [
                {name: "Red",       channel: 'r'},
                {name: "Green",     channel: 'g'},
                {name: "Blue",      channel: 'b'},
                //{name: "Brightness",channel: 'brightness'},
                {name: "Hue",       channel: 'hue'}
            ]

            this.set = function(value, id, options){
                if(!options) return;

                if( options.channel == 'hue' ){

                    var h = value;
                    var s = 1.0;
                    var v = 1.0;
                    var r, g, b, i, f, p, q, t;
                    i = Math.floor(h * 6);
                    f = h * 6 - i;
                    p = v * (1 - s);
                    q = v * (1 - f * s);
                    t = v * (1 - (1 - f) * s);
                    switch (i % 6) {
                        case 0: r = v, g = t, b = p; break;
                        case 1: r = q, g = v, b = p; break;
                        case 2: r = p, g = v, b = t; break;
                        case 3: r = p, g = q, b = v; break;
                        case 4: r = t, g = p, b = v; break;
                        case 5: r = v, g = p, b = q; break;
                    }

                    this.data.r[id] = r;
                    this.data.g[id] = g;
                    this.data.b[id] = b;

                    return;
                }

                if(!this.data[options.channel]) this.data[options.channel] = {}

                this.data[options.channel][id] = value

            }

            this.stop = function(id) {
                for( var key in this.data ){
                    this.data[key][id] = null
                }
            }

        }
    }
}

rockpool.module_handlers['motion'] = {
    'title': 'Motion',
    'address': 0x1d,
    'receive': function(data){
        console.log(data);
        var x = (parseInt(data[0]) + 33767) / 65535;
        var y = (parseInt(data[1]) + 33767) / 65535;
        var z = (parseInt(data[2]) + 33767) / 65535;
        return {'x': x, 'y': y, 'z': z};
    },
    'inputs': {
        'axis': function(){

            this.name = "Axis"
            this.module_type = 'blue'
            this.icon = "css/images/icons/icon-joystick.png"
            this.bgColor = rockpool.palette.blue
            this.data = {x:0,y:0,z:0}
            this.options = [
                {name: 'X', axis: 'x'},
                {name: 'Y', axis: 'y'},
                {name: 'Z', axis: 'z'}
            ]

            this.get = function(options) {

                if(!options) return 0;

                return this.data[options.axis]

            }

        }
    }
}

rockpool.module_handlers['colour'] = {
    'title': 'Colour',
    'address': 0x39,
    'receive': function(data) {
        var r = parseInt(data[0])/255.0;
        var g = parseInt(data[1])/255.0;
        var b = parseInt(data[2])/255.0;
        var c = 0; //parseInt(data[3])/255.0;
        return {'r': r, 'g': g, 'b': b, 'brightness': c};
    },
    'inputs': {
        'colour': function() {
            this.name = "Colour"
            this.module_type = 'blue'
            this.icon = "css/images/icons/icon-colour.png"
            this.bgColor = rockpool.palette.blue
            this.data = {r:0,g:0,b:0,brightness:0}
            this.options = [
                {name:'Red', channel:'r'},
                {name:'Green', channel:'g'},
                {name:'Blue', channel:'b'},
                {name:'Brightness', channel:'brightness'}
            ]
            this.get = function(options){

                if(!options) return 0;

                return this.data[options.channel]

            }
        }
    }
}

rockpool.module_handlers['weather'] = {
    'title': 'Weather',
    'address': 0x00,
    'receive': function(data){
        return {'temperature': parseInt(data[0]), 'pressure': parseInt(data[1])}
    },
    'inputs': {
        'temperature': function(){
            this.name = "Temperature"
            this.module_type = 'blue'
            this.icon = "css/images/icons/icon-weather.png"
            this.bgColor = rockpool.palette.blue
            this.data = {temperature:0}
            this.get = function(){
                return (this.data.temperature/10) > 60 ? 1 : (this.data.vis.temperature/10/60);
            }
        },
        'pressure': function(){
            this.name = "Pressure"
            this.module_type = 'blue'
            this.icon = "css/images/icons/icon-weather.png"
            this.bgColor = rockpool.palette.blue
            this.data = {pressure:0}
            this.get = function(){
                return (this.data.temperature/10) > 2000 ? 1 : (this.data.vis.temperature/10/2000);
            }
        }
    }
}

rockpool.module_handlers['light'] = {
	'title': 'Light',
    'address': 0x29,
    'receive': function(data) {
        var vis = parseInt(data[0]);
        //var ir = parseInt(data[1]);
        return {'vis': vis};
    },
    'inputs': {
        'visible': function() {
            this.name = "Visible"
            this.module_type = 'blue'
            this.icon = "css/images/icons/icon-light.png"
            this.bgColor = rockpool.palette.blue
            this.data = {vis:0}
            this.get = function () { return (this.data.vis/3000) > 1 ? 1 : (this.data.vis/3000) }
        }
    }
}

rockpool.matrix_brightness = 20

rockpool.module_handlers['matrix'] = {
	'title': 'Matrix',
    'average': false,
    'address': 0x63,
    'send': function(data){
        return [
            [
                data.image[0],
                data.image[1],
                data.image[2],
                data.image[3],
                data.image[4],
                data.image[5],
                data.image[6],
                data.image[7],
                rockpool.matrix_brightness
            ]
        ];
    },
    'outputs': {
        'display': function() {
            this.name = 'Text'
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-matrix.png"
            this.bgColor = rockpool.palette.green
            this.data = {image:[0, 0, 0, 0, 0, 0, 0, 0]}

            this.options = [
                {name:'Number', fn: function(value){ return matrix_font[Math.ceil(value * 9).toString().charCodeAt(0)]; } },
                {name:'Letter', fn: function(value){ return matrix_font[ 97 + Math.ceil(value * 25) ]; } }
            ]

            this.set = function (value, id, options){
                if(!options) return false;

                this.data.image = options.fn(value);
            }

        },/*
        'number': function() {
            this.name = "Number"
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-matrix.png"
            this.bgColor = rockpool.palette.green
            this.data = {image:[0, 0, 0, 0, 0, 0, 0, 0]}

            this.set = function (value) { this.data.image = matrix_font[Math.ceil(value * 9).toString().charCodeAt(0)] }
        },
        'letter': function() {
            this.name = "Letter"
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-matrix.png"
            this.bgColor = rockpool.palette.green
            this.data = {image:[0, 0, 0, 0, 0, 0, 0, 0]}
            this.set = function (value) { this.data.image = matrix_font[ 97 + Math.ceil(value * 25) ] }
        },*/
        'brightness': function() {
            this.name = "Brightness"
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-matrix.png"
            this.bgColor = rockpool.palette.green
            this.data = {brightness:100}
            this.set = function (value) { this.data.value = value*255 }
        }
    }
}

var number_digit_map = [
 252,//0b11111100,
 96, //0b01100000,
 218,//0b11011010,
 242,//0b11110010,
 102,//0b01100110,
 182,//0b10110110,
 190,//0b10111110,
 224,//0b11100000,
 254,//0b11111110,
 230 //0b11100110
]

rockpool.module_handlers['number'] = {
	'title': 'Number',
    'address': 0x63,
    'send': function(data){
        // Input should look like "XXXX" or "X.XXX" or "XX.XX" or "XX:XX" or "XX:X'"
        console.log(data);
        var display = [0,0,0,0,0,0,0]; // 7 bytes, char 1-4, colon, apostrophe and brightness

        for(var x = 0; x<data.number.toString().length; x++){

            var ord = data.number.toString().charCodeAt(x) - 48;

            if( ord >= 0 && ord < 48+number_digit_map.length){
                display[x] = number_digit_map[ord];
            }

        }

        /*function get_digit_segment(segment){
            var d1 = (digits[0] & segment) > 0;
            var d2 = (digits[1] & segment) > 0;
            var d3 = (digits[2] & segment) > 0;
            var d4 = (digits[3] & segment) > 0;

            return d1 | d2 << 1 | d3 << 2 | d4 << 3;
        }

        var display = [0,0,0,0,0,0,0,0,0,0,0];

        display[0] = get_digit_segment(128); // Top
        display[1] = get_digit_segment(64);  // Top Right
        display[2] = get_digit_segment(32);  // Bottom Right
        display[3] = get_digit_segment(16);  // Bottom
        display[4] = get_digit_segment(8);   // Bottom Left
        display[5] = get_digit_segment(4);   // Top Left
        display[6] = get_digit_segment(2);   // Middle
        display[7] = get_digit_segment(1);   // Dot
        */


        display[4] = data.colon; // Colon
        display[5] = data.apostrophe; // Apostrophe

        display[6] = data.brightness; // Brightness

        return [ display ];
    },
	'outputs': {
		'number': function() {
			this.name = "Number"
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-7seg.png"
            this.bgColor = rockpool.palette.green
			this.data = {number:"0000", brightness:50, colon: 0, apostrophe: 0}
			this.pad = function (str, max) {
				return str.length < max ? this.pad("0" + str, max) : str;
		      }
			this.set = function (value) { this.data.number = this.pad( Math.ceil(value * 1000).toString(), 4 ); }
		}
	}
}

rockpool.module_handlers['dial'] = {
	'title': 'Dial',
    'address': 0x15,
    'receive': function(data) {
        var val = parseInt(data[0]);
        if( val >= 1021 ){ val = 1024; }

        return { 'value': Math.min(val/1024.0,1.0) };
    },
	'inputs': {
		'position': function () {
			this.name = "Position"
        this.module_type = 'red'
        this.icon = "css/images/icons/icon-dial.png"
        this.bgColor = rockpool.palette.red
			this.data = {value:0}
			this.get = function () { return this.data.value }
		}
	}
}

rockpool.module_handlers['slider'] = {
	'title': 'Slider',
    'address': 0x16,
    'receive': function(data) {
        var val = parseInt(data[0]);
        if( val >= 1021 ){ val = 1024; }

        return { 'position': Math.min(val/1024.0,1.0) };
    },
	'inputs': {
		'position': function () {
			this.name = "Position"
        this.module_type = 'red'
        this.icon = "css/images/icons/icon-slider.png"
        this.bgColor = rockpool.palette.red
			this.data = {position:0}
			this.get = function () { return this.data.position }
		}
	},
	'outputs': {
		'brightness': function() {
			this.name = "Brightness"
        this.module_type = 'red'
        this.icon = "css/images/icons/icon-light.png"
        this.bgColor = rockpool.palette.red
			this.data = {brightness:0}
			this.set = function (value) { this.data.brightness = value }
		}
	}
}

rockpool.module_handlers['motor'] = {
	'title': 'Motor',
    'address': 0x64,
    'send': function(data){
        return [
            [Math.round(data.speed).toString()]
        ];
    },
	'outputs': {
        'speed': function () {
            this.name = "Speed"
            this.module_type = 'orange'
            this.icon = "css/images/icons/icon-motor.png"
            this.bgColor = rockpool.palette.orange
            this.data = {speed:{}}

            this.options = [
                {name: "Speed",     fn: function(value){return (value*126)-63;}},
                {name: "Forwards",  fn: function(value){return value == 0 ? null : (value*63);}},
                {name: "Backwards", fn: function(value){return value == 0 ? null : -(value*63);}}
            ]

            this.set = function( value, id, options ){
                var fn = options ? options.fn : this.options[0].fn;

                this.data.speed[id] = fn(value);
            }

            this.stop = function(id) { this.data.speed[id] = null }
        }
	}
	}

rockpool.module_handlers['joystick'] = {
		'title': 'Joystick',
    'address': 0x12,
    'receive': function(data) {
        var x = parseInt(data[1]);
        var y = parseInt(data[2]);
        var b = parseInt(data[0]);
        return {'x': x, 'y': y, 'button': b};
    },
		'inputs': {
			'button': function () {
	        this.name = "Button"
            this.module_type = 'red'
            this.icon = "css/images/icons/icon-button.png"
            this.bgColor = rockpool.palette.red
            this.data = {button:0}
	        this.get = function () { return this.data.button ? 1 : 0 }
    	},
        'direction': function(){
            this.name = "Direction"
            this.module_type = 'red'
            this.icon = "css/images/icons/icon-joystick.png"
            this.bgColor = rockpool.palette.red
            this.data = {x:0.5,y:0.5}

            this.options = [
                {name:'X', fn: function(data){     return (data.x)/1023 }},
                {name:'Y', fn: function(data){     return (data.y)/1023 }},
                {name:'Up', fn: function(data){    return (data.y) < 512 ? 0 : (data.y-512)/512 }},
                {name:'Down', fn: function(data){  return (data.y) > 512 ? 0 : (512-data.y)/512 }},
                {name:'Left', fn: function(data){  return (data.x) < 512 ? 0 : (data.x-512)/512 }},
                {name:'Right', fn: function(data){ return (data.x) > 512 ? 0 : (512-data.x)/512 }}
            ]

            this.get = function(options) {
                var fn = options ? options.fn : this.options[0].fn;

                return fn(this.data);
            }
        }
    }
}




var matrix_font = [
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x18,0x00,0x18,0x18,0x3c,0x3c,0x18],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x6c,0x6c],
    [0x00,0x6c,0x6c,0xfe,0x6c,0xfe,0x6c,0x6c],
    [0x00,0x30,0xf8,0x0c,0x78,0xc0,0x7c,0x30],
    [0x00,0xc6,0x66,0x30,0x18,0xcc,0xc6,0x00],
    [0x00,0x76,0xcc,0xdc,0x76,0x38,0x6c,0x38],
    [0x00,0x00,0x00,0x00,0x00,0xc0,0x60,0x60],
    [0x00,0x18,0x30,0x60,0x60,0x60,0x30,0x18],
    [0x00,0x60,0x30,0x18,0x18,0x18,0x30,0x60],
    [0x00,0x00,0x66,0x3c,0xff,0x3c,0x66,0x00],
    [0x00,0x00,0x30,0x30,0xfc,0x30,0x30,0x00],
    [0x60,0x30,0x30,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0xfc,0x00,0x00,0x00],
    [0x00,0x30,0x30,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x80,0xc0,0x60,0x30,0x18,0x0c,0x06],
    [0x00,0x7c,0xe6,0xf6,0xde,0xce,0xc6,0x7c],
    [0x00,0xfc,0x30,0x30,0x30,0x30,0x70,0x30],
    [0x00,0xfc,0xcc,0x60,0x38,0x0c,0xcc,0x78],
    [0x00,0x78,0xcc,0x0c,0x38,0x0c,0xcc,0x78],
    [0x00,0x1e,0x0c,0xfe,0xcc,0x6c,0x3c,0x1c],
    [0x00,0x78,0xcc,0x0c,0x0c,0xf8,0xc0,0xfc],
    [0x00,0x78,0xcc,0xcc,0xf8,0xc0,0x60,0x38],
    [0x00,0x30,0x30,0x30,0x18,0x0c,0xcc,0xfc],
    [0x00,0x78,0xcc,0xcc,0x78,0xcc,0xcc,0x78],
    [0x00,0x70,0x18,0x0c,0x7c,0xcc,0xcc,0x78],
    [0x00,0x30,0x30,0x00,0x00,0x30,0x30,0x00],
    [0x60,0x30,0x30,0x00,0x00,0x30,0x30,0x00],
    [0x00,0x18,0x30,0x60,0xc0,0x60,0x30,0x18],
    [0x00,0x00,0xfc,0x00,0x00,0xfc,0x00,0x00],
    [0x00,0x60,0x30,0x18,0x0c,0x18,0x30,0x60],
    [0x00,0x30,0x00,0x30,0x18,0x0c,0xcc,0x78],
    [0x00,0x78,0xc0,0xde,0xde,0xde,0xc6,0x7c],
    [0x00,0xcc,0xcc,0xfc,0xcc,0xcc,0x78,0x30],
    [0x00,0xfc,0x66,0x66,0x7c,0x66,0x66,0xfc],
    [0x00,0x3c,0x66,0xc0,0xc0,0xc0,0x66,0x3c],
    [0x00,0xf8,0x6c,0x66,0x66,0x66,0x6c,0xf8],
    [0x00,0xfe,0x62,0x68,0x78,0x68,0x62,0xfe],
    [0x00,0xf0,0x60,0x68,0x78,0x68,0x62,0xfe],
    [0x00,0x3e,0x66,0xce,0xc0,0xc0,0x66,0x3c],
    [0x00,0xcc,0xcc,0xcc,0xfc,0xcc,0xcc,0xcc],
    [0x00,0x78,0x30,0x30,0x30,0x30,0x30,0x78],
    [0x00,0x78,0xcc,0xcc,0x0c,0x0c,0x0c,0x1e],
    [0x00,0xe6,0x66,0x6c,0x78,0x6c,0x66,0xe6],
    [0x00,0xfe,0x66,0x62,0x60,0x60,0x60,0xf0],
    [0x00,0xc6,0xc6,0xd6,0xfe,0xfe,0xee,0xc6],
    [0x00,0xc6,0xc6,0xce,0xde,0xf6,0xe6,0xc6],
    [0x00,0x38,0x6c,0xc6,0xc6,0xc6,0x6c,0x38],
    [0x00,0xf0,0x60,0x60,0x7c,0x66,0x66,0xfc],
    [0x00,0x1c,0x78,0xdc,0xcc,0xcc,0xcc,0x78],
    [0x00,0xe6,0x66,0x6c,0x7c,0x66,0x66,0xfc],
    [0x00,0x78,0xcc,0x1c,0x70,0xe0,0xcc,0x78],
    [0x00,0x78,0x30,0x30,0x30,0x30,0xb4,0xfc],
    [0x00,0xfc,0xcc,0xcc,0xcc,0xcc,0xcc,0xcc],
    [0x00,0x30,0x78,0xcc,0xcc,0xcc,0xcc,0xcc],
    [0x00,0xc6,0xee,0xfe,0xd6,0xc6,0xc6,0xc6],
    [0x00,0xc6,0x6c,0x38,0x38,0x6c,0xc6,0xc6],
    [0x00,0x78,0x30,0x30,0x78,0xcc,0xcc,0xcc],
    [0x00,0xfe,0x66,0x32,0x18,0x8c,0xc6,0xfe],
    [0x00,0x78,0x60,0x60,0x60,0x60,0x60,0x78],
    [0x00,0x02,0x06,0x0c,0x18,0x30,0x60,0xc0],
    [0x00,0x78,0x18,0x18,0x18,0x18,0x18,0x78],
    [0x00,0x00,0x00,0x00,0xc6,0x6c,0x38,0x10],
    [0xff,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    [0x00,0x00,0x00,0x00,0x00,0x18,0x30,0x30],
    [0x00,0x76,0xcc,0x7c,0x0c,0x78,0x00,0x00],
    [0x00,0xdc,0x66,0x66,0x7c,0x60,0x60,0xe0],
    [0x00,0x78,0xcc,0xc0,0xcc,0x78,0x00,0x00],
    [0x00,0x76,0xcc,0xcc,0x7c,0x0c,0x0c,0x1c],
    [0x00,0x78,0xc0,0xfc,0xcc,0x78,0x00,0x00],
    [0x00,0xf0,0x60,0x60,0xf0,0x60,0x6c,0x38],
    [0xf8,0x0c,0x7c,0xcc,0xcc,0x76,0x00,0x00],
    [0x00,0xe6,0x66,0x66,0x76,0x6c,0x60,0xe0],
    [0x00,0x78,0x30,0x30,0x30,0x70,0x00,0x30],
    [0x78,0xcc,0xcc,0x0c,0x0c,0x0c,0x00,0x0c],
    [0x00,0xe6,0x6c,0x78,0x6c,0x66,0x60,0xe0],
    [0x00,0x78,0x30,0x30,0x30,0x30,0x30,0x70],
    [0x00,0xc6,0xd6,0xfe,0xfe,0xcc,0x00,0x00],
    [0x00,0xcc,0xcc,0xcc,0xcc,0xf8,0x00,0x00],
    [0x00,0x78,0xcc,0xcc,0xcc,0x78,0x00,0x00],
    [0xf0,0x60,0x7c,0x66,0x66,0xdc,0x00,0x00],
    [0x1e,0x0c,0x7c,0xcc,0xcc,0x76,0x00,0x00],
    [0x00,0xf0,0x60,0x66,0x76,0xdc,0x00,0x00],
    [0x00,0xf8,0x0c,0x78,0xc0,0x7c,0x00,0x00],
    [0x00,0x18,0x34,0x30,0x30,0x7c,0x30,0x10],
    [0x00,0x76,0xcc,0xcc,0xcc,0xcc,0x00,0x00],
    [0x00,0x30,0x78,0xcc,0xcc,0xcc,0x00,0x00],
    [0x00,0x6c,0xfe,0xfe,0xd6,0xc6,0x00,0x00],
    [0x00,0xc6,0x6c,0x38,0x6c,0xc6,0x00,0x00],
    [0xf8,0x0c,0x7c,0xcc,0xcc,0xcc,0x00,0x00],
    [0x00,0xfc,0x64,0x30,0x98,0xfc,0x00,0x00],
    [0x00,0x1c,0x30,0x30,0xe0,0x30,0x30,0x1c],
    [0x00,0x18,0x18,0x18,0x00,0x18,0x18,0x18],
    [0x00,0xe0,0x30,0x30,0x1c,0x30,0x30,0xe0],
    [0x00,0x00,0x00,0x00,0x00,0x00,0xdc,0x76],
    [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]
]

var buttonfactory = function(button_index,button_title){
    return function() {
                this.name = button_title ? button_title : "Key " + button_index
                this.data = {'button':[]}
                this.icon = "css/images/icons/icon-button.png"
                this.bgColor = rockpool.palette.red
                this.get = function () {  return this.data.button[button_index] ? 1 : 0 }
            }
}
