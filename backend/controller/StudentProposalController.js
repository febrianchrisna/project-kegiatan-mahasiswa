import PostgreSQLService from '../services/PostgreSQLService.js';
import MySQLService from '../services/MySQLService.js';
import upload from '../middleware/upload.js';

// Get all proposals
export const getAllProposals = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            search: req.query.search,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };

        // If not admin, only show user's own proposals
        if (req.userRole !== 'admin') {
            filters.user_id = req.userId;
        }

        const result = await PostgreSQLService.getAllProposals(filters);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                data: result.data
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get proposal by ID
export const getProposalById = async (req, res) => {
    try {
        const result = await PostgreSQLService.getProposalById(req.params.id);

        if (result.success) {
            // Check if user can access this proposal
            if (req.userRole !== 'admin' && result.data.user_id !== req.userId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Not authorized to view this proposal'
                });
            }

            res.status(200).json({
                status: 'success',
                data: result.data
            });
        } else {
            res.status(404).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get proposal by number
export const getProposalByNumber = async (req, res) => {
    try {
        const result = await PostgreSQLService.getProposalByNumber(req.params.proposalNumber);

        if (result.success) {
            // Check if user can access this proposal
            if (req.userRole !== 'admin' && result.data.user_id !== req.userId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Not authorized to view this proposal'
                });
            }

            res.status(200).json({
                status: 'success',
                data: result.data
            });
        } else {
            res.status(404).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create new proposal
export const createProposal = async (req, res) => {
    try {
        // Check if activity_id is provided
        if (!req.body.activity_id) {
            return res.status(400).json({
                status: 'error',
                message: 'activity_id is required'
            });
        }

        const proposalData = {
            ...req.body,
            user_id: req.userId
        };

        const result = await PostgreSQLService.createProposal(proposalData);

        if (result.success) {
            res.status(201).json({
                status: 'success',
                message: 'Proposal created successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update proposal
export const updateProposal = async (req, res) => {
    try {
        const proposalId = req.params.id;
        
        // Check if proposal exists and user has permission
        const checkResult = await PostgreSQLService.getProposalById(proposalId);
        if (!checkResult.success) {
            return res.status(404).json({
                status: 'error',
                message: checkResult.error
            });
        }

        if (req.userRole !== 'admin' && checkResult.data.user_id !== req.userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to update this proposal'
            });
        }

        // Check if proposal can be edited
        if (checkResult.data.status === 'submitted' || checkResult.data.status === 'under_review') {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot edit a proposal that is submitted or under review'
            });
        }

        const result = await PostgreSQLService.updateProposal(proposalId, req.body);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                message: 'Proposal updated successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete proposal
export const deleteProposal = async (req, res) => {
    try {
        const proposalId = req.params.id;
        
        // Check if proposal exists and user has permission
        const checkResult = await PostgreSQLService.getProposalById(proposalId);
        if (!checkResult.success) {
            return res.status(404).json({
                status: 'error',
                message: checkResult.error
            });
        }

        if (req.userRole !== 'admin' && checkResult.data.user_id !== req.userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to delete this proposal'
            });
        }

        const result = await PostgreSQLService.deleteProposal(proposalId);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                message: result.message
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Submit proposal
export const submitProposal = async (req, res) => {
    try {
        const proposalId = req.params.id;
        
        // Check if proposal exists and user has permission
        const checkResult = await PostgreSQLService.getProposalById(proposalId);
        if (!checkResult.success) {
            return res.status(404).json({
                status: 'error',
                message: checkResult.error
            });
        }

        if (req.userRole !== 'admin' && checkResult.data.user_id !== req.userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to submit this proposal'
            });
        }

        const result = await PostgreSQLService.submitProposal(proposalId);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                message: 'Proposal submitted successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Review proposal (admin only)
export const reviewProposal = async (req, res) => {
    try {
        const proposalId = req.params.id;
        const reviewData = {
            status: req.body.status,
            reviewer_comments: req.body.reviewer_comments,
            reviewed_by: req.userId
        };

        const result = await PostgreSQLService.reviewProposal(proposalId, reviewData);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                message: 'Proposal reviewed successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get proposal statistics (fix the missing function)
export const getProposalStats = async (req, res) => {
    try {
        // Call the service function that already exists
        const result = await PostgreSQLService.getProposalStatistics();

        if (result.success) {
            res.status(200).json({
                status: 'success',
                data: result.data
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        console.error('Error getting proposal stats:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// File upload controllers with GCS
export const uploadProposal = async (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            
            // Handle specific multer errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    status: 'error',
                    message: 'File too large. Maximum size is 50MB.'
                });
            }
            
            return res.status(400).json({
                status: 'error',
                message: `File upload error: ${err.message}`
            });
        }

        // Set longer timeout for this operation
        req.setTimeout(300000); // 5 minutes
        res.setTimeout(300000); // 5 minutes

        try {
            if (!req.file) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No file uploaded'
                });
            }

            if (!req.file.buffer || req.file.buffer.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Uploaded file is empty'
                });
            }

            if (!req.body.activity_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'activity_id is required'
                });
            }

            console.log('Processing file upload:', {
                originalName: req.file.originalname,
                size: req.file.size,
                bufferSize: req.file.buffer.length,
                mimetype: req.file.mimetype,
                activityId: req.body.activity_id,
                userId: req.userId
            });

            const proposalData = {
                activity_id: parseInt(req.body.activity_id),
                title: req.body.title || req.file.originalname.replace('.pdf', ''),
                user_id: req.userId
            };

            console.log('Calling PostgreSQLService.createProposalWithFile...');
            const result = await PostgreSQLService.createProposalWithFile(proposalData, req.file);

            if (result.success) {
                console.log('File upload successful:', result.data.id);
                res.status(201).json({
                    status: 'success',
                    message: 'Proposal file uploaded successfully to Google Cloud Storage',
                    data: result.data
                });
            } else {
                console.error('Database save failed:', result.error);
                res.status(400).json({
                    status: 'error',
                    message: result.error
                });
            }
        } catch (error) {
            console.error('Unexpected error during file upload:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Internal server error during file upload';
            
            if (error.message.includes('uniform bucket-level access')) {
                errorMessage = 'Cloud storage configuration error. Please contact administrator.';
            } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
                errorMessage = 'Network connection error. Please try again.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Upload timeout. Please try with a smaller file.';
            } else if (error.message.includes('value too long')) {
                errorMessage = 'Database schema error. Please contact administrator to update column lengths.';
            } else if (error.name === 'SequelizeDatabaseError') {
                errorMessage = `Database error: ${error.message}`;
            }
            
            res.status(500).json({
                status: 'error',
                message: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });
};

export const updateProposalFile = async (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                status: 'error',
                message: `File upload error: ${err.message}`
            });
        }

        try {
            const proposalId = req.params.id;
            
            // Check if proposal exists and user has permission
            const checkResult = await PostgreSQLService.getProposalById(proposalId);
            if (!checkResult.success) {
                return res.status(404).json({
                    status: 'error',
                    message: checkResult.error
                });
            }

            if (req.userRole !== 'admin' && checkResult.data.user_id !== req.userId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Not authorized to update this proposal'
                });
            }

            console.log('Processing file update for proposal:', proposalId, {
                hasFile: !!req.file,
                title: req.body.title
            });

            const updateData = {};
            if (req.body.title) {
                updateData.title = req.body.title;
            }

            const result = await PostgreSQLService.updateProposalWithFile(proposalId, updateData, req.file);

            if (result.success) {
                console.log('File update successful for proposal:', proposalId);
                res.status(200).json({
                    status: 'success',
                    message: 'Proposal file updated successfully in Google Cloud Storage',
                    data: result.data
                });
            } else {
                console.error('Update failed for proposal:', proposalId, result.error);
                res.status(400).json({
                    status: 'error',
                    message: result.error
                });
            }
        } catch (error) {
            console.error('Unexpected error during file update:', error);
            res.status(500).json({
                status: 'error',
                message: 'Internal server error during file update'
            });
        }
    });
};

