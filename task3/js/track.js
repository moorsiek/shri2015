~function() {
    function Track(data) {
        $.extend(this, {
            playing: false,
            paused: false,
            _startTime: null,
            _pausedAt: null
        }, data);

    }

    Track.prototype.toggle = function () {
        if (this.playing) {
            this.pause();
        } else {
            this.play()
        }
    };
    Track.prototype.play = function () {
        if (this.playing) {
            return;
        }
        this._source = this.ctx.createBufferSource();
        this._source.buffer = this.audioBuffer;
        this._source.connect(this.targetNode);
        this._startTime = this.ctx.currentTime;
        if (this.paused) {
            this._source.start(0, this._pausedAt);
            this._startTime -= this._pausedAt;
            this._pausedAt = null;
            this.paused = false;
        } else {
            this._source.start(0);
        }
        this.playing = true;
    };
    Track.prototype.pause = function () {
        if (!this.playing) {
            return;
        }
        this.playing = false;
        this.paused = true;
        this._source.stop();
        this._pausedAt = this.ctx.currentTime - this._startTime;
    };
    Track.prototype.seek = function (pos) {
        if (this.playing) {

        }
    };
    Track.prototype.stop = function () {
        if (this.playing) {
            this._source.stop();
            this.playing = false;
        } else if (this.paused) {
            this.paused = false;
            this._pausedAt = null;
        }
    };

    window.Track = Track;
}();