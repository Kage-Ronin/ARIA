/**
 * AudioWorkletProcessor that downsamples mono float input to 16-bit PCM at 16 kHz.
 * Runs in the audio thread; posts Int16Array buffers to the main thread.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = options.processorOptions || {};
    this._inputRate = opts.inputSampleRate || sampleRate || 44100;
    this._outputRate = opts.outputSampleRate || 16000;
    this._ratio = this._inputRate / this._outputRate;
    this._phase = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel || channel.length === 0) return true;

    const out = [];
    for (let i = 0; i < channel.length; i++) {
      this._phase += 1;
      if (this._phase >= this._ratio) {
        this._phase -= this._ratio;
        const s = Math.max(-1, Math.min(1, channel[i]));
        out.push(s < 0 ? s * 0x8000 : s * 0x7fff);
      }
    }

    if (out.length > 0) {
      const buf = new Int16Array(out);
      // Transfer ownership — zero-copy to main thread
      this.port.postMessage(buf.buffer, [buf.buffer]);
    }
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
