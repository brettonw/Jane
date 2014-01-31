//------------------------------------------------------------------------------
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

}(Jane.DataObject);