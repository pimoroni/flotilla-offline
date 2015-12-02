var rockpool = rockpool || {};

rockpool.helpers = {
    avg: function() {
        var sum=0;
        var j=0;
        for(var i=0;i<this.length;i++){
            if(isFinite(this[i]) && this[i] !== null){
              sum=sum+parseFloat(this[i]);
               j++;
            }
        }
        if(j===0){
            return 0;
        }else{
            return sum/j;
        }

    },
    objAvg: function(){
        var sum = 0;
        var j = 0;
        for( var i in this ){
            if(isFinite(this[i]) && this[i] !== null){
              sum=sum+parseFloat(this[i]);
               j++;
            }
        }
        return j===0 ? 0 : (sum/j)
    }
}

rockpool.converters = {
    noop: function () {
        this.name = "Empty"
        //this.bgColor = rockpool.palette.empty
        this.category = rockpool.category.empty
        this.convert = function (value) { return value }        
    },
    invert: function () {
        this.name = "Invert"
        //this.bgColor = rockpool.palette.purple
        this.category = rockpool.category.converters
        this.icon = "css/images/icons/icon-invert.png"
        this.convert = function (value) { return 1 - value }        
    },
    halve: function () {
        this.name = "Halve"
        //this.bgColor = rockpool.palette.purple
        this.category = rockpool.category.converters
        this.icon = "css/images/icons/icon-halve.png"
        this.convert = function (value) { return value / 2.0 }        
    },
    greaterThan: function () {
        this.name = "Greater Than"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.deciders
        this.icon = "css/images/icons/icon-gt.png"
        this.childValue = 0
        this.convert = function (value, idx) { return ( value > this.childValue ) ? 1 : 0 }
        this.set     = function (value, idx) { this.childValue = value }
    },
    mix: function () {
        this.name = "Mix"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.deciders
        this.icon = "css/images/icons/icon-mix.png"
        this.childValue = 0
        this.convert = function (value, idx) { return (value + this.childValue)/2 }
        this.set     = function (value, idx) { this.childValue = value }
    },
    lessThan: function () {
        this.name = "Less Than"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.deciders
        this.icon = "css/images/icons/icon-lt.png"
        this.childValue = 0
        this.convert = function (value) { return ( value < this.childValue ) ? 1 : 0 }
        this.set     = function (value) { this.childValue = value }
    },
    smooth: function () {
        this.name = "Smooth"
        //this.bgColor = rockpool.palette.purple
        this.category = rockpool.category.converters
        this.icon = "css/images/icons/icon-smooth.png"
        this.values = []
        this.values.average = rockpool.helpers.avg;
        this.convert = function (value){

            this.values.push( value )

            if( this.values.length > 10 ){
                this.values.shift()
            }

            return this.values.average()

        }
    },
    /*
        Returns the difference between to inputs
    */
    diff: function () {
        this.name = "Difference"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.deciders
        this.icon = "css/images/icons/icon-diff.png"
        this.childValue = 0
        this.convert = function (value) { return (this.childValue < value) ? value - this.childValue : this.childValue - value }
        this.set     = function (value) { this.childValue = value }
    },
/*
    Value   1 0 0 1
    Clock   1 1 0 0
            1 1 - -

*/
    latch: function() {
        this.name = "Latch"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.deciders
        this.icon = "css/images/icons/icon-latch.png"

        this.latched_value  = 0
        this.input_value    = 0
        this.last_value     = 0

        this.convert = function ( value ) {
            this.input_value = value
            return this.latched_value
        }
        this.set = function( value ){
            // Clock into the latch on rising edge
            //if( value == 1 && this.last_value == 0 ){
            
            if( value > 0.5 && this.last_value <= 0.5 ){
                this.latched_value = this.input_value
            }
            this.last_value = value
        }
    },
    /*count: function() {
        this.name = "Count"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.converters
        this.icon = "css/images/icons/icon-decide.png"

        this.count_value      = 0
        this.last_value       = 0
        this.last_reset_value = 0

        this.convert = function ( value ) {
            if( value > 0.5 && this.last_value <= 0.5 ){
                this.count_value += 1;
                if( this.count_value > 10 ){
                    this.count_value = 0
                }
            }
            this.last_value = value
            return this.count_value/10
        }
        this.set = function( value ){
            if( value > 0.5 && this.last_reset_value <= 0.5 ){
                this.count_value = 0
            }
            this.last_reset_value = value
        }
    },*/
    toggle: function () {
        this.name = "Toggle"
        //this.bgColor = rockpool.palette.purple
        this.category = rockpool.category.converters
        this.icon = "css/images/icons/icon-toggle.png"

        this.last_value = 0
        this.latch = false

        this.convert = function ( value ) {
            //if( value != this.last_value ){
            if( value > 0.5 && this.last_value <= 0.5 ){
                //if( value == 1 ){
                    this.latch = !this.latch
                //}

            }
                this.last_value = value

            return this.latch ? 1 : 0
        }
    },
    /*
        Experimental
        Use case: ?
    */
    add: function () {
        this.name = "Add"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.deciders
        this.icon = "css/images/icons/icon-add.png"
        this.childValue = 0
        this.convert = function (value) { return (this.childValue + value > 1) ? 1 : this.childValue + value}
        this.set     = function (value) { this.childValue = value }
    },
    /*
        Returns the minimum of the two input values
    */
    min: function () {
        this.name = "Min"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.deciders
        this.icon = "css/images/icons/icon-min.png"
        this.childValue = 0
        this.convert = function (value) { return (this.childValue < value) ? this.childValue : value }
        this.set     = function (value) { this.childValue = value }
    },
    /*
        Returns the maximum of the two input values
    */
    max: function () {
        this.name = "Max"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.deciders
        this.icon = "css/images/icons/icon-max.png"
        this.childValue = 0
        this.convert = function (value) { return (this.childValue > value) ? this.childValue : value }
        this.set     = function (value) { this.childValue = value }
    }/*,
    tankDrive: function() {
        this.name = "Tank Drive"
        //this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.tools
        this.icon = "css/images/icons/icon-tank.png"
        this.y = 0.5
        this.x = 0.5
        this.convert = function (value) {
            this.x = value;

            // Scale values into motor control range ( -100 to 100 )
            var x = (this.x*200) - 100;
            var y = (this.y*200) - 100;

            x = -x;

            v = (100-Math.abs(x)) * (y/100) + y
            w = (100-Math.abs(y)) * (x/100) + x
            
            return (((v-w)/2) + 100) / 200
        }
        this.set     = function (value) { this.y = value }
    }*//*,
    tankRight: function() {
        this.name = "Tank Right"
        this.bgColor = rockpool.palette.orange
        this.category = rockpool.category.deciders
        this.icon = "css/images/icons/icon-decider.png"
        this.y = 0
        this.x = 0
        this.convert = function (value) {
            this.x = value;
            var x = (this.x*200) - 100;
            var y = (this.y*200) - 100;
            x = -x;
            v = (100-Math.abs(x)) * (y/100) + y
            w = (100-Math.abs(y)) * (x/100) + x
            return (((v+w)/2) + 100) / 200
        }
        this.set     = function (value) { this.y = value }
    }*/
}