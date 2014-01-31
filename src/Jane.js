//------------------------------------------------------------------------------
// Jane is a data source manager for client-only operations on result sets. It
// is designed to be a lazy instantiator of queries, filters, and transform-
// ations using shallow copies to manage memory utilization. 
//
// Messaging is accomplished using a simple direct subscriber mechanism, rather
// than use channels or any universal publish and subscribe methodology.
//
// We include a "contract" for subscribers so that lazy instantiations can be 
// shared across widgets when we can guarantee they won't conflict with each 
// other in use.
//
//------------------------------------------------------------------------------
var Jane = function (base) {
    var Jane = Object.create (base).init ({ "name" : "Jane" });
    Jane.isJane = "isJane";

    Jane.monitor = Object.create (EventSubscriber).init ({ "name" : "Jane.monitor" });
    Jane.monitor.receiveEvent = function (source, event, parameter) {
        DEBUGLOG(this.name + " receives " + event + " from " + source.name);
        // Jane is merely letting an outside client know that something happened. 
        // No parameters are passed along.
        Jane.postEvent (event, null);
    };

    Jane.constants = {
        D_STRING(PK)
    };

    Jane.events = {
        D_STRING(DATA_REFERENCE_ADDED),
        D_STRING(DATA_REFERENCE_SELECTED),
        D_STRING(DATA_REFERENCE_REMOVED),

        D_STRING(DATA_POPULATING),
        D_STRING(DATA_POPULATED),
        D_STRING(DATA_FLUSHED),
        D_STRING(DATA_CHANGED),
        D_STRING(HIGHLIGHT_CHANGED)
    };

    Jane.dataRefs = { 
        index : {}, 
        root  : null,
        depth : 0,

        addNode : function (name, dataRef) {
            DEBUGLOG("node - " + name);
            var parent = ((dataRef != null) && ("source" in dataRef) && (dataRef.source.name in this.index)) ? this.index[dataRef.source.name] : this.root;
            var depth = (parent != null) ? parent.depth + 1 : 0;
            this.depth = Math.max (depth, this.depth);
            var node = {
                "name"          : name,
                "depth"         : depth,
                "children"      : [],
                "parent"        : parent,
                "dataRef"       : dataRef
            };
            this.index[name] = node;
            if (parent != null) {
                parent.children.push (node);
            }
            return node;
        },

        removeNode: function (node) {
            // recursive function to remove the node starting with all its children
            while (node.children.count > 0) {
                var child = node.children[0];
                this.removeNode (child);
            }

            // remove this node from it's parent's list
            if (node.parent != null) {
                var index = node.parent.children.indexOf (node);
                if (index >= 0) {
                    node.parent.children.splice (index, 1);
                }

                // let go of the parent
                node.parent = null;
            }

            // remove this node from the index
            delete this.index[node.name];
        }
    };
    Jane.dataRefs.root = Jane.dataRefs.addNode ("Jane", null);

    Jane.addDataReference = function (dataRef) {
        if (! (dataRef.name in this.dataRefs.index)) {
            this.dataRefs.addNode (dataRef.name, dataRef);
            dataRef.addSubscriberReadOnly(this.monitor);
            this.postEvent (Jane.events.DATA_REFERENCE_ADDED, dataRef);
            return dataRef;
        }
        return null;
    };

    Jane.removeDataReference = function (dataRef) {
        // remove the requested node, and any children as well
        if (dataRef.name in this.dataRefs.index) {
            var node = this.dataRefs.index[dataRef.name];
            // flush this data source
            node.dataRef.flush ();

            Jane.dataRefs.removeNode (node);
            this.postEvent (Jane.events.DATA_REFERENCE_REMOVED, dataRef);
        }
    };

    Jane.reset = function () {
        // remove all the children of the root
        while (this.dataRefs.root.children.length > 0) {
            this.removeDataReference (this.dataRefs.root.children[0].dataRef);
            this.dataRefs.depth = 0;
        }
    };

    Jane.getDataReference = function (name) {
        if (name in this.dataRefs.index) {
            return this.dataRefs.index[name].dataRef;
        }
        return null;
    };

    Jane.onJane = function () {
        // do nothing, but this is here as a placeholder in case a naive
        // user copies code from a widget that acts like this
        DEBUGLOG("ALERT - Use jane-client.js instead");
    };

    Jane.EventSource = EventSource;
    Jane.EventSubscriber = EventSubscriber;

    window.top.Jane = Jane;
    return Jane;
} (EventSource);

