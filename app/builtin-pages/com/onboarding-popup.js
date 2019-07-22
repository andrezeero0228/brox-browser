/* globals beaker DatArchive localStorage */

import * as yo from 'yo-yo'
import * as createArchivePopup from './create-archive-popup'

// globals
// =

let currentStep = 0
let isHintHidden = true
let showNavigation = true
let settings
let defaultProtocolSettings
let resolve
let reject

const STEPS = [
  {
    title: 'Welcome to Brox Browser!',
    subtitle: 'Configure your preferences',
    description: 'Brox is a browser for exploring and building the peer-to-peer Web.',
    content: () => yo`
      <div>
        <img class="icon" src="broxme://assets/img/onboarding/p2p-connection.svg" />

        <p>
          <label class="toggle">
            <input checked=${defaultProtocolSettings.dat} type="checkbox" onchange=${onToggleDefaultBrowser} />
            <div class="switch"></div>
            <span class="text">
              Set Brox as the default browser for dat:// URLs
            </span>

            <button type="button" class="btn hint-btn plain link" onclick=${onShowHint}>
              <i class="far fa-question-circle"></i>
            </button>
          </label>

          <div class="onboarding-hint ${isHintHidden ? 'hidden' : ''}">
            dat:// is a peer-to-peer protocol that Brox uses to host websites
          </div>
        </p>
      </div>`,
    color: 'blue',
    onLeave: async () => {
      if (defaultProtocolSettings.dat) {
        await beaker.browser.setAsDefaultProtocolClient('dat')
      } else {
        await beaker.browser.removeAsDefaultProtocolClient('dat')
      }
    }
  },
  {
    title: 'Get started',
    subtitle: 'Start exploring the peer-to-peer Web',
    description: '',
    content: () => yo`
      <p>
        <div class="module" onclick=${onCreateWebsite}>
          <img src="broxme://assets/img/onboarding/create-website.svg"/>

          <span>
            <h3 class="module-heading">
              Create a peer-to-peer website
              <i class="fa fa-angle-right"></i>
            </h3>

            <p>
              Create your first peer-to-peer website using a basic template.
            </p>
          </span>
        </div>

        

        <a href="https://support.broxme.com" class="module" target="_blank">
          <img src="broxme://assets/img/onboarding/documentation.svg"/>

          <span>
            <h3 class="module-heading">
              Learn more
              <i class="fa fa-angle-right"></i>
            </h3>

            <p>
              Explore Brox${"'"}s documentation and tutorials.
            </p>
          </span>
        </a>
      </p>`,
    color: 'green'
  }
]

// internal
// =

async function onCreateWebsite () {
  var archive = await DatArchive.create({template: 'website', prompt: false})
  window.location = `broxme://library/${archive.url}#setup`
}

// exported api
// =

export async function create (opts = {}) {
  settings = await beaker.browser.getSettings()
  defaultProtocolSettings = await beaker.browser.getDefaultProtocolSettings()
  currentStep = (opts.showHelpOnly) ? (STEPS.length - 1) : 0
  showNavigation = !opts.showHelpOnly

  // render interface
  var popup = render()
  document.body.appendChild(popup)
  document.addEventListener('keyup', onKeyUp)

  // return promise
  return new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
}

export function destroy () {
  // run any effects
  if (STEPS[currentStep].onLeave) {
    STEPS[currentStep].onLeave()
  }

  localStorage.hasDismissedOnboarding = true
  var popup = document.getElementById('onboarding-popup')
  document.body.removeChild(popup)
  document.removeEventListener('keyup', onKeyUp)
  reject()
}

// internal methods
// =

function update () {
  yo.update(document.getElementById('onboarding-popup'), render())
}

function render () {
  const step = STEPS[currentStep]

  return yo`
    <div id="onboarding-popup" class="popup-wrapper ${step.color} step-${currentStep}" onclick=${onClickWrapper}>
      <div class="popup-inner">
        ${renderHead()}
        ${renderBody()}
        ${renderFooter()}
      </div>
    </div>`
}

function renderHead () {
  const step = STEPS[currentStep]

  return yo`
    <div class="head onboarding-header">
      <button class="btn close-btn plain" onclick=${destroy}>
        <i class="fa fa-times"></i>
      </button>

      <h1 class="title">
        ${step.title}
      </h1>

      <h2 class="subtitle">
        ${step.subtitle}
      </h2>
    </div>`
}

function renderBody () {
  const step = STEPS[currentStep]

  return yo`
    <div class="body onboarding-body">
      ${step.description && step.description.length
        ? yo`
          <p class="description">
            ${step.description}
          </p>`
        : ''
      }

      ${step.content()}
    </div>`
}

function renderFooter () {
  if (!showNavigation) {
    return yo`<div class="footer"></div>`
  }
  return yo`
    <div class="footer">
      ${currentStep !== 0
        ? yo`
          <button class="btn nofocus" onclick=${onClickPrevious}>
            <i class="fa fa-angle-double-left"></i>
            <span>Previous</span>
          </button>`
        : ''
      }

      <div class="progress-indicator">
        ${STEPS.map((step, i) => yo`<div class="step ${currentStep === i ? 'active' : ''}"></div>`)}
      </div>

      ${currentStep === STEPS.length - 1
        ? ''
        : yo`
          <button class="btn nofocus" onclick=${destroy}>
            <span>Close</span>
            
          </button>`
      }
    </div>
  </div>`
}

// event handlers
// =

function onKeyUp (e) {
  e.preventDefault()
  e.stopPropagation()

  if (e.keyCode === 27) {
    destroy()
  }
}

function onClickWrapper (e) {
  if (e.target.id === 'onboarding-popup') {
    destroy()
  }
}

function onClickPrevious () {
  currentStep = currentStep - 1
  isHintHidden = true
  update()
}

async function onClickNext () {
  // run any effects
  if (STEPS[currentStep].onLeave) {
    await STEPS[currentStep].onLeave()
  }

  // go to next step
  currentStep = currentStep + 1
  isHintHidden = true
  update()
}

function onShowHint (e) {
  e.stopPropagation()
  e.preventDefault()
  isHintHidden = !isHintHidden
  update()
}

function onToggleDefaultBrowser (e) {
  e.preventDefault()
  defaultProtocolSettings.dat = !defaultProtocolSettings.dat
  update()
}