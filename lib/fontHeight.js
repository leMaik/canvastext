(function() {
  module.exports = function(fontStyle) {
    var body, dummy, dummyText, result;
    body = document.getElementsByTagName("body")[0];
    dummy = document.createElement("div");
    dummyText = document.createTextNode("M");
    dummy.appendChild(dummyText);
    dummy.setAttribute("style", fontStyle);
    body.appendChild(dummy);
    result = dummy.offsetHeight;
    body.removeChild(dummy);
    return result;
  };

}).call(this);
