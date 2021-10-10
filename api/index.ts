import { readFileSync } from 'fs'
import { join as joinPath } from 'path'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { satisfies } from 'semver'
import collectionPromise from './mongodb-client';
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
  const message = ['3.1.4','3.1.0-canary.6'].includes(version) ? '' : (
    version.includes('canary') ? ({
      "text": "Version 3.1.0-canary.6 is here",
      "url": "https://github.com/vercel/hyper/releases/tag/v3.1.0-canary.6",
      "dismissable": true
    }):
    ({
      "text": "Version 3.1.4 is here",
      "url": "https://github.com/vercel/hyper/releases/tag/v3.1.4",
      "dismissable": true
    })
  )

  if (message && !version.startsWith('3')){
    message.dismissable = false;
  }

  //Push logs    
  const collection = await collectionPromise;
  await collection.insertOne({platform,version,count:1,ts:new Date().getTime()});

  // Respond with message
  res.json({message})

  return;
}
