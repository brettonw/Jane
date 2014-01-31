//------------------------------------------------------------------------------
// A Bag is a container for metadata, data, and indexes. A bag knows how to 
// create a copy of itself, selecting specific columns, applying 
// transformations, and building and using indexes to satisfy query components
//
//  - function: getPrimaryKey - returns the name of the column used as the 
//              primary key
//
//  - function: getIndex (column) - returns the stored index for the specified 
//              column, or builds one if it doesn't already exist.
// 
//  - function: query (where, select, transform, sort, writable) - create a new 
//              bag with the results of the query, featuring "where" clause to 
//              reduce the records to those that match the condition, "select" 
//              to choose the columns that should be included, "sort" to define 
//              how the result should be organized, and "writable" to say 
//              whether the result needs to be a new object that can have 
//              values written to it by the consumer.
//
//  - property: metaData - an object containing two values. "columns" - an 
//              object with columnName as keys for the type of the column. 
//              "tags" - an object containing columns by tag
//                         
//  - property: records - array of row data
//
//  - property: writable - whether or not it's ok to write values into the 
//              records stored in this bag
//
//  - property: index - hash of indices by column name
//
//------------------------------------------------------------------------------


Jane.Bag = function (base) {
    var Bag = Object.create(base);

    Bag.init = function (params) {
        COPY_PARAM(namespace, params);
        COPY_PARAM(metaData, params);
        COPY_PARAM(records, params);
        COPY_PARAM(writable, params);
        this.index = {}
        return this;
    };

    Bag.getPrimaryKey = function () {
        return this.metaData.getPrimaryKey();
    };

    Bag.getIndex = function (column) {
        var index = null;
        // check to see that this is actually a valid column
        if (column in this.metaData.columns) {
            // check to see if the column is already indexed
            if (!(column in this.index)) {
                index = Object.create(Jane.Index).init({ "bag": this, "column": column });
                this.index[column] = index;
            } else {
                index = this.index[column];
            }
        }
        return index;
    };

    Bag.compileSelect = function (selectInput, metaData) {
        if (selectInput == null) { return null; }

        // start with an array with the primary key
        // XXX maybe any other "required" columns
        var primaryKey = metaData.getPrimaryKey();
        var selectOutput = [primaryKey];

        // a comma separated string, or an array of column names using [] 
        // quotation for the column name if there are any spaces. for
        // example: ("[xxx], [yyy y], zzz")
        // it will either be converted to an array of column names, or null
        var selectType = Jane.Utility.objectType(selectInput);
        var selectInputSplit = (selectType == "string") ? selectInput.split(/,([^,]*)/g) : selectInput;
        for (var i = 0, count = selectInputSplit.length; i < count; ++i) {
            if (selectInputSplit[i].length > 0) {
                var columnName = selectInputSplit[i].replace(/^\s*\[?\s*(.*)/, "$1");   // leading spaces and brackets
                columnName = columnName.replace(/((\s*[^\s\]]+)+)\s*\]?\s*$/, "$1");    // trailing spaces

                // this code is meant to be case insensitive, but to put proper 
                // names into the select statement
                var columnMetaData = metaData.getMappedColumn(columnName);
                if (columnMetaData != null) {
                    if (columnMetaData.name != primaryKey) {
                        selectOutput.push(columnMetaData.name);
                    } else {
                        DEBUGLOG("SELECT: Skipping column (" + columnName + " - the PK is automatically included)");
                    }
                } else {
                    DEBUGLOG("SELECT: Skipping invalid column (" + columnName + ")");
                }
            }
        }

        // if there is anything left, return it; otherwise null
        return (selectOutput.length > 0) ? selectOutput : null;
    };

    Bag.selectMetaData = function (selectArray, metaData) {
        if (selectArray != null) {
            var newMetaData = Object.create(Jane.MetaData).init();
            for (var i = 0, count = selectArray.length; i < count; ++i) {
                // this code assumes the select statement contains correct names
                var name = selectArray[i];
                var columnMetaData = metaData.columns[name];
                newMetaData.addColumn(name, columnMetaData.type, columnMetaData.tags);
            }
            metaData = newMetaData;
        }
        return metaData;
    };

    Bag.compileWhere = function (whereInput, metaData) {
        var whereType = Jane.Utility.objectType(whereInput);
        return (whereType == "string") ? null : whereInput;
    };

    Bag.compileSort = function (sortInput, metaData) {
        if (sortInput == null) { return null; }

        // a comma separated string, or an array of column names with or 
        // without "ASC" or "DESC", and using [] quotation for the column 
        // name if there are any spaces("[xxx] ASC, [yyy y], zzz")
        // it will either be converted to an array of sort objects, or null
        var sortType = Jane.Utility.objectType(sortInput);
        var sortInputSplit = (sortType == "string") ? sortInput.split(/,([^,]*)/g) : sortInput;
        var sortOutput = [];
        for (var i = 0, count = sortInputSplit.length; i < count; ++i) {
            if (sortInputSplit[i].length > 0) {
                var columnName = sortInputSplit[i];
                var asc = "asc";
                var ascIndex = columnName.search(/(asc|desc)\s*$/i);
                if (ascIndex > 0) {
                    asc = columnName.substring(ascIndex).toLowerCase().replace(/(\S*)\s+$/, "$1");
                    columnName = columnName.substring(0, ascIndex);
                }
                columnName = columnName.replace(/^\s*\[?\s*(.*)/, "$1");               // leading spaces and brackets
                columnName = columnName.replace(/((\s*[^\s\]]+)+)\s*\]?\s*$/, "$1");   // trailing spaces

                // this code is meant to be case insensitive, but to put proper 
                // names into the select statement
                var columnMetaData = metaData.getMappedColumn(columnName);
                if (columnMetaData != null) {
                    sortOutput.push({ "name": columnMetaData.name, "asc": (asc == "asc") });
                } else {
                    DEBUGLOG("SORT: Skipping invalid column (" + columnName + ")");
                }
            }
        }

        // if there is anything left, return it; otherwise null
        return (sortOutput.length > 0) ? sortOutput : null;
    };

    Bag.query = function (select, where, transform, sort, writable) {
        // compile the inputs
        var namespace = this.namespace;
        var metaData = this.metaData;
        var selectArray = this.compileSelect(select, metaData);
        metaData = this.selectMetaData(selectArray, metaData);
        var whereFilter = this.compileWhere(where, metaData);
        var sortArray = this.compileSort(sort, metaData);
        var records = this.records;

        // figure out which records to examine, start by generating a full list
        // and then paring it down with indices
        var range = {};
        for (var i = 0, count = records.length; i < count; ++i) {
            range[i] = i;
        }
        if (whereFilter != null) {
            range = whereFilter.getRange(this, range);
        }

        // create the new records, differently depending on whether we need to 
        // make a copy of the existing records for writeability
        var newRecords = [];
        var rangeEntries = Object.getOwnPropertyNames(range);
        // XXX sort to provide a bit of memory coherence, might want to test to
        // XXX verify that this has *any* effect on performance
        rangeEntries.sort ();
        for (var i = 0, count = rangeEntries.length; i < count; ++i) {
            var index = rangeEntries[i];
            var record = records[index];

            // decide whether to use the record, or create a new record
            if (selectArray != null) {
                var newRecord = {};
                for (var j = 0, jcount = selectArray.length; j < jcount; ++j) {
                    var columnName = selectArray[j];
                    newRecord[columnName] = record[columnName];
                }
                record = newRecord;
            } else if (writable) {
                record = Object.create(record);
            }

            // transform the record according to the request
            if (transform != null) {
                record = transform.handleRecord(record, writable);
            }

            // save the record
            newRecords.push(record);
        }

        // sort the data result as requested
        if (sortArray != null) {
            newRecords.sort(function (a, b) {
                // loop over all of the sort columns, checking that they are valid first
                for (var i = 0, count = sortArray.length; i < count; ++i) {
                    var sortField = sortArray[i];
                    var sortResult = Jane.Utility.sortLexical(a[sortField.name], b[sortField.name], metaData.columns[sortField.name].type, sortField.asc);
                    if (sortResult != 0) {
                        return sortResult;
                    }
                }
                return 0;
            });
        }

        // create and return a new bag with the metadata and records
        return Object.create(Bag).init({
            "namespace" : namespace,
            "metaData"  : metaData, 
            "records"   : newRecords, 
            "writable" : writable
            });
    };

    Bag.buildIndex = function (column) {
        var index = Object.create(Jane.Index).init({ "bag": this, "column": column });
        this.index[column] = index;
        return index;
    }

    return Bag;
}(null);