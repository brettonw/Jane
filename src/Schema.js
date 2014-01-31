//------------------------------------------------------------------------------
// Index functions for Jane data objects.
//------------------------------------------------------------------------------
Jane.Schema = function (base) {
    var Schema = Object.create(base);

/*
    {
        D(Number),
        D(String),
        D(Date)
    }
    */
    Schema.init = function (params) {
        return this;
    };
    
    return Schema;
}(null);