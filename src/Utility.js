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
}(null);