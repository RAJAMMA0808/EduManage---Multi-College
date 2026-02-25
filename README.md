# EduManage - Multi-College Management System

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

EduManage is a modern, comprehensive, and scalable management dashboard designed for educational institutions. It provides a centralized platform for administrators, faculty, and staff to monitor and manage student and faculty metrics with ease. This project uses a robust Node.js/Express backend and a responsive React frontend.

![EduManage Demo](https://storage.googleapis.com/aistudio-hosting/story-authors/511d739810a4306461a25785f782f9c8/edumanage_demo.gif)

## ✨ Features

-   **🔐 Role-Based Access Control**: Secure login system with distinct views and permissions for different user roles.
-   **📊 Comprehensive Dashboards**: High-level overviews for administrators and detailed, personalized dashboards for staff and students.
-   **📈 Data Visualization**: Interactive charts to visualize attendance, academic performance, and other key metrics.
-   **🔍 Powerful Search & Filtering**: Advanced filters to drill down into data by college, department, year, and more.
-   **📥 Data Export**: Download filtered data as a CSV file for offline analysis.
-   **📤 Data Submission**: Manual and bulk-upload functionality for marks and attendance.
-   **📱 Responsive Design**: A clean, modern UI that works seamlessly across all devices.

## 🛠️ Tech Stack

-   **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/)
-   **Frontend**: [React](https://reactjs.org/) (with hooks), [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)

## 📂 Project Structure

This project is structured as a monorepo.

-   `frontend/`: The main React/Vite frontend application.
-   `server/`: The Node.js/Express backend server.
-   `shared/`: Contains shared TypeScript types used by both the frontend and backend.
-   `docs/`: Project documentation.

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/) (v9 or later)
-   [PostgreSQL](https://www.postgresql.org/download/) installed and running.

### Installation & Running

You will need two separate terminal windows to run the backend and frontend servers concurrently.

**1. Install Dependencies**

From the **root directory** of the project, install all necessary dependencies for all workspaces. This is a crucial step for monorepos.

```sh
npm install
```

**2. Setup PostgreSQL Database**

Make sure your PostgreSQL server is running. You need to create a database named `edumanage_db`. You may also need to update the connection string in `server/src/db.ts` with your PostgreSQL username and password.

**3. Run the Servers**

Open two separate terminals in the project's **root directory**.

**Terminal 1: Start the Backend Server**

This command starts the Node.js/Express backend, which will connect to your database and listen on `http://localhost:8080`.

```sh
npm run dev --workspace=server
```
Upon first run, you will need to set up and seed the database. Use a tool like Postman or `curl` to send POST requests to the following endpoints:
- `POST http://localhost:8080/api/setup-database` (This creates the necessary tables)
- `POST http://localhost:8080/api/seed-database` (This populates the tables with mock data)

**Terminal 2: Start the Frontend Server**

This command starts the Vite development server for the React frontend.

```sh
npm run dev --workspace=frontend
```
The application will be available at `http://localhost:5173`. API requests from the frontend will be automatically proxied to the backend.

## 🧑‍💻 Demo Credentials

You can use the following credentials to log in and explore the different roles:

| Role      | Username             | Password      |
| :-------- | :------------------- | :------------ |
| Chairman  | `CHAIRMAN01`         | `password123` |
| HOD       | `dharmaraj`          | `password123` |
| Faculty   | `BCSE01032020-001`   | `password123` |
| Staff     | `KSTF15042020-001`   | `password123` |
| Student   | `KCSE202001`         | `password123` |

## 🤝 Contributing

Contributions are welcome! Please fork the repo and create a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.