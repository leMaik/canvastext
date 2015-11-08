fontHeight = require './fontHeight'
textSelection = require './selectedText'

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
    selection = textSelection()
    lines = (config.text || '').split('\n')
    lineHeight = fontHeight('font: ' + ctx.font)

    repaint = (->
      blink = true
      last = Date.now()
      return (showCursor = true, forceCursor = false) ->
        lineHeight = fontHeight('font: ' + ctx.font)
        if config.clearContext?
          config.clearContext()
        else
          ctx.clearRect(field.x, field.y, field.w, field.h)
        drawtext(canvas, ctx, field.x, field.y, lines)
        selection.mark(canvas, ctx, field.x, field.y, lines)

        if (forceCursor || (showCursor && blink))
          curx = field.x + ctx.measureText(lines[cursorpos.line].substr(0, cursorpos.character)).width
          cury = field.y + cursorpos.line * lineHeight
          ctx.beginPath();
          ctx.moveTo(curx, cury)
          ctx.lineTo(curx, cury + lineHeight)
          ctx.stroke();

        if forceCursor || Date.now() - last >= 450
          blink = !blink || forceCursor
          last = Date.now()
    )()
    repaintInterval = setInterval(repaint, 500)

    insert = (character) ->
      if !selection.isEmpty()
        removeSelected()

      lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + character + lines[cursorpos.line].substr(cursorpos.character)
      cursorpos.character++
      repaint()

    removeSelected = ->
      try
        normalizedSelection = selection.normalize()
        start = normalizedSelection.start
        end = normalizedSelection.end

        lines[start.line] = lines[start.line].substr(0, start.character) + lines[end.line].substr(end.character)
        if end.line > start.line
          lines.splice(start.line + 1, end.line - start.line)
        cursorpos = start
        resetSelection()
        repaint(true, true)

    remove = ->
      if !selection.isEmpty()
        removeSelected()
      else if cursorpos.character > 0
        cursorpos.character--
        lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + lines[cursorpos.line].substr(cursorpos.character + 1)
        repaint(true, true)
      else if cursorpos.line > 0
        cursorpos.line--
        cursorpos.character = lines[cursorpos.line].length
        lines[cursorpos.line] += lines[cursorpos.line + 1]
        for i in [cursorpos.line + 1 ... lines.length - 1]
          lines[i] = lines[i + 1]
        lines.pop()
        repaint(true, true)

    forwardRemove = ->
      if !selection.isEmpty()
        removeSelected()
      else if cursorpos.character <  lines[cursorpos.line].length
        lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + lines[cursorpos.line].substr(cursorpos.character + 1)
        repaint(true, true)
      else if cursorpos.line < lines.length - 1
        lines[cursorpos.line] += lines[cursorpos.line + 1]
        for i in [cursorpos.line + 1 ... lines.length - 1]
          lines[i] = lines[i + 1]
        lines.pop()
        repaint(true, true)

    lineBreak = ->
      if !selection.isEmpty()
        removeSelected()

      cursorpos.line++
      lines.splice(cursorpos.line, 0, lines[cursorpos.line - 1].substr(cursorpos.character))
      lines[cursorpos.line - 1] = lines[cursorpos.line - 1].slice(0, cursorpos.character)
      cursorpos.character = 0
      repaint()

    navigate = (direction, extendSelection) ->
      oldCursorpos =
        line: cursorpos.line
        character: cursorpos.character

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

      if extendSelection
        selection.setEnd(cursorpos)
      else
        if !selection.isEmpty()
          #don't move the cursor if there was a selection previously
          cursorpos.character = oldCursorpos.character
          cursorpos.line = oldCursorpos.line
        resetSelection()
      repaint(true, true)

    resetSelection = ->
      selection.setStart cursorpos
      selection.setEnd cursorpos

    selectAll = ->
      selection.setStart line: 0, character: 0
      end =
        line: lines.length - 1
        character: lines[lines.length - 1].length
      selection.setEnd end
      cursorpos = end
      repaint(true, true)

    getCursorAt = (x, y) ->
      line = Math.min(lines.length - 1, Math.max(0, Math.floor((y - field.y) / lineHeight)))
      character = 0
      while character < lines[line].length && field.x + ctx.measureText(lines[line].substr(0, character + 1)).width <= x
        character++
      #TODO optimize this?

      line: line
      character: character

    mouseSelection = (->
      down = false
      down: (e) ->
        cursorpos = getCursorAt(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop)
        selection.setStart(cursorpos)
        selection.setEnd(cursorpos)
        repaint(true, true)
        down = true
      move: (e) ->
        if down
          cursorpos = getCursorAt(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop)
          selection.setEnd(cursorpos)
          repaint(true, true)
      up: (e) ->
        down = false
    )()

    onKeyPress = (e) ->
      insert String.fromCharCode(e.keyCode || e.which)
      if config.onChange?
        config.onChange(lines)

    onKeyDown = (e) ->
      key = e.keyCode || e.which
      switch key
        when 8 then remove()
        when 13
          if config.onEnterPressed? && !e.shiftKey
            config.onEnterPressed()
          else
            lineBreak()
        when 35 then navigate((if e.ctrlKey then 'end' else 'lineEnd'), e.shiftKey)
        when 36 then navigate((if e.ctrlKey then 'start' else 'lineStart'), e.shiftKey)
        when 37 then navigate('left', e.shiftKey)
        when 38 then navigate('up', e.shiftKey)
        when 39 then navigate('right', e.shiftKey)
        when 40 then navigate('down', e.shiftKey)
        when 46 then forwardRemove()
        when 65 # A
          if e.ctrlKey
            selectAll()
          else
            return
        else return
      e.preventDefault()
      if config.onChange?
        config.onChange(lines)

    document.addEventListener('keypress', onKeyPress)
    document.addEventListener('keydown', onKeyDown)
    canvas.addEventListener('mousedown', mouseSelection.down)
    canvas.addEventListener('mousemove', mouseSelection.move)
    canvas.addEventListener('mouseup', mouseSelection.up)
    canvas.addEventListener('mouseleave', mouseSelection.up)

    navigate('end')

    repaint: repaint
    text: ->
      lines.join('\n')
    dispose: ->
      document.removeEventListener('keypress', onKeyPress)
      document.removeEventListener('keydown', onKeyDown)
      canvas.removeEventListener('mousedown', mouseSelection.down)
      canvas.removeEventListener('mousemove', mouseSelection.move)
      canvas.removeEventListener('mouseup', mouseSelection.up)
      canvas.removeEventListener('mouseleave', mouseSelection.up)
      clearInterval(repaintInterval)
      repaint(false) #repaint without cursor
      return
  )()

module.exports =
  field: canvastext
  draw: drawtext
