import StudentProposal from '../models/postgres/StudentProposalModel.js';
import MySQLService from './MySQLService.js';
import { Op } from 'sequelize';
import { bucket } from '../config/gcs.js';

class PostgreSQLService {
    // Generate unique proposal number
    generateProposalNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const timestamp = Date.now().toString().slice(-6);
        return `PROP-${year}${month}-${timestamp}`;
    }

    // Student Proposal CRUD operations
    async createProposal(proposalData) {
        try {
            //   Check if the activity exists and is approved
            const activityCheck = await MySQLService.isActivityApproved(proposalData.activity_id);
            
            if (!activityCheck.success) {
                return { success: false, error: activityCheck.error };
            }
            
            if (!activityCheck.isApproved) {
                return { success: false, error: 'You can only create proposals for approved activities' };
            }
            
            const proposal = await StudentProposal.create({
                ...proposalData,
                proposal_number: this.generateProposalNumber()
            });
            return { success: true, data: proposal };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAllProposals(filters = {}) {
        try {
            const whereClause = {};
            
            if (filters.status) {
                whereClause.status = filters.status;
            }
            
            if (filters.user_id) {
                whereClause.user_id = filters.user_id;
            }
            
            if (filters.search) {
                whereClause[Op.or] = [
                    { title: { [Op.iLike]: `%${filters.search}%` } },
                    { background: { [Op.iLike]: `%${filters.search}%` } },
                    { proposal_number: { [Op.iLike]: `%${filters.search}%` } }
                ];
            }

            const proposals = await StudentProposal.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']],
                limit: filters.limit || 50,
                offset: filters.offset || 0
            });

            return { success: true, data: proposals };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getProposalById(id) {
        try {
            const proposal = await StudentProposal.findByPk(id);
            if (!proposal) {
                return { success: false, error: 'Proposal not found' };
            }
            return { success: true, data: proposal };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getProposalByNumber(proposalNumber) {
        try {
            const proposal = await StudentProposal.findOne({
                where: { proposal_number: proposalNumber }
            });
            if (!proposal) {
                return { success: false, error: 'Proposal not found' };
            }
            return { success: true, data: proposal };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateProposal(id, updateData) {
        try {
            const proposal = await StudentProposal.findByPk(id);
            if (!proposal) {
                return { success: false, error: 'Proposal not found' };
            }

            await proposal.update(updateData);
            return { success: true, data: proposal };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Helper function to upload file to GCS
    async uploadToGCS(file) {
        return new Promise((resolve, reject) => {
            if (!file) reject("No file");

            // Generate unique filename
            const timestamp = Date.now();
            const gcsFileName = `proposals/${timestamp}-${file.originalname}`;

            const fileUpload = bucket.file(gcsFileName);

            const stream = fileUpload.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                },
                resumable: false,
            });

            stream.on("error", (err) => {
                console.error('GCS upload stream error:', err);
                reject(err);
            });

            stream.on("finish", async () => {
                console.log('File uploaded to GCS successfully');
                
                // Don't generate signed URL here, just return the filename
                // We'll generate signed URLs on-demand when downloading
                resolve({
                    gcsFileName,
                    originalName: file.originalname,
                    fileSize: file.size
                });
            });

            // Start upload
            stream.end(file.buffer);
        });
    }

    // Helper function to generate download URL for GCS file
    async generateDownloadUrl(gcsFileName) {
        try {
            if (!gcsFileName) {
                return { success: false, error: 'No filename provided' };
            }

            const file = bucket.file(gcsFileName);
            
            // Check if file exists
            const [exists] = await file.exists();
            if (!exists) {
                return { success: false, error: 'File not found in storage' };
            }

            // Generate signed URL valid for 1 hour
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
            });

            return { success: true, url: signedUrl };
        } catch (error) {
            console.error('Error generating download URL:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper function to delete file from GCS
    async deleteFromGCS(gcsFileName) {
        try {
            if (gcsFileName) {
                await bucket.file(gcsFileName).delete();
                return { success: true };
            }
            return { success: false, error: 'No filename provided' };
        } catch (error) {
            console.error('Error deleting file from GCS:', error);
            return { success: false, error: error.message };
        }
    }

    // Create proposal with file upload to GCS
    async createProposalWithFile(proposalData, file) {
        let uploadResult = null;
        let proposal = null;
        
        try {
            // Check if the activity exists and is approved
            const activityCheck = await MySQLService.isActivityApproved(proposalData.activity_id);
            
            if (!activityCheck.success) {
                return { success: false, error: activityCheck.error };
            }
            
            if (!activityCheck.isApproved) {
                return { success: false, error: 'You can only create proposals for approved activities' };
            }

            console.log('Starting file upload to GCS...');
            // Upload file to GCS first
            uploadResult = await this.uploadToGCS(file);
            console.log('File uploaded to GCS successfully:', uploadResult.gcsFileName);

            console.log('Creating proposal in database...');
            // Create proposal in database with minimal file info
            proposal = await StudentProposal.create({
                ...proposalData,
                proposal_number: this.generateProposalNumber(),
                gcs_filename: uploadResult.gcsFileName,
                original_filename: uploadResult.originalName,
                file_size: uploadResult.fileSize,
                file_path: null // Don't store the signed URL, generate on demand
            });
            console.log('Proposal created in database successfully:', proposal.id);

            return { success: true, data: proposal };
        } catch (error) {
            console.error('Error in createProposalWithFile:', error);
            
            // If database save fails but file was uploaded, clean up the file
            if (uploadResult && uploadResult.gcsFileName) {
                console.log('Database save failed, cleaning up uploaded file:', uploadResult.gcsFileName);
                try {
                    await this.deleteFromGCS(uploadResult.gcsFileName);
                    console.log('Orphaned file cleaned up successfully');
                } catch (cleanupError) {
                    console.error('Failed to cleanup orphaned file:', cleanupError.message);
                }
            }
            
            return { success: false, error: error.message };
        }
    }

    // Update proposal with file - enhanced error handling
    async updateProposalWithFile(id, updateData, file) {
        let uploadResult = null;
        let oldGcsFilename = null;
        
        try {
            const proposal = await StudentProposal.findByPk(id);
            if (!proposal) {
                return { success: false, error: 'Proposal not found' };
            }

            let fileData = {};
            
            if (file) {
                console.log('Starting file upload for update...');
                // Store old filename for rollback
                oldGcsFilename = proposal.gcs_filename;
                
                // Upload new file to GCS first
                uploadResult = await this.uploadToGCS(file);
                console.log('New file uploaded successfully:', uploadResult.gcsFileName);
                
                fileData = {
                    gcs_filename: uploadResult.gcsFileName,
                    original_filename: uploadResult.originalName,
                    file_size: uploadResult.fileSize,
                    file_path: null // Don't store signed URL
                };
            }

            console.log('Updating proposal in database...');
            // Update proposal in database
            await proposal.update({
                ...updateData,
                ...fileData
            });
            console.log('Proposal updated successfully');

            // If new file was uploaded successfully and database updated, delete old file
            if (file && oldGcsFilename) {
                try {
                    await this.deleteFromGCS(oldGcsFilename);
                    console.log('Old file deleted successfully');
                } catch (deleteError) {
                    console.error('Failed to delete old file:', deleteError.message);
                    // Don't fail the operation for this
                }
            }

            return { success: true, data: proposal };
        } catch (error) {
            console.error('Error in updateProposalWithFile:', error);
            
            // If database update fails but new file was uploaded, clean up the new file
            if (uploadResult && uploadResult.gcsFileName) {
                console.log('Database update failed, cleaning up new uploaded file:', uploadResult.gcsFileName);
                try {
                    await this.deleteFromGCS(uploadResult.gcsFileName);
                    console.log('New orphaned file cleaned up successfully');
                } catch (cleanupError) {
                    console.error('Failed to cleanup new orphaned file:', cleanupError.message);
                }
            }
            
            return { success: false, error: error.message };
        }
    }

    // Override delete to also delete from GCS
    async deleteProposal(id) {
        try {
            const proposal = await StudentProposal.findByPk(id);
            if (!proposal) {
                return { success: false, error: 'Proposal not found' };
            }

            // Delete file from GCS if exists
            if (proposal.gcs_filename) {
                await this.deleteFromGCS(proposal.gcs_filename);
            }

            await proposal.destroy();
            return { success: true, message: 'Proposal deleted successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async submitProposal(id) {
        try {
            const proposal = await StudentProposal.findByPk(id);
            if (!proposal) {
                return { success: false, error: 'Proposal not found' };
            }

            if (proposal.status !== 'draft') {
                return { success: false, error: 'Only draft proposals can be submitted' };
            }

            await proposal.update({
                status: 'submitted',
                submitted_at: new Date()
            });

            return { success: true, data: proposal };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async reviewProposal(id, reviewData) {
        try {
            const proposal = await StudentProposal.findByPk(id);
            if (!proposal) {
                return { success: false, error: 'Proposal not found' };
            }

            if (proposal.status !== 'submitted') {
                return { success: false, error: 'Only submitted proposals can be reviewed' };
            }

            await proposal.update({
                status: reviewData.status,
                reviewer_comments: reviewData.reviewer_comments,
                reviewed_by: reviewData.reviewed_by,
                reviewed_at: new Date()
            });

            return { success: true, data: proposal };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getProposalStatistics(userId) {
        try {
            const rejectedProposals = await StudentProposal.count({ where: { status: 'rejected' } });
            const approvedProposals = await StudentProposal.count({ where: { status: 'approved' } });
            const submittedProposals = await StudentProposal.count({ where: { status: 'submitted' } });
            const draftProposals = await StudentProposal.count({ where: { status: 'draft' } });
            const totalProposals = await StudentProposal.count();

            return {
                success: true,
                data: {
                    total: totalProposals,
                    draft: draftProposals,
                    submitted: submittedProposals,
                    approved: approvedProposals,
                    rejected: rejectedProposals
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Helper function to stream file from GCS
    async downloadFileStream(gcsFileName) {
        try {
            if (!gcsFileName) {
                return { success: false, error: 'No filename provided' };
            }

            const file = bucket.file(gcsFileName);
            
            // Check if file exists
            const [exists] = await file.exists();
            if (!exists) {
                return { success: false, error: 'File not found in storage' };
            }

            // Get file metadata
            const [metadata] = await file.getMetadata();
            console.log('File metadata:', {
                name: metadata.name,
                size: metadata.size,
                contentType: metadata.contentType
            });

            // Create a read stream from GCS
            const stream = file.createReadStream({
                validation: false // Disable CRC32C validation for better performance
            });
            
            return { success: true, stream, metadata };
        } catch (error) {
            console.error('Error streaming file from GCS:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new PostgreSQLService();
