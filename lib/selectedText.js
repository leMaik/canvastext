(function() {
  var fontHeight;

  fontHeight = require('./fontHeight');

  module.exports = function() {
    var _selection, isEmpty, normalize;
    _selection = {
      start: {
        line: 0,
        character: 0
      },
      end: {
        line: 0,
        character: 0
      }
    };
    normalize = function() {
      var end, start, tmp;
      start = _selection.start;
      end = _selection.end;
      if (end.line < start.line || (end.line === start.line && end.character < start.character)) {
        tmp = end;
        end = start;
        start = tmp;
      }
      return {
        start: {
          line: start.line,
          character: start.character
        },
        end: {
          line: end.line,
          character: end.character
        }
      };
    };
    isEmpty = function() {
      return _selection.start.line === _selection.end.line && _selection.start.character === _selection.end.character;
    };
    return {
      setStart: function(start) {
        return _selection.start = {
          line: start.line,
          character: start.character
        };
      },
      setEnd: function(end) {
        return _selection.end = {
          line: end.line,
          character: end.character
        };
      },
      getStart: function() {
        return {
          line: _selection.start.line,
          character: _selection.start.character
        };
      },
      getEnd: function() {
        return {
          line: _selection.end.line,
          character: _selection.end.character
        };
      },
      getText: function(lines) {
        var end, i, line, ref, ref1, start, text;
        text = [];
        start = _selection.start;
        end = _selection.end;
        for (line = i = ref = start.line, ref1 = end.line; ref <= ref1 ? i <= ref1 : i >= ref1; line = ref <= ref1 ? ++i : --i) {
          if (line === start.line) {
            text.push(lines[line].substr(start.character));
          } else if (line === end.line) {
            text.push(lines[line].slice(0, -end.character));
          } else {
            text.push(lines[line]);
          }
        }
        return text.join('\n');
      },
      normalize: normalize,
      isEmpty: isEmpty,
      mark: function(canvas, ctx, x, y, lines) {
        var e, end, i, line, lineHeight, normalizedSelection, positionOf, ref, ref1, s, selectedTextEnd, selectedTextStart, start;
        normalizedSelection = normalize();
        start = normalizedSelection.start;
        end = normalizedSelection.end;
        if (isEmpty()) {
          return;
        }
        ctx.save();
        lineHeight = fontHeight('font: ' + ctx.font);
        positionOf = function(line, character) {
          return {
            x: ctx.measureText(lines[line].slice(0, character)).width + x,
            y: line * lineHeight + y
          };
        };
        selectedTextStart = function(line) {
          if (line > start.line) {
            return 0;
          } else {
            return start.character;
          }
        };
        selectedTextEnd = function(line) {
          if (line < end.line) {
            return lines[line].length;
          } else {
            return end.character;
          }
        };
        ctx.fillStyle = 'lightblue';
        ctx.globalCompositeOperation = 'multiply';
        for (line = i = ref = start.line, ref1 = end.line; ref <= ref1 ? i <= ref1 : i >= ref1; line = ref <= ref1 ? ++i : --i) {
          s = positionOf(line, selectedTextStart(line));
          e = positionOf(line, selectedTextEnd(line));
          ctx.fillRect(s.x, s.y, e.x - s.x, lineHeight);
        }
        return ctx.restore();
      }
    };
  };

}).call(this);
