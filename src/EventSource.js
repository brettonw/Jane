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

