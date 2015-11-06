(function() {
  var canvastext, fontHeight;

  fontHeight = require('./fontHeight');

  canvastext = function(config) {
    return (function() {
      var append, canvas, ctx, cursorpos, field, lineBreak, lineHeight, lines, onKeyDown, onKeyPress, remove, repaint;
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
      append = function(character) {
        cursorpos.character++;
        lines[cursorpos.line] += character;
        return repaint();
      };
      remove = function() {
        var char;
        if (cursorpos.character > 0) {
          char = cursorpos.character--;
          lines[cursorpos.line] = lines[cursorpos.line].slice(0, -1);
          return repaint();
        } else if (cursorpos.line > 0) {
          cursorpos.line--;
          cursorpos.character = lines[cursorpos.line].length;
          lines.pop();
          return repaint();
        }
      };
      lineBreak = function() {
        cursorpos.line++;
        if (lines.length === cursorpos.line) {
          lines.push('');
        }
        return cursorpos.character = lines[cursorpos.line].length;
      };
      onKeyPress = function(e) {
        return append(String.fromCharCode(e.keyCode || e.which));
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
