var targetJdr = null;
var queryCounter = 1;

function runApp() {
    var subs = {};
    this.onbeforeunload = function () {
        Jane.EventSubscriber.clearSubscribers(subs);
    };

    Jane.onJane(function () {
        subs.janeHandler = Object.create(Jane.EventSubscriber).init({ "name": "Jane Test UI.Event Handler" });
        subs.janeHandler.receiveEvent = function (sender, event, parameter) {
            console.log(this.name + " receives " + event + " from " + sender.name);
            if (event == Jane.events.DATA_REFERENCE_SELECTED) {
                targetJdr = parameter;
                if (targetJdr != null) {

                    // set the panel text to be the target JDr's name
                    var label = document.getElementById("divSelectedName");
                    label.innerHTML = targetJdr.name;

                    document.getElementById("queryName").value = targetJdr.name + " " + queryCounter;
                    document.getElementById("selectClause").value = "";
                    document.getElementById("whereClause").value = "";
                    document.getElementById("sortClause").value = "";
                }
            }
        };
        Jane.addSubscriber(subs.janeHandler);
    });
}

function AddCopy() {
    if (targetJdr != null) {
        // create and configure a copy of the source
        var queryName = document.getElementById("queryName").value;
        if (queryName.length == 0) {
            queryName = "Copy " + queryCounter;
        }
        ++queryCounter;
        var selectClause = document.getElementById("selectClause").value;
        var whereClause = document.getElementById("whereClause").value;
        var sortClause = document.getElementById("sortClause").value;
        Object.create(Jane.DataObjectReference).init({
            "name": queryName,
            "source": targetJdr,
            "select": selectClause,
            "where": Object.create(Jane.Filter.And).init({
                "filters": [
                    Object.create(Jane.Filter.Operator).init({
                        "column": "Current Grade",
                        "operator": "=",
                        "value": "A"
                    }),
                    Object.create(Jane.Filter.Operator).init({
                        "column": "Name",
                        "operator": "<",
                        "value": "E"
                    })
                ]
            }),
            "sort": sortClause
        });
    }
}
