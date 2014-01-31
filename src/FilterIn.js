//------------------------------------------------------------------------------
// filter functions for Jane data objects
//
// filters are: AND, OR, IN (array), or (column, operator, value)
//------------------------------------------------------------------------------
Jane.Filter.In = function (base) {
    var In = Object.create(base);

    In.init = function (params) {
        COPY_PARAM(column, params);
        COPY_PARAM(values, params);
        return this;
    };

    In.getRange = function (bag, rangeIn) {
        var index = bag.getIndex(this.column);
        var rangeOut = {};
        // XXX need to think about a more efficient search here

        // loop over all of the value "in" the array
        for (var i = 0, count = values.length; i < count; ++i) {
            var value = values[i];

            // search for the value range
            var valueRange = index.queryOperator("=", value, rangeIn);

            // accumulate the value range into our overall range
            var valueRangeEntries = Object.getOwnPropertyNames(valueRange);
            for (var j = 0, cnt = valueRangeEntries.length; j < cnt; ++j) {
                var valueRangeEntry = valueRangeEntries[j];
                rangeOut[valueRangeEntry] = valueRangeEntry;
            }
        }

        // return the result
        return rangeOut;
    };

    return In;
}(null);
