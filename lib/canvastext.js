(function() {
  var canvastext, drawtext, fontHeight, textSelection;

  fontHeight = require('./fontHeight');

  textSelection = require('./selectedText');

  drawtext = function(canvas, ctx, x, y, lines) {
    var i, j, len, line, lineHeight, results;
    lineHeight = fontHeight('font: ' + ctx.font);
    results = [];
    for (i = j = 0, len = lines.length; j < len; i = ++j) {
      line = lines[i];
      results.push(ctx.fillText(line, x, y + (i + 1) * lineHeight));
    }
    return results;
  };

  canvastext = function(config) {
    return (function() {
      var canvas, ctx, cursorpos, field, forwardRemove, insert, lineBreak, lineHeight, lines, navigate, onKeyDown, onKeyPress, remove, removeSelected, repaint, resetSelection, selection;
      canvas = config.canvas;
      ctx = config.canvas.getContext('2d');
      field = {
        x: config.x,
        y: config.y,
        w: config.width,
        h: config.height
      };
      cursorpos = {
        line: 0,
        character: 0
      };
      selection = textSelection();
      lines = (config.text || '').split('\n');
      lineHeight = fontHeight('font: ' + ctx.font);
      repaint = (function() {
        var blink, last;
        blink = true;
        last = Date.now();
        return function(showCursor, forceCursor) {
          var curx, cury;
          if (showCursor == null) {
            showCursor = true;
          }
          if (forceCursor == null) {
            forceCursor = false;
          }
          ctx.clearRect(field.x, field.y, field.w, field.h);
          drawtext(canvas, ctx, field.x, field.y, lines);
          selection.mark(canvas, ctx, field.x, field.y, lines);
          if (forceCursor || (showCursor && blink)) {
            curx = field.x + ctx.measureText(lines[cursorpos.line].substr(0, cursorpos.character)).width;
            cury = field.y + cursorpos.line * lineHeight;
            ctx.beginPath();
            ctx.moveTo(curx, cury);
            ctx.lineTo(curx, cury + lineHeight);
            ctx.stroke();
          }
          if (forceCursor || Date.now() - last >= 450) {
            blink = !blink || forceCursor;
            return last = Date.now();
          }
        };
      })();
      setInterval(repaint, 500);
      insert = function(character) {
        if (!selection.isEmpty()) {
          removeSelected();
        }
        lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + character + lines[cursorpos.line].substr(cursorpos.character);
        cursorpos.character++;
        return repaint();
      };
      removeSelected = function() {
        var e, end, j, line, normalizedSelection, ref, ref1, s, selectedTextEnd, selectedTextStart, start;
        normalizedSelection = selection.normalize();
        start = normalizedSelection.start;
        end = normalizedSelection.end;
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
        for (line = j = ref = start.line, ref1 = end.line; ref <= ref1 ? j <= ref1 : j >= ref1; line = ref <= ref1 ? ++j : --j) {
          s = selectedTextStart(line);
          e = selectedTextEnd(line);
          if (s === 0 && e === lines[line].length) {
            lines[line] = line === start.line ? '' : null;
          } else {
            lines[line] = lines[line].substring(0, s) + lines[line].substr(e);
          }
        }
        if (start.line !== end.line) {
          if (lines[end.line] !== null) {
            lines[start.line] += lines[end.line];
            lines.splice(end.line, 1);
          }
        }
        lines = lines.filter(function(line) {
          return line !== null;
        });
        if (lines.length === 0) {
          lines = [''];
        }
        resetSelection();
        return repaint(true, true);
      };
      remove = function() {
        var i, j, ref, ref1;
        if (!selection.isEmpty()) {
          return removeSelected();
        } else if (cursorpos.character > 0) {
          cursorpos.character--;
          lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + lines[cursorpos.line].substr(cursorpos.character + 1);
          return repaint(true, true);
        } else if (cursorpos.line > 0) {
          cursorpos.line--;
          cursorpos.character = lines[cursorpos.line].length;
          lines[cursorpos.line] += lines[cursorpos.line + 1];
          for (i = j = ref = cursorpos.line + 1, ref1 = lines.length - 1; ref <= ref1 ? j < ref1 : j > ref1; i = ref <= ref1 ? ++j : --j) {
            lines[i] = lines[i + 1];
          }
          lines.pop();
          return repaint(true, true);
        }
      };
      forwardRemove = function() {
        var i, j, ref, ref1;
        if (!selection.isEmpty()) {
          return removeSelected();
        } else if (cursorpos.character < lines[cursorpos.line].length) {
          lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + lines[cursorpos.line].substr(cursorpos.character + 1);
          return repaint(true, true);
        } else if (cursorpos.line < lines.length - 1) {
          lines[cursorpos.line] += lines[cursorpos.line + 1];
          for (i = j = ref = cursorpos.line + 1, ref1 = lines.length - 1; ref <= ref1 ? j < ref1 : j > ref1; i = ref <= ref1 ? ++j : --j) {
            lines[i] = lines[i + 1];
          }
          lines.pop();
          return repaint(true, true);
        }
      };
      lineBreak = function() {
        if (!selection.isEmpty()) {
          removeSelected();
        }
        cursorpos.line++;
        lines.splice(cursorpos.line, 0, lines[cursorpos.line - 1].substr(cursorpos.character));
        lines[cursorpos.line - 1] = lines[cursorpos.line - 1].slice(0, cursorpos.character);
        cursorpos.character = 0;
        return repaint();
      };
      navigate = function(direction, extendSelection) {
        var oldCursorpos;
        oldCursorpos = {
          line: cursorpos.line,
          character: cursorpos.character
        };
        switch (direction) {
          case 'up':
            if (cursorpos.line > 0) {
              cursorpos.line--;
              cursorpos.character = Math.min(lines[cursorpos.line].length, cursorpos.character);
            }
            break;
          case 'down':
            if (cursorpos.line < lines.length - 1) {
              cursorpos.line++;
              cursorpos.character = Math.min(lines[cursorpos.line].length, cursorpos.character);
            } else {
              cursorpos.character = lines[cursorpos.line].length;
            }
            break;
          case 'left':
            if (cursorpos.character > 0) {
              cursorpos.character--;
            } else if (cursorpos.line > 0) {
              cursorpos.line--;
              cursorpos.character = lines[cursorpos.line].length;
            }
            break;
          case 'right':
            if (cursorpos.character < lines[cursorpos.line].length) {
              cursorpos.character++;
            } else if (cursorpos.line < lines.length - 1) {
              cursorpos.line++;
              cursorpos.character = 0;
            }
            break;
          case 'lineStart':
            cursorpos.character = 0;
            break;
          case 'start':
            cursorpos.character = 0;
            cursorpos.line = 0;
            break;
          case 'lineEnd':
            cursorpos.character = lines[cursorpos.line].length;
            break;
          case 'end':
            cursorpos.line = lines.length - 1;
            cursorpos.character = lines[cursorpos.line].length;
        }
        if (extendSelection) {
          selection.setEnd(cursorpos);
        } else {
          if (!selection.isEmpty()) {
            cursorpos.character = oldCursorpos.character;
            cursorpos.line = oldCursorpos.line;
          }
          resetSelection();
        }
        return repaint(true, true);
      };
      resetSelection = function() {
        selection.setStart(cursorpos);
        return selection.setEnd(cursorpos);
      };
      onKeyPress = function(e) {
        return insert(String.fromCharCode(e.keyCode || e.which));
      };
      onKeyDown = function(e) {
        var key;
        key = e.keyCode || e.which;
        switch (key) {
          case 8:
            remove();
            break;
          case 13:
            lineBreak();
            break;
          case 35:
            navigate((e.ctrlKey ? 'end' : 'lineEnd'), e.shiftKey);
            break;
          case 36:
            navigate((e.ctrlKey ? 'start' : 'lineStart'), e.shiftKey);
            break;
          case 37:
            navigate('left', e.shiftKey);
            break;
          case 38:
            navigate('up', e.shiftKey);
            break;
          case 39:
            navigate('right', e.shiftKey);
            break;
          case 40:
            navigate('down', e.shiftKey);
            break;
          case 46:
            forwardRemove();
            break;
          default:
            return;
        }
        return e.preventDefault();
      };
      document.addEventListener('keypress', onKeyPress);
      document.addEventListener('keydown', onKeyDown);
      navigate('end');
      return {
        dispose: function() {
          document.addEventListener('keypress', onKeyPress);
          document.addEventListener('keydown', onKeyDown);
          repaint(false);
        }
      };
    })();
  };

  module.exports = {
    field: canvastext,
    draw: drawtext
  };

}).call(this);
