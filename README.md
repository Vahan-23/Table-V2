# Table-V2 Seating Application

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Environment Configuration

## REACT_APP_API_BASE_URL=https://mijocarum.qanaqer.work REACT_APP_PUBLIC_PATH=/test/seating/ npm run build

### Backend API Configuration

The seating data persistence can be configured to use a backend API by setting the `REACT_APP_API_BASE_URL` environment variable.

Create a `.env` file in the project root:

```bash
# Backend API Base URL
REACT_APP_API_BASE_URL=http://localhost:3001

# Public Path for static assets (webpack publicPath)
REACT_APP_PUBLIC_PATH=/seating/

# Public URL for React app (similar to Vite's base)
REACT_APP_PUBLIC_URL=/seating
```

**Backend API Examples:**
- Local development: `REACT_APP_API_BASE_URL=http://localhost:3001`
- Production: `REACT_APP_API_BASE_URL=https://api.yourdomain.com`
- Same domain (relative URLs): Leave empty or don't set the variable

**Public Path Examples:**
- Subdirectory deployment: `REACT_APP_PUBLIC_PATH=/my-app/`
- Root deployment: `REACT_APP_PUBLIC_PATH=/`
- Default (if not set): `/test/seating/`

**Public URL Examples (similar to Vite's base):**
- Subdirectory deployment: `REACT_APP_PUBLIC_URL=/seating`
- Root deployment: `REACT_APP_PUBLIC_URL=/`
- CDN deployment: `REACT_APP_PUBLIC_URL=https://cdn.example.com/seating`

**Required API Endpoints:**
- `GET /api/named_value?name=<key>` - Load persisted data
- `PUT /api/named_value` - Save persisted data (body: `{name, value}`)
- `DELETE /api/named_value` - Remove persisted data (body: `{name}`)

If the backend is unavailable or the user is not authenticated, the application will automatically fall back to localStorage.

### URL Utilities

The application includes URL utilities in `src/utils/baseUrl.js` for proper handling of subpath deployments:

```javascript
import { getAssetUrl, getApiUrl, getBaseUrl } from './utils/baseUrl';

// Get asset URLs (for images in /public folder)
const logoUrl = getAssetUrl('/logo.png');

// Get API URLs
const apiEndpoint = getApiUrl('/api/data');

// Get base URL
const baseUrl = getBaseUrl(); // e.g., "https://mijocarum.qanaqer.work/seating"
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
