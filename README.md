# School-Inventory-Management-
## 📂 Project Structure
The backend follows a modular architecture:
src/
├── config/          # Configuration files (database, environment variables, constants)
├── controllers/     # Route handlers; processes incoming requests and sends responses
├── middleware/      # Functions that run during the request-response cycle (Auth, Logging)
├── models/          # Data structures, database schemas, and ORM definitions
├── routes/          # API endpoint definitions; maps URLs to controller functions
└── services/        # The "Brain" of the app; contains core business logic and DB queries
