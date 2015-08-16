~function(){
    function Spectrum(elem, opts){
        $.extend(this, opts);
        this._elem = elem;
        this._$elem = $(elem);
        this._init();
    }
    Spectrum.prototype._init = function(){
        this._isOn = false;
        this._setupAudioNodes();
        this._setupCanvas();
        this.clear();
    };
    Spectrum.prototype._setupAudioNodes = function(){
        this._analyser = this.ctx.createAnalyser();
        this._analyser.smoothingTimeConstant = 0.3;
        this._analyser.fftSize = 512;
        this.in.connect(this._analyser);

        this._processor = this.ctx.createScriptProcessor(2048, 1, 1);
        this.in.connect(this._processor);
        this._processor.onaudioprocess = _.bind(this._tick, this);
    };
    Spectrum.prototype._setupCanvas = function(){
        this._$canvas = $(document.createElement('canvas'))
            .appendTo(this._$elem)
            .prop('width', 512)
            .prop('height', 256);
        this._2dCtx = this._$canvas.get(0).getContext('2d');
    };
    Spectrum.prototype._tick = function(){
        var ary = new Uint8Array(this._analyser.frequencyBinCount);
        console.log(this._analyser.frequencyBinCount);
        this._analyser.getByteFrequencyData(ary);

        this._2dCtx.clearRect(0, 0, 512, 256);
        this._2dCtx.fillStyle='#000000';
        for (var i = 0; i < ary.length; ++i) {
            this._2dCtx.fillRect(i * 2, 256 - ary[i], 1, 256);
        }
    };
    Spectrum.prototype.clear = function(){
        this._2dCtx.clearRect(0, 0, 512, 256);
    };
    Spectrum.prototype.turnOn = function(){
        this._isOn = true;
        this._processor.connect(this.out);
    };
    Spectrum.prototype.turnOff = function(){
        this._isOn = false;
        this._processor.disconnect();
    };

    window.Spectrum = Spectrum;
}();