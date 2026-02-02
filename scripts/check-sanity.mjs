import { createClient } from '@sanity/client';

const token = 'skyQOeqC636shmS8PhBhuEprmHK6zzdHT9RXl9DZZw6faHn8gb6AxCoe9JFuotLDeR1QuGhXA1GGjxZl1wdGzo3TLDirooCPUhoyRYoEM5AWiNXbajuMlZxi01jvr2uclVfUyiL0Hfs6wlScIYNqkKLI3ozFeAIlk5rPOlISpWtdbXDFBRda';

const client = createClient({
    projectId: 'tqmoljsg',
    dataset: 'production',
    apiVersion: '2024-02-01',
    token,
    useCdn: false,
});

async function check() {
    try {
        const project = await client.request({ url: '/projects/tqmoljsg' });
        console.log('Project Info:', project);
    } catch (err) {
        console.error('Check Error:', err.message);
    }
}

check();
