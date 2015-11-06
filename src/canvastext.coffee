fontHeight = require './fontHeight'

canvastext = (config) ->
  return (->
    canvas = config.canvas
    ctx = config.canvas.getContext('2d')
    field =
      x: config.x
      y: config.y
      w: config.width
      h: config.height
    cursorpos = line: 0, character: 0
    lines = [""]
    lineHeight = fontHeight('font: ' + ctx.font)

    repaint = (->
      blink = true
      last = Date.now()
      ->
        ctx.clearRect(field.x, field.y, field.w, field.h)
        for line, i in lines
          ctx.fillText(line, field.x, field.y + (i + 1) * lineHeight)

        if (blink)
          curx = field.x + ctx.measureText(lines[cursorpos.line].substr(0, cursorpos.character)).width
          cury = field.y + cursorpos.line * lineHeight
          ctx.beginPath();
          ctx.moveTo(curx, cury)
          ctx.lineTo(curx, cury + lineHeight)
          ctx.stroke();

        if Date.now() - last >= 450
          blink = !blink
          last = Date.now()
    )()
    setInterval(repaint, 500)

    append = (character) ->
      cursorpos.character++
      lines[cursorpos.line] += character
      repaint()

    remove = ->
      if cursorpos.character > 0
        char = cursorpos.character--
        lines[cursorpos.line] = lines[cursorpos.line].slice(0, -1)
        repaint()
      else if cursorpos.line > 0
        cursorpos.line--
        cursorpos.character = lines[cursorpos.line].length
        lines.pop()
        repaint()

    lineBreak = ->
      cursorpos.line++
      lines.push('') if lines.length == cursorpos.line
      cursorpos.character = lines[cursorpos.line].length

    onKeyPress = (e) ->
      append String.fromCharCode(e.keyCode || e.which)

    onKeyDown = (e) ->
      key = e.keyCode || e.which
      console.log key
      switch key
        when 8 then remove()
        when 13 then lineBreak()
        else return
      e.preventDefault()

    document.addEventListener('keypress', onKeyPress)
    document.addEventListener('keydown', onKeyDown)
  )()

module.exports =
  field: (config) -> canvastext(config)
