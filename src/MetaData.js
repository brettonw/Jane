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
}(null);