/* global chrome */
'use strict'

console.debug('contentscript.js started')

/*
 * parts of this file is from https://github.com/Jermolene/TiddlyWiki5
 * which is licensed under the BSD format copyright Jermolene Ruston
 */
document.addEventListener('DOMContentLoaded', injectMessageBox, false)

const ERROR_DIRECTORY = 'Automatic saving not possible.\nAs your TW is not within the controlled directory a manual save is required'
const ERROR_MULTIPLE_SAVERS_1 = 'saveTiddlers has detected that another tiddly-saving extension called '
const ERROR_MULTIPLE_SAVERS_2 = ' is installed. Currently only one saver is supported therefore - saveTiddlers will not activate'

const BACKUP = true
let TW5 = true
/*
 * we may want to download a dummy file and use the download api to see
 * if it lands in the correct dir,
 * the background would set a value we read here and if set save a test file.
 */

function currentLocation() {
  // Get the pathname of this document
  let [pathname] = window.location.toString().split('#')

  // Replace file://localhost/ with file:///
  if (pathname.indexOf('file://localhost/') === 0) {
    pathname = `file://${pathname.substr(16)}`
  }

  // Windows path file:///x:/blah/blah --> x:\blah\blah
  if (/^file:\/\/\/[A-Z]:\//iu.test(pathname)) {
    // Remove the leading slash and convert slashes to backslashes
    pathname = decodeURI(pathname.substr(8)).replace(/\//gu, '\\')
    // Firefox Windows network path file://///server/share/blah/blah --> //server/share/blah/blah
  } else if (pathname.indexOf('file://///') === 0) {
    pathname = `\\\\${decodeURI(pathname.substr(10)).replace(/\//gu, '\\')}`
    // Mac/Unix local path file:///path/path --> /path/path
  } else if (pathname.indexOf('file:///') === 0) {
    pathname = decodeURI(pathname.substr(7))
    // Mac/Unix local path file:/path/path --> /path/path
  } else if (pathname.indexOf('file:/') === 0) {
    pathname = decodeURI(pathname.substr(5))
    // Otherwise Windows network path file://server/share/path/path --> \\server\share\path\path
  } else {
    pathname = `\\\\${decodeURI(pathname.substr(7)).replace(/\//gu, '\\')}`
  }

  return pathname
}

function isTiddlyWikiClassic(doc) {
  // Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
  const versionArea = doc.getElementById('versionArea')

  return (doc.location.protocol === 'file:')
    && doc.getElementById('storeArea')
    && (versionArea && /TiddlyWiki/u.test(versionArea.text))
}

const debouncing = []

function injectMessageBox() {
  const SAVE_TIDDLERS = 'saveTiddlers'

  if (isTiddlyWikiClassic(document)) {
    const s = document.createElement('script')
    s.src = chrome.extension.getURL('script.js');

    (document.head || document.documentElement).appendChild(s)

    s.onload = function () {
      s.parentNode.removeChild(s)
    }

    TW5 = false
  }

  // Inject the message box
  let messageBox = document.getElementById('tiddlyfox-message-box')

  if (messageBox) {
    const otherSW = messageBox.getAttribute('data-message-box-creator') || null

    if (otherSW && (otherSW !== SAVE_TIDDLERS)) {
      alert(ERROR_MULTIPLE_SAVERS_1 + otherSW + ERROR_MULTIPLE_SAVERS_2)
      return
    }

    messageBox.setAttribute('data-message-box-creator', SAVE_TIDDLERS)
  } else {
    messageBox = document.createElement('div')
    messageBox.id = 'tiddlyfox-message-box'
    messageBox.style.display = 'none'
    messageBox.setAttribute('data-message-box-creator', SAVE_TIDDLERS)

    document.body.appendChild(messageBox)
  }

  // Attach the event handler to the message box
  messageBox.addEventListener('tiddlyfox-save-file', (event) => {
    // Get the details from the message
    const content = message.getAttribute('data-tiddlyfox-content')
    const message = event.target
    const path = currentLocation()

    // Remove the message element from the message box
    message.parentNode.removeChild(message)
    // Save the file

    if (debouncing[path]) return
    debouncing[path] = true

    saveFile(path, content, BACKUP, TW5, (response) => {
      // Send a confirmation message
      debouncing[path] = false
      console.log(`saveTiddlers: response is ${response.status}`)

      if (response.status === 'failedloc' || response.status === 'failedpath') {
        chrome.storage.local.get({ nag: true }, (items) => {
          if (items.nag) {
            alert(ERROR_DIRECTORY)
          }

          finishSave(path, content, (response) => {
            // from saveAs
            console.log(`saveTiddlers: finishSave ${response.status}`)

            if (response.status === 'saved') {
              if (response.newlocal) {
                alert(`Your tiddlywiki has been saved to a new location \n${response.newlocal}`)
              }

              const event1 = document.createEvent('Events')
              event1.initEvent('tiddlyfox-have-saved-file', true, false)
              event1.savedFilePath = path
              message.dispatchEvent(event1)
            }
            else {
              console.log('saveTiddlers: SAVE FAILURE')
              //send failed
            }
          })
        })
      } else {
        console.log('saveTiddlers: savefile')
        const event1 = document.createEvent('Events')
        event1.initEvent('tiddlyfox-have-saved-file', true, false)
        event1.savedFilePath = path
        message.dispatchEvent(event1)
      }
    })
  }, false)
}

function saveFile(filePath, content, backup, tw5, callback) {
  try {
    const msg = {}
    msg.filePath = filePath
    msg.txt = content
    msg.backup = backup
    msg.type = 'start'
    msg.tw5 = tw5

    console.log(`from cs: we are inside downloads at ${msg.filePath}`)
    chrome.runtime.sendMessage(msg, callback)

    return true
  } catch (ex) {
    alert(ex)
    return false
  }
}

function finishSave(filePath, content, callback) {
  // Save the file without control
  try {
    const msg = {}
    msg.filePath = filePath
    msg.txt = content
    msg.type = 'finish'

    console.log(`from cs2: we are inside downloads at ${msg.filePath}`)
    chrome.runtime.sendMessage(msg, callback)

    return true
  } catch (ex) {
    alert(ex)
    return false
  }
}
