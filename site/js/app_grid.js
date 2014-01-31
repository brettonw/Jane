function runApp() {
    var divDisplayGrid = null;
    var subs = {};

    // install the document closing handler
    var myWindow = this;
    this.onbeforeunload = function () {
        Jane.EventSubscriber.clearSubscribers(subs);
    };

    Jane.onJane(function () {
        // the event handler objects
        subs.gridHandler = Object.create(Jane.EventSubscriber).init({ "name": "Jane Grid UI.DATA Handler" });
        subs.gridHandler.receiveEvent = function (sender, event, parameter) {
            //console.log(this.name + " receives " + event + " from " + sender.name);
            if (event == Jane.events.DATA_POPULATED) {
                // get the bag
                var bag = sender.getBag();
                // get the data from the jdr
                var data = {
                    "rows": bag.records,
                    "getItem": function (index) {
                        return this.rows[index];
                    },
                    "getLength": function () {
                        return this.rows.length;
                    }
                };

                // adapt the metadata from the jdr
                var metaData = bag.metaData;
                var columns = [];
                for (var column in metaData.columns) {
                    columns.push({ "id": column, "name": column, "field": column });
                }

                // setup the options
                var options = {
                    enableCellNavigation: true,
                    enableColumnReorder: false
                };

                // create the slick grid interface
                new Slick.Grid("#divDisplayGrid", data, columns, options);
            }
        };

        subs.janeHandler = Object.create(Jane.EventSubscriber).init({ "name": "Jane Grid UI.SELECT Handler" });
        subs.janeHandler.receiveEvent = function (sender, event, parameter) {
            if (event == Jane.events.DATA_REFERENCE_SELECTED) {
                // remove any old grid
                if (divDisplayGrid !== null) {
                    subs.gridHandler.removeAllSources();
                    myWindow.document.body.removeChild(divDisplayGrid);
                }

                // create the div element in the body
                divDisplayGrid = myWindow.document.createElement("div");
                divDisplayGrid.id = "divDisplayGrid";
                myWindow.document.body.appendChild(divDisplayGrid);

                // prompt the grid to populate
                var jdr = parameter;
                if (jdr != null) {
                    jdr.addSubscriberReadOnly(subs.gridHandler);
                    jdr.post();
                }
            }
        };
        Jane.addSubscriber(subs.janeHandler);
    });
}
