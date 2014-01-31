//------------------------------------------------------------------------------
// filter functions for Jane data objects
//
// filters are: AND, OR, or (column, operator, value)
//------------------------------------------------------------------------------
Jane.Filter.Or = function (base) {
    var Or = Object.create(base);

    Or.init = function (params) {
        COPY_PARAM(filters, params);
        return this;
    };

    Or.getRange = function (bag, rangeIn) {
        var rangeOut = rangeIn;
        if (this.filters.length > 0) {
            rangeOut = this.filters[0].getRange(bag, rangeIn);
            for (var i = 1, count = this.filters.length; i < count; ++i) {
                var rangeEntries = Object.getOwnPropertyNames(range);
                for (var j = 0, rangeCount = rangeEntries.length; j < rangeCount; ++j) {
                    var index = rangeEntries[j];
                    rangeOut[index] = index;
                }
            }
        }
        return rangeOut;
    };

    return Or;
}(null);
