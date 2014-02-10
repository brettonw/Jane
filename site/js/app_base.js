var knownResultSets = {};
var username = "NOBODY";
function addFromServer() {
    var resultSetsUrl = "/espace/rest/ResultSets/?user=" + username;
    $.getJSON(resultSetsUrl, function (resultSets) {
        var removedResultSets = {};
        Object.getOwnPropertyNames(knownResultSets).forEach(function (key) {
            removedResultSets[key] = knownResultSets[key];
        });

        for (var i = 0, count = resultSets.length; i < count; ++i) {
            // create data object references for each result set, this 
            // will only succeed for result sets that aren't already in
            // the Jane memory
            var resultSet = resultSets[i];
            var espaceJdr = Object.create(Jane.DataObjectEspace).init(resultSet);
            delete removedResultSets[resultSet.dataSourceName + " (" + resultSet.resultSetName + ")"];
            if (espaceJdr !== null) {
                knownResultSets[espaceJdr.name] = espaceJdr;
            }
        }

        // remove data refs that have been deleted
        Object.getOwnPropertyNames(removedResultSets).forEach(function (key) {
            Jane.removeDataReference(removedResultSets[key]);
        });
    });
}

function runApp() {
    var refresh = function () {
        addFromServer();
        setTimeout(refresh, 10000);
    };

    var getUser = function () {
        if (username == "NOBODY") {
            if (typeof Ozone != "undefined") {
                Ozone.pref.PrefServer.getCurrentUser({
                    onSuccess: function (response) {
                        username = response.currentUserName;
                        refresh();
                    }
                });
            }

            // try again in a second
            setTimeout(getUser, 1000);
        }
    }
    getUser();
}
