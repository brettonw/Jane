//------------------------------------------------------------------------------
// filter functions for Jane data objects
//
// filters are: AND, OR, or (column, operator, value)
//------------------------------------------------------------------------------
Jane.Filter.And = function (base) {
    var And = Object.create(base);

    And.init = function (params) {
        COPY_PARAM(filters, params);
        return this;
    };

    And.getRange = function (bag, rangeIn) {
        var rangeOut = rangeIn;
        if (this.filters.length > 0) {
            for (var i = 0, count = this.filters.length; i < count; ++i) {
                var range = this.filters[i].getRange(bag, rangeOut);
                var andRange = {};
                var rangeEntries = Object.getOwnPropertyNames(range);
                for (var j = 0, rangeCount = rangeEntries.length; j < rangeCount; ++j) {
                    var index = rangeEntries[j];
                    if (index in rangeOut) {
                        andRange[index] = index;
                    }
                }
                rangeOut = andRange;
            }
        }
        return rangeOut;
    };

    return And;
}(null);
