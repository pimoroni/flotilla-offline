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
            if(isNaN(i)) continue;
            if(isFinite(this[i]) && this[i] !== null){
              sum=sum+parseFloat(this[i]);
               j++;
            }
        }
        return j===0 ? 0 : (sum/j)
    }
}

rockpool.converters = {
    /*
        No value conversion
    */   
    noop: function () {
        this.name = "Empty"
        this.category = rockpool.category.empty
        this.color = 'grey'
        this.icon = "add"
        this.convert = function (value) { return value }        
    },
    /*
        Converters
    */
    halve: function () {
        this.name = "Halve"
        this.category = rockpool.category.maths
        this.color = 'navy'
        this.icon = "halve"
        this.convert = function (value) { return value / 2.0 }        
    },
    double: function () {
        this.name = "Double"
        this.category = rockpool.category.maths
        this.color = 'navy'
        this.icon = "double"
        this.convert = function (value) {
            if( value <= 0.5 ){
                return value * 2.0
            }else{
                return 1.0
            }
        }
    },
    invert: function () {
        this.name = "Invert"
        this.category = rockpool.category.modify
        this.color = 'navy'
        this.icon = "invert"
        this.convert = function (value) { return 1 - value }        
    },
    smooth: function () {
        this.name = "Smooth"
        this.category = rockpool.category.modify
        this.color = 'navy'
        this.icon = "smooth"
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
    toggle: function () {
        this.name = "Toggle"
        this.category = rockpool.category.modify
        this.color = 'navy'
        this.icon = "toggle"

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
        this.category = rockpool.category.maths
        this.color = 'purple'
        this.icon = "add"
        this.childValue = 0
        this.convert = function (value) { return (this.childValue + value > 1) ? 1 : this.childValue + value}
        this.set     = function (value) { this.childValue = value }
    },
    subtract: function () {
        this.name = "Subtract"
        this.category = rockpool.category.maths
        this.color = 'purple'
        this.icon = "subtract"
        this.childValue = 0
        this.convert = function (value) { return (value - this.childValue < 0) ? 0 : value - this.childValue}
        this.set     = function (value) { this.childValue = value }
    },
    multiply: function () {
        this.name = "Multiply"
        this.category = rockpool.category.maths
        this.color = 'purple'
        this.icon = "double"
        this.childValue = 0
        this.convert = function (value) { 
            var thisValue = value * 100;
            var childValue = this.childValue * 100;

            return Math.min( 1.0, (thisValue * childValue) / 100 );

        }
        this.set     = function (value) { this.childValue = value }
    },
    divide: function () {
        this.name = "Divide"
        this.category = rockpool.category.maths
        this.color = 'purple'
        this.icon = "halve"
        this.childValue = 0
        this.convert = function (value) { 
            var thisValue = value * 100;
            var childValue = this.childValue * 100;

            return childValue > 0 ? (thisValue / childValue) / 100 : 0
        }
        this.set     = function (value) { this.childValue = value }
    },
    /*
        Returns the minimum of the two input values
    */
    min: function () {
        this.name = "Min"
        this.category = rockpool.category.compare
        this.color = 'purple'
        this.icon = "min"
        this.childValue = 0
        this.inheritFormatting = true
        this.convert = function (value) { return (this.childValue < value) ? this.childValue : value }
        this.set     = function (value) { this.childValue = value }
    },
    /*
        Returns the maximum of the two input values
    */
    max: function () {
        this.name = "Max"
        this.category = rockpool.category.compare
        this.color = 'purple'
        this.icon = "max"
        this.childValue = 0
        this.inheritFormatting = true
        this.convert = function (value) { return (this.childValue > value) ? this.childValue : value }
        this.set     = function (value) { this.childValue = value }
    },
    /*
        Returns the difference between two inputs
    */
    diff: function () {
        this.name = "Difference"
        this.category = rockpool.category.compare
        this.color = 'purple'
        this.icon = "diff"
        this.childValue = 0
        this.inheritFormatting = true
        this.convert = function (value) { return (this.childValue < value) ? value - this.childValue : this.childValue - value }
        this.set     = function (value) { this.childValue = value }
    },
    /*
        Returns the average of two inputs
    */
    mix: function () {
        this.name = "Average"
        this.category = rockpool.category.modify
        this.color = 'red'
        this.icon = "mix"
        this.childValue = 0
        this.inheritFormatting = true
        this.convert = function (value, idx) { return (value + this.childValue)/2 }
        this.set     = function (value, idx) { this.childValue = value }
    },
    /*
        Deciders
    */
    lessThan: function () {
        this.name = "Less Than"
        this.category = rockpool.category.compare
        this.color = 'red'
        this.icon = "lt"
        this.childValue = 0
        this.inheritFormatting = true
        this.convert = function (value) { return ( value < this.childValue ) ? 1 : 0 }
        this.set     = function (value) { this.childValue = value }
    },
    greaterThan: function () {
        this.name = "Greater Than"
        this.category = rockpool.category.compare
        this.color = 'red'
        this.icon = "gt"
        this.childValue = 0
        this.inheritFormatting = true
        this.convert = function (value, idx) { return ( value > this.childValue ) ? 1 : 0 }
        this.set     = function (value, idx) { this.childValue = value }
    },
/*
    Value   1 0 0 1
    Clock   1 1 0 0
            1 1 - -

*/
    latch: function() {
        this.name = "Latch"
        this.category = rockpool.category.modify
        this.color = 'red'
        this.icon = "latch"

        this.latched_value  = 0
        this.input_value    = 0
        this.last_value     = 0

        this.convert = function ( value ) {
            this.input_value = value
            return this.latched_value
        }
        this.set = function( value ){
            // Clock into the latch on rising edge
            
            if( value > 0.5 && this.last_value <= 0.5 ){
                this.latched_value = this.input_value
            }
            this.last_value = value
        }
    }
}