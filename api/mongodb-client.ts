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

let reconnecting = false;
const reconnect = () => {
   if (reconnecting) return;
   reconnecting = true;
   console.log('reconnecting...');
   client = new MongoClient(uri, options);
   mongo.collection = client.connect().then(_client => {
      reconnecting = false;
      return _client.db('hyper').collection<doc>('log')
   });
}

const mongo = {
   collection : client.connect().then(_client => _client.db('hyper').collection<doc>('log')),
   reconnect
}

export default mongo;