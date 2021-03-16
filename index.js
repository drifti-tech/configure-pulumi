const core = require('@actions/core')
const AWS = require('aws-sdk')

const Bucket = core.getInput('bucket')
const revision = core.getInput('revision')
const stackName = core.getInput('stackName')

const s3 = new AWS.S3({ region: 'eu-north-1' })

async function main() {
  const { Contents } = await s3.listObjects({ Bucket, Prefix: revision }).promise()

  const configs = [`revision=${revision}`, `namespace=${stackName}`]

  await Promise.all(
    Contents.map(async ({ Key }) => {
      const file = await s3.getObject({ Bucket, Key }).promise()
      const [, name] = Key.split('/')
      const body = file.Body.toString('utf-8').trim()
      configs.push(`image-${name}=${body}`)
    })
  )

  const config = configs.map((c) => `--plaintext ${c}`).join(' ')
  core.info(`Configuration params: ${config}`)
  core.setOutput('config', config)
}

main().catch((error) => core.setFailed(error))
