// Import the dependency.
import { MongoClient } from 'mongodb';

type doc = {ts: number; version: string; platform: string; count: number};

const uri = process.env.MONGODB_URI;
const options:any = {
   useUnifiedTopology: true,
   useNewUrlParser: true,
};
let client: MongoClient;

client = new MongoClient(uri, options);
const collectionPromise = client.connect().then(_client => _client.db('hyper').collection<doc>('log'))

export default collectionPromise;