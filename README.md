# Hotfix Action

Github Action that handles the following:

1. Creates a hotfix branch
2. Creates a Github issue
3. Posts a Slack webhook message

## Inputs

### `github-token`

(Required) Github default token (`GITHUB_TOKEN`) used to call the Github API.

### `workflow-token`

(Required) Github personal access token (`WORKFLOW_TOKEN`) used to call the Github API. This is required to create the ref since the default token cannot do this.

### `slack-webhook-url`

(Required) URL of the Slack webhook to send the message to.

### `tag`

(Required) Existing tagged release to apply the hotfix to.

## Example Usage

```yaml
name: Hotfix

on:
  workflow_dispatch:
    inputs:
      tag:
        description: Existing tag to hotfix
        required: true
        type: string

jobs:
  hotfix:
    runs-on: ubuntu-latest
    name: Hotfix
    steps:
      - name: Hotfix
        id: hotfix
        uses: loopsocial/hotfix-action@v1.0.2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          workflow-token: ${{ secrets.WORKFLOW_TOKEN }}
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          tag: ${{ github.event.inputs.tag }}
```
