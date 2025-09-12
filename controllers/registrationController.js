const Registration = require('../models/Registration');
const { validationResult } = require('express-validator');

// Register a new participant
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const {
      name,
      ldapId,
      rollNumber,
      branch,
      year,
      interestedEvents,
      phoneNumber
    } = req.body;

    // Check if user already registered
    const existingRegistration = await Registration.checkExistingRegistration(
      ldapId, 
      rollNumber
    );

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'You have already registered for the event',
        registrationNumber: existingRegistration.registrationNumber,
        registrationDate: existingRegistration.registrationDate
      });
    }

    // Create new registration
    const registration = new Registration({
      name,
      ldapId: ldapId.toLowerCase(),
      rollNumber: rollNumber.toUpperCase(),
      branch,
      year,
      interestedEvents: Array.isArray(interestedEvents) ? interestedEvents : [interestedEvents],
      phoneNumber,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        registrationNumber: registration.registrationNumber,
        name: registration.name,
        ldapId: registration.ldapId,
        rollNumber: registration.rollNumber,
        events: registration.interestedEvents,
        registrationDate: registration.registrationDate
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `This ${field === 'ldapId' ? 'LDAP ID' : 'Roll Number'} is already registered`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.'
    });
  }
};

// Check if a user is already registered
exports.checkRegistration = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide LDAP ID or Roll Number'
      });
    }

    // Check if identifier is email or roll number
    const query = identifier.includes('@') 
      ? { ldapId: identifier.toLowerCase() }
      : { rollNumber: identifier.toUpperCase() };

    const registration = await Registration.findOne(query);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No registration found',
        isRegistered: false
      });
    }

    res.status(200).json({
      success: true,
      isRegistered: true,
      data: {
        registrationNumber: registration.registrationNumber,
        name: registration.name,
        events: registration.interestedEvents,
        registrationDate: registration.registrationDate
      }
    });

  } catch (error) {
    console.error('Check registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration status'
    });
  }
};

// Get all registrations (admin only - add authentication in production)
exports.getAllRegistrations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      event, 
      branch, 
      year,
      sortBy = 'registrationDate',
      order = 'desc' 
    } = req.query;

    const query = {};
    
    if (event) {
      query.interestedEvents = event;
    }
    if (branch) {
      query.branch = branch;
    }
    if (year) {
      query.year = year;
    }

    const totalCount = await Registration.countDocuments(query);
    
    const registrations = await Registration.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-ipAddress -userAgent');

    res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations'
    });
  }
};

// Get registration by registration number
exports.getRegistrationByNumber = async (req, res) => {
  try {
    const { registrationNumber } = req.params;

    const registration = await Registration.findOne({ registrationNumber })
      .select('-ipAddress -userAgent');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      data: registration
    });

  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration'
    });
  }
};

// Update registration status (admin only)
exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const registration = await Registration.findOneAndUpdate(
      { registrationNumber },
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: registration
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// Delete registration (admin only)
exports.deleteRegistration = async (req, res) => {
  try {
    const { registrationNumber } = req.params;

    const registration = await Registration.findOneAndDelete({ registrationNumber });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete registration'
    });
  }
};

// Export registrations to CSV (admin only)
exports.exportRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({})
      .sort({ registrationDate: -1 })
      .select('-ipAddress -userAgent -_id -__v');

    const csvData = registrations.map(reg => ({
      'Registration Number': reg.registrationNumber,
      'Name': reg.name,
      'LDAP ID': reg.ldapId,
      'Roll Number': reg.rollNumber,
      'Branch': reg.branch,
      'Year': reg.year,
      'Events': reg.interestedEvents.join(', '),
      'Phone': reg.phoneNumber || 'N/A',
      'Registration Date': new Date(reg.registrationDate).toLocaleString(),
      'Status': reg.status
    }));

    res.status(200).json({
      success: true,
      data: csvData,
      count: csvData.length
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export registrations'
    });
  }
};
