import { bucket } from '../config/gcs.js';
import StudentProposal from '../models/postgres/StudentProposalModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupOrphanedFiles() {
    try {
        console.log('Starting cleanup of orphaned files...');
        
        // Get all files in the proposals folder
        const [files] = await bucket.getFiles({ prefix: 'proposals/' });
        
        // Get all GCS filenames from database
        const proposals = await StudentProposal.findAll({
            attributes: ['gcs_filename'],
            where: {
                gcs_filename: { $ne: null }
            }
        });
        
        const dbFilenames = new Set(proposals.map(p => p.gcs_filename));
        
        // Find orphaned files
        const orphanedFiles = files.filter(file => {
            const filename = file.name;
            return filename.startsWith('proposals/') && !dbFilenames.has(filename);
        });
        
        console.log(`Found ${orphanedFiles.length} orphaned files`);
        
        // Delete orphaned files
        for (const file of orphanedFiles) {
            try {
                await file.delete();
                console.log(`Deleted orphaned file: ${file.name}`);
            } catch (error) {
                console.error(`Failed to delete ${file.name}:`, error.message);
            }
        }
        
        console.log('Cleanup completed');
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

// Run if script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    cleanupOrphanedFiles();
}

export default cleanupOrphanedFiles;
