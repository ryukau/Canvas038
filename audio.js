export class AudioMaster {
  constructor() {
    this.ctx = new AudioContext()

    this.gain = createGain(this.ctx, 1)
    this.gain.connect(this.ctx.destination)

    this.highpass = createBiquadFilter(this.ctx, "highpass", 20, 0, 0)
    this.highpass.connect(this.gain)
  }
}

// buffer ---------------------------------------------------------------------
export function playBuffer(ctx, buffer) {
  var source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start()
}

export function toAudioBuffer(ctx, wave) {
  var buffer = ctx.createBuffer(channel, frame, ctx.sampleRate)
  for (var ch = 0; ch < channel; ++ch) {
    buffer.copyToChannel(new Float32Array(wave[ch]), ch, 0)
  }
  return buffer
}

export function renderTestBuffer(ctx, channel, frame) {
  var wave = new Array(channel)
  for (var ch = 0; ch < channel; ++ch) {
    wave[ch] = new Array(frame)
    var freq = 1000 * (ch + 1)
    var two_pi_f_per_fs = 2 * Math.PI * freq / ctx.sampleRate
    for (var i = 0; i < wave[ch].length; ++i) {
      wave[ch][i] = 0.1 * Math.sin(i * two_pi_f_per_fs)
    }
  }
  return toAudioBuffer(ctx, wave)
}

// create nodes ---------------------------------------------------------------
export function createBiquadFilter(ctx, type, frequency, Q, gain = 0) {
  var filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = frequency
  filter.Q.value = Q
  filter.gain.value = gain
  return filter
}

export function createDelay(ctx, time, maxTime) {
  var delay = ctx.createDelay(maxTime)
  delay.delayTime.value = time
  return delay
}

export function createGain(ctx, gain) {
  var gainNode = ctx.createGain()
  gainNode.gain.value = gain
  return gainNode
}

export function createOscillator(ctx, type, frequency, detune) {
  var osc = ctx.createOscillator()
  osc.type.value = type
  osc.frequency.value = frequency
  osc.detune.value = detune
  return osc
}

export function createStereoPanner(ctx, pan) {
  var panner = ctx.createStereoPanner()
  panner.pan.value = pan
  return panner
}

export function createWaveShaper(ctx, curve) {
  var shaper = ctx.createWaveShaper()
  shaper.oversample = "4x"
  shaper.curve = new Float32Array(curve)
  return shaper
}
