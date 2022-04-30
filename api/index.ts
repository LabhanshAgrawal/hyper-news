import { readFileSync } from 'fs'
import { join as joinPath } from 'path'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { satisfies } from 'semver'
import mongo from './mongodb-client';
// Set Type for Messages
interface Messages {
  text: string;
  url?: string;
  dismissable: boolean;
  versions: string[];
  platforms: string[];
}[]

// Get news JSON
const news = JSON.parse(readFileSync(joinPath(__dirname, '../news.json'), 'utf-8'))
const legacyNews = JSON.parse(readFileSync(joinPath(__dirname, '../legacy-news.json'), 'utf-8'))

// Match versions (strings) from two sources
const matchVersion = (versions: string[], clientVersion: string) => (
  versions.some(v => v === '*' || satisfies(clientVersion, v))
)

// Match platform (strings) from two sources
const matchPlatform = (platforms: string[], clientPlatform: string) => (
  platforms.some(p => p === '*' || p === clientPlatform)
)

// Main function export
export default async (req: VercelRequest, res: VercelResponse) => {
  // Get platform and version headers, which should be sent from Hyper.app
  const platform = req.headers['x-hyper-platform'] as string
  const version = req.headers['x-hyper-version'] as string

  console.log(JSON.stringify({platform, version}))
  
  // If platform and version aren't defined, assume legacy Hyper version and respond with legacy message
  if (platform === undefined || version === undefined) {
    res.json(legacyNews)
    return
  }
  
  // Set message, if there are any found
  const message = news.messages.find((msg: Messages) => (
    matchVersion(msg.versions, version) && matchPlatform(msg.platforms, platform)
  )) || ''

  //Push logs
  const entry = {platform,version,count:1,ts:new Date().getTime()};
  try {
    await (await mongo.collection).insertOne(entry);
  } catch (error) {
    console.log(error)
    mongo.reconnect();
    await (await mongo.collection).insertOne(entry);
  }

  // Respond with message
  res.json({message})

  return;
}
