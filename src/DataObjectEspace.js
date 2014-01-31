//------------------------------------------------------------------------------
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