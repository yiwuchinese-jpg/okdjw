import { createClient } from '@sanity/client';

const token = 'skyQOeqC636shmS8PhBhuEprmHK6zzdHT9RXl9DZZw6faHn8gb6AxCoe9JFuotLDeR1QuGhXA1GGjxZl1wdGzo3TLDirooCPUhoyRYoEM5AWiNXbajuMlZxi01jvr2uclVfUyiL0Hfs6wlScIYNqkKLI3ozFeAIlk5rPOlISpWtdbXDFBRda';

const client = createClient({
    projectId: 'tqmoljsg',
    dataset: 'production',
    apiVersion: '2024-02-01',
    token,
    useCdn: false,
});

async function testWrite() {
    try {
        const res = await client.create({
            _type: 'post',
            title: 'Test Post from Script',
            slug: { _type: 'slug', current: 'test-from-script' },
            locale: 'zh'
        });
        console.log('Write Success:', res._id);
    } catch (err) {
        console.error('Write Error:', err.message);
    }
}

testWrite();
