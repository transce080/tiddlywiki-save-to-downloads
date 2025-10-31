/* globals browser, chrome */
'use strict'

console.debug('options.js started')

const SAVE_OPTIONS_TIMEOUT = 750
const CHECK_TIMEOUT = 2750

// Saves options to chrome.storage.sync.
function save_options() {
  if (!check(document.getElementById('homedir'))) return
  if (!check(document.getElementById('backupdir'))) return

  chrome.storage.local.set({
    backupdir: document.getElementById('backupdir').value,
    backuptw5: document.getElementById('backuptw5').checked,
    backuptwc: document.getElementById('backuptwc').checked,
    homedir: document.getElementById('homedir').value,
    nag: document.getElementById('nag').checked
  }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status')
    status.textContent = 'Options saved.'
    setTimeout(() => { status.textContent = '' }, SAVE_OPTIONS_TIMEOUT)
  })
}

//from https://github.com/parshap/node-sanitize-filename/
const illegalRegex = /[/?<>\\:*|":]/u
const ctlRegex = /[\x00-\x1f\x80-\x9f]/u
const rvRegex = /^\.+$/u
const winRsRegex = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/iu
const winTrRegex = /[. ]+$/u

const unixRe = /[/]/u
const unixDotsRe = /^\.|\.\.$/u

let test

chrome.runtime.getPlatformInfo((info) => {
  if (info.os === 'win') {
    test = (value) => (
      value.match(illegalRegex)
      || value.match(ctlRegex)
      || value.match(rvRegex)
      || value.match(winRsRegex)
      || value.match(winTrRegex)
    )
  } else {
    test = (value) => (value.match(unixRe) || value.match(unixDotsRe))
  }
})

function check(element) {
  if (test(element.value)) {
    const error = document.getElementById('error')
    error.textContent = 'name invalid.'
    element.focus()

    setTimeout(() => {
      error.textContent = ''
    }, CHECK_TIMEOUT)

    return false
  }

  return true
}

// Restores select box and text fields
function restore_options() {
  try {
    browser.runtime.getBrowserInfo((info) => {
      if (info.vendor != 'Mozilla')
        document.getElementById('showand').hidden = false
    })
  } catch {
    document.getElementById('showand').hidden = false
  }

  chrome.storage.local.get({
    backupdir: 'backupdir',
    backuptw5: true,
    backuptwc: false,
    homedir: 'tiddlywikiLocations',
    nag: true
  }, (items) => {
    document.getElementById('homedir').value = items.homedir
    document.getElementById('backupdir').value = items.backupdir
    document.getElementById('backuptw5').checked = items.backuptw5
    document.getElementById('backuptwc').checked = items.backuptwc
    document.getElementById('nag').checked = items.nag
  })
}

document.addEventListener('DOMContentLoaded', restore_options)
document.getElementById('save').addEventListener('click', save_options)
