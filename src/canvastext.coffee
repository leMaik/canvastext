fontHeight = require './fontHeight'

drawtext = (canvas, ctx, x, y, lines) ->
  lineHeight = fontHeight('font: ' + ctx.font)
  for line, i in lines
    ctx.fillText(line, x, y + (i + 1) * lineHeight)

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
    lines = (config.text || '').split('\n')
    lineHeight = fontHeight('font: ' + ctx.font)

    repaint = (->
      blink = true
      last = Date.now()
      return (showCursor = true) ->
        ctx.clearRect(field.x, field.y, field.w, field.h)
        drawtext(canvas, ctx, field.x, field.y, lines)

        if (showCursor && blink)
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

    insert = (character) ->
      lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + character + lines[cursorpos.line].substr(cursorpos.character)
      cursorpos.character++
      repaint()

    remove = ->
      if cursorpos.character > 0
        cursorpos.character--
        lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + lines[cursorpos.line].substr(cursorpos.character + 1)
        repaint()
      else if cursorpos.line > 0
        cursorpos.line--
        cursorpos.character = lines[cursorpos.line].length
        lines[cursorpos.line] += lines[cursorpos.line + 1]
        for i in [cursorpos.line + 1 ... lines.length - 1]
          lines[i] = lines[i + 1]
        lines.pop()
        repaint()

    forwardRemove = ->
      if cursorpos.character <  lines[cursorpos.line].length
        lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + lines[cursorpos.line].substr(cursorpos.character + 1)
        repaint()
      else if cursorpos.line < lines.length - 1
        lines[cursorpos.line] += lines[cursorpos.line + 1]
        for i in [cursorpos.line + 1 ... lines.length - 1]
          lines[i] = lines[i + 1]
        lines.pop()
        repaint()

    lineBreak = ->
      cursorpos.line++
      lines.splice(cursorpos.line, 0, lines[cursorpos.line - 1].substr(cursorpos.character))
      lines[cursorpos.line - 1] = lines[cursorpos.line - 1].slice(0, cursorpos.character)
      cursorpos.character = 0
      repaint()

    onKeyPress = (e) ->
      insert String.fromCharCode(e.keyCode || e.which)

    navigate = (direction) ->
      switch direction
        when 'up'
          if cursorpos.line > 0
            cursorpos.line--
            cursorpos.character = Math.min(lines[cursorpos.line].length, cursorpos.character)
        when 'down'
          if cursorpos.line < lines.length - 1
            cursorpos.line++
            cursorpos.character = Math.min(lines[cursorpos.line].length, cursorpos.character)
          else
            cursorpos.character = lines[cursorpos.line].length
        when 'left'
          if cursorpos.character > 0
            cursorpos.character--
          else if cursorpos.line > 0
            cursorpos.line--
            cursorpos.character = lines[cursorpos.line].length
        when 'right'
          if cursorpos.character < lines[cursorpos.line].length
            cursorpos.character++
          else if cursorpos.line < lines.length - 1
            cursorpos.line++
            cursorpos.character = 0
        when 'lineStart'
          cursorpos.character = 0
        when 'start'
          cursorpos.character = 0
          cursorpos.line = 0
        when 'lineEnd'
          cursorpos.character = lines[cursorpos.line].length
        when 'end'
          cursorpos.line = lines.length - 1
          cursorpos.character = lines[cursorpos.line].length
      repaint()

    onKeyDown = (e) ->
      key = e.keyCode || e.which
      switch key
        when 8 then remove()
        when 13 then lineBreak()
        when 35 then navigate(if e.ctrlKey then 'end' else 'lineEnd')
        when 36 then navigate(if e.ctrlKey then 'start' else 'lineStart')
        when 37 then navigate('left')
        when 38 then navigate('up')
        when 39 then navigate('right')
        when 40 then navigate('down')
        when 46 then forwardRemove()
        else return
      e.preventDefault()

    document.addEventListener('keypress', onKeyPress)
    document.addEventListener('keydown', onKeyDown)

    navigate('end')

    dispose: ->
      document.addEventListener('keypress', onKeyPress)
      document.addEventListener('keydown', onKeyDown)
      repaint(false) #repaint without cursor
      return
  )()

module.exports =
  field: canvastext
  draw: drawtext
