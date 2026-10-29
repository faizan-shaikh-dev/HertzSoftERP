import * as quotationService from './quotation.service.js';

// 1. Create a New Quotation
export const createQuotation = async (req, res, next) => {
  try {
    const { client_id, items } = req.body;

    if (!client_id) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'client_id is required'
        }
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Quotation must have at least one line item'
        }
      });
    }

    const quotation = await quotationService.createQuotation(req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Quotations
export const getQuotations = async (req, res, next) => {
  try {
    const { client_id, project_id, status, search } = req.query;
    const quotations = await quotationService.getQuotations({
      client_id,
      project_id,
      status,
      search
    });

    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Quotation by ID
export const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Draft Quotation
export const updateQuotation = async (req, res, next) => {
  try {
    const updated = await quotationService.updateQuotation(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 5. Revise Quotation (Create v2, mark v1 as Superseded)
export const reviseQuotation = async (req, res, next) => {
  try {
    const revised = await quotationService.reviseQuotation(req.params.id, req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: revised
    });
  } catch (error) {
    next(error);
  }
};

// 6. Update Quotation Status
export const updateQuotationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status is required'
        }
      });
    }

    const updated = await quotationService.updateQuotationStatus(req.params.id, status);

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 7. Delete Quotation
export const deleteQuotation = async (req, res, next) => {
  try {
    const result = await quotationService.deleteQuotation(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// 8. Financial & Quotations Metrics Summary
export const getQuotationMetrics = async (req, res, next) => {
  try {
    const metrics = await quotationService.getQuotationMetrics();

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

// 9. Get Printable HTML View
export const getPrintableQuotation = async (req, res, next) => {
  try {
    const html = await quotationService.generatePrintableHtml(req.params.id);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

