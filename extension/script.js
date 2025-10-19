'use strict';

// The JavaScript in this file is injected into each TiddlyWiki page that loads

(function () {
  // Returns true if successful, false if failed, null if not available
  const injectedSaveFile = function (path, content) {
    // Find the message box element
    const messageBox = document.getElementById('tiddlyfox-message-box')

    if (messageBox) {
      // Create the message element and put it in the message box
      const message = document.createElement('div')
      message.setAttribute('data-tiddlyfox-path', path)
      message.setAttribute('data-tiddlyfox-content', content)
      messageBox.appendChild(message)
      // Create and dispatch the custom event to the extension
      const event = document.createEvent('Events')
      event.initEvent('tiddlyfox-save-file', true, false)
      message.dispatchEvent(event)
    }

    return true
  }

  // Returns text if successful, false if failed, null if not available
  const injectedLoadFile = function (path) {
    try {
      // Just the read the file synchronously
      const xhReq = new XMLHttpRequest()
      xhReq.open('GET', `file://${path.charAt(0) == '/' ? '' : '/'}${escape(path)}`, false)
      xhReq.send(null)
      return xhReq.responseText
    } catch {
      /* do nothing */
    }

    return false
  }

  const injectedConvertUriToUTF8 = function (path) {
    return path
  }

  const injectedConvertUnicodeToFileFormat = function (s) {
    return s
  }

  window.mozillaSaveFile = injectedSaveFile
  window.mozillaLoadFile = injectedLoadFile
  window.convertUriToUTF8 = injectedConvertUriToUTF8
  window.convertUnicodeToFileFormat = injectedConvertUnicodeToFileFormat
})()
