import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Missing env vars');
  console.log('URL:', supabaseUrl ? 'set' : 'missing');
  console.log('Key:', supabaseServiceKey ? 'set' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorage() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.log('Error listing buckets:', listError.message);
    return;
  }
  console.log('Buckets:', buckets.map(b => b.name));
  
  const docsBucket = buckets.find(b => b.name === 'documents');
  if (!docsBucket) {
    console.log('Creating documents bucket...');
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: false,
      fileSizeLimit: 10485760
    });
    if (error) {
      console.log('Error creating bucket:', error.message);
    } else {
      console.log('Bucket created:', data);
    }
  } else {
    console.log('documents bucket exists');
  }
}

checkStorage();
