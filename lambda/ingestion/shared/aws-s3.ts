import fs from 'fs'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  type ListObjectsCommandOutput,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import type { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client'
import { AWS_DEFAULT_CONFIG, ENV, LOCAL_STORAGE_PATH, NO_CACHE_FILES, RR_S3_BUCKET } from './config.ts'

export type AwsFiles = Required<ListObjectsCommandOutput['Contents']>

export class AwsS3Client {
  private _bucket: string
  private _client: S3Client

  constructor(bucket: string, config?: S3ClientConfig) {
    this._bucket = bucket
    this._client = new S3Client({
      ...AWS_DEFAULT_CONFIG,
      ...(config || {}),
    })
  }

  async fetchDirectoryFiles(directory: string): Promise<{ files: AwsFiles, subdirectories: string[] }> {
    const response = await this._client.send(
      new ListObjectsCommand({
        Bucket: this._bucket,
        Delimiter: '/',
        Prefix: directory,
      })
    )

    let files: AwsFiles = []
    let subdirectories: string[] = []

    if (response.Contents?.length) files = response.Contents
    if (response.CommonPrefixes) subdirectories = response.CommonPrefixes.map(({ Prefix }) => Prefix!)

    return {
      files,
      subdirectories,
    }
  }

  async fetchFile(filename: string): Promise<string | undefined> {
    const response = await this._client.send(
      new GetObjectCommand({
        Bucket: this._bucket,
        Key: filename,
      }),
    )

    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const content = await response.Body?.transformToString()

    return content
  }

  async writeFile(path: string, content: string) {
    let cacheControl = 'must-revalidate, max-age=3600'

    if (NO_CACHE_FILES.some((file) => path.startsWith(file))) {
      cacheControl = 'max-age=0, no-cache, no-store, must-revalidate'
    }

    await this._client.send(
      new PutObjectCommand({
        Bucket: this._bucket,
        Key: path,
        Body: content,
        CacheControl: cacheControl,
        ContentType: 'application/json',
      })
    )

    // Write raw data to local storage
    if (ENV === 'dev' && this._bucket === RR_S3_BUCKET) {
      const directory = `${LOCAL_STORAGE_PATH}/${path}`.split('/').slice(0, -1).join('/')

      if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true })

      const unpackedContent = JSON.parse(content)
      fs.writeFileSync(`${LOCAL_STORAGE_PATH}/${path}`, JSON.stringify(unpackedContent, null, 2))
    }
  }

  async deleteFile(path: string) {
    await this._client.send(
      new DeleteObjectCommand({
        Bucket: this._bucket,
        Key: path,
      })
    )
  }
}