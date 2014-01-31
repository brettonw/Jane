"use strict";
var EventSource = Object.create(null);

EventSource.init = function (params) {

    this.subscribers = [];


    if ("name" in params) this["name"] = params["name"];

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


    if (this.findSubscriberTargetIndex(subscriber) == -1) {

        if (typeof window.top.console !== "undefined") window.top.console.log ("SOURCE - " + subscriber.name + " subscribes to " + this.name);
        target = { "subscriber": subscriber };
        this.subscribers.push(target);


        subscriber.addSource(this);
    }
    return target;
};

EventSource.removeSubscriber = function (subscriber) {

    var i = this.findSubscriberTargetIndex(subscriber);
    if (i >= 0) {
        if (typeof window.top.console !== "undefined") window.top.console.log ("SOURCE - " + subscriber.name + " unsubscribes from " + this.name);
        this.subscribers.splice(i, 1);


        subscriber.removeSource(this);
    }
};

EventSource.postEvent = function (event, parameter) {
    for (var i = 0, count = this.subscribers.length; i < count; ++i) {
        var target = this.subscribers[i];
        if (typeof window.top.console !== "undefined") window.top.console.log ("SOURCE - " + this.name + " posting " + event + " to " + target.subscriber.name);
        target.subscriber.receiveEvent(this, event, parameter);
    }
};
var EventSubscriber = Object.create(null);

EventSubscriber.init = function (params) {


    this.sources = [];
    this.isEventSubscriber = true;


    if ("name" in params) this["name"] = params["name"];

    return this;
};

EventSubscriber.addSource = function (source) {
 if (this.sources.indexOf (source) == -1) {
  if (typeof window.top.console !== "undefined") window.top.console.log ("SUBSCRIBER - " + this.name + " subscribes to " +source.name);
  this.sources.push(source);


  source.addSubscriber (this);
 }
};

