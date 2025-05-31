import { S3Client, PutObjectCommand, ListObjectsCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mime from 'mime'

// Configure your AWS credentials and region (or use environment variables)
const REGION = 'us-west-2'
const BUCKET = 'race-results.aclement.com'
const CLOUDFRONT_DISTRIBUTION_ID = 'YOUR_DISTRIBUTION_ID'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BUILD_PATH = path.resolve(__dirname, '../dist')

const s3 = new S3Client({ region: REGION })
const cloudfront = new CloudFrontClient({ region: REGION })

function getAllFiles(dir, baseDir = dir) {
  let files = []
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file)
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath, baseDir))
    } else {
      files.push({
        path: fullPath,
        key: path.relative(baseDir, fullPath).replace(/\\/g, '/'),
      })
    }
  }
  return files
}

async function deleteExistingFilesFromS3() {
  const existingFiles = await s3.send(new ListObjectsCommand({
    Bucket: BUCKET,
  }))

  if (!existingFiles.Contents?.length) return

  await s3.send(new DeleteObjectsCommand({
    Bucket: BUCKET,
    Delete: {
      Objects: existingFiles.Contents.map(({ Key }) => ({ Key })),
      Quiet: true,
    },
  }))

  console.log(`${existingFiles.Contents.length} files deleted from S3 bucket ${BUCKET}`)
}

async function uploadFile(file) {
  const fileContent = fs.readFileSync(file.path)
  const contentType = mime.getType(file.path) || 'application/octet-stream'

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: file.key,
    Body: fileContent,
    ContentType: contentType,
  })

  await s3.send(command)

  console.log(`Uploaded: ${file.key}`)
}

async function invalidateCloudFrontDistribution() {
  const command = new CreateInvalidationCommand({
    DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: `deploy-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ['/*'],
      },
    },
  })

  const result = await cloudfront.send(command)

  console.log('CloudFront invalidation created:', result.Invalidation.Id)
}

async function main() {
  await deleteExistingFilesFromS3()

  const files = getAllFiles(BUILD_PATH)

  for (const file of files) {
    await uploadFile(file)
  }

  console.log('All files uploaded.')

  await invalidateCloudFrontDistribution()
}

main().catch((err) => {
  console.error('Upload failed:', err)
  process.exit(1)
})