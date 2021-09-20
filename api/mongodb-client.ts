// Import the dependency.
import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI;
const options:any = {
   useUnifiedTopology: true,
   useNewUrlParser: true,
};
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

client = new MongoClient(uri, options);
clientPromise = client.connect()

  // Export a module-scoped MongoClient promise. By doing this in a
  // separate module, the client can be shared across functions.
export default clientPromise;