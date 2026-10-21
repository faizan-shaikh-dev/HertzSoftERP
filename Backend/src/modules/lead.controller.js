import * as leadService from './lead.service.js';

// 1. Create a Lead
export const createLead = async (req, res, next) => {
  try {
    const requirement = req.body.requirement || req.body.service_interest || (req.body.lead_type === 'Student' ? 'Course Inquiry' : null);
    const { name, phone } = req.body;

    if (!name || !phone || !requirement) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, phone and requirement (or course) are required fields'
        }
      });
    }

    const payload = { ...req.body, requirement };
    const lead = await leadService.createLead(payload, req.user.id);

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Leads (supports ?status=Won&search=Faizan)
export const getLeads = async (req, res, next) => {
  try {
    const { status, search, lead_type } = req.query;
    const leads = await leadService.getLeads({ status, search, lead_type });

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Lead by ID
export const getLeadById = async (req, res, next) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Lead Details
export const updateLead = async (req, res, next) => {
  try {
    const updatedLead = await leadService.updateLead(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update Lead Status
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status, lost_reason, on_hold_reason } = req.body;

    if (!status) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status is required'
        }
      });
    }

    const updatedLead = await leadService.updateLeadStatus(req.params.id, {
      status,
      lost_reason,
      on_hold_reason
    });

    res.status(200).json({
      success: true,
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete Lead
export const deleteLead = async (req, res, next) => {
  try {
    const result = await leadService.deleteLead(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
