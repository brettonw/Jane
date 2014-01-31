//------------------------------------------------------------------------------
// filter and transform plugins are javascript objects with a defined interface:
//  - property: name
//  - function: handleRecord (record)
//  
//------------------------------------------------------------------------------
Jane.Transform.Flatten = function (base) {
    var Flatten = Object.create(base, {
        "name": {
            "value": "Flatten",
            "enumerable": true,
            "writable": false
        }
    });

    Flatten.init = function (params) {
        return this;
    };

    Flatten.enumerateRecord = function (record, into) {
        // recursive function on objects
        for (var key in record) {
            if (record.hasOwnProperty(key)) {
                var value = record[key];
                var valueType = typeof (value);
                if (valueType == "object") {
                    this.EnumerateRecord(value, into);
                } else {
                    into[key] = value;
                }
            }
        }
    };

    Flatten.handleRecord = function (record, writable) {
        // flatten traverses a record and returns a new record with all sub-objects
        // flattened out into a single object
        var into = Object.create(null);
        this.enumerateRecord(record, into);
        return into;
    };

    return Flatten;
}(null);
