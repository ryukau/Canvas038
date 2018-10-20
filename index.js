class VBlock {
  // position は Vec2
  // width:height は 4:3 くらい。
  constructor(width, height, position, rotation = 0) {
    this.halfSize = new Vec2(width, height)
    this.position = position
    this.rotation = rotation

    var top = this.position.y
    this.path = [
      new Vec2(-this.halfSize.x, -this.halfSize.y),
      new Vec2(0, this.halfSize.y),
      new Vec2(this.halfSize.x, -this.halfSize.y)
    ]
    for (let p of this.path) {
      p.rotate(rotation)
    }

    this.lineWidth = Math.floor(width / 4)
  }

  draw(canvas) {
    var ctx = canvas.context

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = this.lineWidth

    var top = this.position.y - this.halfSize.y

    ctx.beginPath()
    ctx.moveTo(
      this.position.x + this.path[0].x,
      this.position.y + this.path[0].y
    )
    for (var i = 1; i < this.path.length; ++i) {
      ctx.lineTo(
        this.position.x + this.path[i].x,
        this.position.y + this.path[i].y
      )
    }
    ctx.stroke()

    // debug
    // ctx.fillStyle = "#ff0000"
    // canvas.drawPoint(this.position, 10)
  }

  isOffScreen(canvas) {
    return canvas.isOffScreen(
      this.position.x - this.halfSize.x,
      this.position.y - this.halfSize.y,
      this.position.x + this.halfSize.x,
      this.position.y + this.halfSize.y
    )
  }
}

class VScroll {
  // density は v と v の間隔。
  constructor(canvas, xCenter, scrollSpeed, blockWidth) {
    this.canvas = canvas

    this.density = 1.5
    this.scrollSpeed = Math.max(0, scrollSpeed)
    this.xCenter = xCenter

    this.blockWidth = blockWidth
    this.blockHeight = blockWidth * 3 / 4
    this.rotation = 0
    this.vBlocks = []
    this.yInit = -this.blockHeight * (1 + this.density) + 1

    var y = this.yInit
    while (y < canvas.height + this.blockHeight * 2) {
      this.vBlocks.push(this.createVBlock(y))
      y += this.blockHeight * this.density
    }

    this.synth = new Synth(
      audioContext,
      master.gain,
      60 * Math.pow(2, (blockWidth + 0.01 * Math.random()) / 5),
      Math.max(-1, Math.min(2 * xCenter / canvas.width - 1, 1))
    )
  }

  createVBlock(yPos) {
    var sin = Math.max(0, Math.sin(Date.now() * 0.0001))
    return new VBlock(
      this.blockWidth + sin * randRange(-4, 2),
      this.blockHeight + sin * randRange(-4, 2),
      new Vec2(this.xCenter, yPos),
      this.rotation + sin * Math.PI * randRange(-0.1, 0.1)
    )
  }

  draw(canvas) {
    for (let v of this.vBlocks) {
      v.draw(canvas)
    }

    // move
    for (let v of this.vBlocks) {
      v.position.y += this.scrollSpeed
    }

    // If this.xCenter is out of screen, then all this.vBlocks may be popped
    // and program will crash. This condition prevents it.
    if (this.vBlocks.length <= 0) {
      this.vBlocks.unshift(this.createVBlock(this.yInit))
    }

    if (!this.vBlocks[0].isOffScreen(canvas)) {
      this.vBlocks.unshift(this.createVBlock(this.yInit))

      this.synth.play(this.vBlocks[0].rotation / Math.PI * 1000)
    }

    if (this.vBlocks[this.vBlocks.length - 1].isOffScreen(canvas)) {
      this.vBlocks.pop()
    }
  }
}

import { AudioMaster } from "./audio.js"

class Synth {
  constructor(ctx, parent, freq, pan) {
    this.ctx = ctx
    this.parent = parent

    this.panner = ctx.createStereoPanner()
    this.panner.pan.value = pan
    this.panner.connect(parent)

    this.buffer = this.createBuffer(this.ctx, freq)
  }

  createBuffer(ctx, freq) {
    console.log(freq)
    var wave = new Float32Array(
      Math.floor(this.ctx.sampleRate * 0.12 * Math.log10(20000 / freq))
    )

    var tick = 2 * Math.PI * freq / ctx.sampleRate
    var phase = 0
    for (var i = 0; i < wave.length; ++i) {
      phase += tick + 0.001 * Math.tanh(phase % 1)
      var decay = (wave.length - i) / wave.length
      decay *= decay * decay
      wave[i] = 0.01 * decay * (
        + 0.1 * Math.sin(1 * phase)
        + 1.0 * Math.sin(3 * phase)
        + 0.7 * Math.sin(7 * phase)
        + 0.03 * Math.sin(11 * phase * phase)
      )
    }

    var buffer = ctx.createBuffer(2, wave.length, ctx.sampleRate)
    buffer.copyToChannel(wave, 0, 0)
    buffer.copyToChannel(wave, 1, 0)
    return buffer
  }

  play(detune = 0) {
    var source = this.ctx.createBufferSource()
    source.buffer = this.buffer
    source.detune.value = detune
    source.connect(this.panner)
    source.start()
  }
}

function randRange(min, max) {
  return (max - min) * Math.random() + min
}

function draw(canvas) {
  for (let v of vScrolls) {
    v.draw(canvas)
  }
}

function refresh() {
  canvas.clearWhite()
  draw(canvas)
}

function animate() {
  refresh()
  requestAnimationFrame(animate)
}

function reset() {
  vScrolls = []

  var x = 0
  while (x < canvas.width) {
    var blockWidth = randRange(8, 32) // 4 も面白い。
    x += blockWidth + 1
    vScrolls.push(new VScroll(canvas, x, randRange(0.5, 3), blockWidth))
    x += blockWidth + 1
  }
}

// Entry point.
var master = new AudioMaster()
master.gain.gain.value = 0.5
var audioContext = master.ctx

var canvas = new Canvas(document.body, 512, 512)
var vScrolls = []

reset()

animate()

var numberInputGain = new NumberInput(document.body, "Gain",
  master.gain.gain.value, 0, 1, 0.01,
  (value) => { master.gain.gain.value = value },
  true
)

canvas.element.addEventListener("click", () => { reset() })

// If startup is succeeded, remove "unsupported" paragaraph.
document.getElementById("unsupported").outerHTML = ""
