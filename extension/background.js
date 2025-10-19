/* global chrome */
'use strict'

const DATE_LENGTH = 10
const PATH_TEST_HACK = false //set to true to avoid path test
const MINUTE_BACKS_HACK = false //set to true to allow backs every minute for testing

let tiddlywikiLocations = 'tiddlywikiLocations'
const $ = { '/': '/' }

const TEST_FILE = 'This is a test file'
const probBlob = new Blob([TEST_FILE], { type: 'text/plain' })
const probBlobUrl = URL.createObjectURL(probBlob)

function datesArray(now, andHours, andMinutes) {
  const date = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()]

  if (andHours) {
    date.push(now.getUTCHours())
  }
  if (andMinutes) {
    date.push(now.getUTCMinutes())
  }

  return date
}

function equalDateArrays(Ar1, Ar2) {
  if (Ar1.length !== Ar2.length) {
    return false
  }

  for (let i = 0; i < Ar1.length; i++) {
    if (Ar1[i] !== Ar2[i]) return false
  }

  return true
}

let os = 'notwin'
chrome.runtime.getPlatformInfo((info) => { if (info.os == 'win') { $['/'] = '\\'; os = 'win' } })

let testBase//	tiddlywikiLocations+$["/"]+'readTiddlySaverInstruction';
let round = '59723833' //by rotating this string of digits we can have 8 unique named test files for simultaneous use
//ie testpath = testbase+round+'.html';rotate(round) for next test file
const rlen = round.length - 1

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('background: got request')

  function performDownload(msg, tiddlywikiLocations) {
    const objUrl = URL.createObjectURL(new Blob([msg.txt], { type: 'text/html' }))

    chrome.downloads.download({
      conflictAction: 'overwrite',
      filename: tiddlywikiLocations + $['/'] + msg.path,
      url: objUrl
    }, (id) => {
      chrome.downloads.onChanged.addListener(function hearChange(deltas) {
        // wait for completion
        if (deltas.id == id && deltas.state && deltas.state.current === 'complete') {
          chrome.downloads.onChanged.removeListener(hearChange)
          console.log(`saveTiddlers: saved ${msg.path}`)
          URL.revokeObjectURL(objUrl)
          chrome.storage.local.get({
            backedup: {},
            backupdir: 'backupdir',
            backuptw5: true,
            backuptwc: false,
            period: [],
            periodchoice: 'day'
          }, (items) => {
            const newValues = {}
            const newdate = new Date()
            const date = datesArray(newdate, items.periodchoice == 'hour', MINUTE_BACKS_HACK)
            const backupDate = newdate.toISOString().slice(0, DATE_LENGTH)

            if ((msg.tw5 && items.backuptw5 === false) || (!msg.tw5 && items.backuptwc === false)) {
              sendResponse({ status: 'saved' })
              return
            }

            if (equalDateArrays(date, items.period)) {
              if (items.backedup[msg.path]) {
                sendResponse({ status: 'saved' })
                return// already save in this period
              }
              // continue with this period
              newValues.backedup = items.backedup
              newValues.period = items.period
            } else {
              // new time period
              newValues.backedup = {}
              newValues.period = date
            }

            // remember we backed up on this filepath
            newValues.backedup[msg.path] = true
            const objUrlBkup = URL.createObjectURL(new Blob([msg.txt], { type: 'text/html' }))

            chrome.downloads.download({
              conflictAction: 'overwrite',
              filename: tiddlywikiLocations + $['/'] + items.backupdir + $['/'] + msg.path.replace(new RegExp(`.{${msg.path.lastIndexOf('.')}}`, 'u'), `$&${backupDate}`),
              url: objUrlBkup
            }, (id) => {
              chrome.downloads.onChanged.addListener(function hearChange(deltas) {
                // wait for completion
                if (deltas.id == id && deltas.state && deltas.state.current === 'complete') {
                  chrome.downloads.onChanged.removeListener(hearChange)
                  URL.revokeObjectURL(objUrlBkup)
                  sendResponse({ status: 'backupsaved' })
                }
              })
            })

            console.log(`background: backed up to ${msg.path}`)
            chrome.storage.local.set(newValues)
          })
        }
      })
    })
  }

  ////////////////////////// start ///////////////////////////////
  if (msg.type === 'start') {
    console.log('background: start')

    chrome.storage.local.get({ homedir: 'tiddlywikiLocations' }, (params) => {
      tiddlywikiLocations = params.homedir
      testBase = `${tiddlywikiLocations + $['/']}readTiddlySaverInstruction`
      const firstLocation = msg.filePath.indexOf($['/'] + tiddlywikiLocations + $['/'])

      msg.fPath = msg.filePath.substring(0, firstLocation)

      if (firstLocation === -1) {
        console.log(`file not in a subdirectory of ${tiddlywikiLocations}, it must be saved to the download dir`)
        const path = msg.filePath.split($['/'])
        msg.path = path[path.length - 1]
        msg.twdl = false
      }
      else {
        msg.path = msg.filePath.slice(firstLocation + tiddlywikiLocations.length + '//'.length)
        msg.twdl = true
      }

      console.log('background: background 3nd step')

      // show the choose file dialogue when tw not under 'tiddlywikiLocations'
      if (!msg.twdl) {
        console.log(`background: not in ${tiddlywikiLocations} ${msg.path}`)
        sendResponse({ location: tiddlywikiLocations, status: 'failedloc' })
      } else if (PATH_TEST_HACK) {
        console.log('background: avoid path testing')
        performDownload(msg, tiddlywikiLocations)//avoid path testing
      } else {
        // first download check our destination is valid by download a dummy file first and then reading back the filepath
        round = round[rlen] + round.substring(0, rlen)

        chrome.downloads.download({
          conflictAction: 'overwrite',
          filename: `${testBase}${round}.html`,
          url: probBlobUrl
        }, (id) => {
          chrome.downloads.onChanged.addListener(function hearChange(deltas) {
            // wait for completion
            if (deltas.id == id && deltas.state && deltas.state.current === 'complete') {
              chrome.downloads.onChanged.removeListener(hearChange)
              chrome.downloads.search({ id }, (x) => {
                let bodyX = x[0].filename.split($['/'] + testBase)[0]
                let bodyY = msg.fPath

                if (os === 'win') {//make drive letters the same case
                  bodyY = bodyY.replace(/^./gu, bodyY[0].toLowerCase())
                  bodyX = bodyX.replace(/^./gu, bodyX[0].toLowerCase())
                }

                if (bodyY === bodyX) {
                  // All tests passed!
                  performDownload(msg, tiddlywikiLocations)
                } else {
                  console.log(`background: failed path ${msg.fPath}!=${x[0].filename.split($['/'] + testBase)[0]}`)
                  sendResponse({ path: x[0].filename.split($['/'] + testBase)[0], status: 'failedpath' })
                }

                chrome.downloads.removeFile(id, () => { chrome.downloads.erase({ id }) })//move this further up
              })
            }
          })
        })
      }
    })

    return true
  }

  console.log('background: start save the file manually')
  let path = msg.filePath.split($['/'])
  path = path[path.length - 1]
  const objUrl = URL.createObjectURL(new Blob([msg.txt], { type: 'text/html' }))

  chrome.downloads.download({
    filename: tiddlywikiLocations + $['/'] + path,
    saveAs: true,
    url: objUrl
  }, (id) => {
    if (id === undefined) {
      sendResponse({ status: 'cancelled' })
      console.log('background: sent cancelled')
    } else {
      chrome.downloads.onChanged.addListener(function hearChange(deltas) {
        if (deltas.id == id && deltas.state && deltas.state.current === 'interrupted') {
          sendResponse({ status: 'cancelled' })
          console.log('background: sent cancelled')
          chrome.downloads.onChanged.removeListener(hearChange)
          URL.revokeObjectURL(objUrl)
          return true
        }

        // wait for completion
        if (deltas.id == id && deltas.state && deltas.state.current === 'complete') {
          chrome.downloads.onChanged.removeListener(hearChange)
          URL.revokeObjectURL(objUrl)
          console.log('background: finishing manual save')

          chrome.downloads.search({ id }, (x) => {
            let bodyX = x[0].filename.split($['/'] + testBase)[0]
            let bodyY = msg.filePath

            if (os === 'win') {//make drive letters the same case
              bodyY = bodyY.replace(/^./gu, bodyY[0].toLowerCase())
              bodyX = bodyX.replace(/^./gu, bodyX[0].toLowerCase())
            }

            console.log(`background: last paths ${msg.filePath}!=${x[0].filename.split($['/'] + testBase)[0]}`)

            if (bodyY === bodyX) {
              sendResponse({ newlocal: null, status: 'saved' })
              return true
            }

            sendResponse({ newlocal: x[0].filename, status: 'saved' })
            return true
          })

          return true
        }

        return true
      })
    }
  })

  return true
})
