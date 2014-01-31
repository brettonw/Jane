//------------------------------------------------------------------------------
// filter and transform plugins are javascript objects with a defined interface:
//  - property: name
//  - function: handleRecord (record, readOnly)
//  
//------------------------------------------------------------------------------
Jane.Transform.Extract = function (base) {
    var Extract = Object.create(base, {
        "name": {
            "value": "Extract",
            "enumerable": true,
            "writable": false
        },
        "extract": {
            "value": "xxx", // not undefined, but not *likely* to be in a record
            "enumerable": true,
            "writable": true
        }
    });

    Extract.init = function (params) {
        // copy some parameters
        COPY_PARAM(extract, params);
        return this;
    };

    Extract.handleRecord = function (record, writable) {
        // don't really need to check that the transform has been created correctly
        // since it will fail without...

        // "extract" uses one sub-element of the record passed in as the record
        if (this.extract in record) {
            return writable ? Object.create(record[this.extract]) : record[this.extract];
        } else {
            // couldn't do it, log the error and return the original
            DEBUGLOG("Can't extract '" + this.extract + "' from record");
            DEBUGGER;
        }
        return record;
    };

    return Extract;
}(null);
