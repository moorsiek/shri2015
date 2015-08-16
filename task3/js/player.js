~function(){
    function Player(elem, o){
        this._opts = $.extend({}, Player.defaults, o);
        this._elem = elem;
        this._$elem = $(elem);
        this.init();
        this.bindHandlers();
    }
    Player.prototype.init = function(){
        $.extend(this, {
            _currentTrack: null,
            _isPlaying: false
        });
        this._initPlaylist();
        this.initAudioContext();
        this._initSpectrum();
    };
    Player.prototype._initPlaylist = function(){
        var that = this;
        this._playlist = new Playlist(this._$elem.find('.playlist'));
        this._playlist
            .on('removeTrack', function(id){
                if (that._currentTrack && that._currentTrack.id == id) {
                    that.stop();
                    that._currentTrack = that._playlist.getCurrentTrack();
                }
            })
            .on('play', function(track){
                if (that._currentTrack) {
                    that._currentTrack.stop();
                }
                that._currentTrack = track;
                track.play();
                that._spectrum.turnOn();
            });
    };
    Player.prototype.initAudioContext = function(){
        var _AudioContext = window.AudioContext || window.WebkitAudioContext;
        if (!_AudioContext) {
            throw new Error('Audio API is not supported!');
        }
        this._audioCtx = new _AudioContext;

        this._gainNode = this._audioCtx.createGain();

        this._analyser = this._audioCtx.createAnalyser();
        this._analyser.smoothingTimeConstant = 0.3;
        this._analyser.fftSize = 256;

        this._processorNode = this._audioCtx.createScriptProcessor(2048, 1, 1);
        this._gainNode.connect(this._processorNode);
        this._processorNode.connect(this._audioCtx.destination);

        this._gainNode.connect(this._audioCtx.destination);
    };
    Player.prototype._initSpectrum = function(){
        this._spectrum = new Spectrum(this._$elem.find('.spectrum'), {
            ctx: this._audioCtx,
            in: this._gainNode,
            out: this._audioCtx.destination
        });
        //this._spectrum.turnOn();
    };
    Player.prototype.bindHandlers = function(){
        var that = this;
        this._$elem.find('.controls__play').click(_.bind(this.play, this));
        this._$elem.find('.controls__pause').click(_.bind(this.pause, this));
        this._$elem.find('.controls__stop').click(_.bind(this.stop, this));
        this._$elem.find('.controls__next').click(_.bind(this.playNext, this));
        this._$elem.find('.controls__prev').click(_.bind(this.playPrev, this));
        this._$elem.find('.controls__volume').change(function(e){
            that._gainNode.gain.value = +$(this).val()/100;
        });
        this._$elem
            .on('dragover', function(e){
                e.preventDefault();
                that._$elem.addClass('player_dragover');
            })
            .on('dragleave', function(e){
                e.preventDefault();
                that._$elem.removeClass('player_dragover');
            })
            .on('drop', function(e){
                e.preventDefault();
                that._$elem.removeClass('player_dragover');
                return that.handleDragDrop(e);
            });
    };
    Player.prototype.handleDragDrop = function(e){
        var that = this,
            ev = e.originalEvent,
            files,
            left,
            tracks = [];

        if (!ev.dataTransfer.files.length) {
            return false;
        }
        files = Array.prototype.slice.call(ev.dataTransfer.files)
            .filter(function(file){
                return (file instanceof File) && that._opts.allowedMimeTypes.indexOf(file.type) >= 0;
            });
        left = files.length;

        function anotherIsDone(){
            console.log(left);
            if (--left) {
                return;
            }
            that.addTracks(tracks);
        }

        files.forEach(function(file){
            var rdr = new FileReader;
            rdr.onloadend = function(e){
                var buff = rdr.result;
                rdr = null;
                that._audioCtx.decodeAudioData(buff, function(abuff){
                    var track = new Track({
                        buffer: buff,
                        audioBuffer: abuff,
                        name: file.name,
                        ctx: that._audioCtx,
                        targetNode: that._gainNode
                    });
                    tracks.push(track);
                    anotherIsDone();
                }, function(){
                    anotherIsDone();
                });
            };
            rdr.onerror = function(){
                rdr = null;
                anotherIsDone();
            };
            rdr.readAsArrayBuffer(file);
        });
    };
    Player.prototype.play = function(){
        if (!this._currentTrack) {
            this._currentTrack = this._playlist.getCurrentTrack();
        }
        if (this._currentTrack) {
            this._currentTrack.play();
            this._spectrum.turnOn();
        }
    };
    Player.prototype.pause = function(){
        if (!this._currentTrack) {
            return;
        }
        this._currentTrack.pause();
    };
    Player.prototype.stop = function(){
        if (!this._currentTrack) {
            return;
        }
        this._currentTrack.stop();
        this._spectrum.turnOff();
        this._spectrum.clear();
    };
    Player.prototype.playNext = function(){
        if (this._currentTrack) {
            this._currentTrack.stop();
        }
        this._currentTrack = this._playlist.getNextTrack();
        if (this._currentTrack) {
            this._currentTrack.play();
        }
    };
    Player.prototype.playPrev = function(){
        if (this._currentTrack) {
            this._currentTrack.stop();
        }
        this._currentTrack = this._playlist.getPrevTrack();
        if (this._currentTrack) {
            this._currentTrack.play();
        }
    };
    Player.prototype.clearPlaylist = function(){
        this._playlist.clear();
    };
    Player.prototype.addTracks = function(tracks){
        this._playlist.addTracks(tracks);
    };

    Player.defaults = {
        namespace: 'player',
        allowedMimeTypes: [
            'audio/ogg',
            'audio/webm',
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/x-pn-wav',
            'audio/mpeg',
            'audio/mp4',
            'audio/mp3'
        ]
    };

    window.Player = Player;

    function Track(data){
        $.extend(this, {
            playing: false,
            paused: false,
            _startTime: null,
            _pausedAt: null
        }, data);

    }
    Track.prototype.toggle = function(){
        if (this.playing) {
            this.pause();
        } else {
            this.play()
        }
    };
    Track.prototype.play = function(){
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
    Track.prototype.pause = function(){
        if (!this.playing) {
            return;
        }
        this.playing = false;
        this.paused = true;
        this._source.stop();
        this._pausedAt = this.ctx.currentTime - this._startTime;
    };
    Track.prototype.seek = function(pos){
        if (this.playing) {

        }
    };
    Track.prototype.stop = function(){
        if (this.playing) {
            this._source.stop();
            this.playing = false;
        } else if (this.paused) {
            this.paused = false;
            this._pausedAt = null;
        }
    };
}();