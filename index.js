class VBlock {
  // position は Vec2
  // width:height は 4:3 くらい。
  constructor(width, height, position, rotation = 0) {
    this.halfSize = new Vec2(width, height)
    this.position = position

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
    }

    if (this.vBlocks[this.vBlocks.length - 1].isOffScreen(canvas)) {
      this.vBlocks.pop()
    }
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

// Entry point.
var canvas = new Canvas(document.body, 512, 512)
var vScrolls = []

var x = 0
while (x < canvas.width) {
  var blockWidth = randRange(8, 32) // 4 も面白い。
  x += blockWidth + 1
  vScrolls.push(new VScroll(canvas, x, randRange(0.5, 3), blockWidth))
  x += blockWidth + 1
}

animate()

// If startup is succeeded, remove "unsupported" paragaraph.
document.getElementById("unsupported").outerHTML = ""
