const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const registrationController = require('../controllers/registrationController');

// Validation middleware - Keeping IITB email, branch, year, and events validation
const validateRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
  
  body('ldapId')
    .trim()
    .notEmpty().withMessage('LDAP ID is required')
    .matches(/@iitb\.ac\.in$/i).withMessage('Must be a valid IITB email address')
    .normalizeEmail(),
  
  body('rollNumber')
    .trim()
    .notEmpty().withMessage('Roll Number is required')
    .toUpperCase(),
  
  body('branch')
    .notEmpty().withMessage('Branch is required')
    .isIn([
      'Aerospace Engineering',
      'Chemical Engineering',
      'Civil Engineering',
      'Computer Science and Engineering',
      'Electrical Engineering',
      'Engineering Physics',
      'Environmental Science and Engineering',
      'Mechanical Engineering',
      'Metallurgical Engineering and Materials Science',
      'Biosciences and Bioengineering',
      'Chemistry',
      'Earth Sciences',
      'Mathematics',
      'Physics',
      'Climate Studies',
      'Educational Technology',
      'Energy Science and Engineering',
      'Systems and Control Engineering',
      'Technology and Development',
      'Economics',
      'Other'
    ]).withMessage('Invalid branch'),
  
  body('year')
    .notEmpty().withMessage('Year is required')
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'MTech', 'PhD', 'Other'])
    .withMessage('Invalid year'),
  
  body('interestedEvents')
    .notEmpty().withMessage('Please select at least one event')
    .custom((value) => {
      const validEvents = ['ScaleUp Blitz', 'ScaleUp Ignite', 'Both'];
      if (Array.isArray(value)) {
        return value.every(event => validEvents.includes(event));
      }
      return validEvents.includes(value);
    }).withMessage('Invalid event selection'),
  
  body('phoneNumber')
    .optional()
    .trim()
];

// Public routes
router.post('/register', validateRegistration, registrationController.register);
router.get('/check-registration/:identifier', registrationController.checkRegistration);
router.get('/registration/:registrationNumber', registrationController.getRegistrationByNumber);

// Admin routes (add authentication middleware in production)
router.get('/registrations', registrationController.getAllRegistrations);
router.put('/registration/:registrationNumber/status', registrationController.updateRegistrationStatus);
router.delete('/registration/:registrationNumber', registrationController.deleteRegistration);
router.get('/registrations/export', registrationController.exportRegistrations);

module.exports = router;