# Hotfix Action

Github Action that handles the following:

1. Creates a hotfix branch
2. Creates a Github issue
3. Posts a Slack webhook message

## Inputs

### `github-token`

**Required**
Github token to use to call the Github API.

### `slack-webhook-url`

**Required**
URL of the Slack webhook to send the message to.

### `tag`

**Required**
Existing tagged release to apply the hotfix to.

## Usage

```yaml
on:
  workflow_dispatch:
    inputs:
      tag:
        description: Existing tag to hotfix
        required: true
        type: string

uses: loopsocial/hotfix-action@v1.0.0
with:
  github-token: ${{ secrets.GITHUB_TOKEN }}
  slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
  tag: ${{ github.event.inputs.tag }}
```
