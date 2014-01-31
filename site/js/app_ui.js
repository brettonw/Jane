function runApp() {
    var subs = {};
    this.onbeforeunload = function () {
        Jane.EventSubscriber.clearSubscribers(subs);
    };

    Jane.onJane(function () {
        buildTree();
        subs.eventHandler = Object.create(Jane.EventSubscriber).init({ "name": "Jane UI.Event Handler" });
        subs.eventHandler.receiveEvent = function (sender, event, parameter) {
            drawTree();
        };
        Jane.addSubscriber(subs.eventHandler);
    });
}
