//------------------------------------------------------------------------------
// Index functions for Jane data objects.
//------------------------------------------------------------------------------
Jane.Index = function (base) {
    var Index = Object.create(base);

    Index.init = function (params) {
        COPY_PARAM(bag, params);
        COPY_PARAM(column, params);

        // build the index data
        this.index = this.buildIndex();

        return this;
    };
    
    Index.buildIndex = function () {
        var index = [];
        var column = this.column;
        var metaDataColumns = this.bag.metaData.columns;
        if (column in metaDataColumns) {
            var records = this.bag.records;
            for (var i = 0, count = records.length; i < count; ++i) {
                var record = records[i];
                index.push({ "value": record[column], "index": i });
            }

            // sort the index
            var columnType = metaDataColumns[column].type;
            var sortFunc = function (a, b) {
                return Jane.Utility.sortLexical(a.value, b.value, columnType, true);
            };
            index.sort(sortFunc);
        }
        return index;
    };

    Index.queryList = function (list) {
        // for each item in the list...
    };

    Index.queryOperator = function (operator, value, rangeIn) {
        var columnType = this.bag.metaData.columns[this.column].type;

        // find where the value should be in the index
        var index = this.index;
        var count = index.length;
        var lo = function () {;
            var lo = 0;
            var hi = count;
            while (lo < hi) {
                var mid = Math.floor((lo + hi) / 2);
                if (Jane.Utility.sortLexical(index[mid].value, value, columnType, true) < 0) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }
            return lo;
        }();
        var hi = function (lo) {;
            var hi = count;
            while (lo < hi) {
                var mid = Math.floor((lo + hi) / 2);
                if (Jane.Utility.sortLexical(index[mid].value, value, columnType, true) == 0) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }
            return hi;
        }(lo);

        // function to add output ranges
        var addRangeOut = function (cases, from, to) {
            if (operator in cases) {
                for (var i = from; i < to; ++i) {
                    var arrayIndex = index[i].index;
                    if (arrayIndex in rangeIn) {
                        rangeOut[arrayIndex] = arrayIndex;
                    }
                }
            }
        }

        // build an object full of output ranges, and return it
        var rangeOut = {};
        addRangeOut ({ D("<"), D("<=") }, 0, lo);
        addRangeOut ({ D("<="), D("="), D(">=") }, lo, hi);
        addRangeOut ({ D(">"), D(">=") }, hi, count);
        return rangeOut;
    };



    return Index;
}(null);