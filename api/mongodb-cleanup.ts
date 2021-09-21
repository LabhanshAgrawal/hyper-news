import clientPromise from './mongodb-client';

export type doc = {ts: number; version: string; platform: string; count: number};

const groupingPeriod = 60_000;

export const cleanupDB = async () => {
  console.log('Updating DB');
  const _client = await clientPromise;
  const collection = _client.db('hyper').collection<doc>('log');
  const data = await collection.findOne({
    $expr: {
      $ne: [
        {
          $mod: ['$ts', groupingPeriod]
        },
        0
      ]
    }
  });

  if (!data) {
    console.log('No data');
    return;
  }

  const ts = data.ts - (data.ts % groupingPeriod);

  if (ts >= new Date().getTime() - groupingPeriod) {
    console.log('Not much data to process');
    return;
  }
  console.log('processing', new Date(ts).toLocaleString());

  const data2 = (
    await collection
      .find(
        {
          $expr: {
            $eq: [{$subtract: ['$ts', {$mod: ['$ts', groupingPeriod]}]}, ts]
          }
        },
        {
          projection: {
            version: 1,
            platform: 1,
            count: 1
          }
        }
      )
      .toArray()
  ).map((d) => ({version: d.version, platform: d.platform, count: d.count || 1}));

  const data3 = data2.reduce((acc, curr) => {
    const idx = acc.findIndex((d) => d.version === curr.version && d.platform === curr.platform);
    if (idx === -1) {
      acc.push({...curr, ts: ts});
    } else {
      acc[idx].count += curr.count;
    }
    return acc;
  }, [] as doc[]);

  console.log(
    await collection.deleteMany({
      $expr: {
        $eq: [{$subtract: ['$ts', {$mod: ['$ts', groupingPeriod]}]}, ts]
      }
    })
  );

  console.log(
    await collection.insertMany(data3).then((r) => {
      const {insertedIds, ...x} = r;
      return x;
    })
  );
  console.log('processed', new Date(ts).toLocaleString());

  // await cleanupDB();
};
