"use strict";

#define MATH_PI				"&pi;"

#define	D(value)			value:value
#define	D_STRING(value)	value:#value
#define	COPY_PARAM(paramName, params)											\
	if (#paramName in params) this[#paramName] = params[#paramName]
#define	COPY_PARAM_NULL(paramName, params)										\
	this[#paramName] = (#paramName in params) ? params[#paramName] : null
#define	COPY_PARAM_AS(paramNameFrom, paramNameTo, params)						\
	if (#paramNameFrom in params) this[#paramNameTo] = params[#paramNameFrom]

#ifdef DEBUG
#define	DEBUGGER			debugger
#define	DEBUGLOG(x)			if (typeof window.top.console !== "undefined") window.top.console.log (x)
#else
#define	DEBUGGER
#define	DEBUGLOG(x)			
#endif

//------------------------------------------------------------------------------
// An EventSource is a base class implementing a subscriber event model.
//
// object interface
//  - function: addSubscriber (subscriber)
//  - function: removeSubscriber (subscriber)
//  - function: postEvent (event, parameter)
//
//  - property: name
//
// Event subscribers are expected to have a "name" property.  
//  - property: name
//
// Events are posted to the subscriber's receiver, which is expected to have a 
// signature like this:
//  - function: receiveEvent (source, event, parameter)
//
//------------------------------------------------------------------------------

var EventSource = Object.create(null);

EventSource.init = function (params) {
    // start by creating an empty subscriber list
    this.subscribers = [];

    // copy some parameters
    COPY_PARAM(name, params);

    return this;
};

EventSource.findSubscriberTargetIndex = function (subscriber) {
    for (var i = 0, count = this.subscribers.length; i < count; ++i) {
        if (this.subscribers[i].subscriber === subscriber) {
            return i;
        }
    }
    return -1;
};

EventSource.addSubscriber = function (subscriber) {
    var target = null;

    // check if the subscriber is already subscribed
    if (this.findSubscriberTargetIndex(subscriber) == -1) {
        // add the subscriber and return it
        DEBUGLOG("SOURCE - " + subscriber.name + " subscribes to " + this.name);
        target = { "subscriber": subscriber };
        this.subscribers.push(target);

        // tell the subscriber to add this source
        subscriber.addSource(this);
    }
    return target;
};

EventSource.removeSubscriber = function (subscriber) {
    // the subscribers array is examined to remove the subscriber
    var i = this.findSubscriberTargetIndex(subscriber);
    if (i >= 0) {
        DEBUGLOG("SOURCE - " + subscriber.name + " unsubscribes from " + this.name);
        this.subscribers.splice(i, 1);

        // tell the subscriber to remove this source
        subscriber.removeSource(this);
    }
};

EventSource.postEvent = function (event, parameter) {
    for (var i = 0, count = this.subscribers.length; i < count; ++i) {
        var target = this.subscribers[i];
        DEBUGLOG("SOURCE - " + this.name + " posting " + event + " to " + target.subscriber.name);
        target.subscriber.receiveEvent(this, event, parameter);
    }
};

//------------------------------------------------------------------------------
// An EventSubscriber is a base class implementing a receiver event model.
//
// object interface
//  - function: addSource (source)
//  - function: removeSource (source)
//  - function: receiveEvent (source, event, parameter)
//
//  - property: name
//  - property: isEventSubscriber
//
// global interface
//  + function: clearSubscribers (body)
//
//------------------------------------------------------------------------------

var EventSubscriber = Object.create(null);

EventSubscriber.init = function (params) {
    // start by creating an empty subscriber list, and declaring this to be an 
    // event subscriber object
    this.sources = [];
    this.isEventSubscriber = true;

    // copy some parameters
    COPY_PARAM(name, params);

    return this;
};

EventSubscriber.addSource = function (source) {
	if (this.sources.indexOf (source) == -1) {
		DEBUGLOG("SUBSCRIBER - " +  this.name + " subscribes to " +source.name);
		this.sources.push(source);

		// tell the source to add this subscriber
		source.addSubscriber (this);
	}
};

EventSubscriber.removeSource = function (source) {
	var i = this.sources.indexOf(source);
	if (i >= 0) {
		DEBUGLOG("SUBSCRIBER - " + this.name + " unsubscribes from " + source.name);
		this.sources.splice(i, 1);

		// tell the source to remove this subscriber
		source.removeSubscriber(this);
	}
};

EventSubscriber.removeAllSources = function () {
	while (this.sources.length > 0) {
		var source = this.sources[0];
		source.removeSubscriber (this);
	}
};

EventSubscriber.receiveEvent = function (source, event, parameter) {
	DEBUGLOG("SUBSCRIBER - " + this.name + " receiving " + event + " from " +source.name);
};

EventSubscriber.clearSubscribers = function (container) {
    Object.getOwnPropertyNames(container).forEach(function (name) {
        var subscriber = container[name];
        if ((subscriber != null) && (typeof subscriber === 'object') && ("isEventSubscriber" in subscriber)) {
            subscriber.removeAllSources();
        }
    });
};
//------------------------------------------------------------------------------
// Jane is a data source manager for client-only operations on result sets. It
// is designed to be a lazy instantiator of queries, filters, and transform-
// ations using shallow copies to manage memory utilization. 
//
// Messaging is accomplished using a simple direct subscriber mechanism, rather
// than use channels or any universal publish and subscribe methodology.
//
// We include a "contract" for subscribers so that lazy instantiations can be 
// shared across widgets when we can guarantee they won't conflict with each 
// other in use.
//
//------------------------------------------------------------------------------
var Jane = function (base) {
    var Jane = Object.create (base).init ({ "name" : "Jane" });
    Jane.isJane = "isJane";

    Jane.monitor = Object.create (EventSubscriber).init ({ "name" : "Jane.monitor" });
    Jane.monitor.receiveEvent = function (source, event, parameter) {
        DEBUGLOG(this.name + " receives " + event + " from " + source.name);
        // Jane is merely letting an outside client know that something happened. 
        // No parameters are passed along.
        Jane.postEvent (event, null);
    };

    Jane.constants = {
        D_STRING(PK)
    };

    Jane.events = {
        D_STRING(DATA_REFERENCE_ADDED),
        D_STRING(DATA_REFERENCE_SELECTED),
        D_STRING(DATA_REFERENCE_REMOVED),

        D_STRING(DATA_POPULATING),
        D_STRING(DATA_POPULATED),
        D_STRING(DATA_FLUSHED),
        D_STRING(DATA_CHANGED),
        D_STRING(HIGHLIGHT_CHANGED)
    };

    Jane.dataRefs = { 
        index : {}, 
        root  : null,
        depth : 0,

        addNode : function (name, dataRef) {
            DEBUGLOG("node - " + name);
            var parent = ((dataRef != null) && ("source" in dataRef) && (dataRef.source.name in this.index)) ? this.index[dataRef.source.name] : this.root;
            var depth = (parent != null) ? parent.depth + 1 : 0;
            this.depth = Math.max (depth, this.depth);
            var node = {
                "name"          : name,
                "depth"         : depth,
                "children"      : [],
                "parent"        : parent,
                "dataRef"       : dataRef
            };
            this.index[name] = node;
            if (parent != null) {
                parent.children.push (node);
            }
            return node;
        },

        removeNode: function (node) {
            // recursive function to remove the node starting with all its children
            while (node.children.count > 0) {
                var child = node.children[0];
                this.removeNode (child);
            }

            // remove this node from it's parent's list
            if (node.parent != null) {
                var index = node.parent.children.indexOf (node);
                if (index >= 0) {
                    node.parent.children.splice (index, 1);
                }

                // let go of the parent
                node.parent = null;
            }

            // remove this node from the index
            delete this.index[node.name];
        }
    };
    Jane.dataRefs.root = Jane.dataRefs.addNode ("Jane", null);

    Jane.addDataReference = function (dataRef) {
        if (! (dataRef.name in this.dataRefs.index)) {
            this.dataRefs.addNode (dataRef.name, dataRef);
            dataRef.addSubscriberReadOnly(this.monitor);
            this.postEvent (Jane.events.DATA_REFERENCE_ADDED, dataRef);
            return dataRef;
        }
        return null;
    };

    Jane.removeDataReference = function (dataRef) {
        // remove the requested node, and any children as well
        if (dataRef.name in this.dataRefs.index) {
            var node = this.dataRefs.index[dataRef.name];
            // flush this data source
            node.dataRef.flush ();

            Jane.dataRefs.removeNode (node);
            this.postEvent (Jane.events.DATA_REFERENCE_REMOVED, dataRef);
        }
    };

    Jane.reset = function () {
        // remove all the children of the root
        while (this.dataRefs.root.children.length > 0) {
            this.removeDataReference (this.dataRefs.root.children[0].dataRef);
            this.dataRefs.depth = 0;
        }
    };

    Jane.getDataReference = function (name) {
        if (name in this.dataRefs.index) {
            return this.dataRefs.index[name].dataRef;
        }
        return null;
    };

    Jane.onJane = function () {
        // do nothing, but this is here as a placeholder in case a naive
        // user copies code from a widget that acts like this
        DEBUGLOG("ALERT - Use jane-client.js instead");
    };

    Jane.EventSource = EventSource;
    Jane.EventSubscriber = EventSubscriber;

    window.top.Jane = Jane;
    return Jane;
} (EventSource);

//------------------------------------------------------------------------------
// Utility functions for Jane.
//------------------------------------------------------------------------------
Jane.Utility = function (base) {
    var Utility = Object.create(base);

    Utility.sortLexical = function (a, b, type, asc) {
        // start by checking for nulls, they sort to the top
        if (a == null) { return (b != null) ? (asc ? -1 : 1) : 0; }
        if (b == null) { return (asc ? 1 : -1); }

        // XXX this might need to be more sophisticated if a sort field is not a
        // XXX string or number (like... an object)
        switch (type) {
            case "number":
            case "integer":
            case "float":
            case "double": {
                return asc ? (a - b) : (b - a);
            } break;
            case "string": {
                // try to sort the values as numerical if we can
                var na = Number(a);
                var nb = Number(b);
                if ((na == a.toString()) && (nb == b.toString())) {
                    return asc ? (na - nb) : (nb - na);
                }

                // sort case-insensitive strings with no spaces
                a = a.replace(/\s*/g, "").toLowerCase();
                b = b.replace(/\s*/g, "").toLowerCase();
                return asc ? a.localeCompare(b) : b.localeCompare(a);
            } break;
            case "datetime":
            case "timestamp":
            case "temporal": {
                var da = new Date(a).valueOf();
                var db = new Date(b).valueOf();
                return asc ? (da - db) : (db - da);
            } break;
        };
        return 0;
    };

    Utility.objectIsEmpty = function (object) {
        // I wonder if there's a faster way to test this
        return (Object.getOwnPropertyNames(object).length == 0);
    };

    Utility.objectType = function (object) {
        return ({}).toString.call(object).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    };

    return Utility;
}(null);//------------------------------------------------------------------------------
// Index functions for Jane data objects.
//------------------------------------------------------------------------------
Jane.Schema = function (base) {
    var Schema = Object.create(base);

/*
    {
        D(Number),
        D(String),
        D(Date)
    }
    */
    Schema.init = function (params) {
        return this;
    };
    
    return Schema;
}(null);﻿//------------------------------------------------------------------------------
// filter functions for Jane data objects
//------------------------------------------------------------------------------
Jane.Filter = function (base) {
    var Filter = Object.create(base);
    return Filter;
}(null);﻿//------------------------------------------------------------------------------
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
﻿//------------------------------------------------------------------------------
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
﻿//------------------------------------------------------------------------------
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
//------------------------------------------------------------------------------
// MetaData is a container for information about column data in a bag. It 
// maintains two primary values:
//
//  - property: columns - an object with column name as keys for the type of the 
//                        column.
//
//  - property: tags - an object with tag values as names, for arrays of columns 
//                     having that tag
//
//  - function: addColumn (name, type, tags) - fills the meta data for columns 
//                                             with type and tags
//
//------------------------------------------------------------------------------

Jane.MetaData = function (base) {
    var MetaData = Object.create(base);

    MetaData.init = function (params) {
        this.columns = {};
        this.tags = {};
        this.map = {};
        return this;
    };

    MetaData.addColumn = function (name, type, tags) {
        DEBUGLOG("adding metaData for [" + name + "] as " + type);
        // XXX an opportunity to map external types to internal types...
        this.columns[name] = { "name" : name, "type": type, "tags": tags };
        this.map[name.toLowerCase ()] = name;

        // tags is an array of values, we store the tags as their own keys, with 
        // references to the columns they are associated with
        for (var i = 0, count = tags.length; i < count; ++i) {
            // reverse index tags if they are a valid string
            var tag = tags[i];
            var tagType = Jane.Utility.objectType(tag);
            if (tagType == "string") {
                DEBUGLOG("tagging " + name + " (" + tag + ")");
                if (!(tag in this.tags)) {
                    this.tags[tag] = [];
                }
                this.tags[tag].push(name);
            }
        }
    };

    MetaData.getMappedColumn = function (name) {
        var lcName = name.toLowerCase();
        if (lcName in this.map) {
            name = this.map[lcName];
            return this.columns[name];
        }
        return null;
    };

    MetaData.getColumnsByTag = function (tag) {
        if (tag in this.tags) {
            return this.tags[tag];
        }
        return null;
    };

    MetaData.getPrimaryKey = function () {
        if (Jane.constants.PK in this.tags) {
            var primaryKeyArray = this.tags[Jane.constants.PK];
            if (primaryKeyArray.length > 0) {
                return primaryKeyArray[0];
            }
        }
        return null;
    };

    return MetaData;
}(null);//------------------------------------------------------------------------------
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
}(null);//------------------------------------------------------------------------------
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
}(null);//------------------------------------------------------------------------------
// filter and transform plugins are javascript objects with a defined interface:
//  - property: name
//  - function: handleRecord (record, readOnly)
//  
//------------------------------------------------------------------------------
Jane.Transform = function (base) {
    var Transform = Object.create(base);
    return Transform;
}(null);
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
//------------------------------------------------------------------------------
// A Jane Data Object (JDO) is a base class for data sources. It supports 
// planned lazy population via RESTful interfaces, and sharing of the data. 
//
// object interface
//  - function: addSubscriberWithContract (target, contract)
//  - function: addSubscriberReadOnly (target)
//  - function: removeSubscriber (target)
//  - function: canAddSubscriber (contract)
//
//  - function: hasBag ()
//  - function: getBag ();
//  - function: getBagIsWritable ()
//
//  - function: populate ()
//  - function: post ()
//  - function: flush ()
//  - function: refresh ()
//
//  - property: name
//  - property: allowFlushForSubscription
//
//  - property: select - an array of columns to select, an empty selection is
//              shorthand for all the columns
//  - property: where - an object that implements the filter plugin interface
//  - property: sort - an array of objects that contain a column name, and asc (boolean)
//  - property: transform - an object that implements the transform plugin interface
//
// The event model is extended to support contracts. A contract is a javascript 
// object with names of values the subcriber can modify. we assume that any 
// modification is expected to be private data that would cause a collision.
// 
// filter and transform plugins are javascript objects with a defined interface:
// XXX TODO - update for indexed operations
//  - property: name
//  - function: HandleRecord (record, readOnly)
//
//------------------------------------------------------------------------------

Jane.DataObject = function (base) {
    var DataObject = Object.create(base, {
        "allowFlushForSubscription": {
            "value": false,
            "enumerable": true,
            "writable": true
        }
    });

    DataObject.init = function (params) {
        // do the parental init, and then do my thing here
        base.init.call(this, params);

        // copy some parameters
        COPY_PARAM_NULL(select, params);
        COPY_PARAM_NULL(where, params);
        COPY_PARAM_NULL(transform, params);
        COPY_PARAM_NULL(sort, params);

        COPY_PARAM(allowFlushForSubscription, params);

        // store this object in the global ref
        return Jane.addDataReference(this);
    };

    DataObject.canAddSubscriber = function (contract) {
        // check if the contract indicates the subscriber will modify the data
        if (! Jane.Utility.objectIsEmpty (contract)) {
            // the proposed contract is checked against all previously subscribed 
            // contracts to see if there is any conflict, return false if any is found
            for (var contractElement in contract) {
                if (contract.hasOwnProperty(contractElement)) {
                    for (var i = 0, count = this.subscribers.length; i < count; ++i) {
                        var subscriber = this.subscribers[i];
                        if (contractElement in subscriber.contract) {
                            return false;
                        }
                    }
                }
            }

            // if the data has been populated, we can check to see if there is a 
            // conflict between the writable property and the contract
            if (this.hasBag() && this.bag.writable) {
                // we know there is no conflict with other contracts because we 
                // checked that above, but the data was already populated as a read-
                // only value. we *could* subscribe, but only if we flush first and 
                // repopulate with modifiable data - NOTE this is NOT the default 
                // behavior
                if (this.allowFlushForSubscription) {
                    this.flush();
                } else {
                    return false;
                }
            }
        }

        // no conflict found
        return true;
    };

    DataObject.addSubscriberWithContract = function (target, contract) {
        if (this.canAddSubscriber(contract)) {
            var subscriber = base.addSubscriber.call(this, target);
            if (subscriber != null) {
                subscriber["contract"] = contract;
                /*
                // if the data is already populated, send a populate event to this
                // receiver so it can join in the fun
                if (this.HasData()) {
                    target.ReceiveEvent(this, Jane.events.DATA_POPULATED);
                }
                */
            }
            return subscriber;
        }
        return null;
    };

    DataObject.addSubscriberReadOnly = function (target) {
        return this.addSubscriberWithContract(target, {});
    };

    DataObject.addSubscriber = function (target) {
        // don't do this
        // XXX it'd be nice to have a way to stop execution if somebody does this
        return null;
    };

    DataObject.hasBag = function () {
        return ("bag" in this);
    };

    DataObject.getBag = function () {
        return this.hasBag() ? this.bag : null;
    };

    DataObject.getBagIsWritable = function () {
        // if the data is populated, return its real property
        if (this.hasBag()) { return this.bag.writable; }

        // otherwise look at all the contracts to see if any of them will 
        // modify the data
        for (var i = 0, count = this.subscribers.length; i < count; ++i) {
            var subscriber = this.subscribers[i];
            if (! Jane.Utility.objectIsEmpty (subscriber.contract)) {
                return true;
            }
        }

        // nobody says this will be modified, it's read only
        return false;
    };

    DataObject.populateResponse = function (bag, event) {
        if (bag != null) {
            var writable = this.getBagIsWritable();
            if ((this.sort != null) || (this.select != null) || (this.where != null) || (this.transform != null) || (writable)) {
                bag = bag.query(this.select, this.where, this.transform, this.sort, writable);
            }
            this.bag = bag;
            delete this.populateRequested;
            this.postEvent(event, null);
        }
    };

    DataObject.populateExec = function () {
        // internal method to be overridden by descendant classes, this method will
        // only ever be called if the data source is not populated already - 
        // the result should call this function as its parent, and then call
        // PopulateDataResponse with the new data
        this.populateRequested = true;
        this.postEvent(Jane.events.DATA_POPULATING, null);
    };

    DataObject.populate = function () {
        if (!this.hasBag()) { this.populateExec(); }
    };

    DataObject.post = function () {
        if (this.hasBag()) {
            this.postEvent(Jane.events.DATA_POPULATED, null);
        } else {
            this.populateExec();
        }
    };

    DataObject.flush = function () {
        if (this.hasBag()) {
            delete this.bag;
            this.postEvent(Jane.events.DATA_FLUSHED, null);
        }
    };

    DataObject.refresh = function () {
        this.flush();
        this.populateExec();
    };

    return DataObject;
}(EventSource);//------------------------------------------------------------------------------
// A Jane Data Reference (JDR) Copy is an abstract, lightweight JDR that 
// describes a data source as a filter, sort, and/or transformation of one or
// more JDRs.
//
// object interface
//  - function: Orphan - disconnect a populated data reference from its source
//                       data references
//
// we assume that all record formats implement the bracket notation to retrieve 
// fields within the record
//
//------------------------------------------------------------------------------

Jane.DataObjectReference = function (base) {
    var DataObjectReference = Object.create(base);

    DataObjectReference.init = function (params) {
        // copy the sources
        COPY_PARAM(source, params);

        // do the parental init, and then do my thing here
        var dataObject = base.init.call(this, params);
        if (dataObject !== null) {
            // look to receive events from my source, so I can handle refresh 
            this.monitor = Object.create(EventSubscriber).init({ "name": (this.name + ".monitor") });
            var self = this;
            this.monitor.receiveEvent = function (source, event, parameter) {
                // forward the event back to the DataObjectReference itself
                self.handleSourceEvent(source, event, parameter);
            };
            this.source.addSubscriberReadOnly(this.monitor);
        }
        return dataObject;
    };

    DataObjectReference.handleSourceEvent = function (source, event, parameter) {
        DEBUGLOG(this.name + " receives " + event + " from " + source.name);
        switch (event) {
            case Jane.events.DATA_POPULATED:
                // we should only populate if we requested this
                if ("populateRequested" in this) {
                    this.populateResponse(source.getBag(), event);
                }
                break;
            case Jane.events.DATA_CHANGED:
                if (this.hasBag()) {
                    this.populateResponse(source.gatBag(), event);
                }
                break;
            case Jane.events.DATA_FLUSHED:
                // could check that the source is my source...
                this.flush();
                break;
            default:
                break;
        }
    };

    DataObjectReference.populateExec = function () {
        // do the parental thing
        base.populateExec.call(this);

        var sourceBag = this.source.getBag ();
        if (sourceBag != null) {
            this.populateResponse(sourceBag, Jane.events.DATA_POPULATED);
        } else {
            this.source.populate();
        }
    };

    return DataObjectReference;

}(Jane.DataObject);//------------------------------------------------------------------------------
// A JSON JDR is a simple JDR that implements retrieval of JSON from a given URL
//  
//------------------------------------------------------------------------------

Jane.DataObjectEspace = function (base) {
    var DataObjectEspace = Object.create(base);

    DataObjectEspace.init = function (params) {
        // copy some parameters
        COPY_PARAM_AS(resultSetUrl, dataUrl, params);
        COPY_PARAM_AS(cdmMapUrl, metaDataUrl, params);
        COPY_PARAM_AS(resultSetId, resultSetId, params);
        COPY_PARAM_AS(numRows, recordCount, params);

        // do the parental init
        params["name"] = params.dataSourceName + " (" + params.resultSetName + ")";
        return base.init.call(this, params);
    };

    DataObjectEspace.populateExec = function () {
        // do the parental thing
        base.populateExec.call(this);

        // use jquery to fetch the JSON response
        var scope = this;
        $.getJSON(this.dataUrl, function (data) {
            // XXX what are the failure modes here?

            // make a new metaData object
            DEBUGLOG(scope.name + " populate metaData");
            var metaData = Object.create(Jane.MetaData).init({});

            // add the column meta data
            var espaceMetaData = data.table.metaData.rowSetMetadata;
            var columns = espaceMetaData.columnMetadata;
            Object.getOwnPropertyNames(columns).forEach(function (key) {
                var column = columns[key];
                var type = (column.types.length > 0) ? column.types[0] : "string";
                metaData.addColumn(column.displayName, type, column.tags);
            });

            var assembledColumns = [];
            // XXX convert the known columns to the desired metaData structure for
            // XXX assembled columns
            var geoPointColumns = espaceMetaData.geoPointColumns;
            for (var i = 0, count = geoPointColumns.length; i < count; ++i) {
                var geoPointColumn = geoPointColumns[i];
                var longitudeColumnName = columns[geoPointColumn.longitudeColumn].displayName;
                var latitudeColumnName = columns[geoPointColumn.latitudeColumn].displayName;
                var assembledColumn = {
                    "typeName": "GeoPoint",
                    "displayName": geoPointColumn.displayName,
                    "values": [
                        { "displayName": "longitude", "sourceColumn": longitudeColumnName },
                        { "displayName": "latitude", "sourceColumn": latitudeColumnName }
                    ]
                };
                assembledColumns.push(assembledColumn);
            }

            // create transforms for the data
            var transforms = [Object.create(Jane.Transform.Extract).init({ "extract": "data" })];

            // add the assembled columns metadata and transforms
            // XXX might be interesting to validate the assembly against known canonical types
            for (var i = 0, count = assembledColumns.length; i < count; ++i) {
                var assembledColumn = assembledColumns[i];
                metaData.addColumn(assembledColumn.displayName, assembledColumn.typeName, []);
                var transformAssemble = Object.create(Jane.Transform.Assemble).init(assembledColumn);
                transforms.push(transformAssemble);
            }
            scope.transform = Object.create(Jane.Transform.Compound).init({ "transforms": transforms });

            // make a new bag with the data
            var bag = Object.create(Jane.Bag).init({
                "namespace" : "espace",
                "metaData"  : metaData,
                "records"   : data.table.rows, 
                "writable"  : false
            });

            // populate response...
            scope.populateResponse(bag, Jane.events.DATA_POPULATED);
        });
    };

    return DataObjectEspace;
}(Jane.DataObject);