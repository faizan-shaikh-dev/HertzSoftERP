import * as authService from './auth.service.js';

// 1. Register User (First Admin or Team member)
export const register = async (req, res, next) => {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'full_name, email and password are required'
        }
      });
    }

    const result = await authService.register({ full_name, email, password, role });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// 2. Login User
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'email and password are required'
        }
      });
    }

    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// 3. Refresh Access Token (Rotation)
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'refreshToken is required'
        }
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// 4. Logout & Revoke Refresh Token
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out and session terminated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update Current User Profile
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, email, current_password, new_password } = req.body;

    const result = await authService.updateProfile(userId, {
      full_name,
      email,
      current_password,
      new_password
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
