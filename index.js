const github = require('@actions/github')
const core = require('@actions/core')
const axios = require('axios')

/**
 * Gets the input from the used action.
 * @param {string} key Input key to fetch
 * @returns {string} Returns the value of the input
 */
const getInput = (key) => {
  const input = core.getInput(key)
  if (!input) throw Error(`Input "${key}" was not defined`)
  return input
}

/**
 * Gets the hotfix tag name.
 * @param {string} tag Existing tag to apply a hotfix
 * @returns {string} Hotfix tag name
 */
const getHotfixTag = (tag) => `${tag}-hotfix`

/**
 * Creates the release branch.
 * @param {string} currentTag Current tag
 */
const createReleaseBranch = async (currentTag) => {
  console.log(`Tag: ${currentTag}`)
  const token = getInput('workflow-token')
  const octokit = github.getOctokit(token)
  const { owner, repo } = github.context.repo

  // Get the current ref
  const { data: { object: { sha } } } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `tags/${currentTag}`
  })
  console.log(`SHA: ${sha}`)
  
  // Create the hotfix ref
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/hotfix/${currentTag}`,
    sha
  })
}

/**
 * Creates the Release Candidate issue.
 * @param {object} octokit Octokit
 * @param {string} currentTag Current tag
 * @param {string} hotfixTag Hotfix tag
 * @returns {string} URL of the Release Candidate issue
 */
const createIssue = async (octokit, currentTag, hotfixTag) => {
  const body = `
  **Script generated description. DO NOT MODIFY**

  ## Metadata

  - Release tag: ${hotfixTag}
  - Branch: hotfix/${currentTag}

  ## Actions

  - To add fixes:
    1. \`git checkout hotfix/${currentTag}\`
    2. Check in fixes to the release branch.
    3. (If applied) Cherry-pick the fix to \`master\`.
  - To approve the push: Add \`QA Approved\` label and close the issue.
  - To cancel the push: Close the issue directly.
  `

  const { owner, repo } = github.context.repo
  const { data: { html_url: issueUrl } } = await octokit.rest.issues.create({
    owner,
    repo,
    title: `Hotfix ${currentTag}`,
    labels: ['RC'],
    body
  })
  return issueUrl
}

/**
 * Posts to Slack via webhook.
 * @param {string} currentTag Current tag
 * @param {string} hotfixTag Hotfix tag
 * @param {string} issueUrl URL of the Release Candidate issue
 */
const postToSlack = async (currentTag, hotfixTag, issueUrl) => {
  const body = {
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `[${hotfixTag}] Hotfix created 🔥`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Please commit your fixes to \`hotfix/${currentTag}\`.`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Go"
          },
          "url": `${issueUrl}`,
          "action_id": "button-action"
        }
      }
    ]
  }

  const webhookUrl = getInput('slack-webhook-url')
  await axios.post(webhookUrl, body)
}

const run = async () => {
  try {
    // Get token and init
    const token = getInput('github-token')
    const octokit = github.getOctokit(token)

    // Get tags
    const currentTag = getInput('tag')
    const hotfixTag = getHotfixTag(currentTag)

    // Create release branch
    await createReleaseBranch(currentTag)

    // Create issue
    const issueUrl = await createIssue(octokit, currentTag, hotfixTag)

    // Send webhook to Slack
    await postToSlack(currentTag, hotfixTag, issueUrl)
  } catch (error) {
    core.setFailed(error.message)
  }
}
run()
