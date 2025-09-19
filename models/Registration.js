const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  ldapId: {
    type: String,
    required: [true, 'LDAP ID is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        // IITB LDAP email format validation
        return /^[a-zA-Z0-9._%+-]+@iitb\.ac\.in$/.test(v);
      },
      message: 'Please enter a valid IITB email address'
    }
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll Number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        // IITB Roll Number format: e.g., 21B1234, 22M1234, 23D1234
        return /^[0-9]{2}[A-Z][0-9]{4,5}$/.test(v);
      },
      message: 'Please enter a valid IITB roll number (e.g., 21B1234)'
    }
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    enum: {
      values: [
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
      ],
      message: 'Please select a valid branch'
    }
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: {
      values: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'MTech', 'PhD', 'Other'],
      message: 'Please select a valid year'
    }
  },
  interestedEvents: {
    type: [String],
    required: [true, 'Please select at least one event'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Please select at least one event'
    },
    enum: {
      values: ['ScaleUp Blitz', 'ScaleUp Ignite', 'Both'],
      message: 'Please select valid events'
    }
  },
  phoneNumber: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Please enter a valid 10-digit Indian phone number'
    }
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  registrationNumber: {
    type: String,
    unique: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed'
  }
}, {
  timestamps: true
});

// Index for faster queries
registrationSchema.index({ ldapId: 1 });
registrationSchema.index({ rollNumber: 1 });
registrationSchema.index({ registrationDate: -1 });
registrationSchema.index({ interestedEvents: 1 });

// Generate unique registration number before saving
registrationSchema.pre('save', async function(next) {
  if (!this.registrationNumber) {
    const count = await mongoose.model('Registration').countDocuments();
    const year = new Date().getFullYear();
    this.registrationNumber = `BW${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for formatted name
registrationSchema.virtual('formattedName').get(function() {
  return this.name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
});

// Method to get registration summary
registrationSchema.methods.getSummary = function() {
  return {
    registrationNumber: this.registrationNumber,
    name: this.formattedName,
    events: this.interestedEvents,
    registrationDate: this.registrationDate
  };
};

// Static method to check if user exists
registrationSchema.statics.checkExistingRegistration = async function(ldapId, rollNumber) {
  const existing = await this.findOne({
    $or: [
      { ldapId: ldapId.toLowerCase() },
      { rollNumber: rollNumber.toUpperCase() }
    ]
  });
  return existing;
};

// Transform output
registrationSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.ipAddress;
    delete ret.userAgent;
    return ret;
  }
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
