//------------------------------------------------------------------------------
// filter and transform plugins are javascript objects with a defined interface:
//  - property: name
//  - function: handleRecord (record, readOnly)
//  
//------------------------------------------------------------------------------
Jane.Transform.Compound = function (base) {
    var Compound = Object.create(base, {
        "name": {
            "value": "Compound",
            "enumerable": true,
            "writable": false
        }
    });

    Compound.init = function (params) {
        // pull all of the transforms out in an array
        COPY_PARAM(transforms, params);
        return this;
    };

    Compound.handleRecord = function (record, writable) {
        // loop over all of the transforms in order, and pass the transformed
        // record to each one in turn.
        for (var i = 0, count = this.transforms.length; i < count; ++i) {
            record = this.transforms[i].handleRecord(record, writable);

            // the first transform will create a writable result, so we 
            // simplify the result to avoid compound objects
            writable = false;
        }
        return record;
    };

    return Compound;
}(null);
