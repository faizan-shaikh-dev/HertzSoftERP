import * as leadService from './lead.service.js';

// 1. Create a Lead
export const createLead = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const requirement = (req.body.requirement || req.body.service_interest || '').trim();

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Client name is required'
        }
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Phone number is required'
        }
      });
    }

    if (!requirement) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Project requirement is required'
        }
      });
    }

    const payload = { 
      ...req.body, 
      name: name.trim(),
      phone: phone.trim(),
      requirement,
      lead_type: 'Client',
      assigned_to: req.body.assigned_to || req.user.id
    };

    const lead = await leadService.createLead(payload, req.user.id);

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Leads (supports ?status=Won&search=Faizan&assigned_to=...&priority=...&follow_up_filter=...&sort_by=...&sort_order=...)
export const getLeads = async (req, res, next) => {
  try {
    const { status, search, lead_type, assigned_to, priority, follow_up_filter, sort_by, sort_order } = req.query;
    const leads = await leadService.getLeads({ 
      status, 
      search, 
      lead_type, 
      assigned_to, 
      priority, 
      follow_up_filter, 
      sort_by, 
      sort_order 
    });

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Active Assignees (Team Members dropdown)
export const getAssignees = async (req, res, next) => {
  try {
    const assignees = await leadService.getAssignees();
    res.status(200).json({
      success: true,
      data: assignees
    });
  } catch (error) {
    next(error);
  }
};

// 4. Check Duplicate Phone (Real-time check)
export const checkDuplicatePhone = async (req, res, next) => {
  try {
    const { phone, excludeLeadId } = req.query;
    if (!phone) {
      return res.status(200).json({
        success: true,
        data: { isDuplicate: false, matches: [] }
      });
    }

    const result = await leadService.checkDuplicatePhone(phone, excludeLeadId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get Single Lead by ID
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

// 6. Update Lead Details
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

// 7. Update Lead Status
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status, lost_reason, on_hold_reason, revisit_date } = req.body;

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
      on_hold_reason,
      revisit_date
    });

    res.status(200).json({
      success: true,
      data: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// 8. Delete Lead
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

// ==================== FOLLOW-UP CONTROLLERS ====================

// 9. Create a Follow-up for a Lead
export const createFollowUp = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { follow_up_type, notes } = req.body;

    if (!follow_up_type) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Follow-up type is required (Call, Email, Meeting, Message, Other)'
        }
      });
    }

    const followUp = await leadService.createFollowUp(leadId, req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: followUp
    });
  } catch (error) {
    next(error);
  }
};

// 10. Get All Follow-ups for a Specific Lead
export const getLeadFollowUps = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const followUps = await leadService.getLeadFollowUps(leadId);
    res.status(200).json({
      success: true,
      count: followUps.length,
      data: followUps
    });
  } catch (error) {
    next(error);
  }
};

// 11. Get Follow-up Reminders (Due Today & Overdue)
export const getFollowUpReminders = async (req, res, next) => {
  try {
    const reminders = await leadService.getFollowUpReminders();
    res.status(200).json({
      success: true,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};

// 12. Mark Follow-up as Completed
export const completeFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await leadService.completeFollowUp(id);
    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 13. Delete Follow-up Record
export const deleteFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await leadService.deleteFollowUp(id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CONVERT LEAD TO CLIENT ====================

// 14. Convert Won Lead to Client
export const convertLeadToClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await leadService.convertLeadToClient(id, req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: `Lead successfully converted to Client #${result.client.client_number}!`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
