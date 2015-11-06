module.exports = (fontStyle) ->
  body = document.getElementsByTagName("body")[0]
  dummy = document.createElement("div")
  dummyText = document.createTextNode("M")
  dummy.appendChild(dummyText)
  dummy.setAttribute("style", fontStyle)
  body.appendChild(dummy)
  result = dummy.offsetHeight
  body.removeChild(dummy)
  return result
