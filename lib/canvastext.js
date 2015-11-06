(function() {
  var canvastext, fontHeight;

  fontHeight = require('./fontHeight');

  canvastext = function(config) {
    return (function() {
      var canvas, ctx, cursorpos, field, forwardRemove, insert, lineBreak, lineHeight, lines, navigate, onKeyDown, onKeyPress, remove, repaint;
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
      lines = [""];
      lineHeight = fontHeight('font: ' + ctx.font);
      repaint = (function() {
        var blink, last;
        blink = true;
        last = Date.now();
        return function() {
          var curx, cury, i, j, len, line;
          ctx.clearRect(field.x, field.y, field.w, field.h);
          for (i = j = 0, len = lines.length; j < len; i = ++j) {
            line = lines[i];
            ctx.fillText(line, field.x, field.y + (i + 1) * lineHeight);
          }
          if (blink) {
            curx = field.x + ctx.measureText(lines[cursorpos.line].substr(0, cursorpos.character)).width;
            cury = field.y + cursorpos.line * lineHeight;
            ctx.beginPath();
            ctx.moveTo(curx, cury);
            ctx.lineTo(curx, cury + lineHeight);
            ctx.stroke();
          }
          if (Date.now() - last >= 450) {
            blink = !blink;
            return last = Date.now();
          }
        };
      })();
      setInterval(repaint, 500);
      insert = function(character) {
        lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + character + lines[cursorpos.line].substr(cursorpos.character);
        cursorpos.character++;
        return repaint();
      };
      remove = function() {
        if (cursorpos.character > 0) {
          cursorpos.character--;
          lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + lines[cursorpos.line].substr(cursorpos.character + 1);
          return repaint();
        } else if (cursorpos.line > 0) {
          cursorpos.line--;
          cursorpos.character = lines[cursorpos.line].length;
          lines.pop();
          return repaint();
        }
      };
      forwardRemove = function() {
        var i, j, ref, ref1;
        if (cursorpos.character < lines[cursorpos.line].length) {
          lines[cursorpos.line] = lines[cursorpos.line].slice(0, cursorpos.character) + lines[cursorpos.line].substr(cursorpos.character + 1);
          return repaint();
        } else if (cursorpos.line < lines.length - 1) {
          lines[cursorpos.line] += lines[cursorpos.line + 1];
          for (i = j = ref = cursorpos.line + 1, ref1 = lines.length - 1; ref <= ref1 ? j < ref1 : j > ref1; i = ref <= ref1 ? ++j : --j) {
            lines[i] = lines[i + 1];
          }
          lines.pop();
          return repaint();
        }
      };
      lineBreak = function() {
        cursorpos.line++;
        if (lines.length === cursorpos.line) {
          lines.push('');
        }
        cursorpos.character = lines[cursorpos.line].length;
        return repaint();
      };
      onKeyPress = function(e) {
        return insert(String.fromCharCode(e.keyCode || e.which));
      };
      navigate = function(direction) {
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
        }
        return repaint();
      };
      onKeyDown = function(e) {
        var key;
        key = e.keyCode || e.which;
        console.log(key);
        switch (key) {
          case 8:
            remove();
            break;
          case 13:
            lineBreak();
            break;
          case 37:
            navigate('left');
            break;
          case 38:
            navigate('up');
            break;
          case 39:
            navigate('right');
            break;
          case 40:
            navigate('down');
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
      return document.addEventListener('keydown', onKeyDown);
    })();
  };

  module.exports = {
    field: function(config) {
      return canvastext(config);
    }
  };

}).call(this);
