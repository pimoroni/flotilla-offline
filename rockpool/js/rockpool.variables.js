new function() {
    this.variables = [0,0,0,0,0,0,0]
    this.names = ['Red','Orange','Yellow','Green','Blue','Indigo','Violet']
    this.colours = ['e55424','f4856f','f7d44a','00b188','4ec0df','788eb6','9178b6']
    this.options = []

    for( var i in this.variables ){
        this.options.push({
            name:       this.names[i], 
            index:      i, 
            bgColor:    '#' + this.colours[i]
        })
    }
    //console.log(this.options)

    var input = function(parent){
        this.options = parent.options
        this.name = 'Variables'
        this.bgColor = rockpool.palette.blue
        this.icon = 'css/images/icons/icon-variable.png'
        this.type = 'variable'
        this.category = rockpool.category.variables
        this.get = function (options) { return parent.variables[options.index] }
    }
    var output = function(parent){
        this.options = parent.options
        this.name = 'Variables'
        this.bgColor = rockpool.palette.blue
        this.icon = 'css/images/icons/icon-variable.png'
        this.type = 'variable'
        this.category = rockpool.category.variables
        this.set = function (value,idx,options) { parent.variables[options.index] = value }
    }
    var convert = function(parent){
        this.options = parent.options
        this.name = 'Variables'
        this.bgColor = rockpool.palette.blue
        this.icon = 'css/images/icons/icon-variable.png'
        this.type = 'variable'
        this.category = rockpool.category.variables
        this.convert = function (value) { parent.variables[index] = value; return value }
    }

    //for( var i in this.variables ){

        rockpool.registerInput(  -1, 8, 'var', 0, new input(  this ) )
        rockpool.registerOutput( -1, 8, 'var', 0, new output( this ) )
       // rockpool.registerConverter( 8, 'var', i, new convert( this, i ) )

    //}
}