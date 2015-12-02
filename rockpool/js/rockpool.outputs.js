var rockpool = rockpool || {};

rockpool.outputs = {
    none: function () {
        this.name = "None"
        this.category = rockpool.category.general
        this.bgColor = rockpool.palette.empty
        this.set = function ( value ) { return 0 }
    }
}