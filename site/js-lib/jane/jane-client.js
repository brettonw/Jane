var Jane = Object.create(null);
Jane.onJane = function (callback) {
    var waitForJane = function () {
        // check if Jane is installed
        if (("Jane" in window.top) && (window.top.Jane !== undefined) && ("isJane" in window.top.Jane)) {
            if (typeof window.top.console !== "undefined") {
                window.top.console.log ("Found Jane");
            }
            Jane = window.top.Jane;
            callback.call ();
        } else {
            // try again in a second
            setTimeout(waitForJane, 1000);
        }
    };
    waitForJane ();
};
