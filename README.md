# Duncan's Toy Shop

This project is a simple React application that uses Firebase for backend services and Tailwind CSS for styling.

## Installation

Before starting the development server, install all dependencies:

```bash
npm install
```

The project depends on Firebase and Tailwind CSS, which are included in the dependencies. Make sure you have credentials for Firebase configured in `src/firebase.js` or via environment variables.

## Starting the project

Once dependencies are installed, you can start the development server:

```bash
npm start
```

This will launch the app in development mode.

## Firebase credentials

To connect to Firebase, provide your own Firebase configuration in `src/firebase.js`. Replace the existing keys with your Firebase project's credentials or set them in environment variables if you prefer to keep them out of the repository.

## Tailwind CSS

Tailwind is used to style the app. The configuration resides in `tailwind.config.js` and styles are included via `src/index.css`. If you modify the Tailwind configuration, restart the development server so the changes take effect.
