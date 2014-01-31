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
}(EventSource);