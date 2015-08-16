~function(){
    function Playlist(elem){
        mixEventEmitter(this);
        this._elem = elem;
        this._$elem = $(elem);
        this._tracks = [];
        this._currentTrackId = 0;
        this._init();
    }
    Playlist.prototype._init = function(){
        this._tmpl = _.template($('#tmpl_tracks').html());
        this._bindHandlers();
        this._render();
    };
    Playlist.prototype._bindHandlers = function(){
        var that = this;
        this._$elem
            .on('click', '.tracks__remove', function(e){
                e.preventDefault();
                e.stopPropagation();
                var id = +$(this).closest('.tracks__track').data('trackId');
                that.removeTrack(id);
            })
            .on('click', '.tracks__track', function(e){
                e.preventDefault();
                var id = +$(this).data('trackId');
                that._currentTrackId = id;
                that._render();
                that.emit('play', that._tracks[that._currentTrackId]);
            });
    };
    Playlist.prototype._updateOrder = function(){
        this._tracks.forEach(function(track, idx){
            track.id = idx;
        });
    };
    Playlist.prototype.addTracks = function(tracks){
        this._tracks = this._tracks.concat(tracks);
        this._updateOrder();
        this._render();
    };
    Playlist.prototype._render = function(){
        this._$elem.find('.tracks')
            .empty()
            .html(this._tmpl({
                tracks: this._tracks,
                currentTrackId: this._currentTrackId
            }));
        if (!this._tracks.length) {
            this._$elem.find('.playlist__hint').removeClass('playlist__hint_hidden');
        } else {
            this._$elem.find('.playlist__hint').addClass('playlist__hint_hidden');
        }
    };
    Playlist.prototype.clear = function(){
        this._tracks = [];
        this._render();
    };
    Playlist.prototype.removeTrack = function(id){
        this._tracks.splice(id, 1);
        this._updateOrder();
        if (this._currentTrackId === id) {
            this._currentTrackId = 0;
        }
        this.emit('removeTrack', id);
        this._render();
    };
    Playlist.prototype.getCurrentTrack = function(){
        return this._tracks[this._currentTrackId];
    };
    Playlist.prototype.getPrevTrack = function(){
        var id = this._currentTrackId - 1;
        if (id < 0) {
            id = this._tracks.length - 1;
        }
        this._currentTrackId = id;
        this._render();
        return this._tracks[this._currentTrackId];
    };
    Playlist.prototype.getNextTrack = function(){
        var id = this._currentTrackId + 1;
        if (id >= this._tracks.length) {
            id = 0;
        }
        this._currentTrackId = id;
        this._render();
        return this._tracks[this._currentTrackId];
    };
    window.Playlist = Playlist;
}();