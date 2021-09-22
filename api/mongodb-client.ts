// Import the dependency.
import { MongoClient } from 'mongodb';
import { doc } from './mongodb-cleanup';
const uri = process.env.MONGODB_URI;
const options:any = {
   useUnifiedTopology: true,
   useNewUrlParser: true,
};
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

client = new MongoClient(uri, options);
const collectionPromise = client.connect().then(_client => _client.db('hyper').collection<doc>('log'))

export default collectionPromise;