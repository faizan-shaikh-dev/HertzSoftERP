import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import * as certController from './certificate.controller.js';

const router = Router();

//Public verification route
router.get('/verify/:serial_no', certController.verifyCertificate);

//Protected routes
router.post('/', authenticateToken, authorizeRoles('Administrator', 'HR'), certController.issueCertificate);
router.get('/', authenticateToken, certController.getCertificates);
router.get('/:id', authenticateToken, certController.getCertificateById);


//Browser HTML preview route (Direct print/PDF view)
router.get('/:id/preview', certController.previewCertificateHtml);

export default router;