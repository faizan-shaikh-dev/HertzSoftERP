import * as paymentService from './payment.service.js';

// 1. Record a New Payment
export const recordPayment = async (req, res, next) => {
  try {
    const { project_id, amount_paid } = req.body;

    if (!project_id || !amount_paid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'project_id and amount_paid are required fields'
        }
      });
    }

    if (Number(amount_paid) <= 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'amount_paid must be greater than 0'
        }
      });
    }

    const payment = await paymentService.recordPayment(req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Payments
export const getPayments = async (req, res, next) => {
  try {
    const { project_id, client_id } = req.query;
    const payments = await paymentService.getPayments({ project_id, client_id });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Payment by ID
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// 4. Delete Payment Record
export const deletePayment = async (req, res, next) => {
  try {
    const result = await paymentService.deletePayment(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get Financial Summary (Total Deals, Total Collected, Total Due)
export const getFinancialSummary = async (req, res, next) => {
  try {
    const summary = await paymentService.getFinancialSummary();

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};
