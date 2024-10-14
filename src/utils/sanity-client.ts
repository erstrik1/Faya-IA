import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';
import { createClient, type ClientConfig, type SanityClient } from '@sanity/client';

const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN, STACKBIT_PREVIEW, SANITY_PREVIEW_DRAFTS } = loadEnv(process.env.NODE_ENV || '', process.cwd(), '');
const isDev = import.meta.env.DEV;
const isDeployPreview = process.env.CONTEXT === 'deploy-preview';
const previewDrafts = STACKBIT_PREVIEW?.toLowerCase() === 'true' || SANITY_PREVIEW_DRAFTS?.toLowerCase() === 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sanityConfig: ClientConfig = {
    projectId: 'lei769qx', // Mettre des guillemets pour définir la variable
    dataset: 'fayaia' || 'production', // Assurez-vous que cela renvoie une chaîne
    useCdn: false,
    apiVersion: '2024-01-31',
    token: 'sk7x5duYrvyBiV6EmicjdWHEtj1y2ol91a9LOL2PJWEr3NNzE1rG65tT4FDVu45kLAzFeGNoH5McjUuBcBD1Ozjjb2XV8NLUg1YRoGS2UVGslfSKt4yrOCQtGPtgCY5dehBlnxdG803HIIc9j1QjFoAHpMFo4Nkf11zUVUmqcgyTMryM0OTO', // Mettre des guillemets pour le token
    perspective: isDev || isDeployPreview || previewDrafts ? 'previewDrafts' : 'published'
};

export const client = createClient(sanityConfig);

/**
 * @param {SanityClient} client The Sanity client to add the listener to
 * @param {Array<String>} types An array of types the listener should take an action on
 * Creating Sanity listener to subscribe to whenever a new document is created or deleted to refresh the list in Create
 */
[{ client: client, types: ['page'] }].forEach(({ client, types }: { client: SanityClient; types: Array<String> }) =>
    client.listen(`*[_type in ${JSON.stringify(types)}]`, {}, { visibility: 'query' }).subscribe(async (event: any) => {
        // only refresh when pages are deleted or created
        if (event.transition === 'appear' || event.transition === 'disappear') {
            const filePath = path.join(__dirname, '../layouts/Layout.astro');
            const time = new Date();
            
            // update the updatedat stamp for the layout file, triggering astro to refresh the data in getStaticPaths
            await fs.promises.utimes(filePath, time, time);
        }
    })
);
