var rockpool = rockpool || {};

rockpool.palette = {
    red: '#D94D15',
    green: '#00b188',
    yellow: 'rgb(248,212,75)', // '#F0856F',
    blue: 'rgb(78, 192, 223)', //'#00A1BE',
    grey: '#888',
    navy: '#182b53',
    purple: '#9279b7',
    orange: '#f58670',
    empty: 'rgba(4, 72, 94, 1)' //rgba(0,55,72,0.6)'
}
/*

    A module definition maps the array-based inputs
    and outputs into meaningful properties.

    The output and input adaptors defined by the "get" and "set"
    functions handle scaling from sensor values to values
    more usable and friendly within the system.

    Generally everything is scaled into a range of 0 to 1, but
    this is not always possible.

    Motors and joystick axis may range from -1 to +1,
    and sensors without an absolute range of values
    may be impossible to scale.

*/

var modules = {
    'switch':function(){
        this.title = 'Button &amp; LED';
        this.bgColor = rockpool.palette.green

        this.button = 0
        this.r = 0
        this.g = 0
        this.b = 0

        this.set = function(data){
            this.button = data[0];
        }

        this.get = function(){
            return [
                '1:' + Math.round(this.r * 255.0),
                '2:' + Math.round(this.g * 255.0),
                '3:' + Math.round(this.b * 255.0)
            ]
        }
    },
    'number':function(){
        this.title = 'Number Display';
        this.bgColor = rockpool.palette.blue
        this.icon = '7seg'

        this.number = 0
        this.decimal = 0

        this.get = function(){
            return [
                ['1',Math.round(this.number * 9999.0),Math.round(this.decimal * 3.0)].join(':')
            ]
        }
    },
    'dial':function(){
        this.title = 'Dial';
        this.bgColor = rockpool.palette.blue

        this.position = 0

        this.set = function(data){
            this.position = data[0] / 100.0;
        }
    },
    'slider':function(){
        this.title = 'Slider';
        this.bgColor = rockpool.palette.blue

        this.position = 0

        this.set = function(data){
            this.position = data[0] / 100.0;
        }
    },
    'joystick':function(){
        this.title = 'Joystick';
        this.bgColor = rockpool.palette.blue

        this.x = 0;
        this.y = 0;
        this.button = 0;

        this.set = function(data){
            this.x = data[0] / 100.0;
            this.y = data[1] / 100.0;
            this.button = data[2];
        }
    },
    'barometer':function(){
        this.title = 'Barometer';
        this.bgColor = rockpool.palette.blue
        
        this.pressure = 0
        this.temp = 0
    },
    'light':function(){
        this.title = 'Light Sensor';
        this.bgColor = rockpool.palette.blue

        /* Inputs */
        this.visible = 0;
        this.ir = 0;

        this.set = function(data){
            this.visible = data[0];
            this.ir = data[1];
        }

    },
    'colour':function(){
        this.title = 'Light Sensor';
        this.bgColor = rockpool.palette.blue

        /* Inputs */
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.clear = 0;

        this.set = function(data){
            this.r = data[0]/256.0;
            this.g = data[1]/256.0;
            this.b = data[2]/256.0;
            this.clear = data[3]/256.0;
        }
    },
    'motor':function(){
        this.title = 'Motor';
        this.bgColor = rockpool.palette.blue

        this.speed = 0;

        this.get = function(data){
            return [
                Math.round(this.speed*100)
            ]
        }
    },
    'matrix':function(){
        this.title = 'Matrix';
        this.bgColor = rockpool.palette.blue;
        this.icon_index = 0;
        this.screen_data = [
            [0,0,0,0,0,0,0,0], // User buffer
            [0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff] // Full white
        ];
        this.xy_data = [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ];

        this.set_pixel = function(x, y, col){
            console.log('Setting pixel', x, y, col);
            this.xy_data[y][x] = col;
            this._update_display();
            return true;
        }

        this.set_icon = function(idx){
            this.icon_index = idx;
        }

        this._update_display = function(){
            /* data is a 2d array that looks something like this:
            [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0]
            ]
            */
            var d = [];
            for( row in this.xy_data ){
                var r = 0;
                for( col in this.xy_data[row] ){

                    if( this.xy_data[row][col] ){

                        r += (1 << (7-col));

                    }
                }
                d.push(r);
            }
            this.screen_data[this.icon_index] = d;
        }

        this.get = function(data){
            return [
                ['0',
                    this.screen_data[this.icon_index].join(':')
                ].join(':')
            ]
        }
    }
}

var module_map = {
    15: 'dial', // value
    14: 'switch', // button, r, g, b
    16: 'slider', // position
    29: 'light', // light, vis, ir?
    64: 'motor',  // speed
    12: 'joystick',  // x, y, button
    63: 'number',    // number
    39: 'colour',     // r, g, b, c
    77: 'barometer',
    60: 'matrix'
}