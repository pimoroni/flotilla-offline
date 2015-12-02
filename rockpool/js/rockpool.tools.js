var rockpool = rockpool || {};

rockpool.tools = {
    'Empty': function(){
        this.bgColor = rockpool.palette.grey
        this.category = 'Basic'
        this.apply = function(){
            var rule = new rockpool.rule();
            rule.start();
            return rule;
        }
    },
    'Clock Pulse': function(){
        this.bgColor = rockpool.palette.grey
        this.category = 'Advanced'
        this.apply = function(){
            var rule = new rockpool.rule();
            //rule.setInputHandler(new rockpool.inputs.high)
            rule.setInputHandler(rockpool.inputs.var_8_0,0)
            //rule.setHandler(0, new rockpool.converters.greaterThan)
            rule.setHandler(1, new rockpool.converters.invert)
            rule.setOutputHandler(rockpool.outputs.var_8_0,0)
            //rule.getChild(0).setInputHandler(rockpool.inputs.var_8_0)
            return rule;
        }
    },
    'Clock Divider': function(){
        this.bgColor = rockpool.palette.grey
        this.category = 'Advanced'
        this.apply = function(){
            var rule = new rockpool.rule();
            rule.setInputHandler(rockpool.inputs.var_8_0, 0)
            rule.setHandler(0, new rockpool.converters.toggle)
            rule.setHandler(1, new rockpool.converters.toggle)
            rule.setHandler(2, new rockpool.converters.toggle)
            rule.setOutputHandler(rockpool.outputs.var_8_0, 1)
            return rule
        }
    }
}

rockpool.tool = function(tool){
    //console.log('Loading tool', tool)
    if( typeof( rockpool.tools[tool]) ==='function' ){
        return new rockpool.tools[tool]().apply()
    }
    else
    {
        //console.log('Load failed')
    }
}