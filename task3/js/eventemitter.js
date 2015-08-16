~function(){
    var methods = {
        on: function(event, handler){
            this._eventHandlers[event] = this._eventHandlers[event] || [];
            idx = this._eventHandlers[event].indexOf(handler);
            if (idx !== -1) {
                return this;
            }
            this._eventHandlers[event].push(handler);
            return this;
        },
        off: function(event, handler){
            var idx;
            if (!this._eventHandlers[event]) {
                return this;
            }
            if (handler) {
                idx = this._eventHandlers[event].indexOf(handler);
                if (idx !== -1) {
                    this._eventHandlers[event].splice(idx, 1);
                }
            } else {
                this._eventHandlers[event] = [];
            }
            return this;
        },
        emit: function(event){
            var that = this,
                args = arguments;
            if (!this._eventHandlers[event]) {
                return this;
            }
            this._eventHandlers[event].forEach(function(handler){
                handler.apply(that, Array.prototype.slice.call(args, 1));
            });
            return this;
        }
    };
    function mixEventEmitter(obj){
        obj._eventHandlers = {};
        obj.on = methods.on;
        obj.off = methods.off;
        obj.emit = methods.emit;
    }

    window.mixEventEmitter = mixEventEmitter;
}();