# SwiftCourier - Professional Delivery Management System

A comprehensive courier delivery and shipping management application built with Django REST Framework and Next.js.

## Features

- 📦 **Package Management**: Create, track, and manage packages with QR codes
- 🚚 **Real-time Tracking**: Live GPS tracking with WebSocket updates
- 🗺️ **Route Optimization**: Intelligent delivery route planning
- 👥 **Multi-role System**: Customer, Driver, and Admin dashboards
- 📱 **Responsive Design**: Mobile-first design for all devices
- 🔔 **Notifications**: SMS and email notifications for status updates
- 💳 **Rate Calculator**: Dynamic shipping cost calculation
- 🔐 **JWT Authentication**: Secure token-based authentication
- 📊 **Analytics Dashboard**: Comprehensive reporting and analytics

## Tech Stack

### Backend
- Django 4.2 + Django REST Framework
- PostgreSQL database
- Redis for caching and WebSocket channels
- Celery for background tasks
- Django Channels for real-time features

### Frontend
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Axios for API communication
- WebSocket for real-time updates

### Infrastructure
- Docker & Docker Compose
- Nginx reverse proxy
- SSL/TLS encryption
- Automated backups

## Quick Start

### Development Setup

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd swiftcourier
   \`\`\`

2. **Start with Docker Compose**
   \`\`\`bash
   docker-compose up --build
   \`\`\`

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

### Production Deployment

1. **Configure environment variables**
   \`\`\`bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with your production settings
   \`\`\`

2. **Deploy with the deployment script**
   \`\`\`bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   \`\`\`

## Environment Variables

### Backend (.env)
\`\`\`env
SECRET_KEY=your-secret-key
DEBUG=False
DB_NAME=swiftcourier
DB_USER=postgres
DB_PASSWORD=your-password
GOOGLE_MAPS_API_KEY=your-api-key
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
\`\`\`

### Frontend (.env.local)
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key
\`\`\`

## API Documentation

The API documentation is available at:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

## Key API Endpoints

- `POST /api/packages/` - Create new package
- `GET /api/packages/{tracking_number}/track/` - Track package
- `GET /api/packages/{tracking_number}/location/` - Get real-time location
- `POST /api/calculate-rate/` - Calculate shipping rates
- `GET /api/routes/optimize/` - Optimize delivery routes
- `WebSocket /ws/tracking/{tracking_number}/` - Real-time updates

## User Roles

### Customer
- Create and manage shipments
- Track packages in real-time
- View shipping history
- Calculate shipping rates

### Driver
- View assigned routes
- Update package status
- Manage delivery stops
- Real-time location updates

### Admin
- System overview and analytics
- Manage users and packages
- Route optimization
- System configuration

## Backup & Restore

### Create Backup
\`\`\`bash
./scripts/backup.sh
\`\`\`

### Restore from Backup
\`\`\`bash
./scripts/restore.sh /path/to/db_backup.sql /path/to/media_backup.tar.gz
\`\`\`

## Monitoring

- Application logs: `docker-compose logs -f`
- Database monitoring: Built-in PostgreSQL tools
- Redis monitoring: Redis CLI
- Nginx logs: `/var/log/nginx/`

## Security Features

- JWT token authentication
- CORS protection
- SQL injection prevention
- XSS protection
- CSRF protection
- SSL/TLS encryption
- Rate limiting
- Input validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@swiftcourier.com or create an issue in the repository.
