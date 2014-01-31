//------------------------------------------------------------------------------
// An EventSubscriber is a base class implementing a receiver event model.
//
// object interface
//  - function: addSource (source)
//  - function: removeSource (source)
//  - function: receiveEvent (source, event, parameter)
//
//  - property: name
//  - property: isEventSubscriber
//
// global interface
//  + function: clearSubscribers (body)
//
//------------------------------------------------------------------------------

var EventSubscriber = Object.create(null);

EventSubscriber.init = function (params) {
    // start by creating an empty subscriber list, and declaring this to be an 
    // event subscriber object
    this.sources = [];
    this.isEventSubscriber = true;

    // copy some parameters
    COPY_PARAM(name, params);

    return this;
};

EventSubscriber.addSource = function (source) {
	if (this.sources.indexOf (source) == -1) {
		DEBUGLOG("SUBSCRIBER - " +  this.name + " subscribes to " +source.name);
		this.sources.push(source);

		// tell the source to add this subscriber
		source.addSubscriber (this);
	}
};

EventSubscriber.removeSource = function (source) {
	var i = this.sources.indexOf(source);
	if (i >= 0) {
		DEBUGLOG("SUBSCRIBER - " + this.name + " unsubscribes from " + source.name);
		this.sources.splice(i, 1);

		// tell the source to remove this subscriber
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
	DEBUGLOG("SUBSCRIBER - " + this.name + " receiving " + event + " from " +source.name);
};

EventSubscriber.clearSubscribers = function (container) {
    Object.getOwnPropertyNames(container).forEach(function (name) {
        var subscriber = container[name];
        if ((subscriber != null) && (typeof subscriber === 'object') && ("isEventSubscriber" in subscriber)) {
            subscriber.removeAllSources();
        }
    });
};
