var rockpool = rockpool || {};
rockpool.module_handlers = rockpool.module_handlers || {};

rockpool.module_handlers['remote'] = {
    'title': 'Remote',
    'address': 0x00,
    'inputs': {
        'Remote': function() {
            this.name = 'Remote'
            this.module_type = 'red'
            this.data = {'button':[]}
            this.icon = "css/images/icons/icon-button.png"
            this.bgColor = rockpool.palette.red
            this.button_index = 0
            this.options = [
                {category: 'Numbers', name:"0",   button_index:0},
                {category: 'Numbers', name:"1",   button_index:1},
                {category: 'Numbers', name:"2",   button_index:2},
                {category: 'Numbers', name:"3",   button_index:3},
                {category: 'Numbers', name:"4",   button_index:4},
                {category: 'Numbers', name:"5",   button_index:5},
                {category: 'Numbers', name:"6",   button_index:6},
                {category: 'Numbers', name:"7",   button_index:7},
                {category: 'Numbers', name:"8",   button_index:8},
                {category: 'Numbers', name:"9",   button_index:9},

                {category: 'Controls', name:"CH -",   button_index:10},
                {category: 'Controls', name:"CH",     button_index:11},
                {category: 'Controls', name:"CH +",   button_index:12},
                {category: 'Controls', name:"Prev",   button_index:13},
                {category: 'Controls', name:"Next",   button_index:14},
                {category: 'Controls', name:"Play/Pause",   button_index:15},
                {category: 'Controls', name:"-",      button_index:16},
                {category: 'Controls', name:"+",      button_index:17},
                {category: 'Controls', name:"EQ",     button_index:18},
            ]
            this.get = function ( options ) { 
                return this.data.button[ (options && options.button_index) ? options.button_index : this.button_index ] ? 1 : 0
            }
            //this.get = function () {  return this.data.button[this.button_index] ? 1 : 0 }
        }
    }
}

rockpool.module_handlers['switch'] = {
    'title': 'Switch',
    'address': 0x00,
    'inputs': {
        'button': function () {
            this.name = "Button"
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-button.png"
            this.bgColor = rockpool.palette.green
            this.data = {button:0}
            this.get = function () { return this.data.button }
        }
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

rockpool.module_handlers['pibrella'] = {
    'title': 'Pibrella Board',
    'address': 0x99,
    'receive': function(data){
        var which = parseInt(data[0]);
        var value = parseInt(data[1]);
        console.log('New value for Pibrella', which, value);
        switch(which){
            case 14:
                return {'button': value };
            case 13: //A
                return {'button': value };
            case 11: //B
                return {'button': value };
            case 10: //C
                return {'button': value };
            case 12: //D
                return {'button': value };
        }
    },
    'outputs': {
        'LED': function() {
            this.name = "LED"
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-light.png"
            this.data = {r:{}, g:{}, y:{}}
            this.bgColor = rockpool.palette.green;

            this.options = [
                {name: "Red",       channel: 'r'},
                {name: "Green",     channel: 'g'},
                {name: "Yellow",    channel: 'y'}
            ]

            this.set = function(value, id, options){
                if(!options) return;
                if(!this.data[options.channel]) this.data[options.channel] = {}
                this.data[options.channel][id] = value
            }
        },
        'Output': function(){
            this.name = "Output"
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-light.png"
            this.data = {e:{}, f:{}, g:{}, h:{}}
            this.bgColor = rockpool.palette.green;

            this.options = [
                {name: "E",    channel: 'e'},
                {name: "F",    channel: 'f'},
                {name: "G",    channel: 'g'},
                {name: "H",    channel: 'h'}
            ]

            this.set = function(value, id, options){
                if(!options) return;
                if(!this.data[options.channel]) this.data[options.channel] = {}
                this.data[options.channel][id] = value
            }
        }

}

rockpool.module_handlers['inputs'] = {
        'button': function () {
            this.name = "Button"
            this.module_type = 'green'
            this.icon = "css/images/icons/icon-button.png"
            this.bgColor = rockpool.palette.green
            this.data = {button:0}
            this.get = function () { return this.data.button }
        },
        'Input': function() {
            this.name = "Input"
            this.module_type = 'blue'
            this.icon = "css/images/icons/icon-colour.png"
            this.bgColor = rockpool.palette.blue
            this.data = {a:0,b:0,c:0,d:0}
            this.options = [
                {name:'A', channel:'a'},
                {name:'B', channel:'b'},
                {name:'C', channel:'c'},
                {name:'D', channel:'d'}
            ]
            this.get = function(options){

                if(!options) return 0;

                return this.data[options.channel]

            }
        }
    }
}

rockpool.module_handlers['servodriver'] = {
    'title': 'Servo Driver',
    'address': 0x00,
    'outputs': {
        'position': function() {
            this.name = "Position"
            this.module_type = 'yellow'
            this.icon = ""
            this.bgColor = rockpool.palette.yellow
            this.data = {}

            this.options = [
                {name:'Main Arm',   index:'l'},
                {name:'Forearm',    index:'s'},
                {name:'Jaws',       index:'j'},
                {name:'Base',       index:'b'}
            ]

            this.set = function ( value, id, options ){
                this.data[ options.index ] = value
            }
        }
    }
}

rockpool.module_handlers['servo'] = {
    'title': 'Servo',
    'address': 0x00,
    'outputs': {
        'position': function () {
            this.name = "Position"
            this.module_type = 'yellow'
            this.icon = ""
            this.bgColor = rockpool.palette.yellow
            this.data = {position: 0}
            this.set = function (value) {
                this.data.position = value
            }
        }
    }
}