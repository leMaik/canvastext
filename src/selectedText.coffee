fontHeight = require './fontHeight'

module.exports = ->
  _selection =
    start:
      line: 0
      character: 0
    end:
      line: 0
      character: 0

  normalize = ->
    start = _selection.start
    end = _selection.end
    if end.line < start.line || (end.line == start.line && end.character < start.character)
      tmp = end
      end = start
      start = tmp

    start:
      line: start.line
      character: start.character
    end:
      line: end.line
      character: end.character

  isEmpty = ->
    _selection.start.line == _selection.end.line &&
    _selection.start.character == _selection.end.character

  setStart: (start) ->
    _selection.start =
      line: start.line
      character: start.character

  setEnd: (end) ->
    _selection.end =
      line: end.line
      character: end.character

  getStart: () ->
    line: _selection.start.line
    character: _selection.start.character

  getEnd: () ->
    line: _selection.end.line
    character: _selection.end.character

  getText: (lines) ->
    text = []
    start = _selection.start
    end = _selection.end

    for line in [start.line..end.line]
      if line == start.line
        text.push(lines[line].substr(start.character))
      else if line == end.line
        text.push(lines[line].slice(0, -end.character))
      else
        text.push(lines[line])
    return text.join('\n')

  normalize: normalize
  isEmpty: isEmpty

  mark: (canvas, ctx, x, y, lines) ->
    normalizedSelection = normalize()
    start = normalizedSelection.start
    end = normalizedSelection.end

    return if isEmpty()

    ctx.save()

    lineHeight = fontHeight('font: ' + ctx.font)
    positionOf = (line, character) ->
      x: ctx.measureText(lines[line].slice(0, character)).width + x
      y: line * lineHeight + y

    selectedTextStart = (line) ->
      if line > start.line
        return 0
      else
        return start.character

    selectedTextEnd = (line) ->
      if line < end.line
        return lines[line].length
      else
        return end.character

    ctx.fillStyle = 'lightblue'
    ctx.globalCompositeOperation = 'multiply';

    for line in [start.line..end.line]
      s = positionOf(line, selectedTextStart(line))
      e = positionOf(line, selectedTextEnd(line))
      ctx.fillRect(s.x, s.y, e.x - s.x, lineHeight)

    ctx.restore()