export const downloadProposal = async (req, res) => {
    try {
        const proposalId = req.params.id;
        
        console.log(`=== DOWNLOAD REQUEST START ===`);
        console.log('Proposal ID:', proposalId);
        console.log('User ID:', req.userId);
        console.log('User Role:', req.userRole);
        console.log('Origin:', req.headers.origin);
        console.log('Host:', req.headers.host);
        
        // Set comprehensive CORS headers for Cloud Run
        res.set({
            'Access-Control-Allow-Origin': '*', // Allow all origins for downloads
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
            'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Type, Cache-Control, X-Filename',
            'Vary': 'Origin'
        });
        
        // Handle preflight OPTIONS request
        if (req.method === 'OPTIONS') {
            console.log('Handling OPTIONS preflight request');
            return res.status(200).end();
        }
        
        // Validate proposal ID
        if (!proposalId || isNaN(proposalId)) {
            console.log('Invalid proposal ID');
            return res.status(400).json({
                status: 'error',
                message: 'Invalid proposal ID'
            });
        }
        
        // Get proposal data
        console.log('Fetching proposal data...');
        const result = await PostgreSQLService.getProposalById(proposalId);
        if (!result.success) {
            console.log('Proposal not found:', result.error);
            return res.status(404).json({
                status: 'error',
                message: result.error
            });
        }
        
        // Authorization logic - MORE PERMISSIVE for downloads
        if (req.userId) {
            // Authenticated user
            if (req.userRole === 'admin') {
                console.log('Admin access granted');
            } else if (result.data.user_id === req.userId) {
                console.log('Owner access granted');
            } else {
                console.log('Access denied - not owner or admin, but allowing anyway for download');
                // CHANGED: Allow download even if not owner (more permissive)
            }
        } else {
            // Public access - allow all for now to test download functionality
            console.log('Public access granted');
        }
        
        // Check if file exists
        if (!result.data.gcs_filename) {
            console.log('No file attached to proposal');
            return res.status(404).json({
                status: 'error',
                message: 'No file attached to this proposal'
            });
        }
        
        console.log('Getting file stream from GCS:', result.data.gcs_filename);
        
        // Get file stream from GCS
        const downloadResult = await PostgreSQLService.downloadFileStream(result.data.gcs_filename);
        if (!downloadResult.success) {
            console.log('Failed to get file stream:', downloadResult.error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve file: ' + downloadResult.error
            });
        }
        
        // Prepare file info
        const filename = result.data.original_filename || `proposal-${proposalId}.pdf`;
        const sanitizedFilename = filename.replace(/[^\w\s.-]/gi, '');
        
        console.log('Preparing file download:', {
            originalFilename: filename,
            sanitizedFilename: sanitizedFilename,
            fileSize: downloadResult.metadata?.size,
            contentType: downloadResult.metadata?.contentType
        });
        
        // Set download headers with Cloud Run compatibility
        const headers = {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Filename': sanitizedFilename,
            'Accept-Ranges': 'bytes',
            // Enhanced CORS headers for Cloud Run
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Type, Cache-Control, X-Filename',
            'Cross-Origin-Resource-Policy': 'cross-origin'
        };
        
        // Add file size if available
        if (downloadResult.metadata?.size) {
            headers['Content-Length'] = downloadResult.metadata.size;
        }
        
        res.set(headers);
        
        console.log('Headers set, starting stream...');
        
        // Handle stream events with better error handling for Cloud Run
        let streamEnded = false;
        let bytesTransferred = 0;
        
        downloadResult.stream.on('data', (chunk) => {
            bytesTransferred += chunk.length;
        });
        
        downloadResult.stream.on('end', () => {
            if (!streamEnded) {
                streamEnded = true;
                console.log(`File stream completed. Bytes transferred: ${bytesTransferred}`);
            }
        });
        
        downloadResult.stream.on('error', (error) => {
            console.error('GCS stream error:', error);
            if (!streamEnded && !res.headersSent) {
                streamEnded = true;
                res.status(500).json({
                    status: 'error',
                    message: 'File stream error'
                });
            }
        });
        
        // Handle client disconnect and cleanup
        req.on('aborted', () => {
            if (!streamEnded) {
                console.log('Client aborted download');
                streamEnded = true;
                if (downloadResult.stream && !downloadResult.stream.destroyed) {
                    downloadResult.stream.destroy();
                }
            }
        });
        
        res.on('close', () => {
            if (!streamEnded) {
                console.log('Response closed');
                streamEnded = true;
                if (downloadResult.stream && !downloadResult.stream.destroyed) {
                    downloadResult.stream.destroy();
                }
            }
        });
        
        res.on('finish', () => {
            console.log('Response finished successfully');
        });
        
        // Start piping the stream
        console.log('Starting file download stream...');
        downloadResult.stream.pipe(res);
        
        console.log(`=== DOWNLOAD REQUEST PROCESSING ===`);
        
    } catch (error) {
        console.error('Download controller error:', error);
        
        if (!res.headersSent) {
            res.set({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true'
            });
            
            res.status(500).json({
                status: 'error',
                message: 'Internal server error during download',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

// Simplified public download function
export const downloadProposalPublic = async (req, res) => {
    try {
        const proposalId = req.params.id;
        
        console.log(`=== PUBLIC DOWNLOAD REQUEST START ===`);
        console.log('Proposal ID:', proposalId);
        
        // Set permissive CORS headers
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Type, Cache-Control, X-Filename',
        });
        
        // Validate proposal ID
        if (!proposalId || isNaN(proposalId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid proposal ID'
            });
        }
        
        // Get proposal data
        const result = await PostgreSQLService.getProposalById(proposalId);
        if (!result.success) {
            return res.status(404).json({
                status: 'error',
                message: 'Proposal not found'
            });
        }
        
        // CHANGED: Allow all proposals for public download (remove approval restriction for testing)
        // if (result.data.status !== 'approved') {
        //     return res.status(403).json({
        //         status: 'error',
        //         message: 'Only approved proposals can be downloaded publicly'
        //     });
        // }
        console.log('Public access granted for all proposals (testing mode)');
        
        // Check if file exists
        if (!result.data.gcs_filename) {
            return res.status(404).json({
                status: 'error',
                message: 'No file attached to this proposal'
            });
        }
        
        // Get file stream from GCS
        const downloadResult = await PostgreSQLService.downloadFileStream(result.data.gcs_filename);
        if (!downloadResult.success) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve file'
            });
        }
        
        // Prepare filename
        const filename = result.data.original_filename || `proposal-${proposalId}.pdf`;
        const sanitizedFilename = filename.replace(/[^\w\s.-]/gi, '');
        
        // Set headers
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
            'X-Filename': sanitizedFilename,
            'Content-Length': downloadResult.metadata?.size || '',
            'Access-Control-Allow-Origin': '*'
        });
        
        console.log('Starting public download stream...');
        downloadResult.stream.pipe(res);
        
    } catch (error) {
        console.error('Public download error:', error);
        
        if (!res.headersSent) {
            res.set({
                'Access-Control-Allow-Origin': '*'
            });
            res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
};
