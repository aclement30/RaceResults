import {
  GetObjectCommand,
  ListObjectsCommand,
  type ListObjectsCommandOutput,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import type { S3ClientConfig } from '@aws-sdk/client-s3/dist-types/S3Client'

export const RR_S3_BUCKET = 'cycling-race-results'

const DEFAULT_CONFIG = {
  region: 'us-west-2',
}

export type AwsFiles = Required<ListObjectsCommandOutput['Contents']>

export class AwsS3Client {
  private _bucket: string
  private _client: S3Client

  constructor(bucket: string, config?: S3ClientConfig) {
    this._bucket = bucket
    this._client = new S3Client({
      ...DEFAULT_CONFIG,
      ...( config || {} ),
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
    await this._client.send(
      new PutObjectCommand({
        Bucket: this._bucket,
        Key: path,
        Body: content,
        CacheControl: 'must-revalidate',
      })
    )
  }
}