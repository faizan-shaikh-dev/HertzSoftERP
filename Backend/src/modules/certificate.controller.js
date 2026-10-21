import * as certService from './certificate.service.js';

// 1. Issue Certificate / Offer Letter
export const issueCertificate = async (req, res, next) => {
  try {
    const document_type = req.body.document_type || req.body.doc_type;
    const candidate_name = req.body.candidate_name || req.body.recipient_name;
    const course_or_domain = req.body.course_or_domain || req.body.course_or_role;

    if (!document_type || !candidate_name || !course_or_domain) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'document_type, candidate_name, and course_or_domain are required'
        }
      });
    }

    const payload = {
      ...req.body,
      document_type,
      candidate_name,
      course_or_domain
    };

    const doc = await certService.createCertificate(payload, req.user?.id || null);

    return res.status(201).json({
      success: true,
      message: `${document_type} issued successfully`,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Certificates
export const getCertificates = async (req, res, next) => {
  try {
    const list = await certService.getCertificates(req.query);
    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Certificate Details by ID
export const getCertificateById = async (req, res, next) => {
  try {
    const doc = await certService.getCertificateById(req.params.id);
    return res.status(200).json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// 4. Verify Certificate Publicly (via Serial / Certificate Number)
export const verifyCertificate = async (req, res, next) => {
  try {
    const serialNo = req.params.serial_no || req.params.certificate_number;
    const result = await certService.verifyCertificate(serialNo);

    if (!result.verified) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: result.message || 'Invalid certificate or document number'
        }
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

// 5. HTML Preview Template (Browser me direct view/print/PDF ke liye)
export const previewCertificateHtml = async (req, res, next) => {
  try {
    const html = await certService.getCertificateHtml(req.params.id);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

