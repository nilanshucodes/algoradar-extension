import fs from 'fs';
import path from 'path';

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader(
    'Cache-Control',
    'public,s-maxage=300,stale-while-revalidate=600'
  );

  if(req.method === 'OPTIONS'){
    return res.status(200).end();
  }

  if(req.method !== 'GET'){
    return res.status(405).json({ error: 'Method not allowed'});
  }
  try{
    const filePath = path.join(process.cwd(),'data','contests.json');
    if(!fs.existsSync(filePath)){
      console.error('contests.json not found');
      return res.status(503).json({
        error: 'Data unavailable',
        message: 'Contest data not generated yet',
        contests: [],
      });
    }

    const raw = fs.readFileSync(filePath,'utf8');
    const data = JSON.parse(raw);

    if(!Array.isArray(data.contests)){
      throw new Error('Invalid contests.json structure');
    }

    return res.status(200).json({
      contests: data.contests,
      count: data.count ?? data.contests.length,
      lastUpdated: data.lastUpdated ?? null,
      cached: true,
      source: 'static-file',
    });

  }catch(err){
    console.error('API error:',err.message);

    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Failed to read contest data',
      contests: [],
    });
  }
}

export const config ={
  maxDuration: 10,
};