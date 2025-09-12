# ScaleUp Blitz Week Registration Backend

## 🚀 Overview
Backend API for ScaleUp Blitz Week registration system at IIT Bombay. This Node.js application handles participant registrations, validation, and analytics for the event.

## 📋 Features
- **Registration Management**: Handle participant registrations with duplicate prevention
- **Validation**: IITB email and roll number format validation
- **Rate Limiting**: Prevent spam and abuse
- **Analytics**: Real-time statistics and registration trends
- **Export**: Export registration data for analysis
- **CORS**: Configured for frontend integration

## 🛠️ Tech Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **Rate Limiter** - API rate limiting

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/Scaleupapp-nirpeksh/blitzweek-b.git
cd blitzweek-b
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```
Edit `.env` file with your configuration:
- MongoDB connection string
- Port number
- CORS origins

4. **Start MongoDB** (if running locally)
```bash
mongod
```

5. **Run the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔗 API Endpoints

### Registration Endpoints

#### Register Participant
```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "ldapId": "johndoe@iitb.ac.in",
  "rollNumber": "21B1234",
  "branch": "Computer Science and Engineering",
  "year": "3rd Year",
  "interestedEvents": ["ScaleUp Blitz", "ScaleUp Ignite"],
  "phoneNumber": "9876543210"
}
```

#### Check Registration Status
```http
GET /api/check-registration/:identifier
```
- `identifier` can be LDAP ID or Roll Number

#### Get Registration Details
```http
GET /api/registration/:registrationNumber
```

### Statistics Endpoints

#### Get Overall Stats
```http
GET /api/stats
```

#### Get Live Registration Count
```http
GET /api/stats/live-count
```

#### Get Event-Specific Stats
```http
GET /api/stats/event/:eventName
```

### Admin Endpoints

#### Get All Registrations
```http
GET /api/registrations?page=1&limit=50&event=ScaleUp%20Blitz
```

#### Export Registrations
```http
GET /api/registrations/export
```

#### Update Registration Status
```http
PUT /api/registration/:registrationNumber/status
Content-Type: application/json

{
  "status": "confirmed"
}
```

#### Delete Registration
```http
DELETE /api/registration/:registrationNumber
```

## 📊 Database Schema

### Registration Model
```javascript
{
  name: String,
  ldapId: String (unique),
  rollNumber: String (unique),
  branch: String,
  year: String,
  interestedEvents: [String],
  phoneNumber: String (optional),
  registrationNumber: String (auto-generated),
  registrationDate: Date,
  status: String (default: 'confirmed'),
  timestamps: true
}
```

## 🔒 Security Features
- **Helmet.js** for security headers
- **CORS** configuration for allowed origins
- **Rate limiting** to prevent abuse
- **Input validation** using express-validator
- **MongoDB injection** prevention
- **XSS protection**

## 🚀 Deployment

### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - Choose Ubuntu Server 22.04 LTS
   - Configure security groups (ports 80, 443, 5000)

2. **Install Node.js and MongoDB**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

3. **Deploy Application**
```bash
# Clone repository
git clone https://github.com/Scaleupapp-nirpeksh/blitzweek-b.git
cd blitzweek-b

# Install dependencies
npm install

# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start app.js --name "blitzweek-api"
pm2 save
pm2 startup
```

4. **Setup Nginx (optional)**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/blitzweek

# Add configuration:
server {
    listen 80;
    server_name api.theblitzweek.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo ln -s /etc/nginx/sites-available/blitzweek /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up database user
4. Whitelist IP addresses
5. Get connection string
6. Update `.env` file with connection string

## 📈 Monitoring

### Health Check
```http
GET /health
```

### PM2 Monitoring
```bash
pm2 monit
pm2 logs blitzweek-api
pm2 status
```

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Environment Variables

```env
# Required
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blitzweek

# CORS
ALLOWED_ORIGINS=https://theblitzweek.com,https://www.theblitzweek.com

# Optional
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@iitb.ac.in
ADMIN_PASSWORD=secure-password
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access (for Atlas)

2. **CORS Error**
   - Add frontend URL to `ALLOWED_ORIGINS`
   - Restart server after changes

3. **Port Already in Use**
   - Change PORT in `.env`
   - Kill process using the port

## 📞 Support
For issues or questions, contact the ScaleUp team or create an issue in the repository.

## 📄 License
ISC License

---
Built with ❤️ for IIT Bombay by ScaleUp Team
