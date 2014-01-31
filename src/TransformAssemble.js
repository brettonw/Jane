//------------------------------------------------------------------------------
// filter and transform plugins are javascript objects with a defined interface:
//  - property: name
//  - function: handleRecord (record, readOnly)
//  
//------------------------------------------------------------------------------
Jane.Transform.Assemble = function (base) {
    var Assemble = Object.create(base, {
        "name": {
            "value": "Assemble",
            "enumerable": true,
            "writable": false
        }
    });

    Assemble.init = function (params) {
        // copy some parameters
        COPY_PARAM(displayName, params);
        COPY_PARAM(values, params);
        return this;
    };

    Assemble.handleRecord = function (record, writable) {
        // don't really need to check that the transform has been created correctly
        // since it will fail without...

        // assemble: {
        //      displayName : "location",
        //      values : [
        //          { displayName : "latitude", sourceColumn : "lat1" },
        //          { displayName : "longitude", sourceColumn : "lon1" },
        //      ]
        // }

        // "assemble" uses sub-elements of the record passed to build a new 
        // named sub-element
        var assembly = {};
        var values = this.values;
        for (var i = 0, count = values.length; i < count; ++i) {
            assembly[values[i].displayName] = record[values[i].sourceColumn];
        }
        if (writable) {
            record = Object.create(record);
        }
        record[this.displayName] = assembly;
        return record;
    };

    return Assemble;
}(null);
