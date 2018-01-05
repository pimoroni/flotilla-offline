new function() {
    this.variables = [0,0,0,0,0]
    this.names = ['Red','Yellow','Green','Blue','Purple']
    this.options = []

    for( var i in this.names ){
        this.options.push({
            name:       this.names[i], 
            index:      i, 
            color:      this.names[i].toLowerCase()
        })
    }

    var input = function(parent){
        this.options = parent.options
        this.name = 'Variable'
        this.icon = 'variable'
        this.type = 'variable'
        this.category = rockpool.category.variables
        this.get = function (options) { return parent.variables[options.index] }
    }
    var output = function(parent){
        this.options = parent.options
        this.name = 'Variable'
        this.icon = 'variable'
        this.type = 'variable'
        this.category = rockpool.category.variables
        this.set = function (value,idx,options) { parent.variables[options.index] = value }
    }

    rockpool.registerInput(  -1, 8, 'var', 0, new input(  this ) );
    rockpool.registerOutput( -1, 8, 'var', 0, new output( this ) );
}