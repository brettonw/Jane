//------------------------------------------------------------------------------
// filter functions for Jane data objects
//
// filters are: AND, OR, or (column, operator, value)
//------------------------------------------------------------------------------
Jane.Filter.Operator = function (base) {
    var Operator = Object.create(base);

    Operator.init = function (params) {
        COPY_PARAM(column, params);
        COPY_PARAM(operator, params);
        COPY_PARAM(value, params);
        return this;
    };

    Operator.getRange = function (bag, rangeIn) {
        var index = bag.getIndex(this.column);
        var range = index.queryOperator(this.operator, this.value, rangeIn);
        return range;
    };

    return Operator;
}(null);