EventSubscriber.removeSource = function (source) {
 var i = this.sources.indexOf(source);
 if (i >= 0) {
  if (typeof window.top.console !== "undefined") window.top.console.log ("SUBSCRIBER - " + this.name + " unsubscribes from " + source.name);
  this.sources.splice(i, 1);


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
 if (typeof window.top.console !== "undefined") window.top.console.log ("SUBSCRIBER - " + this.name + " receiving " + event + " from " +source.name);
};

EventSubscriber.clearSubscribers = function (container) {
    Object.getOwnPropertyNames(container).forEach(function (name) {
        var subscriber = container[name];
        if ((subscriber != null) && (typeof subscriber === 'object') && ("isEventSubscriber" in subscriber)) {
            subscriber.removeAllSources();
        }
    });
};
var Jane = function (base) {
    var Jane = Object.create (base).init ({ "name" : "Jane" });
    Jane.isJane = "isJane";

    Jane.monitor = Object.create (EventSubscriber).init ({ "name" : "Jane.monitor" });
    Jane.monitor.receiveEvent = function (source, event, parameter) {
        if (typeof window.top.console !== "undefined") window.top.console.log (this.name + " receives " + event + " from " + source.name);


        Jane.postEvent (event, null);
    };

    Jane.constants = {
        PK:"PK"
    };

    Jane.events = {
        DATA_REFERENCE_ADDED:"DATA_REFERENCE_ADDED",
        DATA_REFERENCE_SELECTED:"DATA_REFERENCE_SELECTED",
        DATA_REFERENCE_REMOVED:"DATA_REFERENCE_REMOVED",

        DATA_POPULATING:"DATA_POPULATING",
        DATA_POPULATED:"DATA_POPULATED",
        DATA_FLUSHED:"DATA_FLUSHED",
        DATA_CHANGED:"DATA_CHANGED",
        HIGHLIGHT_CHANGED:"HIGHLIGHT_CHANGED"
    };

    Jane.dataRefs = {
        index : {},
        root : null,
        depth : 0,

        addNode : function (name, dataRef) {
            if (typeof window.top.console !== "undefined") window.top.console.log ("node - " + name);
            var parent = ((dataRef != null) && ("source" in dataRef) && (dataRef.source.name in this.index)) ? this.index[dataRef.source.name] : this.root;
            var depth = (parent != null) ? parent.depth + 1 : 0;
            this.depth = Math.max (depth, this.depth);
            var node = {
                "name" : name,
                "depth" : depth,
                "children" : [],
                "parent" : parent,
                "dataRef" : dataRef
            };
            this.index[name] = node;
            if (parent != null) {
                parent.children.push (node);
            }
            return node;
        },

        removeNode: function (node) {

            while (node.children.count > 0) {
                var child = node.children[0];
                this.removeNode (child);
            }


            if (node.parent != null) {
                var index = node.parent.children.indexOf (node);
                if (index >= 0) {
                    node.parent.children.splice (index, 1);
                }


                node.parent = null;
            }


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

        if (dataRef.name in this.dataRefs.index) {
            var node = this.dataRefs.index[dataRef.name];

            node.dataRef.flush ();

            Jane.dataRefs.removeNode (node);
            this.postEvent (Jane.events.DATA_REFERENCE_REMOVED, dataRef);
        }
    };

    Jane.reset = function () {

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


        if (typeof window.top.console !== "undefined") window.top.console.log ("ALERT - Use jane-client.js instead");
    };

    Jane.EventSource = EventSource;
    Jane.EventSubscriber = EventSubscriber;

    window.top.Jane = Jane;
    return Jane;
} (EventSource);




Jane.Utility = function (base) {
    var Utility = Object.create(base);

    Utility.sortLexical = function (a, b, type, asc) {

        if (a == null) { return (b != null) ? (asc ? -1 : 1) : 0; }
        if (b == null) { return (asc ? 1 : -1); }



        switch (type) {
            case "number":
            case "integer":
            case "float":
            case "double": {
                return asc ? (a - b) : (b - a);
            } break;
            case "string": {

                var na = Number(a);
                var nb = Number(b);
                if ((na == a.toString()) && (nb == b.toString())) {
                    return asc ? (na - nb) : (nb - na);
                }


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

        return (Object.getOwnPropertyNames(object).length == 0);
    };

    Utility.objectType = function (object) {
        return ({}).toString.call(object).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    };

    return Utility;
}(null);


Jane.Schema = function (base) {
    var Schema = Object.create(base);
    Schema.init = function (params) {
        return this;
    };

    return Schema;
}(null);﻿


Jane.Filter = function (base) {
    var Filter = Object.create(base);
    return Filter;
}(null);﻿




Jane.Filter.Operator = function (base) {
    var Operator = Object.create(base);

    Operator.init = function (params) {
        if ("column" in params) this["column"] = params["column"];
        if ("operator" in params) this["operator"] = params["operator"];
        if ("value" in params) this["value"] = params["value"];
        return this;
    };

    Operator.getRange = function (bag, rangeIn) {
        var index = bag.getIndex(this.column);
        var range = index.queryOperator(this.operator, this.value, rangeIn);
        return range;
    };

    return Operator;
}(null);





Jane.Filter.In = function (base) {
    var In = Object.create(base);

    In.init = function (params) {
        if ("column" in params) this["column"] = params["column"];
        if ("values" in params) this["values"] = params["values"];
        return this;
    };

    In.getRange = function (bag, rangeIn) {
        var index = bag.getIndex(this.column);
        var rangeOut = {};



        for (var i = 0, count = values.length; i < count; ++i) {
            var value = values[i];


            var valueRange = index.queryOperator("=", value, rangeIn);


            var valueRangeEntries = Object.getOwnPropertyNames(valueRange);
            for (var j = 0, cnt = valueRangeEntries.length; j < cnt; ++j) {
                var valueRangeEntry = valueRangeEntries[j];
                rangeOut[valueRangeEntry] = valueRangeEntry;
            }
        }


        return rangeOut;
    };

    return In;
}(null);
﻿




Jane.Filter.And = function (base) {
    var And = Object.create(base);

    And.init = function (params) {
        if ("filters" in params) this["filters"] = params["filters"];
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
﻿




Jane.Filter.Or = function (base) {
    var Or = Object.create(base);

    Or.init = function (params) {
        if ("filters" in params) this["filters"] = params["filters"];
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
Jane.MetaData = function (base) {
    var MetaData = Object.create(base);

    MetaData.init = function (params) {
        this.columns = {};
        this.tags = {};
        this.map = {};
        return this;
    };

    MetaData.addColumn = function (name, type, tags) {
        if (typeof window.top.console !== "undefined") window.top.console.log ("adding metaData for [" + name + "] as " + type);

        this.columns[name] = { "name" : name, "type": type, "tags": tags };
        this.map[name.toLowerCase ()] = name;



        for (var i = 0, count = tags.length; i < count; ++i) {

            var tag = tags[i];
            var tagType = Jane.Utility.objectType(tag);
            if (tagType == "string") {
                if (typeof window.top.console !== "undefined") window.top.console.log ("tagging " + name + " (" + tag + ")");
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
}(null);


Jane.Index = function (base) {
    var Index = Object.create(base);

    Index.init = function (params) {
        if ("bag" in params) this["bag"] = params["bag"];
        if ("column" in params) this["column"] = params["column"];


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


            var columnType = metaDataColumns[column].type;
            var sortFunc = function (a, b) {
                return Jane.Utility.sortLexical(a.value, b.value, columnType, true);
            };
            index.sort(sortFunc);
        }
        return index;
    };

    Index.queryList = function (list) {

    };

    Index.queryOperator = function (operator, value, rangeIn) {
        var columnType = this.bag.metaData.columns[this.column].type;


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


        var rangeOut = {};
        addRangeOut ({ "<":"<", "<=":"<=" }, 0, lo);
        addRangeOut ({ "<=":"<=", "=":"=", ">=":">=" }, lo, hi);
        addRangeOut ({ ">":">", ">=":">=" }, hi, count);
        return rangeOut;
    };



    return Index;
}(null);
Jane.Bag = function (base) {
    var Bag = Object.create(base);

    Bag.init = function (params) {
        if ("namespace" in params) this["namespace"] = params["namespace"];
        if ("metaData" in params) this["metaData"] = params["metaData"];
        if ("records" in params) this["records"] = params["records"];
        if ("writable" in params) this["writable"] = params["writable"];
        this.index = {}
        return this;
    };

    Bag.getPrimaryKey = function () {
        return this.metaData.getPrimaryKey();
    };

    Bag.getIndex = function (column) {
        var index = null;

        if (column in this.metaData.columns) {

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



        var primaryKey = metaData.getPrimaryKey();
        var selectOutput = [primaryKey];





        var selectType = Jane.Utility.objectType(selectInput);
        var selectInputSplit = (selectType == "string") ? selectInput.split(/,([^,]*)/g) : selectInput;
        for (var i = 0, count = selectInputSplit.length; i < count; ++i) {
            if (selectInputSplit[i].length > 0) {
                var columnName = selectInputSplit[i].replace(/^\s*\[?\s*(.*)/, "$1");
                columnName = columnName.replace(/((\s*[^\s\]]+)+)\s*\]?\s*$/, "$1");



                var columnMetaData = metaData.getMappedColumn(columnName);
                if (columnMetaData != null) {
                    if (columnMetaData.name != primaryKey) {
                        selectOutput.push(columnMetaData.name);
                    } else {
                        if (typeof window.top.console !== "undefined") window.top.console.log ("SELECT: Skipping column (" + columnName + " - the PK is automatically included)");
                    }
                } else {
                    if (typeof window.top.console !== "undefined") window.top.console.log ("SELECT: Skipping invalid column (" + columnName + ")");
                }
            }
        }


        return (selectOutput.length > 0) ? selectOutput : null;
    };

    Bag.selectMetaData = function (selectArray, metaData) {
        if (selectArray != null) {
            var newMetaData = Object.create(Jane.MetaData).init();
            for (var i = 0, count = selectArray.length; i < count; ++i) {

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
                columnName = columnName.replace(/^\s*\[?\s*(.*)/, "$1");
                columnName = columnName.replace(/((\s*[^\s\]]+)+)\s*\]?\s*$/, "$1");



                var columnMetaData = metaData.getMappedColumn(columnName);
                if (columnMetaData != null) {
                    sortOutput.push({ "name": columnMetaData.name, "asc": (asc == "asc") });
                } else {
                    if (typeof window.top.console !== "undefined") window.top.console.log ("SORT: Skipping invalid column (" + columnName + ")");
                }
            }
        }


        return (sortOutput.length > 0) ? sortOutput : null;
    };

    Bag.query = function (select, where, transform, sort, writable) {

        var namespace = this.namespace;
        var metaData = this.metaData;
        var selectArray = this.compileSelect(select, metaData);
        metaData = this.selectMetaData(selectArray, metaData);
        var whereFilter = this.compileWhere(where, metaData);
        var sortArray = this.compileSort(sort, metaData);
        var records = this.records;



        var range = {};
        for (var i = 0, count = records.length; i < count; ++i) {
            range[i] = i;
        }
        if (whereFilter != null) {
            range = whereFilter.getRange(this, range);
        }



        var newRecords = [];
        var rangeEntries = Object.getOwnPropertyNames(range);


        rangeEntries.sort ();
        for (var i = 0, count = rangeEntries.length; i < count; ++i) {
            var index = rangeEntries[i];
            var record = records[index];


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


            if (transform != null) {
                record = transform.handleRecord(record, writable);
            }


            newRecords.push(record);
        }


        if (sortArray != null) {
            newRecords.sort(function (a, b) {

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


        return Object.create(Bag).init({
            "namespace" : namespace,
            "metaData" : metaData,
            "records" : newRecords,
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





Jane.Transform = function (base) {
    var Transform = Object.create(base);
    return Transform;
}(null);






Jane.Transform.Assemble = function (base) {
    var Assemble = Object.create(base, {
        "name": {
            "value": "Assemble",
            "enumerable": true,
            "writable": false
        }
    });

    Assemble.init = function (params) {

        if ("displayName" in params) this["displayName"] = params["displayName"];
        if ("values" in params) this["values"] = params["values"];
        return this;
    };

    Assemble.handleRecord = function (record, writable) {
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






Jane.Transform.Extract = function (base) {
    var Extract = Object.create(base, {
        "name": {
            "value": "Extract",
            "enumerable": true,
            "writable": false
        },
        "extract": {
            "value": "xxx",
            "enumerable": true,
            "writable": true
        }
    });

    Extract.init = function (params) {

        if ("extract" in params) this["extract"] = params["extract"];
        return this;
    };

    Extract.handleRecord = function (record, writable) {




        if (this.extract in record) {
            return writable ? Object.create(record[this.extract]) : record[this.extract];
        } else {

            if (typeof window.top.console !== "undefined") window.top.console.log ("Can't extract '" + this.extract + "' from record");
            debugger;
        }
        return record;
    };

    return Extract;
}(null);






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


        var into = Object.create(null);
        this.enumerateRecord(record, into);
        return into;
    };

    return Flatten;
}(null);






Jane.Transform.Compound = function (base) {
    var Compound = Object.create(base, {
        "name": {
            "value": "Compound",
            "enumerable": true,
            "writable": false
        }
    });

    Compound.init = function (params) {

        if ("transforms" in params) this["transforms"] = params["transforms"];
        return this;
    };

    Compound.handleRecord = function (record, writable) {


        for (var i = 0, count = this.transforms.length; i < count; ++i) {
            record = this.transforms[i].handleRecord(record, writable);



            writable = false;
        }
        return record;
    };

    return Compound;
}(null);
Jane.DataObject = function (base) {
    var DataObject = Object.create(base, {
        "allowFlushForSubscription": {
            "value": false,
            "enumerable": true,
            "writable": true
        }
    });

    DataObject.init = function (params) {

        base.init.call(this, params);


        this["select"] = ("select" in params) ? params["select"] : null;
        this["where"] = ("where" in params) ? params["where"] : null;
        this["transform"] = ("transform" in params) ? params["transform"] : null;
        this["sort"] = ("sort" in params) ? params["sort"] : null;

        if ("allowFlushForSubscription" in params) this["allowFlushForSubscription"] = params["allowFlushForSubscription"];


        return Jane.addDataReference(this);
    };

    DataObject.canAddSubscriber = function (contract) {

        if (! Jane.Utility.objectIsEmpty (contract)) {


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



            if (this.hasBag() && this.bag.writable) {





                if (this.allowFlushForSubscription) {
                    this.flush();
                } else {
                    return false;
                }
            }
        }


        return true;
    };

    DataObject.addSubscriberWithContract = function (target, contract) {
        if (this.canAddSubscriber(contract)) {
            var subscriber = base.addSubscriber.call(this, target);
            if (subscriber != null) {
                subscriber["contract"] = contract;







            }
            return subscriber;
        }
        return null;
    };

    DataObject.addSubscriberReadOnly = function (target) {
        return this.addSubscriberWithContract(target, {});
    };

    DataObject.addSubscriber = function (target) {


        return null;
    };

    DataObject.hasBag = function () {
        return ("bag" in this);
    };

    DataObject.getBag = function () {
        return this.hasBag() ? this.bag : null;
    };

    DataObject.getBagIsWritable = function () {

        if (this.hasBag()) { return this.bag.writable; }



        for (var i = 0, count = this.subscribers.length; i < count; ++i) {
            var subscriber = this.subscribers[i];
            if (! Jane.Utility.objectIsEmpty (subscriber.contract)) {
                return true;
            }
        }


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
}(EventSource);
Jane.DataObjectReference = function (base) {
    var DataObjectReference = Object.create(base);

    DataObjectReference.init = function (params) {

        if ("source" in params) this["source"] = params["source"];


        var dataObject = base.init.call(this, params);
        if (dataObject !== null) {

            this.monitor = Object.create(EventSubscriber).init({ "name": (this.name + ".monitor") });
            var self = this;
            this.monitor.receiveEvent = function (source, event, parameter) {

                self.handleSourceEvent(source, event, parameter);
            };
            this.source.addSubscriberReadOnly(this.monitor);
        }
        return dataObject;
    };

    DataObjectReference.handleSourceEvent = function (source, event, parameter) {
        if (typeof window.top.console !== "undefined") window.top.console.log (this.name + " receives " + event + " from " + source.name);
        switch (event) {
            case Jane.events.DATA_POPULATED:

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

                this.flush();
                break;
            default:
                break;
        }
    };

    DataObjectReference.populateExec = function () {

        base.populateExec.call(this);

        var sourceBag = this.source.getBag ();
        if (sourceBag != null) {
            this.populateResponse(sourceBag, Jane.events.DATA_POPULATED);
        } else {
            this.source.populate();
        }
    };

    return DataObjectReference;

}(Jane.DataObject);




Jane.DataObjectEspace = function (base) {
    var DataObjectEspace = Object.create(base);

    DataObjectEspace.init = function (params) {

        if ("resultSetUrl" in params) this["dataUrl"] = params["resultSetUrl"];
        if ("cdmMapUrl" in params) this["metaDataUrl"] = params["cdmMapUrl"];
        if ("resultSetId" in params) this["resultSetId"] = params["resultSetId"];
        if ("numRows" in params) this["recordCount"] = params["numRows"];


        params["name"] = params.dataSourceName + " (" + params.resultSetName + ")";
        return base.init.call(this, params);
    };

    DataObjectEspace.populateExec = function () {

        base.populateExec.call(this);


        var scope = this;
        $.getJSON(this.dataUrl, function (data) {



            if (typeof window.top.console !== "undefined") window.top.console.log (scope.name + " populate metaData");
            var metaData = Object.create(Jane.MetaData).init({});


            var espaceMetaData = data.table.metaData.rowSetMetadata;
            var columns = espaceMetaData.columnMetadata;
            Object.getOwnPropertyNames(columns).forEach(function (key) {
                var column = columns[key];
                var type = (column.types.length > 0) ? column.types[0] : "string";
                metaData.addColumn(column.displayName, type, column.tags);
            });

            var assembledColumns = [];


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


            var transforms = [Object.create(Jane.Transform.Extract).init({ "extract": "data" })];



            for (var i = 0, count = assembledColumns.length; i < count; ++i) {
                var assembledColumn = assembledColumns[i];
                metaData.addColumn(assembledColumn.displayName, assembledColumn.typeName, []);
                var transformAssemble = Object.create(Jane.Transform.Assemble).init(assembledColumn);
                transforms.push(transformAssemble);
            }
            scope.transform = Object.create(Jane.Transform.Compound).init({ "transforms": transforms });


            var bag = Object.create(Jane.Bag).init({
                "namespace" : "espace",
                "metaData" : metaData,
                "records" : data.table.rows,
                "writable" : false
            });


            scope.populateResponse(bag, Jane.events.DATA_POPULATED);
        });
    };

    return DataObjectEspace;
}(Jane.DataObject);
