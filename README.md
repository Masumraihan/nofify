
## 🚀 Node.js Server Setup Guide
 * ===========================
 *
 * 1. 📁 Environment Variables:
 *    - Create a `.env` file in the root of your project.
 *    - Example:
 *        DATABASE_URL="your-database-url"
 *        PORT=3000
 *    - ⚠️ See env.example for more details.
 *
 * 2. 📦 Install Dependencies:
 *    - Use any one of the following commands:
 *        npm install
 *        yarn
 *        pnpm install
 *
 * 3. 🔧 Generate Prisma Client:
 *    - Run the command:
 *        npx prisma generate
 *
 * 4. 🗃️ Push Prisma Schema to DB:
 *    - Run the command:
 *        npx prisma db push
 *    - This applies your Prisma schema to the connected database.
 *
 * 5. 🏃‍♂️ Start Development Server:
 *    - Use one of the following:
 *        npm run dev
 *        yarn dev
 *        pnpm dev
 *    - Your server will run on http://localhost:ENV_PORT (or the port from `.env`).
 *
 * ===========================
 * 💡 Helpful Commands Recap
 * ===========================
 * - npx prisma generate      => Generate Prisma Client
 * - npx prisma db push       => Push schema changes to DB
 * - npm|yarn|pnpm run dev    => Run development server
 *
 * ===========================
 * 📂 Basic Project Structure
 * ===========================
 * .
 * ├── prisma/
 * │   └── schema.prisma       # Prisma schema
 * ├── src/                    # Source code
 * ├── .env                    # Environment variables
 * ├── package.json            # Scripts and dependencies
 * └── README.md               # Project guide
 *
 * ===========================
 * 🧪 Testing Suggestions
 * ===========================
 * - You can test your API using tools like:
 *     - Postman
 *     - Insomnia
 *     - curl or your frontend app
 *
 * ===========================
 * ✅ Done!
 * Happy coding! 💻✨
 * ===========================
 
